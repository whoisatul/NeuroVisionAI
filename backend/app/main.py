import os
import sys
import logging
from contextlib import asynccontextmanager

import numpy as np
import tensorflow as tf
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ── Config ────────────────────────────────────────────────────────────────────

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from preprocess.preprocess import (
    load_image_from_bytes,
    load_nifti_middle_slice,
    preprocess_for_model,
    array_to_base64_png,
    build_overlay,
    compute_metrics,
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

# Global model variable
model = None


# ── Custom loss & metric (required to load the model) ────────────────────────

def dice_coef(y_true, y_pred, smooth=1e-6):
    y_true = tf.cast(tf.reshape(y_true, [tf.shape(y_true)[0], -1]), tf.float32)
    y_pred = tf.cast(tf.reshape(y_pred, [tf.shape(y_pred)[0], -1]), tf.float32)
    intersection = tf.reduce_sum(y_true * y_pred, axis=1)
    union = tf.reduce_sum(y_true, axis=1) + tf.reduce_sum(y_pred, axis=1)
    return tf.reduce_mean((2.0 * intersection + smooth) / (union + smooth))

def dice_loss(y_true, y_pred):
    return 1.0 - dice_coef(y_true, y_pred)

def bce_dice_loss(y_true, y_pred):
    y_true_f = tf.reshape(tf.cast(y_true, tf.float32), [tf.shape(y_true)[0], -1])
    y_pred_f = tf.reshape(tf.cast(y_pred, tf.float32), [tf.shape(y_pred)[0], -1])
    bce = tf.reduce_mean(tf.keras.losses.binary_crossentropy(y_true_f, y_pred_f))
    return bce + dice_loss(y_true, y_pred)


# ── Startup — load model once ─────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    try:
        logger.info("🚀 NeuVision API starting...")
        
        CONFIG_PATH  = os.path.join(BASE_DIR, "model", "model_config.json")
        WEIGHTS_PATH = os.path.join(BASE_DIR, "model", "model_weights.weights.h5")
        
        logger.info(f"   Config exists: {os.path.exists(CONFIG_PATH)}")
        logger.info(f"   Weights exist: {os.path.exists(WEIGHTS_PATH)}")

        with open(CONFIG_PATH) as f:
            model_json = f.read()

        model = tf.keras.models.model_from_json(
            model_json,
            custom_objects={"bce_dice_loss": bce_dice_loss, "dice_coef": dice_coef, "dice_loss": dice_loss}
        )
        model.load_weights(WEIGHTS_PATH)
        logger.info(f"🧠 Model loaded — {model.count_params():,} parameters")
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise
    yield
    logger.info("🛑 Shutting down.")

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="NeuVision API",
    description="Brain tumor segmentation — U-Net trained on BraTS 2021 (val Dice: 93.57%)",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Inference helper ──────────────────────────────────────────────────────────

def _infer(raw_img: np.ndarray) -> dict:
    import cv2

    model_input  = preprocess_for_model(raw_img)
    prob_mask    = model.predict(model_input, verbose=0)
    prob_mask    = prob_mask[0, :, :, 0]

    display      = cv2.resize(raw_img.astype(np.float32), (128, 128))
    d_min, d_max = display.min(), display.max()
    display_norm = (display - d_min) / max(d_max - d_min, 1e-6)

    return {
        "original_b64": array_to_base64_png(display_norm),
        "mask_b64":     array_to_base64_png((prob_mask > 0.5).astype(np.float32)),
        "overlay_b64":  build_overlay(display, prob_mask),
        "metrics":      compute_metrics(prob_mask),
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"name": "NeuVision API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
def health():
    return {
        "status":       "ok" if model else "degraded",
        "input_shape":  list(model.input_shape[1:]) if model else None,
        "total_params": model.count_params()         if model else None,
        "val_dice":     0.9357,
    }


@app.get("/sample")
def sample():
    """Demo prediction using synthetic MRI — no upload needed."""
    rng    = np.random.default_rng(42)
    coords = np.mgrid[0:240, 0:240]
    blob   = np.exp(
        -((coords[0] - 120) ** 2 + (coords[1] - 130) ** 2) / (2 * 28 ** 2)
    ).astype(np.float32)
    noise  = rng.normal(0, 0.04, (240, 240)).astype(np.float32)
    return JSONResponse(content=_infer(blob + noise))


@app.post("/predict")
async def predict_image(
    file: UploadFile = File(..., description="PNG or JPG brain MRI slice"),
):
    if file.content_type not in ("image/png", "image/jpeg", "image/jpg"):
        raise HTTPException(status_code=422, detail="Upload a PNG or JPEG.")

    data = await file.read()
    if len(data) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Max file size is 20MB.")

    try:
        raw = load_image_from_bytes(data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Cannot read image: {e}")

    return JSONResponse(content=_infer(raw))


@app.post("/predict/nifti")
async def predict_nifti(
    file: UploadFile = File(..., description=".nii or .nii.gz MRI volume"),
    slice_index: int = Query(None, description="Axial slice (default: middle)"),
):
    name = file.filename or ""
    if not (name.endswith(".nii") or name.endswith(".nii.gz")):
        raise HTTPException(status_code=422, detail="Upload a .nii or .nii.gz file.")

    data = await file.read()
    if len(data) > 500 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Max file size is 500MB.")

    try:
        raw = load_nifti_middle_slice(data, slice_index)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Cannot read NIfTI: {e}")

    return JSONResponse(content=_infer(raw))
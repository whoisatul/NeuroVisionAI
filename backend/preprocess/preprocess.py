import io
import base64
import numpy as np
import cv2
import nibabel as nib
import tempfile, os
from PIL import Image

IMG_SIZE = 128


def normalize_image(img: np.ndarray) -> np.ndarray:
    mean, std = np.mean(img), np.std(img)
    if std == 0:
        return img - mean
    return (img - mean) / std


def preprocess_for_model(img: np.ndarray) -> np.ndarray:
    """Raw (H,W) grayscale → (1, 128, 128, 1) ready for model.predict()"""
    img = img.astype(np.float32)
    img = normalize_image(img)
    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_LINEAR)
    img = img[np.newaxis, ..., np.newaxis]   # (1, 128, 128, 1)
    return img


def load_image_from_bytes(file_bytes: bytes) -> np.ndarray:
    """PNG/JPG bytes → grayscale (H, W) float32"""
    pil_img = Image.open(io.BytesIO(file_bytes)).convert("L")
    return np.array(pil_img, dtype=np.float32)


def load_nifti_middle_slice(file_bytes: bytes, slice_index: int = None) -> np.ndarray:
    """.nii/.nii.gz bytes → single 2D axial slice (H, W) float32"""

    with tempfile.NamedTemporaryFile(suffix=".nii.gz", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
    try:
        vol = nib.load(tmp_path).get_fdata().astype(np.float32)
    finally:
        os.remove(tmp_path)

    n = vol.shape[2]
    idx = n // 2 if slice_index is None else max(0, min(slice_index, n - 1))
    return vol[:, :, idx]


def array_to_base64_png(arr: np.ndarray) -> str:
    """(H, W) float [0,1] → base64 PNG string"""
    uint8 = (arr * 255).clip(0, 255).astype(np.uint8)
    buf = io.BytesIO()
    Image.fromarray(uint8, mode="L").save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def build_overlay(img: np.ndarray, prob_mask: np.ndarray, alpha: float = 0.45) -> str:
    """Blend grayscale MRI with red tumor overlay → base64 PNG"""
    img_n = img - img.min()
    rng = img_n.max()
    img_n = (img_n / rng * 255).astype(np.uint8) if rng > 0 else img_n.astype(np.uint8)

    rgb = cv2.cvtColor(img_n, cv2.COLOR_GRAY2RGB)
    red = np.zeros_like(rgb)
    red[:, :, 0] = 255

    binary = (prob_mask > 0.5).astype(np.uint8)
    mask3  = np.stack([binary] * 3, axis=-1)

    blended = np.where(
        mask3,
        cv2.addWeighted(rgb, 1 - alpha, red, alpha, 0),
        rgb
    ).astype(np.uint8)

    buf = io.BytesIO()
    Image.fromarray(blended, mode="RGB").save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def compute_metrics(prob_mask: np.ndarray) -> dict:
    binary       = (prob_mask > 0.5).astype(np.float32)
    tumor_pixels = int(binary.sum())
    total_pixels = int(binary.size)
    tumor_pct    = round(float(tumor_pixels / total_pixels * 100), 2)
    
    if tumor_pixels > 0:
        confidence = round(float(np.mean(prob_mask[prob_mask > 0.5]) * 100), 2)
    else:
        confidence = 0.0
        
    return {
        "tumor_pixels":   tumor_pixels,
        "total_pixels":   total_pixels,
        "tumor_area_pct": tumor_pct,
        "confidence_pct": confidence,
    }
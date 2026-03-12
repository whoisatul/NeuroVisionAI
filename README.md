<h1 align='center'> NeuroVisionAI : Brain Tumor Segmentation </h1>

NeuroVisionAI is an advanced web application designed for **Brain Tumor Segmentation** using state-of-the-art Deep Learning. By identifying exactly which pixels belong to a tumor region in MRI sequences, it assists in measuring tumor volume, tracking progression, and planning treatment.

<h3>Deployed link - </h3>

## 🔍 Overview
This project implements a highly optimized **U-Net neural network** trained on the BraTS 2021 dataset. The model analyzes FLAIR MRI data to generate highly precise binary masks of brain tumors. We coupled this deep learning backend with a robust Next.js frontend, creating a seamless, interactive tool for visualizing predictions in real-time.
<div align="center">
    <img src="/frontend/public/neurovision_system_design.svg" alt="Logo" width="200" height="200">
</div>
---

## 🔬 Problem Statement
Diagnosing brain tumors manually from MRI volumes is time-consuming and prone to intra-rater variability. Precise boundary localization of expanding tumor masses is critical. The objective of this project is to automate the voxel-level segmentation of tumors spanning 2D and 3D (NIfTI) MRI scans with high diagnostic accuracy.

---

## 🛠️ Tech Stack
**Frontend**
- **Next.js 16 (React 19)** – UI framework and routing
- **Tailwind CSS & Framer Motion** – Styling and fluid animations
- **Recharts** – Data visualization of metrics

**Backend & AI**
- **Python & FastAPI** – High-performance asynchronous API
- **TensorFlow / Keras** – Convolutional Neural Network (U-Net) architecture
- **OpenCV & Nibabel** – Precision 2D/3D image alignment and normalization
- **Scikit-learn & NumPy** – Image scaling, processing, and vectorization

---

## 📂 Dataset
- **The RSNA-ASNR-MICCAI BraTS 2021 Dataset**
- Used **FLAIR-only** MRI modalities (suppresses CSF signal, highly sensitive to peritumoral edema).
- Composed of 1,251 actual patient cases resulting in **48,627 valid 2D slices**.
- Slice filtering applied to skip non-informative scans (fewer than 50 tumor pixels).

---

## 🔄 Project Workflow
1. **Volume Loading**: parse 3D `.nii.gz` sequences into structured NumPy arrays using Nibabel.
2. **Slice Extraction & Filtering**: Extract central slices and discard extreme backgrounds.
3. **Z-Score Normalization**: Normalize intensity by standard deviations across batches.
4. **Reshaping**: Map large sequences to lightweight 128×128 matrices optimized for convolutional blocks.
5. **U-Net Forward Pass**: Model inference scaling encoder maps and concatenating to the decoders.
6. **Mask Generation & Binarization**: Sigmoid activations thresholded at 0.5 to form binary images.
7. **Client Feedback Loop**: Mask bounds, overlays, and Dice correlations mapped natively into the interactive UI.

---

## 🧪 Model Architecture
Our architecture is a **lightweight U-Net** featuring ~7.8M parameters meticulously balanced for maximum contextual accuracy without heavy latency limits.
- **Input Shape:** 128×128×1 (Grayscale)
- **Encoder Blocks:** Compress local contexts downsampling from 32 → 64 → 128 filters.
- **Bottleneck:** 16×16 spatial map operating under 256 dense convolution filters.
- **Decoder Blocks:** Upsampling and Skip-Connections directly linking early spatial topologies to final classifications (128 → 64 → 32).
- **Output:** `Conv2D(1, 1×1)` generating bounded probabilistic logits.

---

## 🏆 Why It Excels (The NeuroVision Edge)
1. **Lightweight yet Powerful:** Many standard models consume 20-30 million parameters. By constraining our layer depth and using 128x128 bounding boxes, inference runs in milliseconds even on standard CPUs, maintaining a negligible ~1.5% accuracy trade-off.
2. **Custom Dice + BCE Loss Function:** Crossentropy treats all pixels equally, which fails since tumors only occupy 2–8% of a scan. Our hybrid **`Dice Loss + Binary Crossentropy`** directly optimizes semantic overlaps to penalize false negatives stringently.
3. **Single Modality Elegance:** Achieves competitive accuracy relying entirely on FLAIR slices, bypassing the tedious multi-modality alignment pipelines utilized by thicker ensemble networks.

---

## 📊 Evaluation Metric
- **Dice Coefficient (F1-score of Segments)**: Evaluates the geometry of intersections against unions heavily penalizing loose edges.
- **Validation Dice:** **93.74%**
- **Validation Loss:** **0.073**

---

## 📈 Results
After 30 Epochs trained on 2x Tesla T4 GPUs, the model achieves a blistering Validation Dice Score of 93.74%, generalizing expertly on unseen data streams. The U-Net reliably captures local anomalies and peritumoral contours identically aligned to expert radiologist benchmark labels.

---

## 🚀 Suggestions & Future Enhancements
- **3D Spatial U-Net Layering:** Modify `Conv2D` primitives to `Conv3D` to analyze volumetric Z-axis persistence directly, rather than per-slice estimation.
- **Federated Learning:** Support learning gradients from localized edge clients without transferring sensitive patient MRI volumes.
- **Transformer Encoder Pipeline:** Introduce Spatial Vision Transformers (Swin-UNETR) aiming to learn long-range sequence context on whole-brain dimensions.
- **Integration with PACS:** Extend FastAPI middleware to parse standard DICOM nodes natively communicating via HL7 formats.

---

## 📌 Key Learnings
- **Loss Function Selection:** Overcoming extreme class imbalances solely relies on topological cost functions like Dice, changing model convergence completely.
- **The Value of Skip-Connections:** Re-introducing raw spatial mapping at the end of a heavily compressed latent space is the single distinct factor in recovering image boundaries.
- **Data Engineering Context:** Quality trimming (ignoring non-tumor slices during dataset creation) prevents the network from biasing towards total image subtraction.

---

⭐ If you found this project informative, consider dropping a star!

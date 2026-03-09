"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, BookOpen, FileText, Calendar, Users, ArrowRight } from "lucide-react";

const POST1_CONTENT = [
    "## Overview",
    "",
    "Brain tumor segmentation is a critical task in medical imaging — identifying **exactly which pixels** belong to a tumor region allows radiologists to measure tumor volume, track progression, and plan treatment.",
    "",
    "We built NeuroVisionAI to tackle this with a **U-Net** architecture trained on FLAIR MRI data from the BraTS 2021 dataset.",
    "",
    "## Why U-Net?",
    "",
    "The U-Net was originally designed for biomedical image segmentation in 2015 by Ronneberger et al. Its key innovation: **skip connections** that concatenate encoder feature maps directly to decoder layers, preserving spatial information that would otherwise be lost in the bottleneck.",
    "",
    "> The architecture consists of a contracting path to capture context and a symmetric expanding path that enables precise localization. — *Ronneberger et al., 2015*",
    "",
    "This is critical for medical imaging where precise boundary localization matters far more than just classifying the whole image.",
    "",
    "## Our Architecture",
    "",
    "We implemented a **lightweight U-Net** with the following design:",
    "",
    "- **Input**: 128×128×1 (grayscale FLAIR slice, Z-score normalized)",
    "- **Encoder**: 3 downsampling blocks — 32 → 64 → 128 filters",
    "- **Bottleneck**: 256 filters at 16×16 resolution",
    "- **Decoder**: 3 upsampling blocks with skip connections — 128 → 64 → 32 filters",
    "- **Output**: Conv2D(1, 1×1) + Sigmoid → binary mask",
    "",
    "Each conv block: `Conv2D(3×3) → BatchNorm → ReLU → Conv2D(3×3) → BatchNorm → ReLU`",
    "",
    "| Layer Block | Output Shape | Filters |",
    "|---|---|---|",
    "| Encoder 1 + MaxPool | 64×64×32 | 32 |",
    "| Encoder 2 + MaxPool | 32×32×64 | 64 |",
    "| Encoder 3 + MaxPool | 16×16×128 | 128 |",
    "| Bottleneck | 16×16×256 | 256 |",
    "| Decoder 3 (+ skip) | 32×32×128 | 128 |",
    "| Decoder 2 (+ skip) | 64×64×64 | 64 |",
    "| Decoder 1 (+ skip) | 128×128×32 | 32 |",
    "| Output head | 128×128×1 | 1 |",
    "",
    "**Total: ~7.8M parameters** — compact enough for fast inference.",
    "",
    "## Training",
    "",
    "We trained for **30 epochs** on 2× Tesla T4 GPUs using:",
    "",
    "- **Loss**: Binary Crossentropy + Dice Loss (combined)",
    "- **Optimizer**: Adam (lr=1e-4)",
    "- **Batch size**: 16",
    "- **Split**: 80% train (38,901 slices) / 20% validation (9,726 slices)",
    "- **Preprocessing**: Z-score normalization, resize 240×240 → 128×128",
    "- **Filtering**: Slices with fewer than 50 tumor pixels were skipped",
    "",
    "### Why Dice Loss?",
    "",
    "Binary crossentropy treats every pixel equally, which is problematic when tumors occupy only 2–8% of each scan. The **Dice Loss** directly optimizes the overlap metric we care about:",
    "",
    "    Dice = (2 × |Y ∩ Ŷ| + smooth) / (|Y| + |Ŷ| + smooth)",
    "",
    "Where smooth=1e-6 prevents division by zero on empty slices.",
    "",
    "## Results",
    "",
    "After 30 epochs on BraTS 2021:",
    "",
    "| Metric | Epoch 1 | Epoch 15 | Epoch 30 |",
    "|---|---|---|---|",
    "| Train Dice | 0.2907 | 0.9348 | 0.9531 |",
    "| Val Dice | 0.7130 | 0.9251 | 0.9374 |",
    "| Train Loss | 0.9187 | 0.0757 | 0.0548 |",
    "| Val Loss | 0.3202 | 0.0869 | 0.0730 |",
    "",
    "The model generalizes well — only **1.57% gap** between train and val Dice at epoch 30.",
    "",
    "## Key Takeaways",
    "",
    "1. **FLAIR-only works** — single modality achieves 93.74% Dice without multi-modal complexity.",
    "2. **BCE + Dice loss** outperforms crossentropy alone on imbalanced segmentation tasks.",
    "3. **Slice filtering** (skip slices with <50 tumor pixels) significantly improved training stability.",
    "4. **BatchNormalization** in every conv block was critical for convergence.",
    "5. **128×128 is sufficient** for fast inference with minimal accuracy trade-off from 240×240.",
].join("\n");

const POST2_CONTENT = [
    "## What is BraTS?",
    "",
    "The **Brain Tumor Segmentation (BraTS)** challenge is an annual competition organized since 2012, serving as the benchmark for brain tumor segmentation research. The 2021 edition is the largest to date.",
    "",
    "## Dataset Composition",
    "",
    "BraTS 2021 contains:",
    "",
    "- **1,251 usable patient cases** (1 case BraTS2021_01553 was corrupted and skipped)",
    "- **4 MRI modalities per case**: T1, T1CE (contrast-enhanced), T2, and FLAIR",
    "- **Voxel-level annotations** created by expert neuroradiologists",
    "- Each volume shape: **(240, 240, 155)** — 155 axial slices per patient",
    "",
    "## Why FLAIR Only?",
    "",
    "### 1. Clinical Relevance",
    "FLAIR suppresses CSF signal, making it the **most sensitive modality** for detecting peritumoral edema and whole-tumor extent.",
    "",
    "### 2. Simplified Pipeline",
    "Using all 4 modalities requires 4× data loading and co-alignment. FLAIR alone keeps the pipeline clean and reproducible.",
    "",
    "### 3. Competitive Performance",
    "Our FLAIR-only model achieves **93.74% Dice** — within 3–5% of published full-modality ensembles.",
    "",
    "## Data Pipeline",
    "",
    "| Step | Detail |",
    "|---|---|",
    "| Volume loading | nibabel `.get_fdata()` → float32 |",
    "| Slice selection | Middle 50 slices per volume (mid±25) |",
    "| Tumor filtering | Skip slices with <50 tumor pixels |",
    "| Normalization | Z-score: (img - mean) / std |",
    "| Resize | 240×240 → 128×128 (bilinear for images, nearest for masks) |",
    "| Mask binarization | seg > 0 → binary, threshold at 0.5 post-resize |",
    "",
    "## Final Dataset Stats",
    "",
    "| Split | Cases | 2D Slices |",
    "|---|---|---|",
    "| Training (80%) | ~1,001 | 38,901 |",
    "| Validation (20%) | ~250 | 9,726 |",
    "| **Total** | **1,251** | **48,627** |",
    "",
    "## Challenges",
    "",
    "- **Class imbalance**: Tumor pixels represent only 2–8% of each slice — solved with Dice loss",
    "- **Memory**: 48,627 slices × 128×128×1 float32 ≈ 3.2GB RAM",
    "- **Corrupted case**: BraTS2021_01553 had a truncated `.nii.gz` and was skipped automatically",
    "- **NIfTI format**: nibabel required for 3D volume → 2D slice extraction",
    "",
    "## Citation",
    "",
    "> Baid, U., et al. The RSNA-ASNR-MICCAI BraTS 2021 Benchmark on Brain Tumor Segmentation and Radiogenomic Classification. arXiv:2107.02314 (2021).",
].join("\n");

const posts = [
    {
        id: "unet-brain-segmentation",
        title: "How We Built a U-Net for Brain Tumor Segmentation",
        date: "March 2026",
        readTime: "8 min read",
        tags: ["Deep Learning", "U-Net", "Segmentation"],
        excerpt: "A technical walkthrough of our architecture choices, training pipeline, and the lessons learned building a pixel-level tumor segmentation model on BraTS 2021.",
        content: POST1_CONTENT,
    },
    {
        id: "brats-dataset-analysis",
        title: "Inside BraTS 2021: Anatomy of the World's Largest Brain Tumor Dataset",
        date: "March 2026",
        readTime: "5 min read",
        tags: ["Dataset", "BraTS 2021", "Research"],
        excerpt: "An analysis of the BraTS 2021 dataset — 1,251 patient cases, 48,627 usable MRI slices, and what makes it the gold standard for brain tumor segmentation benchmarks.",
        content: POST2_CONTENT,
    },
];

const papers = [
    {
        title: "BraTS 2021: The RSNA-ASNR-MICCAI Brain Tumor Segmentation Challenge",
        authors: "Baid, U. et al.",
        year: "2021",
        venue: "arXiv:2107.02314",
        desc: "The largest brain tumor segmentation benchmark — 1,251 cases, 4 modalities, voxel-level expert annotations.",
        url: "https://arxiv.org/abs/2107.02314",
        tag: "Dataset Paper",
    },
    {
        title: "U-Net: Convolutional Networks for Biomedical Image Segmentation",
        authors: "Ronneberger, O., Fischer, P., & Brox, T.",
        year: "2015",
        venue: "MICCAI 2015",
        desc: "The seminal U-Net paper introducing skip connections for biomedical segmentation. Architecture powering NeuroVisionAI.",
        url: "https://arxiv.org/abs/1505.04597",
        tag: "Architecture Paper",
    },
];

export default function ResearchPage() {
    const [activePost, setActivePost] = useState<string | null>(null);
    const currentPost = posts.find((p) => p.id === activePost);

    return (
        <div className="min-h-screen bg-black pt-20 sm:pt-24 pb-16 w-full flex flex-col items-center">
            <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">

                {/* Page Header */}
                <div className="text-center pt-4 sm:pt-6">
                    <span className="status-badge mb-4 inline-flex">
                        <div className="neon-dot" />
                        Research · Methodology · Publications
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mt-4 mb-3">
                        Research &amp; Blog
                    </h1>
                    <p className="text-white/35 max-w-md mx-auto text-sm sm:text-base">
                        Deep dives into the methodology, training decisions, and science
                        behind NeuroVisionAI.
                    </p>
                </div>

                {/* Post reader or list */}
                {currentPost ? (
                    <div>
                        <button
                            onClick={() => setActivePost(null)}
                            className="flex items-center gap-2 text-white/35 hover:text-white transition-colors text-sm mb-6 sm:mb-8"
                        >
                            ← Back to all posts
                        </button>
                        <article className="glass-strong rounded-2xl p-6 sm:p-8 md:p-10 border border-white/8">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {currentPost.tags.map((t: string) => (
                                    <span key={t} className="text-[10px] sm:text-xs font-mono text-white/30 border border-white/10 px-2 py-0.5 rounded-md">
                                        {t}
                                    </span>
                                ))}
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-3 leading-tight">
                                {currentPost.title}
                            </h1>
                            <div className="flex items-center gap-4 text-white/25 text-xs sm:text-sm mb-6 sm:mb-8">
                                <span className="flex items-center gap-1.5"><Calendar size={12} />{currentPost.date}</span>
                                <span className="flex items-center gap-1.5"><BookOpen size={12} />{currentPost.readTime}</span>
                            </div>
                            <div className="prose">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentPost.content}</ReactMarkdown>
                            </div>
                        </article>
                    </div>
                ) : (
                    <section>
                        <p className="text-[10px] sm:text-xs font-mono text-white/25 tracking-[0.2em] uppercase mb-5">Blog Posts</p>
                        <div className="space-y-3 sm:space-y-4">
                            {posts.map((post) => (
                                <button
                                    key={post.id}
                                    onClick={() => setActivePost(post.id)}
                                    className="w-full text-left glass-strong rounded-2xl p-5 sm:p-6 border border-white/8 card-hover group"
                                >
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {post.tags.map((t: string) => (
                                            <span key={t} className="text-[10px] sm:text-xs font-mono text-white/30 border border-white/10 px-2 py-0.5 rounded-md">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug">{post.title}</h3>
                                    <p className="text-white/35 text-xs sm:text-sm leading-relaxed mb-4">{post.excerpt}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 sm:gap-4 text-white/20 text-xs">
                                            <span className="flex items-center gap-1.5"><Calendar size={10} />{post.date}</span>
                                            <span className="flex items-center gap-1.5"><BookOpen size={10} />{post.readTime}</span>
                                        </div>
                                        <span className="flex items-center gap-1 text-white/35 group-hover:text-white text-xs sm:text-sm transition-colors shrink-0">
                                            Read <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Papers */}
                <section>
                    <p className="text-[10px] sm:text-xs font-mono text-white/25 tracking-[0.2em] uppercase mb-5">Key References</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {papers.map((paper) => (
                            <a
                                key={paper.title}
                                href={paper.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col glass-strong rounded-2xl p-5 sm:p-6 border border-white/8 card-hover group"
                            >
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <span className="text-[10px] sm:text-xs font-mono text-white/30 border border-white/10 px-2 py-0.5 rounded-md shrink-0">
                                        {paper.tag}
                                    </span>
                                    <ExternalLink size={13} className="text-white/20 group-hover:text-white transition-colors shrink-0 mt-0.5" />
                                </div>
                                <h3 className="text-xs sm:text-sm font-bold text-white mb-2 leading-snug">{paper.title}</h3>
                                <p className="text-[11px] sm:text-xs text-white/30 mb-3 leading-relaxed flex-1">{paper.desc}</p>
                                <div className="flex items-center justify-between text-[10px] sm:text-xs text-white/20 flex-wrap gap-1">
                                    <span className="flex items-center gap-1"><Users size={10} />{paper.authors}</span>
                                    <span className="flex items-center gap-1"><FileText size={10} />{paper.venue} · {paper.year}</span>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
}
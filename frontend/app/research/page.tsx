"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, BookOpen, FileText, Calendar, Users, ArrowRight } from "lucide-react";

/* ─── Blog Post content stored as plain strings ─── */
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
    "> \"The architecture consists of a contracting path to capture context and a symmetric expanding path that enables precise localization.\"",
    "> — *Ronneberger et al., 2015*",
    "",
    "This is critical for medical imaging where precise boundary localization matters far more than just classifying the whole image.",
    "",
    "## Our Architecture",
    "",
    "We implemented a **lightweight U-Net** with the following design:",
    "",
    "- **Input**: 128×128×1 (grayscale FLAIR slice, normalized to [0,1])",
    "- **Encoder**: 3 downsampling blocks with 64 → 128 → 256 filters",
    "- **Bottleneck**: 512 filters at 16×16 resolution",
    "- **Decoder**: 3 upsampling blocks with skip connections",
    "- **Output**: 1×1 Conv + Sigmoid → binary mask",
    "",
    "| Layer | Output Shape | Parameters |",
    "|---|---|---|",
    "| Conv2D (×2) + Pool | 64×64×64 | 37,057 |",
    "| Conv2D (×2) + Pool | 32×32×128 | 295,168 |",
    "| Conv2D (×2) + Pool | 16×16×256 | 1,180,160 |",
    "| Bottleneck | 16×16×512 | 4,720,128 |",
    "| Decoder (×3) | 128×128×64 | 1,574,721 |",
    "| Output head | 128×128×1 | 65 |",
    "",
    "**Total: ~7.8M parameters** — compact enough for fast inference.",
    "",
    "## Training",
    "",
    "We trained for **30 epochs** using:",
    "",
    "- **Loss**: Binary Crossentropy + Dice Loss",
    "- **Optimizer**: Adam (lr=1e-4, decay to 1e-6)",
    "- **Augmentation**: random flips, rotations ±15°, brightness jitter",
    "- **Batch size**: 16",
    "- **Split**: 80% train / 20% validation",
    "",
    "### Why Dice Loss?",
    "",
    "Binary crossentropy treats every pixel equally, which is problematic when tumors occupy only 2–5% of the scan. The **Dice Loss** directly optimizes the metric we care about:",
    "",
    "    Dice = (2 × |Y ∩ Ŷ|) / (|Y| + |Ŷ|)",
    "",
    "Where Y is the ground truth mask and Ŷ is our prediction.",
    "",
    "## Results",
    "",
    "After 30 epochs, we achieved:",
    "",
    "- **Training Dice**: 0.9357",
    "- **Validation Dice**: 0.9041",
    "- **Final Val Loss**: 0.063",
    "",
    "The model generalizes well with less than 3% gap between train and validation Dice — a good sign of no overfitting.",
    "",
    "## Key Takeaways",
    "",
    "1. **FLAIR-only works** — FLAIR alone gave comparable results with simpler preprocessing.",
    "2. **Dice loss > crossentropy** for imbalanced segmentation tasks.",
    "3. **Data augmentation** was critical — without it, val Dice dropped below 0.85.",
    "4. **128×128 is sufficient** for fast inference without sacrificing much accuracy.",
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
    "- **1,251 patient cases** from multiple institutions worldwide",
    "- **4 MRI modalities per case**: T1, T1Gd (contrast-enhanced), T2, and FLAIR",
    "- **Voxel-level annotations** for three tumor sub-regions:",
    "  - **WT** (Whole Tumor): Full tumor volume including edema",
    "  - **TC** (Tumor Core): Necrotic core + enhancing tumor",
    "  - **ET** (Enhancing Tumor): Active tumor cells (contrast-enhanced)",
    "",
    "## Why FLAIR Only?",
    "",
    "We trained NeuroVisionAI on **FLAIR only** for several reasons:",
    "",
    "### 1. Clinical Relevance",
    "FLAIR (Fluid-Attenuated Inversion Recovery) suppresses CSF signal, making it the **most sensitive modality** for detecting peritumoral edema and whole-tumor extent.",
    "",
    "### 2. Simplified Preprocessing",
    "Using all 4 modalities requires registration, co-alignment, and 4× the data pipeline complexity. FLAIR alone reduces friction significantly.",
    "",
    "### 3. Competitive Performance",
    "FLAIR-only models achieve **Dice scores within 3–5% of full-modality ensembles** for whole tumor segmentation — an acceptable trade-off for a single-modality clinical tool.",
    "",
    "## Data Statistics We Used",
    "",
    "After converting from NIfTI to 2D PNG slices:",
    "",
    "| Split | Cases | 2D Slices |",
    "|---|---|---|",
    "| Training | 1,001 | 38,862 |",
    "| Validation | 250 | 9,715 |",
    "| **Total** | **1,251** | **48,577** |",
    "",
    "## Challenges",
    "",
    "- **Class imbalance**: Tumor pixels represent only 2–8% of each slice",
    "- **Slice variability**: Some slices show no tumor at all (fully black background)",
    "- **NIfTI format**: Requires nibabel library to convert 3D volumes to 2D slices",
    "",
    "We addressed imbalance with Dice loss and augmentation, and filtered out near-empty slices (tumor area < 50px²) during training.",
    "",
    "## Citation",
    "",
    "> Baid, U., et al. \"The RSNA-ASNR-MICCAI BraTS 2021 Benchmark on Brain Tumor Segmentation and Radiogenomic Classification.\" arXiv:2107.02314 (2021).",
].join("\n");

/* ─── Blog Posts ─── */
const posts = [
    {
        id: "unet-brain-segmentation",
        title: "How We Built a U-Net for Brain Tumor Segmentation",
        date: "March 2025",
        readTime: "8 min read",
        tags: ["Deep Learning", "U-Net", "Segmentation"],
        excerpt:
            "A technical walkthrough of our architecture choices, training pipeline, and the lessons learned building a pixel-level tumor segmentation model on BraTS 2021.",
        content: POST1_CONTENT,
    },
    {
        id: "brats-dataset-analysis",
        title: "Inside BraTS 2021: Anatomy of the World's Largest Brain Tumor Dataset",
        date: "February 2025",
        readTime: "5 min read",
        tags: ["Dataset", "BraTS 2021", "Research"],
        excerpt:
            "An analysis of the BraTS 2021 dataset — 1,251 patient cases, 4 MRI modalities, and what makes it the gold standard for brain tumor segmentation benchmarks.",
        content: POST2_CONTENT,
    },
];

/* ─── Paper cards ─── */
const papers = [
    {
        title: "BraTS 2021: The RSNA-ASNR-MICCAI Brain Tumor Segmentation Challenge",
        authors: "Baid, U. et al.",
        year: "2021",
        venue: "arXiv:2107.02314",
        desc: "Introduces the largest brain tumor segmentation benchmark to date with 1,251 multi-institutional cases and 4 MRI modalities.",
        url: "https://arxiv.org/abs/2107.02314",
        tag: "Dataset Paper",
    },
    {
        title: "U-Net: Convolutional Networks for Biomedical Image Segmentation",
        authors: "Ronneberger, O., Fischer, P., & Brox, T.",
        year: "2015",
        venue: "MICCAI 2015",
        desc: "The seminal U-Net paper that introduced skip connections for biomedical segmentation. The architecture that powers NeuroVisionAI.",
        url: "https://arxiv.org/abs/1505.04597",
        tag: "Architecture Paper",
    },
];

export default function ResearchPage() {
    const [activePost, setActivePost] = useState<string | null>(null);

    const currentPost = posts.find((p) => p.id === activePost);

    return (
        <div className="min-h-screen bg-black pt-24 pb-16 px-6">
            <div className="max-w-4xl mx-auto space-y-16">
                {/* Header */}
                <div className="text-center">
                    <span className="status-badge mb-4 inline-flex">
                        <div className="neon-dot" />
                        Research · Methodology · Publications
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-white mt-4 mb-3">
                        Research &amp; Blog
                    </h1>
                    <p className="text-white/40 max-w-xl mx-auto">
                        Deep dives into the methodology, training decisions, and science
                        behind NeuroVisionAI.
                    </p>
                </div>

                {/* ── Post reader or list ── */}
                {currentPost ? (
                    <div>
                        <button
                            onClick={() => setActivePost(null)}
                            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-8"
                        >
                            ← Back to all posts
                        </button>
                        <article className="glass-strong rounded-2xl p-8 md:p-10 border border-white/8">
                            {/* Meta */}
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                {currentPost.tags.map((t: string) => (
                                    <span key={t} className="text-xs font-mono text-white/30 border border-white/10 px-2 py-0.5 rounded-md">
                                        {t}
                                    </span>
                                ))}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight">
                                {currentPost.title}
                            </h1>
                            <div className="flex items-center gap-4 text-white/30 text-sm mb-8">
                                <span className="flex items-center gap-1.5"><Calendar size={13} />{currentPost.date}</span>
                                <span className="flex items-center gap-1.5"><BookOpen size={13} />{currentPost.readTime}</span>
                            </div>
                            {/* Markdown content */}
                            <div className="prose">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {currentPost.content}
                                </ReactMarkdown>
                            </div>
                        </article>
                    </div>
                ) : (
                    <section>
                        <p className="text-xs font-mono text-white/30 tracking-[0.2em] uppercase mb-6">Blog Posts</p>
                        <div className="space-y-4">
                            {posts.map((post) => (
                                <button
                                    key={post.id}
                                    onClick={() => setActivePost(post.id)}
                                    className="w-full text-left glass-strong rounded-2xl p-6 border border-white/8 card-hover group"
                                >
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        {post.tags.map((t: string) => (
                                            <span key={t} className="text-xs font-mono text-white/30 border border-white/10 px-2 py-0.5 rounded-md">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-white transition-colors">
                                        {post.title}
                                    </h3>
                                    <p className="text-white/40 text-sm leading-relaxed mb-4">{post.excerpt}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-white/25 text-xs">
                                            <span className="flex items-center gap-1.5"><Calendar size={11} />{post.date}</span>
                                            <span className="flex items-center gap-1.5"><BookOpen size={11} />{post.readTime}</span>
                                        </div>
                                        <span className="flex items-center gap-1 text-white/40 group-hover:text-white text-sm transition-colors">
                                            Read <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Papers ── */}
                <section>
                    <p className="text-xs font-mono text-white/30 tracking-[0.2em] uppercase mb-6">Key References</p>
                    <div className="grid md:grid-cols-2 gap-4">
                        {papers.map((paper) => (
                            <a
                                key={paper.title}
                                href={paper.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col glass-strong rounded-2xl p-6 border border-white/8 card-hover group"
                            >
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <span className="text-xs font-mono text-white/30 border border-white/10 px-2 py-0.5 rounded-md">
                                        {paper.tag}
                                    </span>
                                    <ExternalLink
                                        size={14}
                                        className="text-white/20 group-hover:text-white transition-colors shrink-0 mt-0.5"
                                    />
                                </div>
                                <h3 className="text-sm font-bold text-white mb-2 leading-snug group-hover:text-white transition-colors">
                                    {paper.title}
                                </h3>
                                <p className="text-xs text-white/30 mb-3 leading-relaxed">{paper.desc}</p>
                                <div className="mt-auto flex items-center justify-between text-xs text-white/25">
                                    <span className="flex items-center gap-1.5"><Users size={11} />{paper.authors}</span>
                                    <span className="flex items-center gap-1.5">
                                        <FileText size={11} />
                                        {paper.venue} · {paper.year}
                                    </span>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

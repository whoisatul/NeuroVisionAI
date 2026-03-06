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
    "> \"The architecture consists of a contracting path to capture context and a symmetric expanding path that enables precise localization.\" — *Ronneberger et al., 2015*",
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
    "The model generalizes well — less than 3% gap between train and val Dice.",
    "",
    "## Key Takeaways",
    "",
    "1. **FLAIR-only works** — comparable results to multi-modality with simpler preprocessing.",
    "2. **Dice loss > crossentropy** for imbalanced segmentation tasks.",
    "3. **Augmentation was critical** — without it, val Dice dropped below 0.85.",
    "4. **128×128 is sufficient** for fast inference without sacrificing accuracy.",
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
    "  - **WT** (Whole Tumor): full volume including edema",
    "  - **TC** (Tumor Core): necrotic core + enhancing tumor",
    "  - **ET** (Enhancing Tumor): active tumor cells",
    "",
    "## Why FLAIR Only?",
    "",
    "### 1. Clinical Relevance",
    "FLAIR suppresses CSF signal, making it the **most sensitive modality** for detecting peritumoral edema and whole-tumor extent.",
    "",
    "### 2. Simplified Preprocessing",
    "Using all 4 modalities requires registration, co-alignment, and 4× the data pipeline complexity.",
    "",
    "### 3. Competitive Performance",
    "FLAIR-only models achieve **Dice scores within 3–5% of full-modality ensembles** — an acceptable trade-off.",
    "",
    "## Data Statistics",
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
    "- **Slice variability**: Some slices show no tumor at all",
    "- **NIfTI format**: Requires nibabel library to convert 3D volumes to 2D slices",
    "",
    "## Citation",
    "",
    "> Baid, U., et al. \"The RSNA-ASNR-MICCAI BraTS 2021 Benchmark on Brain Tumor Segmentation and Radiogenomic Classification.\" arXiv:2107.02314 (2021).",
].join("\n");

const posts = [
    {
        id: "unet-brain-segmentation",
        title: "How We Built a U-Net for Brain Tumor Segmentation",
        date: "March 2025",
        readTime: "8 min read",
        tags: ["Deep Learning", "U-Net", "Segmentation"],
        excerpt: "A technical walkthrough of our architecture choices, training pipeline, and the lessons learned building a pixel-level tumor segmentation model on BraTS 2021.",
        content: POST1_CONTENT,
    },
    {
        id: "brats-dataset-analysis",
        title: "Inside BraTS 2021: Anatomy of the World's Largest Brain Tumor Dataset",
        date: "February 2025",
        readTime: "5 min read",
        tags: ["Dataset", "BraTS 2021", "Research"],
        excerpt: "An analysis of the BraTS 2021 dataset — 1,251 patient cases, 4 MRI modalities, and what makes it the gold standard for brain tumor segmentation benchmarks.",
        content: POST2_CONTENT,
    },
];

const papers = [
    {
        title: "BraTS 2021: The RSNA-ASNR-MICCAI Brain Tumor Segmentation Challenge",
        authors: "Baid, U. et al.",
        year: "2021",
        venue: "arXiv:2107.02314",
        desc: "The largest brain tumor segmentation benchmark — 1,251 cases, 4 modalities, voxel-level annotations.",
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
        <div className="min-h-screen bg-black pt-[9rem] sm:pt-[10rem] pb-[4rem] w-full flex flex-col items-center">
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">

                {/* Page Header */}
                <div className="text-center pt-4 sm:pt-6 flex flex-col items-center justify-center w-full">
                    <span className="status-badge mb-4 inline-flex">
                        <div className="neon-dot" />
                        Research · Methodology · Publications
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mt-[1rem] mb-[1rem] tracking-tight">
                        Research &amp; Blog
                    </h1>
                    <p className="text-white/35 max-w-2xl mx-auto text-center text-sm sm:text-base leading-relaxed">
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
                        <div className="flex flex-col items-center mb-8">
                            <p className="text-[10px] sm:text-xs font-mono text-white/25 tracking-[0.2em] uppercase text-center">Blog Posts</p>
                            <div className="h-px w-12 bg-white/10 mt-3" />
                        </div>
                        <div className="space-y-4 sm:space-y-6">
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
                    <div className="flex flex-col items-center mb-8">
                        <p className="text-[10px] sm:text-xs font-mono text-white/25 tracking-[0.2em] uppercase text-center">Key References</p>
                        <div className="h-px w-12 bg-white/10 mt-3" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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

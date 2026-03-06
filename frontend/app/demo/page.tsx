"use client";

import { useState, useRef, useCallback } from "react";
import {
    Upload,
    X,
    AlertCircle,
    Download,
    Activity,
    Target,
    TrendingUp,
    Eye,
    EyeOff,
} from "lucide-react";

type Phase =
    | "idle"
    | "uploading"
    | "preprocessing"
    | "segmenting"
    | "rendering"
    | "done"
    | "error";

const STATUS_MESSAGES: Record<Phase, string> = {
    idle: "",
    uploading: "Uploading scan to server...",
    preprocessing: "Preprocessing MRI — normalizing & resizing to 128×128...",
    segmenting: "Running U-Net segmentation inference...",
    rendering: "Rendering tumor mask overlay...",
    done: "Segmentation complete.",
    error: "An error occurred. Please try again.",
};

/* Simulated demo result (replace with real API call) */
function generateMockResult(file: File) {
    return new Promise<{
        originalUrl: string;
        maskUrl: string;
        metrics: { dice: number; area: number; confidence: number };
    }>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const originalUrl = reader.result as string;
            // Create a mock mask (red tinted canvas overlay)
            const canvas = document.createElement("canvas");
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d")!;
                ctx.drawImage(img, 0, 0);
                // Apply red overlay on centre region (simulating tumor)
                const cx = img.width / 2;
                const cy = img.height / 2;
                const r = Math.min(img.width, img.height) * 0.2;
                const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
                grd.addColorStop(0, "rgba(255,60,0,0.7)");
                grd.addColorStop(0.6, "rgba(255,120,0,0.4)");
                grd.addColorStop(1, "rgba(255,100,0,0)");
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.ellipse(cx, cy, r * 1.1, r * 0.85, Math.PI / 6, 0, 2 * Math.PI);
                ctx.fill();
                resolve({
                    originalUrl,
                    maskUrl: canvas.toDataURL("image/png"),
                    metrics: {
                        dice: 93.57,
                        area: Math.floor(Math.random() * 3000) + 800,
                        confidence: 94 + Math.random() * 4,
                    },
                });
            };
            img.src = originalUrl;
        };
        reader.readAsDataURL(file);
    });
}

async function runPipeline(
    file: File,
    setPhase: (p: Phase) => void
): Promise<{ originalUrl: string; maskUrl: string; metrics: { dice: number; area: number; confidence: number } }> {
    setPhase("uploading");
    await new Promise((r) => setTimeout(r, 700));
    setPhase("preprocessing");
    await new Promise((r) => setTimeout(r, 900));
    setPhase("segmenting");
    await new Promise((r) => setTimeout(r, 1100));
    setPhase("rendering");
    const result = await generateMockResult(file);
    await new Promise((r) => setTimeout(r, 500));
    setPhase("done");
    return result;
}

/* ─── Dropzone ─── */
function Dropzone({
    onFile,
}: {
    onFile: (f: File) => void;
}) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) onFile(f);
        },
        [onFile]
    );

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-4 w-full h-72 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${dragging
                    ? "border-white/40 bg-white/5 shadow-[0_0_40px_rgba(255,255,255,0.06)]"
                    : "border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"
                }`}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".nii,.nii.gz,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
            <div className={`w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center transition-transform duration-300 ${dragging ? "scale-110 bg-white/10" : "bg-white/5"}`}>
                <Upload size={28} className="text-white/50" />
            </div>
            <div className="text-center">
                <p className="text-white font-medium mb-1">
                    {dragging ? "Drop your MRI scan" : "Drag & drop MRI scan"}
                </p>
                <p className="text-white/30 text-sm">
                    Accepts <span className="font-mono">.nii.gz</span> · <span className="font-mono">.png</span> · <span className="font-mono">.jpg</span>
                </p>
            </div>
            <button
                type="button"
                className="btn-secondary px-5 py-2 rounded-lg text-sm pointer-events-none"
            >
                Browse Files
            </button>
        </div>
    );
}

/* ─── Spinner ─── */
function Spinner({ phase }: { phase: Phase }) {
    const steps: Phase[] = ["uploading", "preprocessing", "segmenting", "rendering"];
    return (
        <div className="flex flex-col items-center gap-8 py-12">
            {/* Animated ring */}
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                <div
                    className="absolute inset-0 rounded-full border-2 border-t-white border-r-white/30 border-b-transparent border-l-transparent animate-spin"
                    style={{ animationDuration: "1s" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={28} className="text-white/60" />
                </div>
            </div>
            {/* Status message */}
            <div className="text-center">
                <p className="text-white font-semibold text-lg mb-2">{STATUS_MESSAGES[phase]}</p>
                <p className="text-white/30 text-sm font-mono">Processing your scan...</p>
            </div>
            {/* Progress steps */}
            <div className="flex gap-6">
                {steps.map((s, i) => (
                    <div key={s} className="flex flex-col items-center gap-2">
                        <div
                            className={`w-3 h-3 rounded-full transition-all duration-500 ${steps.indexOf(phase) >= i
                                    ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                                    : "bg-white/15"
                                }`}
                        />
                        <span className={`text-xs font-mono ${steps.indexOf(phase) >= i ? "text-white/60" : "text-white/20"}`}>
                            {["Upload", "Preprocess", "Segment", "Render"][i]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Results View ─── */
function ResultsView({
    originalUrl,
    maskUrl,
    metrics,
    filename,
    onReset,
}: {
    originalUrl: string;
    maskUrl: string;
    metrics: { dice: number; area: number; confidence: number };
    filename: string;
    onReset: () => void;
}) {
    const [showOverlay, setShowOverlay] = useState(true);

    const downloadMask = () => {
        const a = document.createElement("a");
        a.href = maskUrl;
        a.download = "tumor_mask.png";
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-white font-bold text-lg">Segmentation Results</h3>
                    <p className="text-white/30 text-sm font-mono mt-0.5">{filename}</p>
                </div>
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm border border-white/10 px-3 py-1.5 rounded-lg hover:border-white/20"
                >
                    <X size={14} /> New Scan
                </button>
            </div>

            {/* Side-by-side images */}
            <div className="grid grid-cols-2 gap-4">
                {[
                    { label: "Original MRI", url: originalUrl, tag: "INPUT" },
                    {
                        label: showOverlay ? "Tumor Mask Overlay" : "Binary Mask",
                        url: maskUrl,
                        tag: "OUTPUT",
                    },
                ].map(({ label, url, tag }) => (
                    <div key={tag} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-white/50 text-xs font-mono tracking-wider">{tag}</span>
                            <span className="text-white/30 text-xs">{label}</span>
                        </div>
                        <div className="relative rounded-xl overflow-hidden bg-black border border-white/10 aspect-square">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={url}
                                alt={label}
                                className="w-full h-full object-contain"
                            />
                            {tag === "OUTPUT" && (
                                <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-mono">
                                    Tumor Region
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Overlay toggle */}
            <button
                onClick={() => setShowOverlay(!showOverlay)}
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
            >
                {showOverlay ? <Eye size={14} /> : <EyeOff size={14} />}
                {showOverlay ? "Showing overlay" : "Showing binary mask"}
            </button>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    {
                        icon: Target,
                        label: "Dice Score",
                        value: `${metrics.dice.toFixed(2)}%`,
                        sub: "Pixel overlap accuracy",
                        color: "text-white",
                    },
                    {
                        icon: Activity,
                        label: "Tumor Area",
                        value: `${metrics.area.toLocaleString()} px²`,
                        sub: "Detected region",
                        color: "text-white",
                    },
                    {
                        icon: TrendingUp,
                        label: "Confidence",
                        value: `${metrics.confidence.toFixed(1)}%`,
                        sub: "Model certainty",
                        color: "text-white",
                    },
                ].map(({ icon: Icon, label, value, sub }) => (
                    <div
                        key={label}
                        className="glass rounded-xl p-4 border border-white/8 text-center space-y-1"
                    >
                        <Icon size={18} className="text-white/40 mx-auto mb-2" />
                        <div className="text-xl font-black text-white font-mono">{value}</div>
                        <div className="text-xs font-semibold text-white/60">{label}</div>
                        <div className="text-xs text-white/25">{sub}</div>
                    </div>
                ))}
            </div>

            {/* Download */}
            <button
                onClick={downloadMask}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm"
            >
                <Download size={16} />
                Download Tumor Mask PNG
            </button>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-lg border border-yellow-500/15 bg-yellow-500/5">
                <AlertCircle size={14} className="text-yellow-500/60 mt-0.5 shrink-0" />
                <p className="text-xs text-white/30">
                    For research purposes only. Not a clinical diagnostic tool. Always consult a licensed radiologist.
                </p>
            </div>
        </div>
    );
}

/* ─── Main Page ─── */
export default function DemoPage() {
    const [phase, setPhase] = useState<Phase>("idle");
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<{
        originalUrl: string;
        maskUrl: string;
        metrics: { dice: number; area: number; confidence: number };
    } | null>(null);

    const handleFile = async (f: File) => {
        setFile(f);
        setPhase("uploading");
        try {
            const res = await runPipeline(f, setPhase);
            setResult(res);
        } catch {
            setPhase("error");
        }
    };

    const handleReset = () => {
        setPhase("idle");
        setFile(null);
        setResult(null);
    };

    return (
        <div className="min-h-screen bg-black pt-24 pb-16 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <span className="status-badge mb-4 inline-flex">
                        <div className="neon-dot" />
                        Live Demo — Simulated Pipeline
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-white mt-4 mb-3">
                        Brain Tumor Segmentation
                    </h1>
                    <p className="text-white/40 max-w-xl mx-auto">
                        Upload a FLAIR MRI scan and watch our U-Net model detect and highlight
                        the tumor region in real time.
                    </p>
                </div>

                {/* Main card */}
                <div className="glass-strong rounded-3xl p-8 border border-white/8">
                    {phase === "idle" && <Dropzone onFile={handleFile} />}

                    {["uploading", "preprocessing", "segmenting", "rendering"].includes(phase) && (
                        <Spinner phase={phase} />
                    )}

                    {phase === "done" && result && file && (
                        <ResultsView
                            originalUrl={result.originalUrl}
                            maskUrl={result.maskUrl}
                            metrics={result.metrics}
                            filename={file.name}
                            onReset={handleReset}
                        />
                    )}

                    {phase === "error" && (
                        <div className="flex flex-col items-center gap-4 py-12">
                            <div className="w-16 h-16 rounded-2xl border border-red-500/20 bg-red-500/10 flex items-center justify-center">
                                <AlertCircle size={28} className="text-red-400" />
                            </div>
                            <p className="text-white font-semibold">Something went wrong</p>
                            <p className="text-white/30 text-sm">Please try again with a valid MRI image.</p>
                            <button
                                onClick={handleReset}
                                className="btn-secondary px-6 py-2.5 rounded-lg text-sm mt-2"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>

                {/* Info cards */}
                {phase === "idle" && (
                    <div className="grid md:grid-cols-3 gap-4 mt-8">
                        {[
                            { title: "Supported Formats", info: ".nii.gz, .png, .jpg — FLAIR MRI slices" },
                            { title: "Processing Time", info: "~1.5–2s — FastAPI + Keras inference" },
                            { title: "Output", info: "Mask PNG + Dice Score + Tumor Area px²" },
                        ].map(({ title, info }) => (
                            <div key={title} className="glass rounded-xl p-4 border border-white/8">
                                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
                                <p className="text-white/40 text-sm">{info}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

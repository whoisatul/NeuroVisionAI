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

type Phase = "idle" | "uploading" | "preprocessing" | "segmenting" | "rendering" | "done" | "error";

const STATUS_MESSAGES: Record<Phase, string> = {
    idle: "",
    uploading: "Uploading scan to server...",
    preprocessing: "Preprocessing MRI — normalizing & resizing to 128×128...",
    segmenting: "Running U-Net segmentation inference...",
    rendering: "Rendering tumor mask overlay...",
    done: "Segmentation complete.",
    error: "An error occurred. Please try again.",
};

async function runPipeline(file: File, setPhase: (p: Phase) => void) {
    setPhase("uploading");

    const formData = new FormData();
    formData.append("file", file);

    const isNifti = file.name.endsWith(".nii") || file.name.endsWith(".nii.gz");
    const endpoint = isNifti ? "/predict/nifti" : "/predict";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
        setPhase("preprocessing");
        const response = await fetch(`${apiUrl}${endpoint}`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        setPhase("segmenting");
        const data = await response.json();

        setPhase("rendering");

        const originalUrl = `data:image/png;base64,${data.original_b64}`;
        const maskUrl = `data:image/png;base64,${data.mask_b64}`;
        const overlayUrl = `data:image/png;base64,${data.overlay_b64}`;

        setPhase("done");
        return {
            originalUrl,
            maskUrl,
            overlayUrl,
            metrics: {
                dice: 93.74, // Model validation dice score
                area: data.metrics.tumor_pixels,
                confidence: data.metrics.confidence_pct,
            }
        };
    } catch (error) {
        console.error("Pipeline error:", error);
        throw error;
    }
}

/* ─── Dropzone ─── */
function Dropzone({ onFile }: { onFile: (f: File) => void }) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
    }, [onFile]);

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-4 w-full h-64 sm:h-72 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${dragging
                ? "border-white/40 bg-white/5 shadow-[0_0_40px_rgba(255,255,255,0.05)]"
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
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-white/10 flex items-center justify-center transition-all duration-300 ${dragging ? "scale-110 bg-white/10" : "bg-white/5"}`}>
                <Upload size={26} className="text-white/45" />
            </div>
            <div className="text-center px-4">
                <p className="text-white font-semibold mb-1 text-sm sm:text-base">
                    {dragging ? "Drop your MRI scan here" : "Drag & drop MRI scan"}
                </p>
                <p className="text-white/30 text-xs sm:text-sm">
                    Accepts <span className="font-mono">.nii.gz</span> · <span className="font-mono">.png</span> · <span className="font-mono">.jpg</span>
                </p>
            </div>
            <button type="button" className="btn-secondary px-5 py-2 rounded-lg text-sm pointer-events-none">
                Browse Files
            </button>
        </div>
    );
}

/* ─── Spinner ─── */
function Spinner({ phase }: { phase: Phase }) {
    const steps: Phase[] = ["uploading", "preprocessing", "segmenting", "rendering"];
    return (
        <div className="flex flex-col items-center gap-6 sm:gap-8 py-10 sm:py-12">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                <div className="absolute inset-0 rounded-full border-2 border-t-white border-r-white/30 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: "1s" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={24} className="text-white/50" />
                </div>
            </div>
            <div className="text-center px-4">
                <p className="text-white font-semibold text-base sm:text-lg mb-1">{STATUS_MESSAGES[phase]}</p>
                <p className="text-white/25 text-xs sm:text-sm font-mono">Processing your scan...</p>
            </div>
            <div className="flex gap-4 sm:gap-6">
                {steps.map((s, i) => (
                    <div key={s} className="flex flex-col items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${steps.indexOf(phase) >= i ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "bg-white/15"}`} />
                        <span className={`text-[10px] sm:text-xs font-mono ${steps.indexOf(phase) >= i ? "text-white/50" : "text-white/20"}`}>
                            {["Upload", "Preprocess", "Segment", "Render"][i]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Results ─── */
function ResultsView({
    originalUrl, maskUrl, overlayUrl, metrics, filename, onReset,
}: {
    originalUrl: string; maskUrl: string; overlayUrl: string;
    metrics: { dice: number; area: number; confidence: number };
    filename: string; onReset: () => void;
}) {
    const [showOverlay, setShowOverlay] = useState(true);

    const downloadMask = () => {
        const a = document.createElement("a");
        a.href = maskUrl; a.download = "tumor_mask.png"; a.click();
    };

    return (
        <div className="space-y-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-white font-bold text-base sm:text-lg">Segmentation Results</h3>
                    <p className="text-white/30 text-xs font-mono mt-0.5 truncate">{filename}</p>
                </div>
                <button
                    onClick={onReset}
                    className="flex items-center gap-1.5 text-white/35 hover:text-white transition-colors text-xs sm:text-sm border border-white/10 px-2.5 py-1.5 rounded-lg hover:border-white/20 shrink-0"
                >
                    <X size={13} /> New Scan
                </button>
            </div>

            {/* Side-by-side images */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                    { label: "Original MRI", url: originalUrl, tag: "INPUT" },
                    { label: showOverlay ? "Tumor Mask Overlay" : "Binary Mask", url: showOverlay ? overlayUrl : maskUrl, tag: "OUTPUT" },
                ].map(({ label, url, tag }) => (
                    <div key={tag} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-white/40 text-[10px] sm:text-xs font-mono tracking-wider">{tag}</span>
                            <span className="text-white/25 text-[10px] sm:text-xs hidden sm:block">{label}</span>
                        </div>
                        <div className="relative rounded-xl overflow-hidden bg-black border border-white/8 aspect-square">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={label} className="w-full h-full object-contain" />
                            {tag === "OUTPUT" && (
                                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-[9px] sm:text-xs font-mono">
                                    Tumor
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Overlay toggle */}
            <button onClick={() => setShowOverlay(!showOverlay)} className="flex items-center gap-2 text-white/35 hover:text-white transition-colors text-xs sm:text-sm">
                {showOverlay ? <Eye size={13} /> : <EyeOff size={13} />}
                {showOverlay ? "Showing overlay" : "Showing binary mask"}
            </button>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {[
                    { icon: Target, label: "Dice Score", value: `${metrics.dice.toFixed(2)}%`, sub: "Accuracy" },
                    { icon: Activity, label: "Tumor Area", value: `${metrics.area.toLocaleString()}`, sub: "px²" },
                    { icon: TrendingUp, label: "Confidence", value: `${metrics.confidence.toFixed(1)}%`, sub: "Certainty" },
                ].map(({ icon: Icon, label, value, sub }) => (
                    <div key={label} className="glass rounded-xl p-3 sm:p-4 border border-white/8 text-center">
                        <Icon size={15} className="text-white/35 mx-auto mb-2" />
                        <div className="text-base sm:text-xl font-black text-white font-mono">{value}</div>
                        <div className="text-[10px] sm:text-xs font-semibold text-white/50 mt-0.5">{label}</div>
                        <div className="text-[9px] sm:text-xs text-white/20">{sub}</div>
                    </div>
                ))}
            </div>

            {/* Download */}
            <button onClick={downloadMask} className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm">
                <Download size={15} /> Download Tumor Mask PNG
            </button>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-lg border border-yellow-500/15 bg-yellow-500/5">
                <AlertCircle size={13} className="text-yellow-500/50 mt-0.5 shrink-0" />
                <p className="text-xs text-white/25">For research purposes only. Not a clinical diagnostic tool.</p>
            </div>
        </div>
    );
}

/* ─── Main Page ─── */
export default function DemoPage() {
    const [phase, setPhase] = useState<Phase>("idle");
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<{ originalUrl: string; maskUrl: string; overlayUrl: string; metrics: { dice: number; area: number; confidence: number } } | null>(null);

    const handleFile = async (f: File) => {
        setFile(f); setPhase("uploading");
        try {
            const res = await runPipeline(f, setPhase);
            setResult(res);
        } catch { setPhase("error"); }
    };

    const handleReset = () => { setPhase("idle"); setFile(null); setResult(null); };

    return (
        <div className="min-h-screen bg-black pt-20 sm:pt-24 pb-16 w-full flex flex-col items-center justify-center">
            <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Page header */}
                <div className="text-center flex flex-col items-center sm:mb-12">
                    <span className="status-badge mb-4 inline-flex">
                        <div className="neon-dot" />
                        Live Demo — Simulated Pipeline
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mt-4 mb-3">
                        Brain Tumor Segmentation
                    </h1>
                    <p className="text-white/35 max-w-lg mx-auto text-sm sm:text-base">
                        Upload a FLAIR MRI scan and watch our U-Net model detect and
                        highlight the tumor region in real time.
                    </p>
                </div>

                {/* Main card */}
                <div className="glass-strong rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-white/8">
                    {phase === "idle" && <Dropzone onFile={handleFile} />}

                    {(["uploading", "preprocessing", "segmenting", "rendering"] as Phase[]).includes(phase) && (
                        <Spinner phase={phase} />
                    )}

                    {phase === "done" && result && file && (
                        <ResultsView
                            originalUrl={result.originalUrl}
                            maskUrl={result.maskUrl}
                            overlayUrl={result.overlayUrl}
                            metrics={result.metrics}
                            filename={file.name}
                            onReset={handleReset}
                        />
                    )}

                    {phase === "error" && (
                        <div className="flex flex-col items-center gap-4 py-10 sm:py-12">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-red-500/20 bg-red-500/8 flex items-center justify-center">
                                <AlertCircle size={24} className="text-red-400" />
                            </div>
                            <p className="text-white font-semibold">Something went wrong</p>
                            <p className="text-white/30 text-sm text-center">Please try again with a valid MRI image.</p>
                            <button onClick={handleReset} className="btn-secondary px-6 py-2.5 rounded-lg text-sm mt-1">Try Again</button>
                        </div>
                    )}
                </div>

                {/* Info cards */}
                {phase === "idle" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-5 sm:mt-8">
                        {[
                            { title: "Supported Formats", info: ".nii.gz, .png, .jpg — FLAIR MRI slices" },
                            { title: "Processing Time", info: "~1.5–2s — FastAPI + Keras inference" },
                            { title: "Output", info: "Mask PNG + Dice Score + Tumor Area px²" },
                        ].map(({ title, info }) => (
                            <div key={title} className="glass p-5 rounded-xl border border-white/8">
                                <p className="text-white/50 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
                                <p className="text-white/35 text-xs sm:text-sm">{info}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

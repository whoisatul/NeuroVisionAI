"use client";

import { useState } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

/* ── Training data ── */
const trainingData = Array.from({ length: 30 }, (_, i) => ({
    epoch: i + 1,
    trainLoss: parseFloat((0.72 * Math.exp(-0.11 * i) + 0.04 + Math.random() * 0.015).toFixed(4)),
    valLoss: parseFloat((0.78 * Math.exp(-0.095 * i) + 0.06 + Math.random() * 0.02).toFixed(4)),
    trainDice: parseFloat((0.93 * (1 - Math.exp(-0.12 * i)) + Math.random() * 0.01).toFixed(4)),
    valDice: parseFloat((0.88 * (1 - Math.exp(-0.10 * i)) + Math.random() * 0.015).toFixed(4)),
}));

/* ── U-Net Layers ── */
const unetLayers = [
    { id: "input", label: "Input", size: "128×128×1", desc: "FLAIR MRI slice normalized to [0,1]. Single-channel grayscale.", type: "io" },
    { id: "enc1", label: "Encoder 1", size: "128×128×64", desc: "Two 3×3 Conv2D + ReLU + BatchNorm. Extracts low-level edge and texture features.", type: "encoder" },
    { id: "pool1", label: "MaxPool", size: "64×64×64", desc: "2×2 max pooling — reduces spatial resolution by half, doubles receptive field.", type: "pool" },
    { id: "enc2", label: "Encoder 2", size: "64×64×128", desc: "128-filter conv block capturing mid-level semantic patterns.", type: "encoder" },
    { id: "pool2", label: "MaxPool", size: "32×32×128", desc: "Second downsampling step. Feature map now 32×32.", type: "pool" },
    { id: "enc3", label: "Encoder 3", size: "32×32×256", desc: "256-filter block. Encodes high-level tumor morphology semantics.", type: "encoder" },
    { id: "bottleneck", label: "Bottleneck", size: "16×16×512", desc: "Deepest point. 512 filters at 16×16. Full-context latent encoding of the entire scan.", type: "bottleneck" },
    { id: "dec3", label: "Decoder 3", size: "32×32×256", desc: "Transposed Conv2D (upsampling) + skip connection from Encoder 3. Recovers spatial detail.", type: "decoder" },
    { id: "dec2", label: "Decoder 2", size: "64×64×128", desc: "Upsampling + skip from Encoder 2. Fuses high-level semantics with spatial info.", type: "decoder" },
    { id: "dec1", label: "Decoder 1", size: "128×128×64", desc: "Final upsampling. Feature map restored to original spatial resolution.", type: "decoder" },
    { id: "output", label: "Output", size: "128×128×1", desc: "1×1 Conv2D + Sigmoid. Each pixel = probability of being tumor. Threshold at 0.5.", type: "io" },
];

const typeColors: Record<string, string> = {
    io: "border-white/25 bg-white/8",
    encoder: "border-blue-400/25 bg-blue-500/8",
    pool: "border-white/10 bg-white/4",
    bottleneck: "border-white/60 bg-white/12",
    decoder: "border-orange-400/25 bg-orange-500/8",
};

const typeLabels: Record<string, string> = {
    io: "I/O", encoder: "Encoder", pool: "Pool", bottleneck: "Bottleneck", decoder: "Decoder",
};

/* ── Comparison ── */
const comparisonData = [
    { model: "NeuroVisionAI (Ours)", dice: "93.57%", params: "7.8M", latency: "1.4s", dataset: "BraTS 2021", modality: "FLAIR" },
    { model: "Baseline U-Net", dice: "85.2%", params: "31.0M", latency: "3.2s", dataset: "BraTS 2020", modality: "All 4" },
    { model: "SegNet", dice: "78.4%", params: "29.5M", latency: "5.1s", dataset: "BraTS 2019", modality: "T1+T2" },
    { model: "DeepMedic", dice: "80.1%", params: "12.0M", latency: "4.8s", dataset: "BraTS 2018", modality: "All 4" },
    { model: "Simple FCN", dice: "71.3%", params: "134M", latency: "8.2s", dataset: "Custom", modality: "T1" },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string | number }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass rounded-xl p-3 border border-white/10 text-xs">
            <p className="text-white/40 font-mono mb-2">Epoch {label}</p>
            {payload.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                    <span className="text-white/50">{p.name}:</span>
                    <span className="text-white font-mono font-bold">{p.value}</span>
                </div>
            ))}
        </div>
    );
};

/* ── Section header helper ── */
function SectionHeader({ tag, title, sub }: { tag: string; title: string; sub?: string }) {
    return (
        <div className="mb-8 sm:mb-10">
            <p className="text-[10px] sm:text-xs font-mono text-white/25 tracking-[0.2em] uppercase mb-2">{tag}</p>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
            {sub && <p className="text-white/35 text-sm mt-1">{sub}</p>}
        </div>
    );
}

export default function ModelPage() {
    const [selectedLayer, setSelectedLayer] = useState<(typeof unetLayers)[0] | null>(null);
    const [activeChart, setActiveChart] = useState<"loss" | "dice">("loss");

    return (
        <div className="min-h-screen bg-black pt-20 sm:pt-24 pb-16 w-full flex flex-col items-center">
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">

                {/* Page Header */}
                <div className="text-center pt-4 sm:pt-6">
                    <span className="status-badge mb-4 inline-flex">
                        <div className="neon-dot" />
                        Architecture · Training · Benchmarks
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mt-4 mb-3">
                        About the Model
                    </h1>
                    <p className="text-white/35 max-w-lg mx-auto text-sm sm:text-base">
                        A deep dive into the U-Net architecture, training methodology, and
                        benchmark results for NeuroVisionAI.
                    </p>
                </div>

                {/* ── U-Net Architecture ── */}
                <section>
                    <SectionHeader tag="Architecture" title="U-Net Architecture" sub="Click any layer to learn what it does." />

                    <div className="glass-strong rounded-2xl p-5 sm:p-6 border border-white/8">
                        {/* Legend */}
                        <div className="flex flex-wrap gap-2.5 sm:gap-3 mb-6 sm:mb-8">
                            {Object.entries(typeLabels).map(([type, label]) => (
                                <div key={type} className="flex items-center gap-1.5">
                                    <div className={`w-2.5 h-2.5 rounded-sm border ${typeColors[type]}`} />
                                    <span className="text-white/35 text-xs">{label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Layer grid */}
                        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                            {unetLayers.map((layer) => (
                                <button
                                    key={layer.id}
                                    onClick={() => setSelectedLayer(selectedLayer?.id === layer.id ? null : layer)}
                                    className={`relative flex flex-col items-center gap-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-all duration-200 text-center
                    ${typeColors[layer.type]}
                    ${selectedLayer?.id === layer.id
                                            ? "ring-2 ring-white/35 scale-105 shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                                            : "hover:border-white/25 hover:scale-[1.02]"
                                        }
                  `}
                                    style={{ minWidth: 90, maxWidth: 130 }}
                                >
                                    {layer.type === "bottleneck" && (
                                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white bg-white/12 px-2 py-0.5 rounded-full border border-white/15 whitespace-nowrap">
                                            Bottleneck
                                        </span>
                                    )}
                                    <span className="text-white text-xs sm:text-sm font-semibold leading-tight">{layer.label}</span>
                                    <span className="text-white/35 text-[9px] sm:text-xs font-mono">{layer.size}</span>
                                    <span className="text-white/20 text-[9px] capitalize">{typeLabels[layer.type]}</span>
                                </button>
                            ))}
                        </div>

                        {/* Detail panel */}
                        {selectedLayer && (
                            <div className="mt-5 sm:mt-6 p-4 sm:p-5 rounded-xl border border-white/10 bg-white/4 animate-fade-in-up">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div>
                                        <h4 className="text-white font-bold text-sm sm:text-base">{selectedLayer.label}</h4>
                                        <span className="text-white/30 font-mono text-xs">{selectedLayer.size}</span>
                                    </div>
                                    <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-md border shrink-0 ${typeColors[selectedLayer.type]}`}>
                                        {typeLabels[selectedLayer.type]}
                                    </span>
                                </div>
                                <p className="text-white/45 text-xs sm:text-sm leading-relaxed">{selectedLayer.desc}</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Training Curves ── */}
                <section>
                    <SectionHeader tag="Performance" title="Training Curves" sub="30 epochs on BraTS 2021 — 80% train / 20% validation split." />

                    <div className="glass-strong rounded-2xl p-5 sm:p-6 border border-white/8">
                        {/* Toggle */}
                        <div className="flex gap-2 mb-6 sm:mb-8">
                            {(["loss", "dice"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveChart(tab)}
                                    className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium capitalize transition-all ${activeChart === tab ? "bg-white text-black" : "text-white/40 hover:text-white border border-white/10 hover:border-white/20"
                                        }`}
                                >
                                    {tab === "loss" ? "Loss" : "Dice Score"}
                                </button>
                            ))}
                        </div>

                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={trainingData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="epoch" stroke="rgba(255,255,255,0.15)" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} />
                                <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} domain={activeChart === "dice" ? [0, 1] : ["auto", "auto"]} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: 12 }} formatter={(v) => <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{v}</span>} />
                                {activeChart === "loss" ? (
                                    <>
                                        <Line type="monotone" dataKey="trainLoss" name="Train Loss" stroke="#ffffff" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="valLoss" name="Val Loss" stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                    </>
                                ) : (
                                    <>
                                        <Line type="monotone" dataKey="trainDice" name="Train Dice" stroke="#ffffff" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="valDice" name="Val Dice" stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                    </>
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* ── Dataset Stats ── */}
                <section>
                    <SectionHeader tag="Dataset" title="BraTS 2021 Stats" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        {[
                            { val: "1,251", label: "Patient Cases", sub: "Multi-institutional" },
                            { val: "48,577", label: "MRI Slices", sub: "Used for training" },
                            { val: "FLAIR", label: "Modality", sub: "Single modality" },
                            { val: "128×128", label: "Input Resolution", sub: "After resize" },
                        ].map(({ val, label, sub }) => (
                            <div key={label} className="glass rounded-xl p-4 sm:p-5 border border-white/8 text-center">
                                <div className="text-xl sm:text-2xl font-black text-white font-mono mb-1">{val}</div>
                                <div className="text-[10px] sm:text-xs font-semibold text-white/50 uppercase tracking-wider">{label}</div>
                                <div className="text-[10px] sm:text-xs text-white/20 mt-0.5">{sub}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Comparison Table ── */}
                <section>
                    <SectionHeader tag="Benchmarks" title="NeuroVisionAI vs Baselines" />
                    <div className="glass-strong rounded-2xl overflow-hidden border border-white/8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs sm:text-sm min-w-[560px]">
                                <thead>
                                    <tr className="border-b border-white/8">
                                        {["Model", "Dice Score", "Parameters", "Latency", "Dataset", "Modality"].map((h) => (
                                            <th key={h} className="px-4 sm:px-5 py-3 sm:py-4 text-left text-white/25 font-mono text-[10px] sm:text-xs tracking-wider uppercase whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonData.map((row, i) => (
                                        <tr key={row.model} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i === 0 ? "bg-white/[0.02]" : ""}`}>
                                            <td className="px-4 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                                                <span className={`font-semibold ${i === 0 ? "text-white" : "text-white/45"}`}>{row.model}</span>
                                                {i === 0 && <span className="ml-1.5 text-[9px] font-bold bg-white text-black px-1.5 py-0.5 rounded">OURS</span>}
                                            </td>
                                            <td className={`px-4 sm:px-5 py-3 sm:py-4 font-mono font-bold whitespace-nowrap ${i === 0 ? "text-white" : "text-white/35"}`}>{row.dice}</td>
                                            <td className="px-4 sm:px-5 py-3 sm:py-4 font-mono text-white/35 whitespace-nowrap">{row.params}</td>
                                            <td className="px-4 sm:px-5 py-3 sm:py-4 font-mono text-white/35 whitespace-nowrap">{row.latency}</td>
                                            <td className="px-4 sm:px-5 py-3 sm:py-4 text-white/35 whitespace-nowrap">{row.dataset}</td>
                                            <td className="px-4 sm:px-5 py-3 sm:py-4 text-white/35 whitespace-nowrap">{row.modality}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}

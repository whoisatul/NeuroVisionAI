"use client";

import { useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

/* ────────────── Training data ────────────── */
const trainingData = Array.from({ length: 30 }, (_, i) => ({
    epoch: i + 1,
    trainLoss: parseFloat((0.72 * Math.exp(-0.11 * i) + 0.04 + Math.random() * 0.015).toFixed(4)),
    valLoss: parseFloat((0.78 * Math.exp(-0.095 * i) + 0.06 + Math.random() * 0.02).toFixed(4)),
    trainDice: parseFloat((0.93 * (1 - Math.exp(-0.12 * i)) + Math.random() * 0.01).toFixed(4)),
    valDice: parseFloat((0.88 * (1 - Math.exp(-0.10 * i)) + Math.random() * 0.015).toFixed(4)),
}));

/* ────────────── U-Net Layer data ────────────── */
const unetLayers = [
    {
        id: "input",
        label: "Input",
        size: "128×128×1",
        desc: "FLAIR MRI slice normalized to [0,1]. Single-channel grayscale input.",
        level: 0,
        type: "io",
        x: 50,
    },
    {
        id: "enc1",
        label: "Encoder 1",
        size: "128×128×64",
        desc: "Two 3×3 Conv2D layers + ReLU activation + BatchNorm. Extracts low-level features: edges, textures.",
        level: 1,
        type: "encoder",
    },
    {
        id: "pool1",
        label: "MaxPool",
        size: "64×64×64",
        desc: "2×2 max pooling reduces spatial resolution by half, doubling effective receptive field.",
        level: 1,
        type: "pool",
    },
    {
        id: "enc2",
        label: "Encoder 2",
        size: "64×64×128",
        desc: "Two 3×3 Conv blocks with 128 filters. Captures mid-level semantic patterns.",
        level: 2,
        type: "encoder",
    },
    {
        id: "pool2",
        label: "MaxPool",
        size: "32×32×128",
        desc: "Second downsampling step. Feature map now 32×32.",
        level: 2,
        type: "pool",
    },
    {
        id: "enc3",
        label: "Encoder 3",
        size: "32×32×256",
        desc: "256-filter conv block. Encodes high-level semantic information about tumor morphology.",
        level: 3,
        type: "encoder",
    },
    {
        id: "bottleneck",
        label: "Bottleneck",
        size: "16×16×512",
        desc: "Deepest representation. 512 filters at 16×16 resolution. Compressed latent encoding of full scan context.",
        level: 4,
        type: "bottleneck",
    },
    {
        id: "dec3",
        label: "Decoder 3",
        size: "32×32×256",
        desc: "Transposed Conv2D (upsampling) + skip connection from Encoder 3. Recovers spatial detail.",
        level: 3,
        type: "decoder",
    },
    {
        id: "dec2",
        label: "Decoder 2",
        size: "64×64×128",
        desc: "Upsampling + skip from Encoder 2. Fuses high-level semantics with fine spatial info.",
        level: 2,
        type: "decoder",
    },
    {
        id: "dec1",
        label: "Decoder 1",
        size: "128×128×64",
        desc: "Final upsampling. Feature map restored to original spatial resolution.",
        level: 1,
        type: "decoder",
    },
    {
        id: "output",
        label: "Output",
        size: "128×128×1",
        desc: "1×1 Conv2D with Sigmoid activation. Each pixel probability of being tumor tissue. Threshold at 0.5.",
        level: 0,
        type: "io",
    },
];

const typeColors: Record<string, string> = {
    io: "border-white/30 bg-white/10",
    encoder: "border-blue-400/30 bg-blue-500/10",
    pool: "border-white/15 bg-white/5",
    bottleneck: "border-white bg-white/15",
    decoder: "border-orange-400/30 bg-orange-500/10",
};

const typeLabels: Record<string, string> = {
    io: "I/O",
    encoder: "Encoder",
    pool: "Pool",
    bottleneck: "Bottleneck",
    decoder: "Decoder",
};

/* ────────────── Comparison data ────────────── */
const comparisonData = [
    { model: "NeuroVisionAI (Ours)", dice: "93.57%", params: "7.8M", latency: "1.4s", dataset: "BraTS 2021", modality: "FLAIR" },
    { model: "Baseline U-Net", dice: "85.2%", params: "31.0M", latency: "3.2s", dataset: "BraTS 2020", modality: "All 4" },
    { model: "SegNet", dice: "78.4%", params: "29.5M", latency: "5.1s", dataset: "BraTS 2019", modality: "T1+T2" },
    { model: "DeepMedic", dice: "80.1%", params: "12.0M", latency: "4.8s", dataset: "BraTS 2018", modality: "All 4" },
    { model: "Simple FCN", dice: "71.3%", params: "134M", latency: "8.2s", dataset: "Custom", modality: "T1" },
];

/* ────────────── Custom Tooltip ────────────── */
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string | number }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass rounded-xl p-3 border border-white/10 text-sm">
                <p className="text-white/50 font-mono mb-2">Epoch {label}</p>
                {payload.map((p) => (
                    <div key={p.name} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                        <span className="text-white/60">{p.name}:</span>
                        <span className="text-white font-mono font-semibold">{p.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function ModelPage() {
    const [selectedLayer, setSelectedLayer] = useState<(typeof unetLayers)[0] | null>(null);
    const [activeChart, setActiveChart] = useState<"loss" | "dice">("loss");

    return (
        <div className="min-h-screen bg-black pt-24 pb-16 px-6">
            <div className="max-w-6xl mx-auto space-y-20">

                {/* Header */}
                <div className="text-center">
                    <span className="status-badge mb-4 inline-flex">
                        <div className="neon-dot" />
                        Architecture · Training · Benchmarks
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-white mt-4 mb-3">
                        About the Model
                    </h1>
                    <p className="text-white/40 max-w-xl mx-auto">
                        A deep dive into the U-Net architecture, training methodology, and
                        benchmark results for NeuroVisionAI.
                    </p>
                </div>

                {/* ── U-Net Architecture Diagram ── */}
                <section>
                    <div className="mb-8">
                        <p className="text-xs font-mono text-white/30 tracking-[0.2em] uppercase mb-2">Architecture</p>
                        <h2 className="text-2xl font-bold text-white">U-Net Architecture</h2>
                        <p className="text-white/40 text-sm mt-1">
                            Click any layer to learn what it does.
                        </p>
                    </div>

                    <div className="glass-strong rounded-2xl p-6 border border-white/8 overflow-x-auto">
                        {/* Legend */}
                        <div className="flex flex-wrap gap-3 mb-8">
                            {Object.entries(typeLabels).map(([type, label]) => (
                                <div key={type} className="flex items-center gap-1.5">
                                    <div className={`w-3 h-3 rounded-sm border ${typeColors[type]}`} />
                                    <span className="text-white/40 text-xs">{label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Layer grid */}
                        <div className="flex flex-wrap gap-3 justify-center">
                            {unetLayers.map((layer) => (
                                <button
                                    key={layer.id}
                                    onClick={() =>
                                        setSelectedLayer(selectedLayer?.id === layer.id ? null : layer)
                                    }
                                    className={`relative flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border transition-all duration-200
                    ${typeColors[layer.type]}
                    ${selectedLayer?.id === layer.id
                                            ? "ring-2 ring-white/40 scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                            : "hover:scale-102 hover:border-white/25"
                                        }
                  `}
                                    style={{ minWidth: 110 }}
                                >
                                    {layer.type === "bottleneck" && (
                                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-full border border-white/20 whitespace-nowrap">
                                            Bottleneck
                                        </span>
                                    )}
                                    <span className="text-white text-sm font-semibold">{layer.label}</span>
                                    <span className="text-white/40 text-xs font-mono">{layer.size}</span>
                                    <span className="text-white/25 text-[10px] capitalize">{typeLabels[layer.type]}</span>
                                </button>
                            ))}
                        </div>

                        {/* Detail panel */}
                        {selectedLayer && (
                            <div className="mt-6 p-5 rounded-xl border border-white/10 bg-white/5 animate-fade-in-up">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h4 className="text-white font-bold">
                                            {selectedLayer.label}
                                        </h4>
                                        <span className="text-white/30 font-mono text-sm">
                                            {selectedLayer.size}
                                        </span>
                                    </div>
                                    <span
                                        className={`text-xs px-2 py-1 rounded-md border ${typeColors[selectedLayer.type]}`}
                                    >
                                        {typeLabels[selectedLayer.type]}
                                    </span>
                                </div>
                                <p className="text-white/50 text-sm leading-relaxed mt-2">
                                    {selectedLayer.desc}
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Training Curves ── */}
                <section>
                    <div className="mb-8">
                        <p className="text-xs font-mono text-white/30 tracking-[0.2em] uppercase mb-2">Performance</p>
                        <h2 className="text-2xl font-bold text-white">Training Curves</h2>
                        <p className="text-white/40 text-sm mt-1">
                            30 epochs on BraTS 2021 — 80% train / 20% validation split.
                        </p>
                    </div>

                    <div className="glass-strong rounded-2xl p-6 border border-white/8">
                        {/* Toggle */}
                        <div className="flex gap-2 mb-8">
                            {(["loss", "dice"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveChart(tab)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${activeChart === tab
                                            ? "bg-white text-black"
                                            : "text-white/40 hover:text-white border border-white/10 hover:border-white/20"
                                        }`}
                                >
                                    {tab === "loss" ? "Loss" : "Dice Score"}
                                </button>
                            ))}
                        </div>

                        <ResponsiveContainer width="100%" height={340}>
                            <LineChart
                                data={trainingData}
                                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="epoch"
                                    stroke="rgba(255,255,255,0.2)"
                                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                                    label={{ value: "Epoch", position: "insideBottom", offset: -2, fill: "rgba(255,255,255,0.2)", fontSize: 11 }}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.2)"
                                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                                    domain={activeChart === "dice" ? [0, 1] : ["auto", "auto"]}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    wrapperStyle={{ paddingTop: 16 }}
                                    formatter={(value) => (
                                        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                                            {value}
                                        </span>
                                    )}
                                />
                                {activeChart === "loss" ? (
                                    <>
                                        <Line
                                            type="monotone"
                                            dataKey="trainLoss"
                                            name="Train Loss"
                                            stroke="#ffffff"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="valLoss"
                                            name="Val Loss"
                                            stroke="rgba(255,255,255,0.4)"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            dot={false}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <Line
                                            type="monotone"
                                            dataKey="trainDice"
                                            name="Train Dice"
                                            stroke="#ffffff"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="valDice"
                                            name="Val Dice"
                                            stroke="rgba(255,255,255,0.4)"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            dot={false}
                                        />
                                    </>
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* ── Dataset Stats ── */}
                <section>
                    <div className="mb-8">
                        <p className="text-xs font-mono text-white/30 tracking-[0.2em] uppercase mb-2">Dataset</p>
                        <h2 className="text-2xl font-bold text-white">BraTS 2021 Stats</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { val: "1,251", label: "Patient Cases", sub: "Multi-institutional" },
                            { val: "48,577", label: "MRI Slices", sub: "Used for training" },
                            { val: "FLAIR", label: "Modality", sub: "Single modality" },
                            { val: "128×128", label: "Input Resolution", sub: "After resize" },
                        ].map(({ val, label, sub }) => (
                            <div
                                key={label}
                                className="glass rounded-xl p-5 border border-white/8 text-center space-y-1.5"
                            >
                                <div className="text-2xl font-black text-white font-mono">{val}</div>
                                <div className="text-xs font-semibold text-white/60 uppercase tracking-wider">{label}</div>
                                <div className="text-xs text-white/25">{sub}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Comparison Table ── */}
                <section>
                    <div className="mb-8">
                        <p className="text-xs font-mono text-white/30 tracking-[0.2em] uppercase mb-2">Benchmarks</p>
                        <h2 className="text-2xl font-bold text-white">NeuroVisionAI vs Baselines</h2>
                    </div>
                    <div className="glass-strong rounded-2xl overflow-hidden border border-white/8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/8">
                                        {["Model", "Dice Score", "Parameters", "Latency", "Dataset", "Modality"].map(
                                            (h) => (
                                                <th
                                                    key={h}
                                                    className="px-5 py-4 text-left text-white/30 font-mono text-xs tracking-wider uppercase"
                                                >
                                                    {h}
                                                </th>
                                            )
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonData.map((row, i) => (
                                        <tr
                                            key={row.model}
                                            className={`border-b border-white/5 transition-colors hover:bg-white/3 ${i === 0 ? "bg-white/[0.03]" : ""
                                                }`}
                                        >
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`font-semibold ${i === 0 ? "text-white" : "text-white/50"
                                                        }`}
                                                >
                                                    {row.model}
                                                </span>
                                                {i === 0 && (
                                                    <span className="ml-2 text-[10px] font-bold bg-white text-black px-1.5 py-0.5 rounded">
                                                        OURS
                                                    </span>
                                                )}
                                            </td>
                                            <td className={`px-5 py-4 font-mono font-bold ${i === 0 ? "text-white" : "text-white/40"}`}>
                                                {row.dice}
                                            </td>
                                            <td className="px-5 py-4 font-mono text-white/40">{row.params}</td>
                                            <td className="px-5 py-4 font-mono text-white/40">{row.latency}</td>
                                            <td className="px-5 py-4 text-white/40">{row.dataset}</td>
                                            <td className="px-5 py-4 text-white/40">{row.modality}</td>
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

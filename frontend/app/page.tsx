"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Brain,
  Zap,
  Shield,
  Upload,
  Search,
  Download,
  Github,
  ArrowRight,
  Activity,
  Layers,
} from "lucide-react";

/* ─────────────────────────────── AnimatedBrainBg ─── */
function AnimatedBrainBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid */}
      <div className="brain-grid-bg" />

      {/* Scan line */}
      <div className="scan-line" />

      {/* Central glow orb */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07]"
        style={{
          background:
            "radial-gradient(ellipse at center, #ffffff 0%, transparent 65%)",
          animation: "brain-glow 6s ease-in-out infinite",
        }}
      />

      {/* Brain MRI ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="w-96 h-96 rounded-full border border-white/5 animate-spin-slow"
          style={{ animationDuration: "30s" }}
        />
        <div
          className="absolute inset-6 rounded-full border border-white/8"
          style={{ borderStyle: "dashed", animation: "spin-slow 20s linear infinite reverse" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Brain
            size={80}
            className="text-white opacity-[0.06]"
            style={{ animation: "float 6s ease-in-out infinite" }}
          />
        </div>
      </div>

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white"
          style={{
            left: `${10 + i * 7.5}%`,
            top: `${20 + (i % 5) * 15}%`,
            opacity: 0.1 + (i % 4) * 0.05,
            animation: `float ${4 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────── Counter ─── */
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          let start = 0;
          const step = end / 60;
          const interval = setInterval(() => {
            start += step;
            if (start >= end) {
              setCount(end);
              clearInterval(interval);
            } else {
              setCount(Math.floor(start));
            }
          }, 20);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ─────────────────────────────── Main Page ─── */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <AnimatedBrainBg />

        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-white/60 tracking-wider uppercase">
            <div className="neon-dot" />
            Deep Learning · U-Net · BraTS 2021
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
            <span className="glow-text">AI-Powered</span>
            <br />
            Brain Tumor Detection
            <br />
            <span className="text-white/40">in Seconds</span>
          </h1>

          {/* Subhead */}
          <p className="max-w-2xl mx-auto text-lg text-white/50 leading-relaxed mb-10">
            Upload a FLAIR MRI scan. Our U-Net model, trained on{" "}
            <span className="text-white/70">1,251 real patient cases</span>{" "}
            from BraTS 2021, segments the tumor region at the pixel level with{" "}
            <span className="text-white font-semibold">93.57% Dice accuracy</span>.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/demo">
              <button className="btn-primary flex items-center gap-2 px-8 py-4 rounded-xl text-base">
                Try Demo <ArrowRight size={18} />
              </button>
            </Link>
            <Link href="/model">
              <button className="btn-secondary flex items-center gap-2 px-8 py-4 rounded-xl text-base">
                <Brain size={18} />
                Explore the Model
              </button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { val: 93, suffix: ".57%", label: "Dice Accuracy" },
              { val: 1251, suffix: "", label: "Patient Cases" },
              { val: 48577, suffix: "", label: "MRI Slices" },
            ].map(({ val, suffix, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black text-white font-mono">
                  <Counter end={val} suffix={suffix} />
                </div>
                <div className="text-xs text-white/30 mt-1 tracking-wider uppercase">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-28 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-white/30 tracking-[0.2em] uppercase mb-3">
              Capabilities
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Precision at Every Pixel
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                stat: "93.5%",
                label: "Dice Accuracy",
                desc: "Validated on the BraTS 2021 test set. Our U-Net achieves state-of-the-art pixel-wise overlap with ground-truth tumor annotations.",
                tag: "Accuracy",
              },
              {
                icon: Activity,
                stat: "FLAIR",
                label: "MRI Support",
                desc: "Trained exclusively on FLAIR (Fluid-attenuated Inversion Recovery) MRI modality — the gold standard for detecting brain edema and tumors.",
                tag: "Modality",
              },
              {
                icon: Zap,
                stat: "<2s",
                label: "Instant Segmentation",
                desc: "From uploaded PNG slice to segmented tumor mask in under 2 seconds — powered by optimized Keras inference on FastAPI backend.",
                tag: "Performance",
              },
            ].map(({ icon: Icon, stat, label, desc, tag }) => (
              <div
                key={label}
                className="glass-strong rounded-2xl p-8 gradient-border card-hover group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Icon size={22} className="text-white" />
                  </div>
                  <span className="text-xs font-mono text-white/30 tracking-wider border border-white/10 px-2 py-1 rounded-md">
                    {tag}
                  </span>
                </div>
                <div className="text-4xl font-black text-white mb-1 tracking-tight">
                  {stat}
                </div>
                <div className="text-sm font-semibold text-white/70 mb-3">{label}</div>
                <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-28 px-6 relative overflow-hidden">
        {/* bg accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-white/[0.02] to-black pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-white/30 tracking-[0.2em] uppercase mb-3">
              Workflow
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              How It Works
            </h2>
            <p className="text-white/40 mt-3 max-w-xl mx-auto">
              Three simple steps from raw scan to segmented tumor mask.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector lines */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {[
              {
                step: "01",
                icon: Upload,
                title: "Upload MRI Scan",
                desc: "Drag & drop your FLAIR MRI scan as a .nii.gz file or PNG slice. 128×128 or larger.",
                color: "from-white/10 to-transparent",
              },
              {
                step: "02",
                icon: Search,
                title: "AI Analyzes",
                desc: "Our U-Net preprocesses the image (normalize → resize to 128×128) and runs pixel-level inference.",
                color: "from-white/10 to-transparent",
              },
              {
                step: "03",
                icon: Download,
                title: "Download Results",
                desc: "Get the segmented tumor mask overlay, Dice score, tumor area, and confidence — all in seconds.",
                color: "from-white/10 to-transparent",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center group">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full glass border border-white/10 flex items-center justify-center group-hover:border-white/25 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                    <Icon size={30} className="text-white/70 group-hover:text-white transition-colors" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-black text-xs font-black flex items-center justify-center">
                    {step.replace("0", "")}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/40 leading-relaxed max-w-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section className="py-24 px-6 bg-black border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-mono text-white/30 tracking-[0.2em] uppercase mb-3">
              Built with
            </p>
            <h2 className="text-3xl font-bold text-white">Tech Stack</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: "TensorFlow", desc: "2.x / Keras" },
              { name: "U-Net", desc: "Architecture" },
              { name: "BraTS 2021", desc: "Dataset" },
              { name: "Python 3.10", desc: "Backend" },
              { name: "FastAPI", desc: "REST API" },
              { name: "Next.js 15", desc: "Frontend" },
              { name: "Tailwind CSS", desc: "Styling" },
              { name: "Docker", desc: "Containerized" },
            ].map(({ name, desc }) => (
              <div
                key={name}
                className="flex items-center gap-2.5 glass px-5 py-3 rounded-xl card-hover cursor-default group"
              >
                <div className="w-2 h-2 rounded-full bg-white/50 group-hover:bg-white transition-colors" />
                <div>
                  <span className="text-sm font-semibold text-white">{name}</span>
                  <span className="text-xs text-white/30 ml-2">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-28 px-6 bg-black">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-strong rounded-3xl p-12 gradient-border relative overflow-hidden">
            {/* decorative */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <Layers size={40} className="text-white/20 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to detect brain tumors?
            </h2>
            <p className="text-white/40 mb-8 max-w-md mx-auto">
              Upload your MRI scan and get a pixel-level tumor segmentation mask
              in under 2 seconds — no setup required.
            </p>
            <Link href="/demo">
              <button className="btn-primary px-10 py-4 rounded-xl text-base flex items-center gap-2 mx-auto">
                Launch Demo <ArrowRight size={18} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-12 px-6 bg-black">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
              <Brain size={14} className="text-black" />
            </div>
            <span className="font-bold text-white">NeuroVisionAI</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-white/30">
            {[
              { href: "/", label: "Home" },
              { href: "/demo", label: "Demo" },
              { href: "/model", label: "Model" },
              { href: "/research", label: "Research" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* GitHub */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-sm group"
          >
            <Github size={16} className="group-hover:scale-110 transition-transform" />
            GitHub
          </a>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-white/20">
          <span>© 2025 NeuroVisionAI. Built for research purposes only.</span>
          <span className="font-mono">U-Net · BraTS 2021 · 93.57% Dice</span>
        </div>
      </footer>
    </div>
  );
}

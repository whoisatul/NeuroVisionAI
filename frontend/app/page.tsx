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

/* ─────────────────────────── Animated Hero Background ─── */
function AnimatedBrainBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="brain-grid-bg" />
      <div className="scan-line" />
      {/* Glow orb */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, transparent 65%)",
          animation: "brain-glow 6s ease-in-out infinite",
        }}
      />
      {/* Rotating rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-white/5 animate-spin-slow" style={{ animationDuration: "30s" }} />
        <div className="absolute inset-5 sm:inset-8 rounded-full border border-white/5" style={{ borderStyle: "dashed", animation: "spin-slow 20s linear infinite reverse" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Brain size={64} className="text-white/5" style={{ animation: "float 6s ease-in-out infinite" }} />
        </div>
      </div>
      {/* Particles */}
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/20"
          style={{
            left: `${10 + i * 8}%`,
            top: `${20 + (i % 5) * 13}%`,
            animation: `float ${4 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────── Numeric Counter ─── */
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
            if (start >= end) { setCount(end); clearInterval(interval); }
            else setCount(Math.floor(start));
          }, 20);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─────────────────────────── Page ─── */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex justify-center overflow-hidden items-center">
        <AnimatedBrainBg />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black pointer-events-none" />

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-28 pb-16 flex flex-col items-center gap-6">
          {/* Badge */}
          <div className="inline-flex items-center justify-center gap-2 h-8 w-80 rounded-full border border-white/10 bg-white/10 text-xs font-medium text-white/50 tracking-wider uppercase">
            <div className="neon-dot" />
            Deep Learning · U-Net · BraTS 2021
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-5">
            <span className="glow-text">AI-Powered</span>
            <br />
            Brain Tumor Detection
            <br />
            <span className="text-white/35 text-7xl">In Seconds</span>
          </h1>

          {/* Sub */}
          <p className="text-base sm:text-lg text-white/45 leading-relaxed mb-10">
            Upload a FLAIR MRI scan. Our U-Net model, trained on{" "}
            <span className="text-white/70">1,251 real patient cases</span>{" "}
            from BraTS 2021, segments the tumor region at pixel level with{" "}
            <span className="text-white font-semibold">93.57% Dice accuracy</span>.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/demo">
              <button className="btn-primary flex items-center gap-2 px-5 py-2 rounded-xl text-sm sm:text-base w-full sm:w-auto justify-center">
                Try Demo <ArrowRight size={16} />
              </button>
            </Link>
            <Link href="/model">
              <button className="btn-secondary flex items-center gap-2 px-5 py-2 text-base sm:text-base w-full sm:w-auto justify-center">
                <Brain size={16} />
                Explore the Model
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mx-auto">
            {[
              { val: 93, suffix: ".57%", label: "Dice Accuracy" },
              { val: 1251, suffix: "", label: "Patient Cases" },
              { val: 48577, suffix: "", label: "MRI Slices" },
            ].map(({ val, suffix, label }) => (
              <div key={label} className="text-center">
                <div className="text-xl sm:text-2xl font-black text-white font-mono">
                  <Counter end={val} suffix={suffix} />
                </div>
                <div className="text-[10px] sm:text-xs text-white/25 mt-1 tracking-wider uppercase">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20">
          <span className="text-[10px] tracking-widest uppercase">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/25 to-transparent" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative pt-40 pb-32 overflow-hidden flex justify-center h-[500px] items-center">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ">
          <div className="text-center mb-25 sm:mb-16">
            <p className="text-[10px] sm:text-xs font-mono text-white/30 tracking-[0.2em] uppercase">
              Capabilities
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Precision at Every Pixel
            </h2>
          </div>

          <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ">
            {[
              {
                icon: Shield,
                stat: "93.57%",
                label: "Dice Accuracy",
                desc: "Validated on the BraTS 2021 test set. State-of-the-art pixel-wise overlap with ground-truth tumor annotations.",
                tag: "Accuracy",
              },
              {
                icon: Activity,
                stat: "FLAIR",
                label: "MRI Support",
                desc: "Trained on FLAIR (Fluid-attenuated Inversion Recovery) modality — the gold standard for detecting brain edema and tumors.",
                tag: "Modality",
              },
              {
                icon: Zap,
                stat: "<2s",
                label: "Instant Segmentation",
                desc: "From uploaded PNG slice to segmented tumor mask in under 2 seconds — powered by optimized Keras inference on FastAPI.",
                tag: "Performance",
              },
            ].map(({ icon: Icon, stat, label, desc, tag }) => (
              <div
                key={label}
                className="glass-strong rounded-2xl p-6 sm:p-8 gradient-border card-hover flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon size={20} className="text-white" />
                  </div>
                  <span className="px-3 py-1 text-xs font-mono text-white/30 tracking-wide border border-white/10 rounded-md">
                    {tag}
                  </span>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-white mb-1">{stat}</div>
                  <div className="text-sm font-semibold text-white/60 mb-2">{label}</div>
                  <p className="text-sm text-white/35 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 sm:py-28 relative overflow-hidden w-full flex flex-col items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-white/[0.015] to-black pointer-events-none" />
        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center flex flex-col items-center sm:mb-16 ">
            <p className="text-[10px] sm:text-xs font-mono text-white/30 tracking-[0.2em] uppercase mb-3">
              Workflow
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
              How It Works
            </h2>
            <p className="text-white/35 mx-auto text-sm sm:text-base">
              Three simple steps from raw scan to segmented tumor mask.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {[
              {
                step: "1",
                icon: Upload,
                title: "Upload MRI Scan",
                desc: "Drag & drop your FLAIR MRI scan as a .nii.gz file or PNG slice.",
              },
              {
                step: "2",
                icon: Search,
                title: "AI Analyzes",
                desc: "Our U-Net preprocesses (normalize → resize to 128×128) and runs pixel-level inference.",
              },
              {
                step: "3",
                icon: Download,
                title: "Download Results",
                desc: "Get the segmented mask overlay, Dice score, tumor area, and confidence in seconds.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center group">
                <div className="relative mb-5">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full glass border border-white/10 flex items-center justify-center group-hover:border-white/25 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.06)]">
                    <Icon size={26} className="text-white/60 group-hover:text-white transition-colors" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white text-black text-xs font-black flex items-center justify-center">
                    {step}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/35 leading-relaxed max-w-[240px]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section className="py-16 sm:py-20 bg-black border-t border-white/5 w-full flex flex-col items-center mt-20 mb-24">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-[10px] sm:text-xs font-mono text-white/30 tracking-[0.2em] uppercase mb-3">
              Built With
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Tech Stack</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
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
                className="flex items-center gap-2 glass px-4 py-2.5 rounded-xl card-hover cursor-default group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-white transition-colors" />
                <span className="text-sm font-semibold text-white">{name}</span>
                <span className="text-xs text-white/25">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 sm:py-28 bg-black w-full flex flex-col items-center mt-10">
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-strong rounded-3xl p-8 sm:p-12 gradient-border relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <Layers size={36} className="text-white/15 mx-auto mb-5" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready to detect brain tumors?
            </h2>
            <p className="text-white/35 mb-7 text-sm sm:text-base">
              Upload your MRI scan and get a pixel-level tumor segmentation mask
              in under 2 seconds — no setup required.
            </p>
            <Link href="/demo">
              <button className="btn-primary px-8 py-3.5 rounded-xl text-sm sm:text-base inline-flex items-center gap-2">
                Launch Demo <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-10 bg-black w-full flex flex-col items-center">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                <Brain size={14} className="text-black" />
              </div>
              <span className="font-bold text-white">NeuroVisionAI</span>
            </div>

            {/* Links */}
            <div className="flex items-center flex-wrap justify-center gap-4 sm:gap-6 text-sm text-white/30">
              {["/", "/demo", "/model", "/research"].map((href, i) => (
                <Link key={href} href={href} className="hover:text-white transition-colors">
                  {["Home", "Demo", "Model", "Research"][i]}
                </Link>
              ))}
            </div>

            {/* GitHub */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-sm"
            >
              <Github size={16} />
              GitHub
            </a>
          </div>

          <div className="mt-7 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/20">
            <span>© 2025 NeuroVisionAI. For research purposes only.</span>
            <span className="font-mono">U-Net · BraTS 2021 · 93.57% Dice</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Brain, Menu, X } from "lucide-react";

const navLinks = [
    { href: "/", label: "Home" },
    { href: "/demo", label: "Demo" },
    { href: "/model", label: "Model" },
    { href: "/research", label: "Research" },
];

export default function Navbar() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handler);
        return () => window.removeEventListener("scroll", handler);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                ? "glass border-b border-white/5 py-3"
                : "bg-black/60 backdrop-blur-md py-4"
                }`}
        >
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group shrink-0">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-shadow duration-300">
                            <Brain size={16} className="text-black" />
                        </div>
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-white neon-dot" />
                    </div>
                    <span className="text-white font-bold text-base tracking-tight whitespace-nowrap">
                        NeuroVisionAI
                    </span>
                </Link>

                {/* Desktop Links — centered */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => {
                        const isActive =
                            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive
                                    ? "text-white bg-white/10 border border-white/10"
                                    : "text-white/50 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Right side */}
                <div className="hidden md:flex items-center gap-3 shrink-0">
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/40 hover:text-white transition-colors text-sm whitespace-nowrap"
                    >
                        GitHub
                    </a>
                    <Link href="/demo">
                        <button className="btn-primary px-4 py-2 rounded-lg text-sm whitespace-nowrap">
                            Try Demo →
                        </button>
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="md:hidden text-white/60 hover:text-white transition-colors p-1"
                    aria-label="Toggle menu"
                >
                    {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden border-t border-white/5 bg-black/90 backdrop-blur-md px-4 py-4 space-y-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMenuOpen(false)}
                            className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${pathname === link.href
                                ? "text-white bg-white/10"
                                : "text-white/50 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="pt-3 border-t border-white/5">
                        <Link href="/demo" onClick={() => setMenuOpen(false)}>
                            <button className="btn-primary w-full px-4 py-2.5 rounded-lg text-sm">
                                Try Demo →
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}

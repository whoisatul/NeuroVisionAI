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
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                        ? "glass border-b border-white/5 py-3"
                        : "bg-transparent py-5"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="relative">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-shadow duration-300">
                                <Brain size={18} className="text-black" />
                            </div>
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white neon-dot" />
                        </div>
                        <span className="text-white font-bold text-lg tracking-tight">
                            Neuro<span className="text-white/60">Vision</span>
                            <span className="text-white">AI</span>
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive =
                                link.href === "/"
                                    ? pathname === "/"
                                    : pathname.startsWith(link.href);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                            ? "text-white bg-white/10 border border-white/10"
                                            : "text-white/50 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* CTA */}
                    <div className="hidden md:flex items-center gap-3">
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/40 hover:text-white transition-colors text-sm"
                        >
                            GitHub
                        </a>
                        <Link href="/demo">
                            <button className="btn-primary px-4 py-2 rounded-lg text-sm">
                                Try Demo →
                            </button>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden text-white/60 hover:text-white transition-colors"
                    >
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="md:hidden glass border-t border-white/5 px-6 py-4 mt-1 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMenuOpen(false)}
                                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${pathname === link.href
                                        ? "text-white bg-white/10"
                                        : "text-white/50 hover:text-white"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="pt-2 border-t border-white/5">
                            <Link href="/demo" onClick={() => setMenuOpen(false)}>
                                <button className="btn-primary w-full px-4 py-2.5 rounded-lg text-sm mt-2">
                                    Try Demo →
                                </button>
                            </Link>
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
}

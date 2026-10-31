"use client";

import { useState } from "react";
import ScrollCanvas from "@/components/ScrollCanvas";
import { ArrowRight, ChevronDown, Sparkles, Compass, Eye, ShieldCheck } from "lucide-react";

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(1);

  return (
    <main className="relative min-h-[500vh] bg-black text-white selection:bg-white selection:text-black">
      {/* Scroll-driven canvas background */}
      <ScrollCanvas
        totalFrames={192}
        onProgressChange={(p, f) => {
          setScrollProgress(p);
          setCurrentFrame(f);
        }}
      />

      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-5 flex items-center justify-between backdrop-blur-md bg-black/20 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
            <Compass className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">
            EXPLORER<span className="text-white/40">.AI</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-300">
          <a href="#hero" className="hover:text-white transition-colors">Experience</a>
          <a href="#focus" className="hover:text-white transition-colors">Precision</a>
          <a href="#architecture" className="hover:text-white transition-colors">Features</a>
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-400">
            FRAME {String(currentFrame).padStart(3, "0")} / 192
          </span>
          <button className="px-4 py-2 rounded-full text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-colors shadow-lg shadow-white/10">
            Get Started
          </button>
        </div>
      </header>

      {/* Narrative Section 1: Hero (0% - 22%) */}
      <section
        id="hero"
        className="sticky top-0 h-screen w-full flex flex-col justify-center items-center px-6 text-center z-10 transition-opacity duration-500"
        style={{
          opacity: scrollProgress < 0.22 ? 1 - scrollProgress * 4.2 : 0,
          pointerEvents: scrollProgress < 0.22 ? "auto" : "none",
          transform: `translateY(${scrollProgress * -80}px)`,
        }}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
          <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
          <span className="text-xs uppercase tracking-widest font-medium text-neutral-200">
            Interactive Visual Narrative
          </span>
        </div>

        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight max-w-4xl leading-[1.08]">
          Capturing the Unseen.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-neutral-300 max-w-2xl font-light">
          Scroll to navigate continuous high-framerate cinematography synced seamlessly with responsive canvas scrubbing.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-white text-black hover:bg-neutral-200 transition-all shadow-xl shadow-white/20">
            Explore Experience <ArrowRight className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono text-neutral-400">
            Scroll down to advance video
          </span>
        </div>

        {/* Scroll down prompt */}
        <div className="absolute bottom-10 flex flex-col items-center gap-2 text-neutral-400 animate-bounce">
          <span className="text-[10px] uppercase font-mono tracking-widest">Scroll</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </section>

      {/* Narrative Section 2: Precision in Motion (25% - 48%) */}
      <section
        id="focus"
        className="sticky top-0 h-screen w-full flex items-center justify-start px-8 sm:px-16 lg:px-24 z-10 transition-opacity duration-500"
        style={{
          opacity:
            scrollProgress >= 0.23 && scrollProgress <= 0.48
              ? Math.min((scrollProgress - 0.23) * 6, (0.48 - scrollProgress) * 6, 1)
              : 0,
          pointerEvents: scrollProgress >= 0.23 && scrollProgress <= 0.48 ? "auto" : "none",
          transform: `translateY(${Math.max(0, (0.35 - scrollProgress) * 60)}px)`,
        }}
      >
        <div className="max-w-xl p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-neutral-300 mb-4">
            <Eye className="h-3.5 w-3.5 text-blue-400" />
            01 / CINEMATIC SCRUB
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Seamless Canvas Rendering
          </h2>
          <p className="mt-4 text-sm sm:text-base text-neutral-300 leading-relaxed font-light">
            Every frame is pre-buffered and synchronized with the browser’s render cycle via requestAnimationFrame. No video buffering jitter, just tactile 60 FPS motion.
          </p>
          <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold font-mono">192</div>
              <div className="text-xs text-neutral-400 uppercase tracking-wider">Frames Indexed</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">60 FPS</div>
              <div className="text-xs text-neutral-400 uppercase tracking-wider">Smooth Playback</div>
            </div>
          </div>
        </div>
      </section>

      {/* Narrative Section 3: Detail & Architecture (50% - 73%) */}
      <section
        id="architecture"
        className="sticky top-0 h-screen w-full flex items-center justify-end px-8 sm:px-16 lg:px-24 z-10 transition-opacity duration-500"
        style={{
          opacity:
            scrollProgress >= 0.50 && scrollProgress <= 0.73
              ? Math.min((scrollProgress - 0.50) * 6, (0.73 - scrollProgress) * 6, 1)
              : 0,
          pointerEvents: scrollProgress >= 0.50 && scrollProgress <= 0.73 ? "auto" : "none",
          transform: `translateY(${Math.max(0, (0.62 - scrollProgress) * 60)}px)`,
        }}
      >
        <div className="max-w-xl p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-neutral-300 mb-4">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            02 / RESPONSIVE COVER
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            High-DPI Adaptive Aspect
          </h2>
          <p className="mt-4 text-sm sm:text-base text-neutral-300 leading-relaxed font-light">
            Dynamic device-pixel-ratio awareness guarantees crisp visual fidelity on Retina displays, auto-centering and scaling the frame sequence without letterboxing.
          </p>
          <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-6">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 border border-white/20" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 border border-white/20" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 border border-white/20" />
            </div>
            <span className="text-xs text-neutral-400 font-mono">
              Universal browser & mobile support
            </span>
          </div>
        </div>
      </section>

      {/* Narrative Section 4: Call to Action (77% - 100%) */}
      <section
        className="sticky top-0 h-screen w-full flex flex-col justify-center items-center px-6 text-center z-10 transition-opacity duration-500"
        style={{
          opacity: scrollProgress >= 0.77 ? Math.min((scrollProgress - 0.77) * 5, 1) : 0,
          pointerEvents: scrollProgress >= 0.77 ? "auto" : "none",
          transform: `translateY(${Math.max(0, (0.9 - scrollProgress) * 60)}px)`,
        }}
      >
        <div className="max-w-2xl p-10 rounded-3xl bg-black/50 backdrop-blur-2xl border border-white/15 shadow-2xl flex flex-col items-center">
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight">
            Ready to Build?
          </h2>
          <p className="mt-4 text-neutral-300 max-w-lg font-light text-base sm:text-lg">
            Create captivating narrative experiences that command attention from the first scroll.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <button className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold bg-white text-black hover:bg-neutral-200 transition-all shadow-xl shadow-white/20">
              Get Started Free
            </button>
            <button className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all">
              Documentation
            </button>
          </div>

          <p className="mt-8 text-xs font-mono text-neutral-400">
            Powered by Next.js & Meko persistent context
          </p>
        </div>
      </section>

      {/* Interactive Scroll Progress Bar at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-white/10 z-40">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-75"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>
    </main>
  );
}

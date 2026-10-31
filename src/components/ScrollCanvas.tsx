"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ScrollCanvasProps {
  totalFrames?: number;
  framePath?: (index: number) => string;
  onProgressChange?: (progress: number, currentFrame: number) => void;
}

export default function ScrollCanvas({
  totalFrames = 192,
  framePath = (i) => `/frames/frame_${String(i).padStart(4, "0")}.jpg`,
  onProgressChange,
}: ScrollCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const currentFrameRef = useRef<number>(1);
  const targetFrameRef = useRef<number>(1);
  const rafIdRef = useRef<number | null>(null);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [isInitialReady, setIsInitialReady] = useState<boolean>(false);

  // Draw image with object-fit: cover semantics
  const renderFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imagesRef.current.get(frameIndex);
    if (!img || !img.complete || img.naturalWidth === 0) {
      // Fallback: search for nearest loaded frame
      let nearest: HTMLImageElement | undefined;
      for (let offset = 1; offset < 20; offset++) {
        const prev = imagesRef.current.get(frameIndex - offset);
        if (prev?.complete && prev.naturalWidth > 0) {
          nearest = prev;
          break;
        }
        const next = imagesRef.current.get(frameIndex + offset);
        if (next?.complete && next.naturalWidth > 0) {
          nearest = next;
          break;
        }
      }
      if (!nearest) return;
      drawImageCover(ctx, nearest, canvas.width, canvas.height);
      return;
    }

    drawImageCover(ctx, img, canvas.width, canvas.height);
  }, []);

  function drawImageCover(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    canvasWidth: number,
    canvasHeight: number
  ) {
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let renderWidth = canvasWidth;
    let renderHeight = canvasHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      renderHeight = canvasWidth / imgRatio;
      offsetY = (canvasHeight - renderHeight) / 2;
    } else {
      renderWidth = canvasHeight * imgRatio;
      offsetX = (canvasWidth - renderWidth) / 2;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
  }

  // Resize canvas according to device pixel ratio
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }

    renderFrame(currentFrameRef.current);
  }, [renderFrame]);

  // Preload initial frames for instant render, then stream remaining
  useEffect(() => {
    let isCancelled = false;
    let loadedCount = 0;

    // Load first frame immediately
    const firstImg = new Image();
    firstImg.src = framePath(1);
    firstImg.onload = () => {
      if (isCancelled) return;
      imagesRef.current.set(1, firstImg);
      setIsInitialReady(true);
      renderFrame(1);
    };

    // Preload remaining frames progressively
    for (let i = 1; i <= totalFrames; i++) {
      if (i === 1) continue;
      const img = new Image();
      img.src = framePath(i);
      img.onload = () => {
        if (isCancelled) return;
        imagesRef.current.set(i, img);
        loadedCount++;
        setLoadProgress(Math.round((loadedCount / totalFrames) * 100));

        // Keep rendering target frame if it was pending
        if (targetFrameRef.current === i) {
          renderFrame(i);
        }
      };
    }

    return () => {
      isCancelled = true;
    };
  }, [totalFrames, framePath, renderFrame]);

  // Setup resize listeners
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // Smooth scroll sync loop
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0;

      const targetFrame = Math.min(
        totalFrames,
        Math.max(1, Math.round(progress * (totalFrames - 1)) + 1)
      );

      targetFrameRef.current = targetFrame;
      onProgressChange?.(progress, targetFrame);

      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(updateAnimation);
      }
    };

    const updateAnimation = () => {
      if (currentFrameRef.current !== targetFrameRef.current) {
        // Interpolate or snap frame
        const diff = targetFrameRef.current - currentFrameRef.current;
        const step = Math.sign(diff) * Math.max(1, Math.abs(diff) > 4 ? 2 : 1);
        currentFrameRef.current += step;
        renderFrame(currentFrameRef.current);
      }

      if (currentFrameRef.current !== targetFrameRef.current) {
        rafIdRef.current = requestAnimationFrame(updateAnimation);
      } else {
        rafIdRef.current = null;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [totalFrames, renderFrame, onProgressChange]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-screen w-screen object-cover pointer-events-none z-0"
      />
      {/* Cinematic subtle vignette / contrast gradient */}
      <div className="fixed inset-0 pointer-events-none z-1 bg-gradient-to-t from-black/80 via-black/30 to-black/60" />

      {/* Loading pill indicator when downloading remaining frames */}
      {!isInitialReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Loading frames... {loadProgress}%
            </p>
          </div>
        </div>
      )}
    </>
  );
}

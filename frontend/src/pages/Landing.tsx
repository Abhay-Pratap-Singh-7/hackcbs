import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Play } from 'lucide-react';

const TOTAL_FRAMES = 366;
const MAX_VIRTUAL_SCROLL = 7500;

const Landing = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollFraction, setScrollFraction] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const startAutoScrollRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const frames: HTMLImageElement[] = [];
    let currentFrameIndex = 0;
    let animId: number | null = null;
    let autoScrollAnimId: number | null = null;
    let isAutoScrollActive = false;
    let virtualScroll = 0;
    let touchStartY = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw frame to canvas
    const drawFrame = (index: number) => {
      let img = frames[index];

      // If exact frame is not ready yet, search for closest loaded frame
      if (!img || !img.complete || img.naturalWidth === 0) {
        let bestDiff = TOTAL_FRAMES;
        let fallbackImg: HTMLImageElement | null = null;
        for (let i = 0; i < TOTAL_FRAMES; i++) {
          if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) {
            const diff = Math.abs(i - index);
            if (diff < bestDiff) {
              bestDiff = diff;
              fallbackImg = frames[i];
            }
          }
        }
        img = fallbackImg ?? img;
      }

      if (!img || !img.complete || img.naturalWidth === 0) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth || 1280;
      const ih = img.naturalHeight || 720;

      const scale = Math.max(cw / iw, ch / ih);
      const nw = iw * scale;
      const nh = ih * scale;
      const nx = (cw - nw) / 2;
      const ny = (ch - nh) / 2;

      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, nx, ny, nw, nh);
    };

    const updateProgress = () => {
      const fraction = Math.max(0, Math.min(1, virtualScroll / MAX_VIRTUAL_SCROLL));
      setScrollFraction(fraction);

      // Frame progression
      let targetFrame = 0;
      if (fraction < 0.22) {
        targetFrame = Math.floor((fraction / 0.22) * 183);
      } else if (fraction >= 0.22 && fraction < 0.26) {
        const tIn = (fraction - 0.22) / 0.04;
        targetFrame = 184 + Math.floor(tIn * 7);
      } else if (fraction >= 0.26 && fraction < 0.40) {
        targetFrame = 191;
      } else if (fraction >= 0.40 && fraction < 0.44) {
        const tMotion = (fraction - 0.40) / 0.04;
        targetFrame = 192 + Math.floor(tMotion * 23);
      } else if (fraction >= 0.44 && fraction < 0.60) {
        const tMid = (fraction - 0.44) / 0.16;
        targetFrame = 216 + Math.floor(tMid * 141);
      } else if (fraction >= 0.60 && fraction < 0.64) {
        const tEndIn = (fraction - 0.60) / 0.04;
        targetFrame = 358 + Math.floor(tEndIn * 7);
      } else {
        targetFrame = 365;
      }

      targetFrame = Math.min(TOTAL_FRAMES - 1, Math.max(0, targetFrame));
      currentFrameIndex = targetFrame;

      if (animId) cancelAnimationFrame(animId);
      animId = requestAnimationFrame(() => {
        drawFrame(currentFrameIndex);
      });
    };

    const stopAutoScroll = () => {
      if (isAutoScrollActive) {
        isAutoScrollActive = false;
        setIsAutoScrolling(false);
        if (autoScrollAnimId) cancelAnimationFrame(autoScrollAnimId);
      }
    };

    const stepAutoScroll = () => {
      if (!isAutoScrollActive) return;
      if (virtualScroll >= MAX_VIRTUAL_SCROLL) {
        stopAutoScroll();
        return;
      }
      virtualScroll = Math.min(MAX_VIRTUAL_SCROLL, virtualScroll + 4.5);
      updateProgress();
      autoScrollAnimId = requestAnimationFrame(stepAutoScroll);
    };

    startAutoScrollRef.current = () => {
      if (virtualScroll >= MAX_VIRTUAL_SCROLL) {
        virtualScroll = 0;
      }
      isAutoScrollActive = true;
      setIsAutoScrolling(true);
      if (autoScrollAnimId) cancelAnimationFrame(autoScrollAnimId);
      autoScrollAnimId = requestAnimationFrame(stepAutoScroll);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopAutoScroll();
      virtualScroll += e.deltaY;
      if (virtualScroll < 0) virtualScroll = 0;
      if (virtualScroll > MAX_VIRTUAL_SCROLL) virtualScroll = MAX_VIRTUAL_SCROLL;
      updateProgress();
    };

    const handleTouchStart = (e: TouchEvent) => {
      stopAutoScroll();
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      stopAutoScroll();
      const touchY = e.touches[0].clientY;
      const deltaY = (touchStartY - touchY) * 2;
      touchStartY = touchY;

      virtualScroll += deltaY;
      if (virtualScroll < 0) virtualScroll = 0;
      if (virtualScroll > MAX_VIRTUAL_SCROLL) virtualScroll = MAX_VIRTUAL_SCROLL;
      updateProgress();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        stopAutoScroll();
        virtualScroll = Math.min(MAX_VIRTUAL_SCROLL, virtualScroll + 140);
        updateProgress();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        stopAutoScroll();
        virtualScroll = Math.max(0, virtualScroll - 140);
        updateProgress();
      }
    };

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawFrame(currentFrameIndex);
      }
    };

    // Preload frames
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(4, '0');
      const frameIdx = i - 1;
      img.src = `/assets/frames/frame_${frameNum}.webp`;

      img.onload = () => {
        if (frameIdx === 0 || Math.abs(frameIdx - currentFrameIndex) <= 1) {
          drawFrame(currentFrameIndex);
        }
      };
      frames.push(img);
    }

    handleResize();

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
      if (autoScrollAnimId) cancelAnimationFrame(autoScrollAnimId);
    };
  }, []);

  // Compute Cloud 1 (Midway: College steps)
  let cloud1Percent = 0;
  let textStep1 = 0;
  const isCloud1Active = scrollFraction >= 0.21 && scrollFraction <= 0.45;

  if (scrollFraction >= 0.22 && scrollFraction < 0.26) {
    const tIn = (scrollFraction - 0.22) / 0.04;
    cloud1Percent = Math.min(1, Math.max(0, tIn));
    textStep1 = 0;
  } else if (scrollFraction >= 0.26 && scrollFraction <= 0.40) {
    cloud1Percent = 1;
    const holdProgress = (scrollFraction - 0.26) / 0.14;
    if (holdProgress < 0.33) {
      textStep1 = 1;
    } else if (holdProgress < 0.66) {
      textStep1 = 2;
    } else {
      textStep1 = 3;
    }
  } else if (scrollFraction > 0.40 && scrollFraction <= 0.44) {
    const tOut = (scrollFraction - 0.40) / 0.04;
    cloud1Percent = Math.max(0, 1 - tOut);
    textStep1 = 3;
  }

  // Compute Cloud 2 (End: Industry & Gov steps) - Slides in 8 frames early (0.60..0.64)
  let cloud2Percent = 0;
  let textStep2 = 0;
  const isCloud2Active = scrollFraction >= 0.59 && scrollFraction <= 0.89;

  if (scrollFraction >= 0.60 && scrollFraction < 0.64) {
    const tIn = (scrollFraction - 0.60) / 0.04;
    cloud2Percent = Math.min(1, Math.max(0, tIn));
    textStep2 = 0;
  } else if (scrollFraction >= 0.64 && scrollFraction <= 0.82) {
    cloud2Percent = 1;
    const holdProgress = (scrollFraction - 0.64) / 0.18;
    if (holdProgress < 0.33) {
      textStep2 = 1;
    } else if (holdProgress < 0.66) {
      textStep2 = 2;
    } else {
      textStep2 = 3;
    }
  } else if (scrollFraction > 0.82 && scrollFraction <= 0.88) {
    const tOut = (scrollFraction - 0.82) / 0.06;
    cloud2Percent = Math.max(0, 1 - tOut);
    textStep2 = 3;
  }

  // Background switches to green footer while cloud 2 is closed, so parting clouds reveal the footer
  const isFooterActive = scrollFraction >= 0.82;

  const activeCloudPercent = isCloud2Active ? cloud2Percent : isCloud1Active ? cloud1Percent : 0;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#061a14] text-white select-none overflow-hidden touch-none font-sans">
      {/* Top Left Branding Logo */}
      <Link
        to="/"
        className="fixed top-6 left-8 md:top-6 md:left-8 z-[100] inline-block transition-transform duration-200 hover:scale-105"
      >
        <img
          src="/assets/logo.webp"
          alt="HackCBS Portal"
          className="h-24 md:h-20 sm:h-16 w-auto object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
        />
      </Link>

      {/* Top Right Auto Scroll Button */}
      {!isAutoScrolling && (
        <button
          onClick={() => startAutoScrollRef.current?.()}
          className="fixed top-6 right-8 md:top-6 md:right-8 z-[100] px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide bg-white/10 hover:bg-white/20 text-white/80 hover:text-white backdrop-blur-md border border-white/15 transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.3)] inline-flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <Play className="w-3 h-3 fill-current text-amber-400" />
          <span>Auto Scroll</span>
        </button>
      )}

      {/* Hero Canvas Container */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <canvas
          id="heroCanvas"
          ref={canvasRef}
          className="w-full h-full object-cover block"
        />
        <div className="absolute bottom-0 left-0 w-full h-[320px] bg-gradient-to-t from-[#061a14]/95 via-[#061a14]/50 to-transparent pointer-events-none z-40" />

        {/* ================= BACKGROUND SWITCHES TO GREEN FOOTER UNDER CLOUD 2 ================= */}
        {isFooterActive && (
          <div className="absolute inset-0 z-40 bg-[#061a14] flex flex-col items-center justify-center text-center px-6 pointer-events-auto gap-6">
            <Link
              to="/login"
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-white/90 hover:text-white transition-all tracking-widest leading-none drop-shadow-md capitalize hover:scale-105"
              style={{ fontFamily: "'Cormorant Garamond', 'Instrument Serif', Georgia, serif", fontWeight: 300 }}
            >
              Got a Problem?
            </Link>
            <Link
              to="/login"
              className="py-3 px-8 rounded-full text-sm font-semibold tracking-wide inline-flex items-center gap-2 bg-[#09261e]/90 border border-white/20 text-white hover:bg-white hover:text-black hover:border-white transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:-translate-y-0.5"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <span>Sign In / Enter Portal</span>
              <ArrowRight className="w-4 h-4 stroke-[2]" />
            </Link>
          </div>
        )}

        {/* ================= 2-CLOUD OVERLAY (SLIDING ON TOP OF CANVAS / FOOTER) ================= */}
        {(isCloud1Active || isCloud2Active) && (
          <div
            className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden transition-opacity duration-150"
            style={{
              opacity: activeCloudPercent > 0 ? 1 : 0,
            }}
          >
            {/* Atmospheric Background Fog with Subtle Warm Sunlight */}
            <div
              className="absolute inset-0 pointer-events-auto"
              style={{
                background: 'radial-gradient(ellipse at 50% 30%, #fffef8 0%, #faf8f2 50%, #f4f1ea 100%)',
                opacity: Math.max(0, Math.min(1, (activeCloudPercent - 0.2) / 0.8)),
              }}
            />

            {/* Subtle Warm Sunlight Ambient */}
            <div
              className="absolute top-0 right-0 w-[60vw] h-[50vh] rounded-full pointer-events-none mix-blend-multiply blur-3xl opacity-40"
              style={{
                background: 'radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, rgba(251, 191, 36, 0.05) 60%, transparent 80%)',
              }}
            />

            {/* Cloud 1: Left Cloud */}
            <img
              src="/assets/cloud_left.webp"
              alt=""
              className="absolute top-1/2 left-0 w-[145vw] max-w-[2500px] h-[155vh] object-cover pointer-events-none"
              style={{
                transform: `translate(${-100 + activeCloudPercent * 100}%, -50%) scale(1.35)`,
                transition: 'transform 0.04s linear',
                filter: 'drop-shadow(30px 0 50px rgba(0,0,0,0.12)) sepia(0.08) saturate(1.1) brightness(1.01)',
                WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 98%)',
                maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 98%)',
              }}
            />

            {/* Cloud 2: Right Cloud */}
            <img
              src="/assets/cloud_right.webp"
              alt=""
              className="absolute top-1/2 right-0 w-[145vw] max-w-[2500px] h-[155vh] object-cover pointer-events-none"
              style={{
                transform: `translate(${100 - activeCloudPercent * 100}%, -50%) scale(1.35)`,
                transition: 'transform 0.04s linear',
                filter: 'drop-shadow(-30px 0 50px rgba(0,0,0,0.12)) sepia(0.08) saturate(1.1) brightness(1.01)',
                WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 98%)',
                maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 98%)',
              }}
            />

            {/* ================= CLOUD 1 CONTENT: COLLEGE PIPELINE (CLEAN PARAS) ================= */}
            {isCloud1Active && (
              <div
                className="relative z-60 w-full max-w-3xl px-8 md:px-12 py-8 flex flex-col items-center justify-center pointer-events-auto"
                style={{
                  opacity: Math.max(0, Math.min(1, (cloud1Percent - 0.45) / 0.55)),
                  transform: `translateY(${(1 - cloud1Percent) * 30}px)`,
                }}
              >
                <div className="w-full flex flex-col gap-8 md:gap-10 text-left">
                  {/* Step 1 */}
                  <div
                    className={`transition-all duration-500 flex flex-col gap-2 ${
                      textStep1 >= 1 ? 'opacity-100' : 'opacity-20'
                    }`}
                  >
                    <h3
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-[#126844] tracking-tight leading-[1.1]"
                      style={{ fontFamily: "'Instrument Serif', 'Cormorant Garamond', Georgia, serif" }}
                    >
                      College will accept the problem
                    </h3>
                    <p
                      className="text-sm sm:text-base md:text-lg text-neutral-600 font-normal leading-relaxed max-w-2xl"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Engineering and research faculties review verified civic challenges and officially adopt them for curriculum capstone R&D.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div
                    className={`transition-all duration-500 flex flex-col gap-2 ${
                      textStep1 >= 2 ? 'opacity-100' : 'opacity-20'
                    }`}
                  >
                    <h3
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-[#126844] tracking-tight leading-[1.1]"
                      style={{ fontFamily: "'Instrument Serif', 'Cormorant Garamond', Georgia, serif" }}
                    >
                      Make a team with mentor
                    </h3>
                    <p
                      className="text-sm sm:text-base md:text-lg text-neutral-600 font-normal leading-relaxed max-w-2xl"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Students assemble multi-disciplinary teams pairing with designated academic mentors and field domain experts.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div
                    className={`transition-all duration-500 flex flex-col gap-2 ${
                      textStep1 >= 3 ? 'opacity-100' : 'opacity-20'
                    }`}
                  >
                    <h3
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-[#126844] tracking-tight leading-[1.1]"
                      style={{ fontFamily: "'Instrument Serif', 'Cormorant Garamond', Georgia, serif" }}
                    >
                      Propose a solution
                    </h3>
                    <p
                      className="text-sm sm:text-base md:text-lg text-neutral-600 font-normal leading-relaxed max-w-2xl"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Teams engineer working prototypes, perform ground validation, and submit formal implementation dossiers to government officials.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ================= CLOUD 2 CONTENT: INDUSTRY & GOV PIPELINE (CLEAN PARAS) ================= */}
            {isCloud2Active && (
              <div
                className="relative z-60 w-full max-w-3xl px-8 md:px-12 py-8 flex flex-col items-center justify-center pointer-events-auto"
                style={{
                  opacity: Math.max(0, Math.min(1, (cloud2Percent - 0.45) / 0.55)),
                  transform: `translateY(${(1 - cloud2Percent) * 30}px)`,
                }}
              >
                <div className="w-full flex flex-col gap-8 md:gap-10 text-left">
                  {/* Point 1 */}
                  <div
                    className={`transition-all duration-500 flex flex-col gap-2 ${
                      textStep2 >= 1 ? 'opacity-100' : 'opacity-20'
                    }`}
                  >
                    <h3
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-[#126844] tracking-tight leading-[1.1]"
                      style={{ fontFamily: "'Instrument Serif', 'Cormorant Garamond', Georgia, serif" }}
                    >
                      Industry will support in Mentorship & Funds
                    </h3>
                    <p
                      className="text-sm sm:text-base md:text-lg text-neutral-600 font-normal leading-relaxed max-w-2xl"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Corporate partners provide seed funding, commercial R&D grants, and executive mentorship to guide student innovation.
                    </p>
                  </div>

                  {/* Point 2 */}
                  <div
                    className={`transition-all duration-500 flex flex-col gap-2 ${
                      textStep2 >= 2 ? 'opacity-100' : 'opacity-20'
                    }`}
                  >
                    <h3
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-[#126844] tracking-tight leading-[1.1]"
                      style={{ fontFamily: "'Instrument Serif', 'Cormorant Garamond', Georgia, serif" }}
                    >
                      Prototyping, testing, and deploying
                    </h3>
                    <p
                      className="text-sm sm:text-base md:text-lg text-neutral-600 font-normal leading-relaxed max-w-2xl"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Hardware fabrication facilities, rigorous QA validation, and scalable public infrastructure deployment.
                    </p>
                  </div>

                  {/* Point 3 */}
                  <div
                    className={`transition-all duration-500 flex flex-col gap-2 ${
                      textStep2 >= 3 ? 'opacity-100' : 'opacity-20'
                    }`}
                  >
                    <h3
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-[#126844] tracking-tight leading-[1.1]"
                      style={{ fontFamily: "'Instrument Serif', 'Cormorant Garamond', Georgia, serif" }}
                    >
                      Student appreciation & government impact
                    </h3>
                    <p
                      className="text-sm sm:text-base md:text-lg text-neutral-600 font-normal leading-relaxed max-w-2xl"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Degree credits and innovation grants awarded to student teams, while administrators gain transparent real-time resolution metrics.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ================= BOTTOM MIDDLE CAPTIONS (MAIN VIDEO) ================= */}
        {!isCloud1Active && !isCloud2Active && !isFooterActive && (
          <>
            {/* Step 1: On Ground Observation */}
            <div
              className={`absolute bottom-12 md:bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-[860px] text-center px-6 md:px-4 flex flex-col items-center gap-2 transition-all duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
                scrollFraction >= 0 && scrollFraction < 0.16
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 translate-y-6 pointer-events-none'
              }`}
            >
              <span
                className="px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold tracking-[0.25em] uppercase text-amber-400 inline-flex items-center gap-1.5 backdrop-blur-md"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                01 • ON GROUND OBSERVATION
              </span>
              <h2
                className="text-[clamp(36px,5.2vw,58px)] font-normal leading-[1.08] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]"
                style={{ fontFamily: "'Instrument Serif', 'Cormorant Garamond', Georgia, serif" }}
              >
                Spot a Civic Problem
              </h2>
              <p
                className="text-[clamp(14px,1.4vw,17px)] text-slate-200/90 font-normal leading-relaxed max-w-[620px] drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                From waterlogged potholes to rural sanitation — citizens discover societal issues directly in their communities.
              </p>
            </div>

            {/* Step 2: AI Geotag & Capture */}
            <div
              className={`absolute bottom-12 md:bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-[860px] text-center px-6 md:px-4 flex flex-col items-center gap-2 transition-all duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
                scrollFraction >= 0.16 && scrollFraction < 0.22
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 translate-y-6 pointer-events-none'
              }`}
            >
              <span
                className="px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold tracking-[0.25em] uppercase text-amber-400 inline-flex items-center gap-1.5 backdrop-blur-md"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                02 • AI GEOTAG & CAPTURE
              </span>
              <h2
                className="text-[clamp(36px,5.2vw,58px)] font-normal leading-[1.08] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]"
                style={{ fontFamily: "'Instrument Serif', 'Cormorant Garamond', Georgia, serif" }}
              >
                Snap & Report Instantly
              </h2>
              <p
                className="text-[clamp(14px,1.4vw,17px)] text-slate-200/90 font-normal leading-relaxed max-w-[620px] drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Take a photo and tag coordinates. IndicBERT AI automatically classifies domain, urgency score, and duplicate clusters.
              </p>
            </div>

            {/* Step 3: Digital Dispatch */}
            <div
              className={`absolute bottom-12 md:bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-[860px] text-center px-6 md:px-4 flex flex-col items-center gap-2 transition-all duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
                scrollFraction >= 0.44 && scrollFraction < 0.52
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 translate-y-6 pointer-events-none'
              }`}
            >
              <span
                className="px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold tracking-[0.25em] uppercase text-amber-400 inline-flex items-center gap-1.5 backdrop-blur-md"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                03 • DIGITAL DISPATCH
              </span>
              <h2
                className="text-[clamp(36px,5.2vw,58px)] font-normal leading-[1.08] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]"
                style={{ fontFamily: "'Instrument Serif', 'Cormorant Garamond', Georgia, serif" }}
              >
                Automated Challenge Routing
              </h2>
              <p
                className="text-[clamp(14px,1.4vw,17px)] text-slate-200/90 font-normal leading-relaxed max-w-[620px] drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                The report transforms into an actionable R&D challenge and is instantly dispatched to relevant government bodies.
              </p>
            </div>

            {/* Step 4: Multi-Stakeholder Solution */}
            <div
              className={`absolute bottom-12 md:bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-[860px] text-center px-6 md:px-4 flex flex-col items-center gap-2 transition-all duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
                scrollFraction >= 0.52 && scrollFraction < 0.60
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 translate-y-6 pointer-events-none'
              }`}
            >
              <span
                className="px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold tracking-[0.25em] uppercase text-amber-400 inline-flex items-center gap-1.5 backdrop-blur-md"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                04 • MULTI-STAKEHOLDER SOLUTION
              </span>
              <h2
                className="text-[clamp(36px,5.2vw,58px)] font-normal leading-[1.08] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]"
                style={{ fontFamily: "'Instrument Serif', 'Cormorant Garamond', Georgia, serif" }}
              >
                Resolved by Universities & Govt
              </h2>
              <p
                className="text-[clamp(14px,1.4vw,17px)] text-slate-200/90 font-normal leading-relaxed max-w-[620px] drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Premier engineering institutes build prototypes, industry sponsors fund grants, and administrators deploy solutions.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Landing;

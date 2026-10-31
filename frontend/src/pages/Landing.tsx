import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollFraction, setScrollFraction] = useState(0);

  useEffect(() => {
    const TOTAL_FRAMES = 192;
    const frames: HTMLImageElement[] = [];
    let loadedCount = 0;
    let currentFrameIndex = 0;
    let animationFrameId: number;
    let currentScroll = 0;
    const maxScroll = 6000; // Total scroll amount to go through all frames

    // Preload frames
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameIndex = String(i).padStart(4, '0');
      img.src = `/assets/frames/frame_${frameIndex}.jpg`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === 1) {
          renderFrame(0);
        }
      };
      frames.push(img);
    }

    const renderFrame = (index: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = frames[index];
      if (!img || !img.complete) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.width || 1280;
      const ih = img.height || 720;

      const scale = Math.max(cw / iw, ch / ih);
      const nw = iw * scale;
      const nh = ih * scale;
      const nx = (cw - nw) / 2;
      const ny = (ch - nh) / 2;

      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, nx, ny, nw, nh);
    };

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderFrame(currentFrameIndex);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      currentScroll += e.deltaY;
      
      if (currentScroll < 0) currentScroll = 0;
      if (currentScroll > maxScroll) currentScroll = maxScroll;
      
      const frac = currentScroll / maxScroll;
      setScrollFraction(frac);

      const frameIndex = Math.min(
        TOTAL_FRAMES - 1,
        Math.floor(frac * TOTAL_FRAMES)
      );

      currentFrameIndex = frameIndex;

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      animationFrameId = requestAnimationFrame(() => renderFrame(frameIndex));
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('wheel', handleWheel, { passive: true });

    // Initial setup
    resizeCanvas();
    
    // Fire initial render
    requestAnimationFrame(() => renderFrame(currentFrameIndex));

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('wheel', handleWheel);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div className="bg-[#061a14] text-white overflow-hidden h-screen w-screen m-0 p-0 font-sans">
      {/* Minimal Logo Fixed at Top Left */}
      <Link to="/" className="fixed top-7 left-9 z-[100] inline-block transition-transform duration-200 ease-in hover:scale-105 md:top-5 md:left-5">
        <img src="/assets/logo.png" alt="Jharkhand Samadhan" className="h-14 w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)] md:h-11" />
      </Link>

      {/* Top Right Portal Link */}
      <Link to="/login" className="fixed top-7 right-9 z-[100] bg-[#09261e]/70 backdrop-blur-md border border-white/15 text-white py-2.5 px-5 rounded-full text-[13.5px] font-bold inline-flex items-center gap-1.5 transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:bg-amber-500 hover:border-amber-500 hover:-translate-y-[1px] md:top-5 md:right-5 md:px-4 md:py-2 md:text-[12.5px]">
        <span>Sign In / Enter Portal</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px' }}>
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </Link>

      {/* Scrollytelling Pinned Video Canvas */}
      <section className="relative h-screen w-screen bg-[#061a14]" id="scrollyContainer">
        <div className="sticky top-0 left-0 w-screen h-screen flex items-center justify-center overflow-hidden">
          <canvas id="heroCanvas" className="w-screen h-screen object-cover block" ref={canvasRef}></canvas>
          <div className="absolute bottom-0 left-0 w-screen h-[280px] bg-gradient-to-t from-[#061a14]/85 via-[#061a14]/40 to-transparent pointer-events-none z-40"></div>

          {/* Bottom Middle Caption 1: Step 1 */}
          <div className={`absolute bottom-10 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[820px] text-center px-6 md:px-4 flex flex-col items-center gap-1.5 transition-all duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${scrollFraction >= 0 && scrollFraction < 0.24 ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-5 pointer-events-none'}`} id="step1">
            <span className="text-[11.5px] font-extrabold tracking-[0.16em] uppercase text-amber-500 inline-block drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">01 • ON GROUND OBSERVATION</span>
            <h2 className="font-sans text-[clamp(28px,3.8vw,44px)] font-extrabold leading-tight tracking-[-0.03em] text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">Spot a Civic Problem</h2>
            <p className="text-[clamp(14px,1.4vw,17px)] text-slate-200 font-medium leading-relaxed max-w-[640px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">From waterlogged potholes to rural sanitation — citizens discover societal issues directly in their communities.</p>
          </div>

          {/* Bottom Middle Caption 2: Step 2 */}
          <div className={`absolute bottom-10 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[820px] text-center px-6 md:px-4 flex flex-col items-center gap-1.5 transition-all duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${scrollFraction >= 0.26 && scrollFraction < 0.50 ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-5 pointer-events-none'}`} id="step2">
            <span className="text-[11.5px] font-extrabold tracking-[0.16em] uppercase text-amber-500 inline-block drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">02 • AI GEOTAG & CAPTURE</span>
            <h2 className="font-sans text-[clamp(28px,3.8vw,44px)] font-extrabold leading-tight tracking-[-0.03em] text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">Snap & Report Instantly</h2>
            <p className="text-[clamp(14px,1.4vw,17px)] text-slate-200 font-medium leading-relaxed max-w-[640px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">Take a photo and tag coordinates. IndicBERT AI automatically classifies domain, urgency score, and duplicate clusters.</p>
          </div>

          {/* Bottom Middle Caption 3: Step 3 */}
          <div className={`absolute bottom-10 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[820px] text-center px-6 md:px-4 flex flex-col items-center gap-1.5 transition-all duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${scrollFraction >= 0.52 && scrollFraction < 0.76 ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-5 pointer-events-none'}`} id="step3">
            <span className="text-[11.5px] font-extrabold tracking-[0.16em] uppercase text-amber-500 inline-block drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">03 • DIGITAL DISPATCH</span>
            <h2 className="font-sans text-[clamp(28px,3.8vw,44px)] font-extrabold leading-tight tracking-[-0.03em] text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">Automated Challenge Routing</h2>
            <p className="text-[clamp(14px,1.4vw,17px)] text-slate-200 font-medium leading-relaxed max-w-[640px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">The report transforms into an actionable R&D challenge and is instantly dispatched to relevant government bodies.</p>
          </div>

          {/* Bottom Middle Caption 4: Step 4 */}
          <div className={`absolute bottom-10 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[820px] text-center px-6 md:px-4 flex flex-col items-center gap-1.5 transition-all duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${scrollFraction >= 0.78 ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-5 pointer-events-none'}`} id="step4">
            <span className="text-[11.5px] font-extrabold tracking-[0.16em] uppercase text-amber-500 inline-block drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">04 • MULTI-STAKEHOLDER SOLUTION</span>
            <h2 className="font-sans text-[clamp(28px,3.8vw,44px)] font-extrabold leading-tight tracking-[-0.03em] text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">Resolved by Universities & Govt</h2>
            <p className="text-[clamp(14px,1.4vw,17px)] text-slate-200 font-medium leading-relaxed max-w-[640px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">Premier engineering institutes build prototypes, industry sponsors fund grants, and administrators deploy solutions.</p>
            <Link to="/login" className="bg-amber-500 text-white py-[11px] px-[26px] rounded-full text-sm font-bold inline-flex items-center gap-1.5 mt-2 transition-all duration-200 shadow-[0_4px_16px_rgba(245,158,11,0.45)] hover:bg-amber-600 hover:-translate-y-[1px]">
              <span>Report a Challenge</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px' }}>
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;

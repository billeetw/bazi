import { useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PARTICLE_COUNT = 70;
const TOTAL_DURATION = 4.5;

/** LINE 內建瀏覽器偵測：用於降級粒子數與避免 backdrop-blur 以維持 60fps */
export function isLineBrowser(): boolean {
  if (typeof navigator === "undefined" || !navigator.userAgent) return false;
  const ua = navigator.userAgent;
  return /Line\//i.test(ua) || /LIFF/i.test(ua);
}

export interface StartupSequenceProps {
  isOpen: boolean;
  onFinished: () => void;
  branchLabel?: string;
  personaLine?: string;
  enableSound?: boolean;
}

/** Whoosh 音效：Web Audio API 模擬點火轉場 */
function playWhoosh() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.4);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch {
    // ignore
  }
}

/** 生成固定數量的粒子參數（穩定動畫，散佈全螢幕） */
function useParticles(count: number) {
  return useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const seed = (i * 9301 + 49297) % 233280;
      const r1 = seed / 233280;
      const r2 = ((seed * 9301 + 49297) % 233280) / 233280;
      const r3 = (((seed * 9301 + 49297) % 233280) * 9301 + 49297) % 233280 / 233280;
      const r4 = (((seed * 9301 + 49297) % 233280) * 9301 + 49297) % 233280 / 233280;
      return {
        id: i,
        leftPct: r1 * 100,
        topPct: r2 * 100,
        driftX: (r3 - 0.5) * 24,
        driftY: (r4 - 0.5) * 24,
        opacityPhases: [0.15 + r1 * 0.5, 0.4 + r2 * 0.4, 0.2 + r3 * 0.4],
        duration: 4 + r1 * 4,
        delay: r2 * 2,
      };
    });
  }, [count]);
}

export function StartupSequence({
  isOpen,
  onFinished,
  branchLabel = "",
  personaLine = "",
  enableSound = true,
}: StartupSequenceProps) {
  const particleCount = useMemo(() => (isLineBrowser() ? Math.floor(PARTICLE_COUNT / 2) : PARTICLE_COUNT), []);
  const particles = useParticles(particleCount);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      onFinished();
    }, TOTAL_DURATION * 1000);
    return () => clearTimeout(t);
  }, [isOpen, onFinished]);

  useEffect(() => {
    if (!isOpen || !enableSound) return;
    const t = setTimeout(() => playWhoosh(), 4000);
    return () => clearTimeout(t);
  }, [isOpen, enableSound]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="startup-overlay"
          className="fixed inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-center overflow-hidden box-border"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background Universe: 60–80 amber particles */}
          <div className="absolute inset-0 pointer-events-none">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute w-1.5 h-1.5 rounded-full bg-amber-500"
                style={{
                  left: `${p.leftPct}%`,
                  top: `${p.topPct}%`,
                  transform: "translate(-50%, -50%)",
                }}
                animate={{
                  x: [0, p.driftX, 0],
                  y: [0, p.driftY, 0],
                  opacity: p.opacityPhases,
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: p.delay,
                }}
              />
            ))}
          </div>

          {/* Step 1 (0s–1s): 系統自檢；1s 時淡出 */}
          <motion.div
            className="absolute top-[28%] left-1/2 -translate-x-1/2 text-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ times: [0, 0.1, 0.85, 1], duration: 1 }}
          >
            <p className="text-amber-500/80 font-mono text-sm">
              Syncing Birth-Time Coordinates...
            </p>
            {branchLabel && (
              <motion.p
                className="text-amber-400 font-mono text-xs mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ times: [0, 0.6, 1], duration: 1 }}
              >
                [SUCCESS] Coordinate Locked: {branchLabel}
              </motion.p>
            )}
          </motion.div>

          {/* Step 2 (1s–4s): 人格鑰匙覺醒 — 1.0–1.8s 淡入+y位移, 1.8–3.5s 停留, 3.5–4.0s 淡出 */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-10 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.95, duration: 0.05 }}
          >
            <motion.p
              className="text-amber-500 text-xl md:text-2xl max-w-2xl text-center font-medium leading-relaxed"
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [16, 0, 0, 0],
              }}
              transition={{
                times: [0, 0.267, 0.833, 1],
                duration: 3,
                delay: 1,
                ease: "easeInOut",
              }}
            >
              {personaLine}
            </motion.p>
          </motion.div>

          {/* Step 3 (4s–4.5s): 引擎點火 — 圓環 0.5s 內 scale 0→20, opacity 1→0 */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            aria-hidden
          >
            <motion.div
              className="absolute w-24 h-24 rounded-full border-2 border-amber-500"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 20, opacity: 0 }}
              transition={{
                duration: 0.5,
                delay: 4,
                ease: "easeOut",
              }}
            />
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default StartupSequence;

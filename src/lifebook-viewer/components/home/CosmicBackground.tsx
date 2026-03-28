import React from "react";
import styles from "./CosmicBackground.module.css";

export interface CosmicBackgroundProps {
  /** 與 .lb-low-power 疊加時由父層 class 控制；此 prop 可額外關閉 SVG 濾鏡 */
  lowPower?: boolean;
}

/**
 * 全螢幕宇宙背景 + 中央命運主幹 SVG（與 demo HTML 對齊；Canvas 可日後替換此層）
 */
export function CosmicBackground({ lowPower: _lowPower }: CosmicBackgroundProps) {
  return (
    <>
      <div className={styles.sceneBackdrop} aria-hidden>
        <div className={styles.abyssLight} />
        <div className={styles.ambientGold} />
      </div>
      <div className={styles.treeWrap} aria-hidden>
        <svg className={styles.treeSvg} viewBox="0 0 100 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="trunk-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#3d2b1f" />
              <stop offset="40%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#fefce8" />
            </linearGradient>
            <filter id="trunk-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            className={styles.trunkBody}
            d="M 50 800 Q 45 600 50 400 T 50 100 L 50 0"
          />
          <path className={styles.energyFlow} d="M 50 800 Q 45 600 50 400 T 50 100" />
        </svg>
      </div>
    </>
  );
}

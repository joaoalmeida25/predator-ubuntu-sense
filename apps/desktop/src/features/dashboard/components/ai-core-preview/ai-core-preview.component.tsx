import type { ReactElement } from "react";

import styles from "./ai-core-preview.module.css";
import type { AiCorePreviewProps } from "./ai-core-preview.types";

const neuralNodes = [
  [50, 10],
  [37, 16],
  [62, 18],
  [25, 29],
  [46, 31],
  [72, 33],
  [18, 48],
  [37, 52],
  [59, 49],
  [82, 55],
  [29, 70],
  [49, 74],
  [68, 73],
  [51, 88],
] as const;

const neuralLines = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 4],
  [2, 5],
  [3, 6],
  [4, 6],
  [4, 7],
  [4, 8],
  [5, 8],
  [5, 9],
  [6, 10],
  [7, 10],
  [7, 11],
  [8, 11],
  [8, 12],
  [9, 12],
  [10, 13],
  [11, 13],
  [12, 13],
] as const;

export const AiCorePreview = ({
  nodeCountLabel,
  modelStatus,
  learningRate,
  dataFlow,
}: AiCorePreviewProps): ReactElement => {
  return (
    <section className={styles.corePanel} aria-label="AI Core preview">
      <div className={styles.panelHeader}>
        <p className={styles.eyebrow}>Predator AI Core</p>
        <h2 className={styles.title}>Adaptive Neural Runtime</h2>
      </div>

      <div className={styles.stage}>
        <div className={styles.orbitOuter} />
        <div className={styles.orbitMiddle} />
        <div className={styles.orbitInner} />
        <div className={styles.scanlines} />
        <div className={styles.coreGlow} />

        <svg className={styles.network} viewBox="0 0 100 100" role="img">
          <title>Animated neural network placeholder</title>
          {neuralLines.map(([from, to]) => {
            const [x1, y1] = neuralNodes[from];
            const [x2, y2] = neuralNodes[to];

            return (
              <line
                key={`${from}-${to}`}
                className={styles.neuralLine}
                x1={x1}
                x2={x2}
                y1={y1}
                y2={y2}
              />
            );
          })}
          {neuralNodes.map(([cx, cy], index) => (
            <circle
              key={`${cx}-${cy}`}
              className={index % 3 === 0 ? styles.neuralNodeHot : styles.neuralNode}
              cx={cx}
              cy={cy}
              r={index % 3 === 0 ? 1.9 : 1.25}
            />
          ))}
        </svg>

        <div className={styles.particleOne} />
        <div className={styles.particleTwo} />
        <div className={styles.particleThree} />
        <div className={styles.baseRing} />
      </div>

      <div className={styles.telemetryGrid}>
        <div className={styles.telemetryCard}>
          <span>Neural nodes</span>
          <strong>{nodeCountLabel}</strong>
        </div>
        <div className={styles.telemetryCard}>
          <span>Model status</span>
          <strong>{modelStatus}</strong>
        </div>
        <div className={styles.telemetryCard}>
          <span>Learning rate</span>
          <strong>{learningRate}</strong>
        </div>
        <div className={styles.telemetryCard}>
          <span>Data flow</span>
          <strong>{dataFlow}</strong>
        </div>
      </div>

      <div className={styles.futureNote}>
        <span>AI Optimization</span>
        <p>Temporary CSS/SVG neural core preview. Future replacement candidate: React Three Fiber / Three.js.</p>
      </div>
    </section>
  );
};

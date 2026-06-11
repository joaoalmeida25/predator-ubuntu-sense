import type { CSSProperties, ReactElement } from "react";

import styles from "./ai-core-preview.module.css";
import type {
  AiCorePreviewCallout,
  AiCorePreviewNode,
  AiCorePreviewViewProps,
} from "./ai-core-preview-view.types";

const getNodeStyle = (node: AiCorePreviewNode): CSSProperties => {
  return {
    "--node-delay": `${-(node.id % 12) * 0.18}s`,
    "--node-depth": node.depth,
  } as CSSProperties;
};

export const AiCorePreviewView = ({
  engineVersion,
  neuralLines,
  neuralNodes,
  callouts,
}: AiCorePreviewViewProps): ReactElement => {
  return (
    <section className={styles.corePanel} aria-label="AI Core preview">
      <div className={styles.panelHeader}>
        <p className={styles.eyebrow}>Predator AI Core</p>
        <h2 className={styles.title}>Adaptive Neural Runtime</h2>
      </div>

      <div className={styles.stage}>
        {callouts.map((callout) => (
          <TelemetryCallout key={callout.label} {...callout} />
        ))}

        <div className={styles.orbitOuter} />
        <div className={styles.orbitMiddle} />
        <div className={styles.orbitTilt} />
        <div className={styles.coreHalo} />
        <div className={styles.scanlines} />

        <svg className={styles.network} viewBox="0 0 100 100" role="img">
          <title>Granular animated neural network preview</title>
          {neuralLines.map(({ id, from, to }) => (
            <line
              key={id}
              className={styles.neuralLine}
              x1={from.x}
              x2={to.x}
              y1={from.y}
              y2={to.y}
            />
          ))}
          {neuralNodes.map((node) => (
            <circle
              key={node.id}
              className={node.isHot ? styles.neuralNodeHot : styles.neuralNode}
              cx={node.x}
              cy={node.y}
              r={node.isHot ? 1.35 + node.depth * 1.1 : 0.72 + node.depth * 0.8}
              style={getNodeStyle(node)}
            />
          ))}
        </svg>

        <div className={styles.energyColumn} />
        <div className={styles.baseRing} />
        <div className={styles.baseRingTwo} />
        <div className={styles.particleOne} />
        <div className={styles.particleTwo} />
        <div className={styles.particleThree} />
      </div>

      <div className={styles.futureNote}>
        <span>AI Optimization</span>
        <p>Learning your usage patterns and optimizing runtime telemetry...</p>
        <strong>Model {engineVersion}</strong>
      </div>
    </section>
  );
};

const TelemetryCallout = ({
  className,
  label,
  value,
  detail,
}: AiCorePreviewCallout): ReactElement => {
  return (
    <div className={`${styles.callout} ${className}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
};

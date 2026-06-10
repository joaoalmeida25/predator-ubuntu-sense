import type { CSSProperties, ReactElement } from "react";

import styles from "./ai-core-preview.module.css";
import type { AiCorePreviewProps } from "./ai-core-preview.types";

interface NeuralNode {
  id: number;
  x: number;
  y: number;
  depth: number;
  isHot: boolean;
}

interface NeuralLine {
  id: string;
  from: NeuralNode;
  to: NeuralNode;
}

const createNeuralNodes = (): NeuralNode[] => {
  return Array.from({ length: 84 }, (_, index) => {
    const angle = index * 2.399963229728653;
    const radius = Math.sqrt(index / 84) * 42;
    const zWave = Math.sin(index * 0.74) * 9;
    const x = 50 + Math.cos(angle) * radius * (0.92 + Math.sin(index * 0.19) * 0.08);
    const y = 49 + Math.sin(angle) * radius * 0.78 + zWave;

    return {
      id: index,
      x: Math.max(7, Math.min(93, x)),
      y: Math.max(8, Math.min(91, y)),
      depth: 0.48 + ((Math.sin(index * 1.71) + 1) / 2) * 0.52,
      isHot: index % 9 === 0 || index % 17 === 0,
    };
  });
};

const neuralNodes = createNeuralNodes();

const getDistance = (from: NeuralNode, to: NeuralNode): number => {
  return Math.hypot(from.x - to.x, from.y - to.y);
};

const neuralLines: NeuralLine[] = neuralNodes.flatMap((node, index) => {
  return neuralNodes
    .filter((candidate) => candidate.id !== node.id)
    .map((candidate) => ({ candidate, distance: getDistance(node, candidate) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, index % 3 === 0 ? 3 : 2)
    .filter(({ candidate }) => candidate.id > node.id)
    .map(({ candidate }) => ({
      id: `${node.id}-${candidate.id}`,
      from: node,
      to: candidate,
    }));
});

const getNodeStyle = (node: NeuralNode): CSSProperties => {
  return {
    "--node-delay": `${-(node.id % 12) * 0.18}s`,
    "--node-depth": node.depth,
  } as CSSProperties;
};

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
        <TelemetryCallout className={styles.calloutLeftTop} label="Neural Nodes" value={nodeCountLabel} detail="Active" />
        <TelemetryCallout className={styles.calloutLeftMiddle} label="Learning Rate" value={learningRate} detail="Optimal" />
        <TelemetryCallout className={styles.calloutLeftBottom} label="Data Flow" value={dataFlow} detail="Synaptic Throughput" />
        <TelemetryCallout className={styles.calloutRightTop} label="Model Status" value={modelStatus} detail="Continuous Learning" />
        <TelemetryCallout className={styles.calloutRightMiddle} label="AI Engine" value="v2.7.4" detail="Online" />
        <TelemetryCallout className={styles.calloutRightBottom} label="Prediction Accuracy" value="99.3%" detail="High Confidence" />

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
        <p>Granular CSS/SVG neural core preview. Future replacement candidate: React Three Fiber / Three.js.</p>
        <strong>Model v2.7.4</strong>
      </div>
    </section>
  );
};

interface TelemetryCalloutProps {
  className: string;
  label: string;
  value: string;
  detail: string;
}

const TelemetryCallout = ({
  className,
  label,
  value,
  detail,
}: TelemetryCalloutProps): ReactElement => {
  return (
    <div className={`${styles.callout} ${className}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
};

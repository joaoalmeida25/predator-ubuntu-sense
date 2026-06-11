import type { ReactElement } from "react";

import styles from "./ai-core-preview.module.css";
import { AiCorePreviewView } from "./ai-core-preview-view.component";
import type {
  AiCorePreviewLine,
  AiCorePreviewNode,
  AiCorePreviewProps,
} from "./ai-core-preview-view.types";

const createNeuralNodes = (): AiCorePreviewNode[] => {
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

const getDistance = (from: AiCorePreviewNode, to: AiCorePreviewNode): number => {
  return Math.hypot(from.x - to.x, from.y - to.y);
};

const neuralNodes = createNeuralNodes();

const neuralLines: AiCorePreviewLine[] = neuralNodes.flatMap((node, index) => {
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

export const AiCorePreview = ({
  nodeCountLabel,
  modelStatus,
  learningRate,
  dataFlow,
  engineVersion,
  engineStatus,
  predictionAccuracy,
}: AiCorePreviewProps): ReactElement => {
  return (
    <AiCorePreviewView
      nodeCountLabel={nodeCountLabel}
      modelStatus={modelStatus}
      learningRate={learningRate}
      dataFlow={dataFlow}
      neuralNodes={neuralNodes}
      neuralLines={neuralLines}
      engineVersion={engineVersion}
      engineStatus={engineStatus}
      predictionAccuracy={predictionAccuracy}
      callouts={[
        {
          className: styles.calloutLeftTop,
          label: "Neural Nodes",
          value: nodeCountLabel,
          detail: "Active",
        },
        {
          className: styles.calloutLeftMiddle,
          label: "Learning Rate",
          value: learningRate,
          detail: "Optimal",
        },
        {
          className: styles.calloutLeftBottom,
          label: "Data Flow",
          value: dataFlow,
          detail: "Synaptic Throughput",
        },
        {
          className: styles.calloutRightTop,
          label: "Model Status",
          value: modelStatus,
          detail: "Continuous Learning",
        },
        {
          className: styles.calloutRightMiddle,
          label: "AI Engine",
          value: engineVersion,
          detail: engineStatus,
        },
        {
          className: styles.calloutRightBottom,
          label: "Prediction Accuracy",
          value: predictionAccuracy,
          detail: "High Confidence",
        },
      ]}
    />
  );
};

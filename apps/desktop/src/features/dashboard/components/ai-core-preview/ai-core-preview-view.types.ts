export interface AiCorePreviewProps {
  dataFlow: string;
  learningRate: string;
  modelStatus: string;
  engineStatus: string;
  engineVersion: string;
  nodeCountLabel: string;
  predictionAccuracy: string;
}

export interface AiCorePreviewNode {
  depth: number;
  id: number;
  isHot: boolean;
  x: number;
  y: number;
}

export interface AiCorePreviewLine {
  from: AiCorePreviewNode;
  id: string;
  to: AiCorePreviewNode;
}

export interface AiCorePreviewCallout {
  className: string;
  detail: string;
  label: string;
  value: string;
}

export interface AiCorePreviewViewProps extends AiCorePreviewProps {
  callouts: AiCorePreviewCallout[];
  neuralLines: AiCorePreviewLine[];
  neuralNodes: AiCorePreviewNode[];
}

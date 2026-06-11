import type { ReactElement, ReactNode } from "react";

import { NeuralCoreCanvasView } from "./neural-core-canvas-view.component";

interface NeuralCoreCanvasProps {
  fallback: ReactNode;
}

export const NeuralCoreCanvas = ({
  fallback,
}: NeuralCoreCanvasProps): ReactElement => {
  return <NeuralCoreCanvasView fallback={fallback} />;
};

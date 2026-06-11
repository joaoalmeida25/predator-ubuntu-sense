import { Canvas } from "@react-three/fiber";
import type { ReactElement } from "react";

import { NeuralCoreScene } from "../neural-core-scene/neural-core-scene.component";
import styles from "./neural-core-canvas.module.css";
import type { NeuralCoreCanvasViewProps } from "./neural-core-canvas-view.types";

export const NeuralCoreCanvasView = ({
  fallback,
}: NeuralCoreCanvasViewProps): ReactElement => {
  return (
    <div className={styles.canvasShell}>
      <Canvas
        camera={{ position: [0.02, 0.02, 4.35], fov: 42 }}
        dpr={[1, 1.5]}
        fallback={fallback}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <fog attach="fog" args={["#050816", 3.9, 6.8]} />
        <ambientLight intensity={0.58} />
        <pointLight position={[2.8, 2.1, 3.1]} color="#26d9ff" intensity={1.45} />
        <pointLight position={[-2.4, -1.5, 2.6]} color="#8a6dff" intensity={0.9} />
        <pointLight position={[0.2, 0.1, 1.2]} color="#d9f7ff" intensity={0.68} />
        <NeuralCoreScene />
      </Canvas>
    </div>
  );
};

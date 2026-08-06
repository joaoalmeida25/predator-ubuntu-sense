import type { RefObject } from "react";
import type { BufferAttribute, BufferGeometry } from "three";

import type {
  NeuralCoreAggregatedPulseField,
  NeuralCoreAggregatedRouteRenderField,
} from "../../visualization/cluster-grammar/neural-core-cluster-grammar.types";

export interface NeuralCoreAggregatedRoutesViewProps {
  pulseColorRef: RefObject<BufferAttribute | null>;
  pulseField: NeuralCoreAggregatedPulseField;
  pulseGeometryRef: RefObject<BufferGeometry | null>;
  pulseOpacityRef: RefObject<BufferAttribute | null>;
  pulsePositionRef: RefObject<BufferAttribute | null>;
  pulseSizeRef: RefObject<BufferAttribute | null>;
  routeField: NeuralCoreAggregatedRouteRenderField;
  routeColorRef: RefObject<BufferAttribute | null>;
  routeOpacityRef: RefObject<BufferAttribute | null>;
  routeThicknessRef: RefObject<BufferAttribute | null>;
}

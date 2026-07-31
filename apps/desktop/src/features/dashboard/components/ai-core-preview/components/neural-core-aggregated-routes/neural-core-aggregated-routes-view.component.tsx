import type { ReactElement } from "react";
import { AdditiveBlending, DoubleSide, NormalBlending } from "three";

import type {
  NeuralCoreAggregatedRoutesViewProps,
} from "./neural-core-aggregated-routes-view.types";

const AGGREGATED_ROUTE_VERTEX_SHADER = `
  attribute vec3 color;
  attribute vec3 aCenterPosition;
  attribute float aOpacity;
  attribute float aThickness;
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vColor = color;
    vOpacity = aOpacity;
    vec3 composedPosition = mix(aCenterPosition, position, aThickness);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(composedPosition, 1.0);
  }
`;

const AGGREGATED_ROUTE_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    if (vOpacity <= 0.001) discard;
    vec3 luminousColor = min(vColor * (0.82 + vOpacity * 0.34), vec3(1.08));
    gl_FragColor = vec4(luminousColor, vOpacity);
  }
`;

const AGGREGATED_PULSE_VERTEX_SHADER = `
  attribute vec3 color;
  attribute float aSize;
  attribute float aOpacity;
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vColor = color;
    vOpacity = aOpacity;
    gl_PointSize = clamp(aSize * 300.0 / max(0.1, -viewPosition.z), 1.5, 7.0);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const AGGREGATED_PULSE_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float distanceToCenter = length(centered);
    float edge = max(fwidth(distanceToCenter), 0.004);
    float circleAlpha = 1.0 - smoothstep(0.5 - edge, 0.5 + edge, distanceToCenter);
    float core = 1.0 - smoothstep(0.07, 0.3, distanceToCenter);
    float halo = 1.0 - smoothstep(0.23, 0.5, distanceToCenter);
    float alpha = circleAlpha * (core * 0.66 + halo * 0.28) * vOpacity;
    if (alpha <= 0.001) discard;
    gl_FragColor = vec4(min(vColor * (0.78 + core * 0.3), vec3(1.12)), alpha);
  }
`;

export const NeuralCoreAggregatedRoutesView = ({
  pulseColorRef,
  pulseField,
  pulseGeometryRef,
  pulseOpacityRef,
  pulsePositionRef,
  pulseSizeRef,
  routeField,
  routeOpacityRef,
  routeThicknessRef,
}: NeuralCoreAggregatedRoutesViewProps): ReactElement => {
  return (
    <group renderOrder={2}>
      <mesh frustumCulled={false} renderOrder={2}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[routeField.positions, 3]} />
          <bufferAttribute
            attach="attributes-aCenterPosition"
            args={[routeField.centerPositions, 3]}
          />
          <bufferAttribute attach="attributes-color" args={[routeField.colors, 3]} />
          <bufferAttribute
            ref={routeOpacityRef}
            attach="attributes-aOpacity"
            args={[routeField.opacities, 1]}
          />
          <bufferAttribute
            ref={routeThicknessRef}
            attach="attributes-aThickness"
            args={[routeField.thicknesses, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={AGGREGATED_ROUTE_VERTEX_SHADER}
          fragmentShader={AGGREGATED_ROUTE_FRAGMENT_SHADER}
          transparent
          side={DoubleSide}
          blending={NormalBlending}
          depthWrite={false}
        />
      </mesh>
      <points frustumCulled={false} renderOrder={3}>
        <bufferGeometry ref={pulseGeometryRef} drawRange={{ start: 0, count: 0 }}>
          <bufferAttribute
            ref={pulsePositionRef}
            attach="attributes-position"
            args={[pulseField.positions, 3]}
          />
          <bufferAttribute
            ref={pulseColorRef}
            attach="attributes-color"
            args={[pulseField.colors, 3]}
          />
          <bufferAttribute
            ref={pulseSizeRef}
            attach="attributes-aSize"
            args={[pulseField.sizes, 1]}
          />
          <bufferAttribute
            ref={pulseOpacityRef}
            attach="attributes-aOpacity"
            args={[pulseField.opacities, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={AGGREGATED_PULSE_VERTEX_SHADER}
          fragmentShader={AGGREGATED_PULSE_FRAGMENT_SHADER}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

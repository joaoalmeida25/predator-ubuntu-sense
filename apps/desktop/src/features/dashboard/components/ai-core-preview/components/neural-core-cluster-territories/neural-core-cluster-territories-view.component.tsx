import type { ReactElement } from "react";
import { AdditiveBlending, Color, DoubleSide, NormalBlending } from "three";

import type {
  NeuralCoreClusterTerritoriesViewProps,
} from "./neural-core-cluster-territories-view.types";

const TERRITORY_BOUNDARY_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const TERRITORY_BOUNDARY_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vViewDirection)));
    float fresnel = pow(1.0 - facing, 2.4);
    float neuralBand = 0.76 + 0.24 * sin(
      vNormal.x * 31.0 + vNormal.y * 23.0 + vNormal.z * 37.0
    );
    float alpha = uOpacity * fresnel * neuralBand;
    if (alpha <= 0.001) discard;
    gl_FragColor = vec4(uColor * (0.72 + fresnel * 0.22), alpha);
  }
`;

const EMBEDDED_BOUNDARY_VERTEX_SHADER = `
  attribute float aSeed;
  uniform float uIrregularity;
  uniform float uPointScale;
  varying float vSeed;

  void main() {
    float stableOffset = (aSeed - 0.5) * uIrregularity * 0.24;
    vec3 irregularPosition = position * (1.0 + stableOffset);
    vec4 viewPosition = modelViewMatrix * vec4(irregularPosition, 1.0);
    gl_PointSize = clamp(uPointScale / max(0.1, -viewPosition.z), 1.0, 3.2);
    vSeed = aSeed;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const EMBEDDED_BOUNDARY_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vSeed;

  void main() {
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    float edge = max(fwidth(distanceToCenter), 0.006);
    float circle = 1.0 - smoothstep(0.5 - edge, 0.5 + edge, distanceToCenter);
    float alpha = circle * uOpacity * (0.58 + vSeed * 0.32);
    if (alpha <= 0.001) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export const NeuralCoreClusterTerritoriesView = ({
  focusLensConfig,
  grammar,
  territoryRefs,
}: NeuralCoreClusterTerritoriesViewProps): ReactElement | null => {
  if (!grammar.enabled) {
    return null;
  }
  const embeddedMode = focusLensConfig.enabled
    && focusLensConfig.territory.embeddedMode;
  return (
    <group renderOrder={1}>
      {grammar.territories.map((territory, index) => (
        <group
          key={territory.clusterId}
          ref={territoryRefs[index]}
          position={territory.center}
          userData={{ clusterId: territory.clusterId }}
        >
          {embeddedMode ? (
            <points scale={territory.boundaryScale} renderOrder={1}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[territory.boundaryPoints, 3]}
                />
                <bufferAttribute
                  attach="attributes-aSeed"
                  args={[territory.boundarySeeds, 1]}
                />
              </bufferGeometry>
              <shaderMaterial
                vertexShader={EMBEDDED_BOUNDARY_VERTEX_SHADER}
                fragmentShader={EMBEDDED_BOUNDARY_FRAGMENT_SHADER}
                userData={{ semanticColor: new Color(territory.color) }}
                uniforms={{
                  uColor: { value: new Color(territory.color) },
                  uOpacity: { value: 0 },
                  uIrregularity: {
                    value: focusLensConfig.territory.boundaryIrregularity,
                  },
                  uPointScale: { value: 7.2 },
                }}
                transparent
                blending={NormalBlending}
                depthWrite={false}
              />
            </points>
          ) : (
            <mesh scale={territory.legacyBoundaryScale} renderOrder={1}>
              <sphereGeometry args={[1, 22, 16]} />
              <shaderMaterial
                vertexShader={TERRITORY_BOUNDARY_VERTEX_SHADER}
                fragmentShader={TERRITORY_BOUNDARY_FRAGMENT_SHADER}
                userData={{ semanticColor: new Color(territory.color) }}
                uniforms={{
                  uColor: { value: new Color(territory.color) },
                  uOpacity: { value: 0 },
                }}
                transparent
                side={DoubleSide}
                blending={NormalBlending}
                depthWrite={false}
              />
            </mesh>
          )}
          <group userData={{ role: "territory-hub" }}>
            <mesh>
              <sphereGeometry
                args={[
                  embeddedMode
                    ? Math.max(0.022, territory.radius * 0.055)
                    : Math.max(0.045, territory.radius * 0.12),
                  14,
                  12,
                ]}
              />
              <meshBasicMaterial
                color={territory.color}
                transparent
                opacity={0}
                blending={AdditiveBlending}
                depthWrite={false}
                userData={{
                  role: "hub-core",
                  semanticColor: new Color(territory.color),
                }}
              />
            </mesh>
            {embeddedMode ? (
              <lineSegments>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    args={[territory.hubFilamentPositions, 3]}
                  />
                </bufferGeometry>
                <lineBasicMaterial
                  color={territory.color}
                  transparent
                  opacity={0}
                  blending={NormalBlending}
                  depthWrite={false}
                  userData={{
                    role: "hub-filaments",
                    semanticColor: new Color(territory.color),
                  }}
                />
              </lineSegments>
            ) : (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry
                  args={[Math.max(0.07, territory.radius * 0.19), 0.006, 6, 48]}
                />
                <meshBasicMaterial
                  color={territory.color}
                  transparent
                  opacity={0}
                  blending={AdditiveBlending}
                  depthWrite={false}
                  userData={{
                    role: "hub-ring",
                    semanticColor: new Color(territory.color),
                  }}
                />
              </mesh>
            )}
          </group>
        </group>
      ))}
    </group>
  );
};

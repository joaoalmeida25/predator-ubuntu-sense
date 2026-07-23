import type { ReactElement } from "react";
import { AdditiveBlending, Color, DoubleSide } from "three";
import { Html } from "@react-three/drei";

import type { NeuralCoreSceneViewProps } from "./neural-core-scene-view.types";

const NEURAL_CORE_FOG_COLOR = new Color("#050816");
const NEURAL_CORE_FOG_NEAR = 3.9;
const NEURAL_CORE_FOG_FAR = 6.8;

const convertSrgbChannelToLinear = (channel: number): number => {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
};

const getLinearHexColor = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  const packedColor = Number.isFinite(value) ? value : 0x8ff4ff;
  return [
    convertSrgbChannelToLinear(((packedColor >> 16) & 255) / 255),
    convertSrgbChannelToLinear(((packedColor >> 8) & 255) / 255),
    convertSrgbChannelToLinear((packedColor & 255) / 255),
  ];
};

const PROPAGATION_POINT_VERTEX_SHADER = `
  attribute vec3 color;
  attribute float aSize;
  attribute float aOpacity;
  varying vec3 vColor;
  varying float vOpacity;
  uniform float uPointScale;
  uniform float uMinimumScreenSize;
  uniform float uMaximumScreenSize;
  uniform float uDistanceScaleInfluence;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vColor = color;
    vOpacity = aOpacity;
    float constantSize = aSize * uPointScale;
    float attenuatedSize = constantSize / max(0.1, -viewPosition.z);
    gl_PointSize = clamp(
      mix(constantSize, attenuatedSize, uDistanceScaleInfluence),
      uMinimumScreenSize,
      uMaximumScreenSize
    );
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const PROPAGATION_POINT_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float distanceToCenter = length(centered);
    float edge = max(fwidth(distanceToCenter), 0.004);
    float circleAlpha = 1.0 - smoothstep(0.5 - edge, 0.5 + edge, distanceToCenter);
    float core = 1.0 - smoothstep(0.06, 0.3, distanceToCenter);
    float halo = 1.0 - smoothstep(0.24, 0.5, distanceToCenter);
    float alpha = circleAlpha * (core * 0.68 + halo * 0.3) * vOpacity;
    if (alpha <= 0.001) discard;
    vec3 luminousColor = min(vColor * (0.76 + core * 0.38), vec3(1.18));
    gl_FragColor = vec4(luminousColor, alpha);
  }
`;

const AMBIENT_POINT_VERTEX_SHADER = `
  attribute vec3 color;
  varying vec3 vColor;
  varying float vOpacity;
  uniform float uSize;
  uniform float uOpacity;
  uniform float uPointScale;
  uniform float uMinimumScreenSize;
  uniform float uMaximumScreenSize;
  uniform float uDistanceScaleInfluence;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    float constantSize = uSize * uPointScale;
    float attenuatedSize = constantSize / max(0.1, -viewPosition.z);
    gl_PointSize = clamp(
      mix(constantSize, attenuatedSize, uDistanceScaleInfluence),
      uMinimumScreenSize,
      uMaximumScreenSize
    );
    vColor = color;
    vOpacity = uOpacity;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const AMBIENT_POINT_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    float edge = max(fwidth(distanceToCenter), 0.005);
    float circleAlpha = 1.0 - smoothstep(0.5 - edge, 0.5 + edge, distanceToCenter);
    float core = 1.0 - smoothstep(0.04, 0.28, distanceToCenter);
    float halo = 1.0 - smoothstep(0.2, 0.5, distanceToCenter);
    float alpha = circleAlpha * (core * 0.58 + halo * 0.28) * vOpacity;
    if (alpha <= 0.001) discard;
    gl_FragColor = vec4(min(vColor * (0.72 + core * 0.3), vec3(1.12)), alpha);
  }
`;

const BASE_NODE_VERTEX_SHADER = `
  attribute vec3 color;
  attribute vec3 aSemanticTint;
  attribute float aSemanticBrightness;
  attribute float aSemanticColorInfluence;
  attribute float aSemanticScale;
  attribute float aSemanticOpacity;
  attribute float aSemanticJitter;
  attribute float aSemanticFragmentation;
  attribute float aSemanticDecay;
  attribute float aSemanticFill;
  attribute float aSemanticSynchronization;
  attribute float aSemanticPulseFrequency;
  attribute float aSemanticPulseAmplitude;
  attribute float aSemanticSeed;
  uniform float uTime;
  uniform float uBasePointSize;
  uniform float uPointScale;
  uniform float uBaseOpacity;
  uniform float uMaximumScreenSize;
  uniform float uMaximumJitterDistance;
  uniform float uMaximumFragmentationDistance;
  uniform float uNodeDecayThresholdSpread;
  varying vec3 vColor;
  varying float vOpacity;
  varying float vFill;
  varying float vBrightness;
  varying float vSemanticPresence;
  #include <fog_pars_vertex>

  vec3 semanticNoise(float seed) {
    return normalize(vec3(
      sin(seed * 91.7 + 0.4),
      sin(seed * 157.3 + 1.7),
      sin(seed * 233.9 + 3.1)
    ));
  }

  void main() {
    vec3 direction = semanticNoise(aSemanticSeed);
    float jitterWave = sin(uTime * 0.55 + aSemanticSeed * 31.0);
    vec3 semanticPosition = position
      + direction * aSemanticJitter * uMaximumJitterDistance * jitterWave * 0.18
      + direction * aSemanticFragmentation * uMaximumFragmentationDistance
        * (0.35 + aSemanticSeed * 0.65);
    vec4 mvPosition = modelViewMatrix * vec4(semanticPosition, 1.0);
    float synchronizedPhase = aSemanticSeed * 6.28318 * (1.0 - aSemanticSynchronization);
    float pulse = 1.0 + sin(
      uTime * max(0.35, aSemanticPulseFrequency) + synchronizedPhase
    ) * aSemanticPulseAmplitude * 0.2;
    float spread = max(0.02, uNodeDecayThresholdSpread);
    float brightnessDecay = smoothstep(
      aSemanticSeed - spread,
      aSemanticSeed,
      aSemanticDecay
    );
    float sizeDecay = smoothstep(
      aSemanticSeed - spread * 0.35,
      aSemanticSeed + spread * 0.35,
      aSemanticDecay
    );
    float opacityDecay = smoothstep(
      aSemanticSeed,
      aSemanticSeed + spread,
      aSemanticDecay
    );
    float pointSize = uBasePointSize * aSemanticScale * (1.0 - sizeDecay * 0.68)
      * (1.0 + aSemanticFill * 0.26) * pulse;
    vColor = mix(color, aSemanticTint, aSemanticColorInfluence);
    vOpacity = uBaseOpacity * aSemanticOpacity * (1.0 - opacityDecay * 0.96);
    vFill = aSemanticFill;
    vBrightness = aSemanticBrightness * (1.0 - brightnessDecay * 0.55);
    vSemanticPresence = clamp(
      max(
        max(aSemanticColorInfluence, aSemanticFill),
        max(
          max(aSemanticDecay, aSemanticFragmentation),
          max(aSemanticPulseAmplitude, abs(aSemanticBrightness - 1.0))
        )
      ),
      0.0,
      1.0
    );
    gl_PointSize = clamp(
      pointSize * (uPointScale / max(0.1, -mvPosition.z)),
      1.0,
      uMaximumScreenSize
    );
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const BASE_NODE_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vOpacity;
  varying float vFill;
  varying float vBrightness;
  varying float vSemanticPresence;
  #include <fog_pars_fragment>

  void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float edge = max(fwidth(distanceToCenter), 0.004);
    float circleAlpha = 1.0 - smoothstep(0.5 - edge, 0.5 + edge, distanceToCenter);
    float core = 1.0 - smoothstep(0.06, 0.34, distanceToCenter);
    float glow = 1.0 - smoothstep(0.18, 0.5, distanceToCenter);
    float fill = 1.0 - smoothstep(0.05, 0.46, distanceToCenter);
    float semanticAlpha = (core * 0.62 + glow * 0.38 + fill * vFill * 0.24)
      * vOpacity * circleAlpha;
    float baseAlpha = circleAlpha * vOpacity * (0.48 + glow * 0.52);
    float alpha = mix(baseAlpha, semanticAlpha, vSemanticPresence);
    vec3 semanticColor = vColor
      * (0.76 + core * 0.52 + vFill * 0.2)
      * vBrightness;
    vec3 outputColor = mix(vColor, semanticColor, vSemanticPresence);
    if (alpha <= 0.002) discard;
    gl_FragColor = vec4(outputColor, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>
  }
`;

const BASE_CONNECTION_VERTEX_SHADER = `
  attribute vec3 aSemanticColor;
  attribute float aSemanticOpacity;
  varying vec3 vColor;
  varying float vOpacity;
  #include <fog_pars_vertex>

  void main() {
    vColor = aSemanticColor;
    vOpacity = aSemanticOpacity;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const BASE_CONNECTION_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vOpacity;
  #include <fog_pars_fragment>

  void main() {
    if (vOpacity <= 0.001) discard;
    gl_FragColor = vec4(vColor, vOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>
  }
`;

const SEMANTIC_RIBBON_VERTEX_SHADER = `
  attribute vec3 aOtherPosition;
  attribute vec3 color;
  attribute float aSide;
  attribute float aThickness;
  attribute float aSemanticOpacity;
  attribute float aSemanticInstability;
  attribute float aSemanticFragmentation;
  attribute float aSemanticInterruption;
  attribute float aSemanticPulseFrequency;
  attribute float aSemanticPulseIntensity;
  attribute float aRouteSeed;
  attribute float aRouteProgress;
  uniform vec2 uResolution;
  uniform float uTime;
  varying vec3 vColor;
  varying float vOpacity;
  varying float vInstability;
  varying float vFragmentation;
  varying float vInterruption;
  varying float vPulseFrequency;
  varying float vPulseIntensity;
  varying float vRouteSeed;
  varying float vRouteProgress;

  void main() {
    vec4 currentClip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec4 otherClip = projectionMatrix * modelViewMatrix * vec4(aOtherPosition, 1.0);
    vec2 currentNdc = currentClip.xy / max(0.0001, currentClip.w);
    vec2 otherNdc = otherClip.xy / max(0.0001, otherClip.w);
    vec2 lineDirection = normalize(otherNdc - currentNdc + vec2(0.00001));
    vec2 normal = vec2(-lineDirection.y, lineDirection.x);
    float thicknessWave = sin(
      aRouteProgress * 18.0 + aRouteSeed * 31.0 + uTime * 0.85
    );
    float stableThickness = aThickness
      * (1.0 + thicknessWave * aSemanticInstability * 0.08);
    vec2 pixelOffset = normal * aSide * stableThickness * 2.0
      / max(uResolution, vec2(1.0));
    currentClip.xy += pixelOffset * currentClip.w;
    vColor = color;
    vOpacity = aSemanticOpacity;
    vInstability = aSemanticInstability;
    vFragmentation = aSemanticFragmentation;
    vInterruption = aSemanticInterruption;
    vPulseFrequency = aSemanticPulseFrequency;
    vPulseIntensity = aSemanticPulseIntensity;
    vRouteSeed = aRouteSeed;
    vRouteProgress = aRouteProgress;
    gl_Position = currentClip;
  }
`;

const SEMANTIC_RIBBON_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uMaximumOpacityVariation;
  varying vec3 vColor;
  varying float vOpacity;
  varying float vInstability;
  varying float vFragmentation;
  varying float vInterruption;
  varying float vPulseFrequency;
  varying float vPulseIntensity;
  varying float vRouteSeed;
  varying float vRouteProgress;

  void main() {
    float opacityWave = 0.5 + 0.5 * sin(
      vRouteProgress * 16.0 + vRouteSeed * 37.0 + uTime * 0.7
    );
    float irregular = 1.0
      - opacityWave * vInstability * uMaximumOpacityVariation;
    float interruptionSignal = 0.5 + 0.5 * sin(
      vRouteProgress * 33.0 + vRouteSeed * 53.0 - uTime * 0.48
    );
    float fragmentationSignal = 0.5 + 0.5 * sin(
      vRouteProgress * 57.0 + vRouteSeed * 71.0
    );
    float interruptionGap = smoothstep(0.48, 0.72, interruptionSignal)
      * vInterruption;
    float fragmentationGap = smoothstep(0.55, 0.78, fragmentationSignal)
      * vFragmentation;
    float visibility = 1.0 - max(interruptionGap * 0.9, fragmentationGap * 0.96);
    float pulseCarrier = 0.5 + 0.5 * sin(
      vRouteProgress * 21.0 + vRouteSeed * 29.0
        - uTime * (1.1 + vPulseFrequency * 3.4)
    );
    float pulse = smoothstep(0.42, 0.92, pulseCarrier) * vPulseIntensity;
    float alpha = vOpacity * irregular * visibility * (1.0 + pulse * 0.22);
    if (alpha <= 0.002) discard;
    gl_FragColor = vec4(vColor * (0.9 + alpha * 0.45 + pulse * 0.24), alpha);
  }
`;

export const NeuralCoreSceneView = ({
  ambientPulseMaterialRef,
  baseRef,
  clusterActivationColorRef,
  clusterActivationField,
  clusterActivationGeometryRef,
  clusterActivationPositionRef,
  clusterActivationOpacityRef,
  clusterActivationSizeRef,
  clusterLabelOverlay,
  inspectionCameraControls,
  connectionBuffers,
  connectionFields,
  connectionRef,
  coreNodes,
  coreRef,
  focusHaloMaterialRef,
  focusHaloRef,
  hubRef,
  hubs,
  networkRef,
  nodeClouds,
  nodeCloudRef,
  particleField,
  particleMaterialRef,
  particlePositionRef,
  propagationPulseColorRef,
  propagationPulseField,
  propagationPulseGeometryRef,
  propagationPulsePositionRef,
  propagationPulseOpacityRef,
  propagationPulseSizeRef,
  propagationConfig,
  pulseField,
  pulseColorRef,
  pulsePositionRef,
  ringRef,
  rings,
  semanticPointCloudFields,
  semanticRibbonAttributeRefs,
  semanticRibbonField,
  semanticRibbonMaterialRef,
  semanticVisualizationConfig,
}: NeuralCoreSceneViewProps): ReactElement => {
  return (
    <>
      {inspectionCameraControls}
      <group ref={networkRef}>
      <group ref={baseRef} position={[0, -1.74, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.48, 0.0065, 8, 192]} />
          <meshBasicMaterial color="#26d9ff" transparent opacity={0.34} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.88, 0.0048, 8, 160]} />
          <meshBasicMaterial color="#8a6dff" transparent opacity={0.16} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.12, 96]} />
          <meshBasicMaterial color="#26d9ff" transparent opacity={0.052} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.32, 0]}>
          <coneGeometry args={[0.78, 1.72, 72, 1, true]} />
          <meshBasicMaterial color="#26d9ff" transparent opacity={0.035} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>

      <group ref={ringRef}>
        {rings.map((ring) => (
          <mesh key={ring.id} rotation={ring.rotation} userData={{ speed: ring.speed, phase: ring.phase }}>
            <torusGeometry args={[ring.radius, ring.tubeRadius, 8, 224]} />
            <meshBasicMaterial color={ring.color} transparent opacity={ring.opacity} blending={AdditiveBlending} depthWrite={false} />
          </mesh>
        ))}
      </group>

      <points>
        <bufferGeometry>
          <bufferAttribute ref={particlePositionRef} attach="attributes-position" args={[particleField.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[particleField.colors, 3]} />
        </bufferGeometry>
        <shaderMaterial
          ref={particleMaterialRef}
          vertexShader={AMBIENT_POINT_VERTEX_SHADER}
          fragmentShader={AMBIENT_POINT_FRAGMENT_SHADER}
          uniforms={{
            uSize: { value: particleField.size },
            uOpacity: { value: particleField.opacity },
            uPointScale: { value: 300 },
            uMinimumScreenSize: { value: 1 },
            uMaximumScreenSize: { value: 4.5 },
            uDistanceScaleInfluence: { value: 0.82 },
          }}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <group ref={connectionRef}>
        {connectionBuffers.map((buffer, bufferIndex) => {
          const semanticField = connectionFields[bufferIndex];

          return (
          <lineSegments key={buffer.bucket}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[buffer.positions, 3]} />
              <bufferAttribute
                attach="attributes-aSemanticColor"
                args={[semanticField.colors, 3]}
              />
              <bufferAttribute
                attach="attributes-aSemanticOpacity"
                args={[semanticField.opacities, 1]}
              />
            </bufferGeometry>
            <shaderMaterial
              vertexShader={BASE_CONNECTION_VERTEX_SHADER}
              fragmentShader={BASE_CONNECTION_FRAGMENT_SHADER}
              uniforms={{
                fogColor: { value: NEURAL_CORE_FOG_COLOR },
                fogNear: { value: NEURAL_CORE_FOG_NEAR },
                fogFar: { value: NEURAL_CORE_FOG_FAR },
              }}
              fog
              transparent
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </lineSegments>
          );
        })}
      </group>

      <mesh frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[semanticRibbonField.positions, 3]} />
          <bufferAttribute attach="attributes-aOtherPosition" args={[semanticRibbonField.otherPositions, 3]} />
          <bufferAttribute attach="attributes-aSide" args={[semanticRibbonField.sides, 1]} />
          <bufferAttribute
            ref={semanticRibbonAttributeRefs.thickness}
            attach="attributes-aThickness"
            args={[semanticRibbonField.thicknesses, 1]}
          />
          <bufferAttribute
            ref={semanticRibbonAttributeRefs.color}
            attach="attributes-color"
            args={[semanticRibbonField.colors, 3]}
          />
          <bufferAttribute
            ref={semanticRibbonAttributeRefs.opacity}
            attach="attributes-aSemanticOpacity"
            args={[semanticRibbonField.opacities, 1]}
          />
          <bufferAttribute
            ref={semanticRibbonAttributeRefs.instability}
            attach="attributes-aSemanticInstability"
            args={[semanticRibbonField.instabilities, 1]}
          />
          <bufferAttribute
            ref={semanticRibbonAttributeRefs.fragmentation}
            attach="attributes-aSemanticFragmentation"
            args={[semanticRibbonField.fragmentations, 1]}
          />
          <bufferAttribute
            ref={semanticRibbonAttributeRefs.interruption}
            attach="attributes-aSemanticInterruption"
            args={[semanticRibbonField.interruptions, 1]}
          />
          <bufferAttribute
            ref={semanticRibbonAttributeRefs.pulseFrequency}
            attach="attributes-aSemanticPulseFrequency"
            args={[semanticRibbonField.pulseFrequencies, 1]}
          />
          <bufferAttribute
            ref={semanticRibbonAttributeRefs.pulseIntensity}
            attach="attributes-aSemanticPulseIntensity"
            args={[semanticRibbonField.pulseIntensities, 1]}
          />
          <bufferAttribute attach="attributes-aRouteSeed" args={[semanticRibbonField.routeSeeds, 1]} />
          <bufferAttribute
            attach="attributes-aRouteProgress"
            args={[semanticRibbonField.routeProgresses, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={semanticRibbonMaterialRef}
          vertexShader={SEMANTIC_RIBBON_VERTEX_SHADER}
          fragmentShader={SEMANTIC_RIBBON_FRAGMENT_SHADER}
          uniforms={{
            uTime: { value: 0 },
            uResolution: { value: { x: 1560, y: 840 } },
            uMaximumOpacityVariation: {
              value: semanticVisualizationConfig.failure.maximumRouteOpacityVariation,
            },
          }}
          transparent
          side={DoubleSide}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <group ref={nodeCloudRef}>
        {nodeClouds.map((cloud, cloudIndex) => {
          const semanticField = semanticPointCloudFields[cloudIndex];

          return (
          <points key={cloud.kind}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[cloud.positions, 3]} />
              <bufferAttribute attach="attributes-color" args={[cloud.colors, 3]} />
              <bufferAttribute attach="attributes-aSemanticTint" args={[semanticField.colors, 3]} />
              <bufferAttribute
                attach="attributes-aSemanticBrightness"
                args={[semanticField.brightnesses, 1]}
              />
              <bufferAttribute
                attach="attributes-aSemanticColorInfluence"
                args={[semanticField.colorInfluences, 1]}
              />
              <bufferAttribute attach="attributes-aSemanticScale" args={[semanticField.scales, 1]} />
              <bufferAttribute attach="attributes-aSemanticOpacity" args={[semanticField.opacities, 1]} />
              <bufferAttribute attach="attributes-aSemanticJitter" args={[semanticField.jitters, 1]} />
              <bufferAttribute
                attach="attributes-aSemanticFragmentation"
                args={[semanticField.fragmentations, 1]}
              />
              <bufferAttribute attach="attributes-aSemanticDecay" args={[semanticField.decays, 1]} />
              <bufferAttribute attach="attributes-aSemanticFill" args={[semanticField.fills, 1]} />
              <bufferAttribute
                attach="attributes-aSemanticSynchronization"
                args={[semanticField.synchronizations, 1]}
              />
              <bufferAttribute
                attach="attributes-aSemanticPulseFrequency"
                args={[semanticField.pulseFrequencies, 1]}
              />
              <bufferAttribute
                attach="attributes-aSemanticPulseAmplitude"
                args={[semanticField.pulseAmplitudes, 1]}
              />
              <bufferAttribute attach="attributes-aSemanticSeed" args={[semanticField.seeds, 1]} />
            </bufferGeometry>
            <shaderMaterial
              vertexShader={BASE_NODE_VERTEX_SHADER}
              fragmentShader={BASE_NODE_FRAGMENT_SHADER}
              uniforms={{
                uTime: { value: 0 },
                uBasePointSize: { value: cloud.size },
                uPointScale: { value: 300 },
                uBaseOpacity: { value: cloud.opacity },
                uMaximumScreenSize: { value: 12 },
                uMaximumJitterDistance: {
                  value: semanticVisualizationConfig.cluster.maximumJitterDistance,
                },
                uMaximumFragmentationDistance: {
                  value: semanticVisualizationConfig.failure.maximumNodeFragmentationDistance,
                },
                uNodeDecayThresholdSpread: {
                  value: semanticVisualizationConfig.failure.nodeDecayThresholdSpread,
                },
                fogColor: { value: NEURAL_CORE_FOG_COLOR },
                fogNear: { value: NEURAL_CORE_FOG_NEAR },
                fogFar: { value: NEURAL_CORE_FOG_FAR },
              }}
              fog
              transparent
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </points>
          );
        })}
      </group>

      <points>
        <bufferGeometry>
          <bufferAttribute ref={pulsePositionRef} attach="attributes-position" args={[pulseField.positions, 3]} />
          <bufferAttribute ref={pulseColorRef} attach="attributes-color" args={[pulseField.colors, 3]} />
        </bufferGeometry>
        <shaderMaterial
          ref={ambientPulseMaterialRef}
          vertexShader={AMBIENT_POINT_VERTEX_SHADER}
          fragmentShader={AMBIENT_POINT_FRAGMENT_SHADER}
          uniforms={{
            uSize: { value: pulseField.size },
            uOpacity: { value: pulseField.opacity },
            uPointScale: { value: 300 },
            uMinimumScreenSize: { value: 1.5 },
            uMaximumScreenSize: { value: 7 },
            uDistanceScaleInfluence: { value: 0.76 },
          }}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <points frustumCulled={false}>
        <bufferGeometry ref={clusterActivationGeometryRef} drawRange={{ start: 0, count: 0 }}>
          <bufferAttribute
            ref={clusterActivationPositionRef}
            attach="attributes-position"
            args={[clusterActivationField.positions, 3]}
          />
          <bufferAttribute
            ref={clusterActivationColorRef}
            attach="attributes-color"
            args={[clusterActivationField.colors, 3]}
          />
          <bufferAttribute
            ref={clusterActivationSizeRef}
            attach="attributes-aSize"
            args={[clusterActivationField.sizes, 1]}
          />
          <bufferAttribute
            ref={clusterActivationOpacityRef}
            attach="attributes-aOpacity"
            args={[clusterActivationField.opacities, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={PROPAGATION_POINT_VERTEX_SHADER}
          fragmentShader={PROPAGATION_POINT_FRAGMENT_SHADER}
          uniforms={{
            uPointScale: { value: 300 },
            uMinimumScreenSize: { value: propagationConfig.pulse.minimumScreenSize },
            uMaximumScreenSize: {
              value: Math.max(
                propagationConfig.pulse.minimumScreenSize,
                propagationConfig.pulse.maximumScreenSize * 0.82,
              ),
            },
            uDistanceScaleInfluence: { value: propagationConfig.pulse.distanceScaleInfluence },
          }}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <points frustumCulled={false}>
        <bufferGeometry ref={propagationPulseGeometryRef} drawRange={{ start: 0, count: 0 }}>
          <bufferAttribute
            ref={propagationPulsePositionRef}
            attach="attributes-position"
            args={[propagationPulseField.positions, 3]}
          />
          <bufferAttribute
            ref={propagationPulseColorRef}
            attach="attributes-color"
            args={[propagationPulseField.colors, 3]}
          />
          <bufferAttribute
            ref={propagationPulseSizeRef}
            attach="attributes-aSize"
            args={[propagationPulseField.sizes, 1]}
          />
          <bufferAttribute
            ref={propagationPulseOpacityRef}
            attach="attributes-aOpacity"
            args={[propagationPulseField.opacities, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={PROPAGATION_POINT_VERTEX_SHADER}
          fragmentShader={PROPAGATION_POINT_FRAGMENT_SHADER}
          uniforms={{
            uPointScale: { value: 300 },
            uMinimumScreenSize: { value: propagationConfig.pulse.minimumScreenSize },
            uMaximumScreenSize: { value: propagationConfig.pulse.maximumScreenSize },
            uDistanceScaleInfluence: { value: propagationConfig.pulse.distanceScaleInfluence },
          }}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <group ref={hubRef}>
        {hubs.map((hub) => (
          <group
            key={hub.id}
            position={hub.position}
            scale={hub.baseScale}
            userData={{
              basePosition: hub.position,
              baseScale: hub.baseScale,
              phase: hub.phase,
              nodeId: hub.id,
            }}
          >
            <mesh>
              <sphereGeometry args={[hub.radius, 12, 12]} />
              <meshBasicMaterial
                color={hub.color}
                transparent
                opacity={0.9}
                blending={AdditiveBlending}
                depthWrite={false}
                userData={{ baseColor: getLinearHexColor(hub.color), baseOpacity: 0.9 }}
              />
            </mesh>
            <mesh scale={1.62}>
              <sphereGeometry args={[hub.radius, 12, 12]} />
              <meshBasicMaterial
                color={hub.color}
                transparent
                opacity={0.12}
                blending={AdditiveBlending}
                depthWrite={false}
                userData={{ baseColor: getLinearHexColor(hub.color), baseOpacity: 0.12 }}
              />
            </mesh>
          </group>
        ))}
      </group>

      <group ref={coreRef}>
        {coreNodes.map((node) => (
          <group
            key={node.id}
            position={node.position}
            scale={node.baseScale}
            userData={{
              basePosition: node.position,
              baseScale: node.baseScale,
              phase: node.phase,
              nodeId: node.id,
            }}
          >
            <mesh>
              <sphereGeometry args={[node.radius, 16, 16]} />
              <meshBasicMaterial
                color={node.color}
                transparent
                opacity={0.98}
                blending={AdditiveBlending}
                depthWrite={false}
                userData={{ baseColor: getLinearHexColor(node.color), baseOpacity: 0.98 }}
              />
            </mesh>
            <mesh scale={1.9}>
              <sphereGeometry args={[node.radius, 16, 16]} />
              <meshBasicMaterial
                color="#26d9ff"
                transparent
                opacity={0.24}
                blending={AdditiveBlending}
                depthWrite={false}
                userData={{ baseColor: getLinearHexColor("#26d9ff"), baseOpacity: 0.24 }}
              />
            </mesh>
            <mesh scale={2.65}>
              <sphereGeometry args={[node.radius, 16, 16]} />
              <meshBasicMaterial
                color="#8a6dff"
                transparent
                opacity={0.085}
                blending={AdditiveBlending}
                depthWrite={false}
                userData={{ baseColor: getLinearHexColor("#8a6dff"), baseOpacity: 0.085 }}
              />
            </mesh>
          </group>
        ))}
      </group>
      </group>

      <mesh ref={focusHaloRef} visible={false} renderOrder={4}>
        <torusGeometry args={[1, 0.012, 10, 112]} />
        <meshBasicMaterial
          ref={focusHaloMaterialRef}
          color="#82efff"
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {clusterLabelOverlay ? (
        <Html fullscreen style={{ pointerEvents: "none" }}>
          {clusterLabelOverlay}
        </Html>
      ) : null}
    </>
  );
};

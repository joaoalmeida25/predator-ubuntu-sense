import type { ReactElement } from "react";
import { AdditiveBlending } from "three";

import type { NeuralCoreSceneViewProps } from "./neural-core-scene-view.types";

export const NeuralCoreSceneView = ({
  baseRef,
  connectionBuffers,
  coreNodes,
  coreRef,
  hubRef,
  hubs,
  networkRef,
  nodeClouds,
  particleField,
  particlePositionRef,
  pulseField,
  pulseColorRef,
  pulsePositionRef,
  ringRef,
  rings,
}: NeuralCoreSceneViewProps): ReactElement => {
  return (
    <group ref={networkRef}>
      <group ref={baseRef} position={[0, -1.74, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.48, 0.0065, 8, 192]} />
          <meshBasicMaterial color="#26d9ff" transparent opacity={0.3} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.88, 0.0048, 8, 160]} />
          <meshBasicMaterial color="#8a6dff" transparent opacity={0.2} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.12, 96]} />
          <meshBasicMaterial color="#26d9ff" transparent opacity={0.045} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.32, 0]}>
          <coneGeometry args={[0.78, 1.72, 72, 1, true]} />
          <meshBasicMaterial color="#26d9ff" transparent opacity={0.04} blending={AdditiveBlending} depthWrite={false} />
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
        <pointsMaterial
          size={particleField.size}
          transparent
          opacity={particleField.opacity}
          vertexColors
          sizeAttenuation
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <group>
        {connectionBuffers.map((buffer) => (
          <lineSegments key={buffer.bucket}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[buffer.positions, 3]} />
            </bufferGeometry>
            <lineBasicMaterial
              color={buffer.color}
              transparent
              opacity={buffer.opacity}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </lineSegments>
        ))}
      </group>

      <group>
        {nodeClouds.map((cloud) => (
          <points key={cloud.kind}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[cloud.positions, 3]} />
              <bufferAttribute attach="attributes-color" args={[cloud.colors, 3]} />
            </bufferGeometry>
            <pointsMaterial
              size={cloud.size}
              transparent
              opacity={cloud.opacity}
              vertexColors
              sizeAttenuation
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </points>
        ))}
      </group>

      <points>
        <bufferGeometry>
          <bufferAttribute ref={pulsePositionRef} attach="attributes-position" args={[pulseField.positions, 3]} />
          <bufferAttribute ref={pulseColorRef} attach="attributes-color" args={[pulseField.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={pulseField.size}
          transparent
          opacity={pulseField.opacity}
          vertexColors
          sizeAttenuation
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
            userData={{ baseScale: hub.baseScale, phase: hub.phase }}
          >
            <mesh>
              <sphereGeometry args={[hub.radius, 12, 12]} />
              <meshBasicMaterial color={hub.color} transparent opacity={0.86} blending={AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh scale={1.5}>
              <sphereGeometry args={[hub.radius, 12, 12]} />
              <meshBasicMaterial color={hub.color} transparent opacity={0.13} blending={AdditiveBlending} depthWrite={false} />
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
            userData={{ baseScale: node.baseScale, phase: node.phase }}
          >
            <mesh>
              <sphereGeometry args={[node.radius, 16, 16]} />
              <meshBasicMaterial color={node.color} transparent opacity={0.94} blending={AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh scale={1.9}>
              <sphereGeometry args={[node.radius, 16, 16]} />
              <meshBasicMaterial color="#26d9ff" transparent opacity={0.2} blending={AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh scale={2.8}>
              <sphereGeometry args={[node.radius, 16, 16]} />
              <meshBasicMaterial color="#8a6dff" transparent opacity={0.075} blending={AdditiveBlending} depthWrite={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

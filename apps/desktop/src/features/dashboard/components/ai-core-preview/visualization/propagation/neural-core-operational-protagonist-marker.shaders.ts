export const OPERATIONAL_COMET_VERTEX_SHADER = `
  attribute vec3 color;
  attribute vec3 aTangent;
  attribute float aSize;
  attribute float aOpacity;
  uniform vec2 uViewport;
  uniform float uPointScale;
  uniform float uMinimumScreenLength;
  uniform float uMaximumScreenLength;
  uniform float uDistanceScaleInfluence;
  uniform float uTangentProbeLength;
  uniform float uHeadPosition;
  varying vec2 vScreenDirection;
  varying float vDirectionStrength;
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vec3 viewTangent = mat3(modelViewMatrix) * aTangent;
    float tangentLength = length(viewTangent);
    vec3 safeViewTangent = tangentLength > 0.00001
      ? viewTangent / tangentLength
      : vec3(1.0, 0.0, 0.0);
    vec4 centerClip = projectionMatrix * viewPosition;
    vec4 probeClip = projectionMatrix * vec4(
      viewPosition.xyz + safeViewTangent * uTangentProbeLength,
      1.0
    );
    vec2 centerNdc = centerClip.xy / max(0.00001, abs(centerClip.w));
    vec2 probeNdc = probeClip.xy / max(0.00001, abs(probeClip.w));
    vec2 screenDelta = (probeNdc - centerNdc) * max(uViewport, vec2(1.0)) * 0.5;
    float projectedDirectionLength = length(screenDelta);
    vScreenDirection = projectedDirectionLength > 0.0001
      ? screenDelta / projectedDirectionLength
      : vec2(1.0, 0.0);
    float transverseStrength = tangentLength > 0.00001
      ? length(viewTangent.xy) / tangentLength
      : 0.0;
    vDirectionStrength = smoothstep(0.04, 0.3, transverseStrength)
      * smoothstep(0.04, 0.8, projectedDirectionLength);
    vColor = color;
    vOpacity = aOpacity;
    float constantLength = aSize * uPointScale;
    float attenuatedLength = constantLength / max(0.1, -viewPosition.z);
    float screenLength = clamp(
      mix(constantLength, attenuatedLength, uDistanceScaleInfluence),
      uMinimumScreenLength,
      uMaximumScreenLength
    );
    gl_PointSize = screenLength;
    vec2 markerCenterOffset = vScreenDirection
      * uHeadPosition
      * vDirectionStrength
      * screenLength
      * 2.0
      / max(uViewport, vec2(1.0));
    centerClip.xy -= markerCenterOffset * centerClip.w;
    gl_Position = centerClip;
  }
`;

export const OPERATIONAL_COMET_FRAGMENT_SHADER = `
  uniform float uAspectRatio;
  uniform float uHeadPosition;
  uniform float uHeadRadius;
  uniform float uTailLength;
  uniform float uTailMaximumWidth;
  uniform float uTailFalloff;
  uniform float uSemanticColorInfluence;
  varying vec2 vScreenDirection;
  varying float vDirectionStrength;
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    vec2 direction = normalize(vScreenDirection);
    vec2 perpendicular = vec2(-direction.y, direction.x);
    float along = dot(centered, direction);
    float across = dot(centered, perpendicular);
    float effectiveHeadPosition = uHeadPosition * vDirectionStrength;
    float headDistance = length(vec2(along - effectiveHeadPosition, across));
    float headSdf = headDistance - uHeadRadius;
    float tailStart = effectiveHeadPosition - uTailLength;
    float tailProgress = clamp(
      (along - tailStart) / max(0.0001, uTailLength),
      0.0,
      1.0
    );
    float tailHalfWidth = min(uTailMaximumWidth, 0.5 / max(1.0, uAspectRatio))
      * pow(max(0.001, tailProgress), uTailFalloff);
    float tailSideSdf = abs(across) - tailHalfWidth;
    float tailCapSdf = max(tailStart - along, along - effectiveHeadPosition);
    float tailSdf = max(tailSideSdf, tailCapSdf);
    float tailTipSdf = length(vec2(along - tailStart, across))
      - uTailMaximumWidth * 0.08;
    tailSdf = min(tailSdf, tailTipSdf);
    float cometSdf = min(headSdf, tailSdf);
    float circularSdf = length(vec2(along, across)) - uHeadRadius;
    float shapeSdf = mix(circularSdf, cometSdf, vDirectionStrength);
    float antialiasWidth = max(fwidth(shapeSdf), 0.0025);
    float body = 1.0 - smoothstep(
      -antialiasWidth,
      antialiasWidth,
      shapeSdf
    );
    float halo = 1.0 - smoothstep(
      0.0,
      0.075 + antialiasWidth,
      shapeSdf
    );
    float directionalTailAlpha = mix(
      0.055,
      0.86,
      pow(tailProgress, 0.82)
    );
    float headWeight = 1.0 - smoothstep(
      uHeadRadius * 0.42,
      uHeadRadius,
      headDistance
    );
    float directionalBodyAlpha = max(directionalTailAlpha, headWeight);
    float bodyAlpha = mix(1.0, directionalBodyAlpha, vDirectionStrength);
    float alpha = (
      body * bodyAlpha
      + max(0.0, halo - body) * 0.2
    ) * vOpacity;
    if (alpha <= 0.001) discard;
    float core = 1.0 - smoothstep(
      uHeadRadius * 0.12,
      uHeadRadius * 0.5,
      headDistance
    );
    vec3 tintedCore = mix(vec3(0.98), vColor, uSemanticColorInfluence);
    vec3 bodyColor = vColor * (0.8 + headWeight * 0.18);
    vec3 cometColor = mix(bodyColor, tintedCore, core * 0.9);
    gl_FragColor = vec4(min(cometColor, vec3(1.0)), alpha);
  }
`;

precision highp float;
attribute vec2 position;
uniform vec2 offset, range;
varying vec2 vUV, stationaryUV;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  stationaryUV = 0.5 + 0.5 * position;
  vUV = position * range + offset;
}

// glsl-split

precision highp float;
uniform sampler2D tNoise, tSand, tSandNormal, tMetal, tMetalNormal, tShadow;
varying vec2 vUV, stationaryUV;

const float noiseScale = 0.005;

void main() {
  float shadow = texture2D(tShadow, stationaryUV).r;
  float noise0 = texture2D(tNoise, vUV.xy * noiseScale * 1.0).r;
  float noise1 = texture2D(tNoise, vUV.yx * noiseScale * 2.0).r;
  float noise2 = texture2D(tNoise, -vUV.xy * noiseScale * 4.0).r;
  float noise3 = texture2D(tNoise, -vUV.yx * noiseScale * 8.0).r;
  vec3 metal = noise3 * texture2D(tMetal, vUV * 0.25).rgb;
  vec3 metalNormal = normalize(texture2D(tMetalNormal, vUV * 0.25).rgb * 2.0 - 1.0);
  vec3 sand = 0.5 * 0.5 * (noise2 + noise1) * texture2D(tSand, vUV * 0.5).rgb;
  vec3 sandNormal = normalize(texture2D(tSandNormal, vUV * 0.5).rgb * 2.0 - 1.0);
  float metalLight = dot(metalNormal, normalize(vec3(1, 1, 2)));
  metalLight = clamp(metalLight, 0.0, 1.0);
  float pMetalLight = pow(metalLight, 12.0);
  metal = pMetalLight + metalLight * metal;
  float sandLight = dot(sandNormal, normalize(vec3(1, 1, 2)));
  sandLight = clamp(sandLight, 0.0, 1.0);
  sand = sandLight * sand;
  float delta = 0.1;
  float center = 0.7;
  float mx = smoothstep(center - delta, center + delta, 0.5 * (noise0 + noise1));
  vec3 color = mix(metal, sand, mx);
  gl_FragColor = vec4(shadow * color, 1);
}

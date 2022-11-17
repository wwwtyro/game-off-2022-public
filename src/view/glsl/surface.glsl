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

void main() {
  float shadow = texture2D(tShadow, stationaryUV).r;
  float noise = texture2D(tNoise, vUV * 0.01).r;
  vec3 metal = 0.5 * texture2D(tMetal, vUV * 0.25).rgb;
  vec3 metalNormal = normalize(texture2D(tMetalNormal, vUV * 0.25).rgb * 2.0 - 1.0);
  vec3 sand = 0.333 * texture2D(tSand, vUV * 0.5).rgb;
  vec3 sandNormal = normalize(texture2D(tSandNormal, vUV * 0.5).rgb * 2.0 - 1.0);
  float delta = 0.05;
  float metalLight = dot(metalNormal, normalize(vec3(1, 1, 2)));
  metalLight = clamp(metalLight, 0.0, 1.0);
  float pMetalLight = pow(metalLight, 12.0);
  metal = pMetalLight + metalLight * metal;
  float sandLight = dot(sandNormal, normalize(vec3(1, 1, 2)));
  sandLight = clamp(sandLight, 0.0, 1.0);
  sand = sandLight * sand;
  float mx = smoothstep(0.5 - delta, 0.5 + delta, noise);
  vec3 color = mix(metal, sand, mx);
  gl_FragColor = vec4(shadow * color, 1);
}

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
uniform sampler2D tNoise, tSand, tMetal, tShadow;
varying vec2 vUV, stationaryUV;

void main() {
  float shadow = texture2D(tShadow, stationaryUV).r;
  vec4 noise = texture2D(tNoise, vUV * 0.001);
  vec4 metal = texture2D(tMetal, vUV * 0.25);
  vec4 sand = texture2D(tSand, vUV * 0.5);
  float delta = 0.1;
  float mx = smoothstep(0.5 - delta, 0.5 + delta, noise.r);
  vec4 color = mix(metal, sand, mx);
  gl_FragColor = vec4(shadow * 0.25 * color.rgb, 1);
}

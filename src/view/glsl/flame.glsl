precision highp float;
attribute vec2 position, center;
attribute float age, scale;
uniform mat4 view, projection;
uniform float flameout, smokeout;
varying vec2 vPosition;
varying vec4 vColor;

float smooth(float e0, float e1, float x) {
  if (x < e0) {
    return 0.0;
  }
  if (x > e1) {
    return 1.0;
  }
  return smoothstep(e0, e1, x);
}

void main() {
  vPosition = position;
  float radius;
  float dFlameout = clamp(age / flameout, 0.0, 1.0);
  radius = scale * dFlameout;
  if (age < flameout) {
    vColor = mix(vec4(3, 2, 1, 1), vec4(0, 0, 0, 0.5), dFlameout);
  } else {
    float dSmokeout = smooth(flameout, smokeout, age);
    vColor = mix(vec4(0, 0, 0, 0.5), vec4(0.2, 0.2, 0.2, 0), dSmokeout);
    radius += scale * dSmokeout;
  }
  gl_Position = projection * view * vec4(center + radius * position, 0.0, 1.0);
}

// glsl-split

precision highp float;
varying vec4 vColor;
varying vec2 vPosition;

void main() {
  float dist = length(vPosition);
  if (dist > 1.0) {
    discard;
  }
  float alpha = clamp(1.0 - smoothstep(0.0, 1.0, dist), 0.0, 1.0);
  gl_FragColor = vColor * vec4(1, 1, 1, alpha);
}

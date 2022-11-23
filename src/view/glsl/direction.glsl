precision highp float;
attribute vec2 position;
uniform vec2 resolution;
uniform float rotation, scale;
varying vec2 vUV;

void main() {
  vec2 dir = vec2(cos(rotation), sin(rotation));
  vec2 tvec = abs(1.0 / dir);
  float t = min(tvec.x, tvec.y);
  vec2 center = t * dir;
  vec2 ir = 1.0 / resolution;
  center -= dir * 64.0 * ir;

  float x = dir.x * position.x - dir.y * position.y;
  float y = dir.y * position.x + dir.x * position.y;

  gl_Position = vec4(64.0 * ir * scale * vec2(x, y) + center, 0.0, 1.0);
  vUV = position + 0.5;
}

// glsl-split

precision highp float;
uniform sampler2D texture;
uniform vec3 color;
uniform float time;
varying vec2 vUV;

void main() {
  vec4 value = texture2D(texture, vUV);
  float blink = 0.5 + 0.5 * sin(time);
  gl_FragColor = vec4(value.rgb * color, value.a * blink);
}

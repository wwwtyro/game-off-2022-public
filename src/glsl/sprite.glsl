precision highp float;
attribute vec2 position;
uniform mat4 model, view, projection;
varying vec2 vUV;

void main() {
  gl_Position = projection * view * model * vec4(position, 0.0, 1.0);
  vUV = position + 0.5;
}

// glsl-split

precision highp float;
uniform sampler2D albedo;
varying vec2 vUV;

void main() {
  vec4 color = texture2D(albedo, vUV);
  if (color.a < 1.0 / 255.0) {
    discard;
  }
  gl_FragColor = vec4(color);
}

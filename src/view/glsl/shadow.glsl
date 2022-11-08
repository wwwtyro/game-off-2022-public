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
  float alpha = texture2D(albedo, vUV).a;
  if (alpha < 0.5) {
    discard;
  }
  gl_FragColor = vec4(0.5, 0.0, 0.0, 0.0);
}

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
uniform sampler2D tAlbedo, tNormal;
uniform float rotation;
varying vec2 vUV;

void main() {
  vec4 color = texture2D(tAlbedo, vUV);
  if (color.a < 0.75) {
    discard;
  }
  vec3 normal = texture2D(tNormal, vUV).rgb * 2.0 - 1.0;
  normal = normalize(normal);
  float cos_r = cos(rotation);
  float sin_r = sin(rotation);
  float x = cos_r * normal.x - sin_r * normal.y;
  float y = sin_r * normal.x + cos_r * normal.y;
  normal.x = x;
  normal.y = y;
  float light = dot(normal, normalize(vec3(1, 1, 2)));
  light = clamp(light, 0.0, 1.0);
  float plight = pow(light, 12.0);
  gl_FragColor = vec4(1.0 * plight + 1.0 * light * color.rgb, 1.0);
}

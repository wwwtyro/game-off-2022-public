precision highp float;
attribute vec4 color;
attribute vec3 position;
attribute vec2 pointA, pointB;
uniform float width;
uniform mat4 model, view, projection;
varying vec4 vColor;

void main() {
  vec2 xBasis = normalize(pointB - pointA);
  vec2 yBasis = vec2(-xBasis.y, xBasis.x);
  vec2 offsetA = pointA + width * (position.x * xBasis + position.y * yBasis);
  vec2 offsetB = pointB + width * (position.x * xBasis + position.y * yBasis);
  vec2 point = mix(offsetA, offsetB, position.z);
  gl_Position = projection * view * model * vec4(point, 0, 1);
  vColor = color;
}

// glsl-split

precision highp float;
varying vec4 vColor;

void main() { gl_FragColor = vColor; }
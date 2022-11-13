import { vec2 } from "gl-matrix";

export function animationFrame() {
  return new Promise((accept) => {
    requestAnimationFrame(accept);
  });
}

export function modulo(n: number, m: number) {
  return ((n % m) + m) % m;
}

export const vec2Origin = vec2.fromValues(0, 0);

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

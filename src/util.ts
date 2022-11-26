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

export function randomChoice<T>(arr: T[]): T | undefined {
  if (arr.length === 0) {
    return undefined;
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

export function vec2RandomOffset(v: vec2, scale: number) {
  const out = vec2.create();
  vec2.random(out, Math.random() * scale);
  vec2.add(out, v, out);
  return out;
}

export function cloneCanvas(source: HTMLCanvasElement) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Couldn't acquire context.");
  }
  ctx.drawImage(source, 0, 0);
  return canvas;
}

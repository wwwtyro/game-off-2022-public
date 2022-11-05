import { vec2 } from "gl-matrix";
import { imageDataGet } from "./image-data";
import { Texture } from "./resources";

export function modulo(n: number, m: number) {
  return ((n % m) + m) % m;
}

export function generateOutline(texture: Texture) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = texture.image.width;
  canvas.height = texture.image.height;
  ctx.drawImage(texture.image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Flood fill to discover edges.
  const queue: number[][] = [[0, 0]];
  const visited: Record<string, boolean> = {};
  const edge: Record<string, number[]> = {};
  while (queue.length > 0) {
    const target = queue.shift();
    if (target === undefined) {
      throw new Error("Failed to discern edge.");
    }
    if (target[0] < 0 || target[0] >= imageData.width || target[1] < 0 || target[1] >= imageData.height) {
      continue;
    }
    if (visited[target.toString()]) {
      continue;
    }
    const pixel = imageDataGet(imageData, target[0], target[1]);
    if (pixel[3] > 0) {
      continue;
    }
    visited[target.toString()] = true;
    if (hasNeighbor(imageData, target[0], target[1])) {
      edge[target.toString()] = target;
    } else {
      queue.push([target[0] + 1, target[1] + 0]);
      queue.push([target[0] - 1, target[1] + 0]);
      queue.push([target[0] + 0, target[1] + 1]);
      queue.push([target[0] + 0, target[1] - 1]);
    }
  }

  // Step along the edge pixels to define a path.
  const deltas = [
    [+0, -1],
    [+1, -1],
    [+1, +0],
    [+1, +1],
    [+0, +1],
    [-1, +1],
    [-1, +0],
    [-1, -1],
  ];

  let current = Object.values(edge)[0];
  const path: number[][] = [current];
  while (Object.values(edge).length > 0) {
    delete edge[current.toString()];
    let fail = true;
    for (const delta of deltas) {
      const test = edge[[current[0] + delta[0], current[1] + delta[1]].toString()];
      if (test !== undefined) {
        path.push(test);
        current = test;
        fail = false;
        break;
      }
    }
    if (fail && Object.values(edge).length > 0) {
      throw new Error("Failed to recover trail.");
    }
  }

  // Delete path points according to their associated angle and segment distances.
  while (true) {
    let maxIndex: number | null = null;
    let maxDot = -Infinity;
    for (let i = 0; i < path.length; i++) {
      const i0 = modulo(i - 1, path.length);
      const i1 = i;
      const i2 = modulo(i + 1, path.length);
      const p0 = path[i0];
      const p1 = path[i1];
      const p2 = path[i2];
      const p0p1 = vec2.sub(vec2.create(), p1 as vec2, p0 as vec2);
      const d01 = vec2.length(p0p1);
      vec2.scale(p0p1, p0p1, 1 / d01);
      const p1p2 = vec2.sub(vec2.create(), p2 as vec2, p1 as vec2);
      const d12 = vec2.length(p1p2);
      vec2.scale(p1p2, p1p2, 1 / d12);
      const dot = vec2.dot(p0p1, p1p2) / Math.max(d01, d12);
      if (dot > maxDot) {
        maxIndex = i1;
        maxDot = dot;
      }
    }
    if (maxIndex === null) {
      throw new Error("Null index");
    }
    if (maxDot < 0.1) {
      break;
    }
    path.splice(maxIndex, 1);
  }

  // Normalize the path. This is specific to this game arch, so might remove if/when making it a library.
  for (let i = 0; i < path.length; i++) {
    path[i][0] -= 0.5 * texture.image.width;
    path[i][1] -= 0.5 * texture.image.height;
    path[i][0] /= texture.image.width;
    path[i][1] /= texture.image.height;
  }

  return path;
}

function hasNeighbor(data: ImageData, x: number, y: number) {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      const px = x + dx;
      const py = y + dy;
      if (px < 0 || px >= data.width || py < 0 || py > data.height) {
        continue;
      }
      if (imageDataGet(data, px, py)[3] > 0) {
        return true;
      }
    }
  }
  return false;
}

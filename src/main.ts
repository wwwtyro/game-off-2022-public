import { vec2 } from "gl-matrix";
import { Renderer } from "./renderer";
import { loadResources, Texture } from "./resources";

async function main() {
  const resources = await loadingScreen();

  await generateOutline(resources["ship0"]);

  return;
  const canvas = document.getElementById("render-canvas") as HTMLCanvasElement;
  canvas.style.display = "block";
  const renderer = new Renderer(canvas, resources);

  while (true) {
    renderer.render();
    await animationFrame();
  }
}

function imageDataGet(data: ImageData, x: number, y: number) {
  const offset = 4 * (y * data.width + x);
  return [data.data[offset + 0], data.data[offset + 1], data.data[offset + 2], data.data[offset + 3]];
}

function imageDataSet(data: ImageData, x: number, y: number, value: number[]) {
  const offset = 4 * (y * data.width + x);
  data.data[offset + 0] = value[0];
  data.data[offset + 1] = value[1];
  data.data[offset + 2] = value[2];
  data.data[offset + 3] = value[3];
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

export function modulo(n: number, m: number) {
  return ((n % m) + m) % m;
}

async function generateOutline(texture: Texture) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = texture.image.width;
  canvas.height = texture.image.height;
  ctx.drawImage(texture.image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let sp = { x: Math.round(canvas.width / 2), y: 0 };
  let history: number[][] = [];
  while (true) {
    history.push([sp.x, sp.y]);
    const pixel = imageDataGet(imageData, sp.x, sp.y);
    if (pixel[3] > 0) {
      break;
    }
    if (history.length > 10000) {
      throw new Error("Failed to generate sprite outline.");
    }
    sp.y++;
  }

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

  canvas.style.margin = "auto";
  document.getElementById("center-container")?.appendChild(canvas);

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

  for (const point of Object.values(edge)) {
    imageDataSet(imageData, point[0], point[1], [255, 0, 0, 255]);
  }

  let current = Object.values(edge)[0];
  const trail: number[][] = [current];
  while (Object.values(edge).length > 0) {
    delete edge[current.toString()];
    let fail = true;
    for (const delta of deltas) {
      const test = edge[[current[0] + delta[0], current[1] + delta[1]].toString()];
      if (test !== undefined) {
        trail.push(test);
        current = test;
        fail = false;
        break;
      }
    }
    if (fail && Object.values(edge).length > 0) {
      throw new Error("Failed to recover trail.");
    }
  }

  for (const point of trail) {
    imageDataSet(imageData, point[0], point[1], [255, 255, 255, 255]);
    ctx.putImageData(imageData, 0, 0);
  }
  await animationFrame();

  while (true) {
    let maxIndex: number | null = null;
    let maxDot = -Infinity;
    for (let i = 0; i < trail.length; i++) {
      const i0 = modulo(i - 1, trail.length);
      const i1 = i;
      const i2 = modulo(i + 1, trail.length);
      const p0 = trail[i0];
      const p1 = trail[i1];
      const p2 = trail[i2];
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
    const deleted = trail[maxIndex];
    imageDataSet(imageData, deleted[0], deleted[1], [255, 0, 255, 255]);
    ctx.putImageData(imageData, 0, 0);
    // await animationFrame();
    trail.splice(maxIndex, 1);
  }

  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";
  for (let i = 0; i < trail.length; i++) {
    const j = modulo(i + 1, trail.length);
    ctx.moveTo(trail[i][0], trail[i][1]);
    ctx.lineTo(trail[j][0], trail[j][1]);
  }
  ctx.stroke();
  for (const point of trail) {
    ctx.fillRect(point[0] - 1, point[1] - 1, 3, 3);
  }
}

async function loadingScreen() {
  const loadingDiv = document.getElementById("loading")!;
  loadingDiv.style.display = "block";
  const resources = await loadResources((fraction: number) => {
    loadingDiv.innerText = `Loading ${Math.round(100 * fraction)}%`;
  });
  loadingDiv.style.display = "none";
  return resources;
}

function animationFrame() {
  return new Promise((accept) => {
    requestAnimationFrame(accept);
  });
}

main();

export {};

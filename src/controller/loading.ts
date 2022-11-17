import { Howl } from "howler";
import { vec2 } from "gl-matrix";
import { modulo } from "../util";

export async function loadingScreen() {
  const loadingDiv = document.getElementById("loading")!;
  loadingDiv.style.display = "block";
  const resources = await loadResources((fraction: number) => {
    loadingDiv.innerText = `Loading ${Math.round(100 * fraction)}%`;
  });
  loadingDiv.style.display = "none";
  return resources;
}

export type Resources = Awaited<ReturnType<typeof loadResources>>;

export interface Texture {
  original: HTMLImageElement;
  powerOfTwo: HTMLCanvasElement;
  powerOfTwoNormal: HTMLCanvasElement;
}

export interface Sprite {
  original: HTMLImageElement;
  powerOfTwo: HTMLCanvasElement;
  powerOfTwoNormal: HTMLCanvasElement;
  outline: vec2[];
  radius: number;
  scale: number;
  width: number;
  length: number;
}

export async function loadResources(callback: (fraction: number) => void) {
  const promises: Record<string, any> = {
    ship0: loadSprite("destroyer.png", "nn5.png", 0.5),
    ship1: loadSprite("blueshuttlenoweps.png", "cnormal.png", 0.35),
    core0: loadSprite("tribase-u1-d0.png", "st1normal.png", 3.0),
    sand0: loadTexture("Sand_001_COLOR.png", "Sand_001_NRM.png"),
    noise0: loadTexture("noise.jpg", "noise.jpg"),
    metal0: loadTexture("Metal_Plate_047_basecolor.jpg", "Metal_Plate_047_normal.jpg"),
    arrow0: loadTexture("orb-direction.png", "orb-direction.png"),
  };

  const total = Object.keys(promises).length;
  let sum = 0;

  for (const key of Object.keys(promises)) {
    promises[key] = promises[key].then((value: any) => {
      sum++;
      callback(sum / total);
      return value;
    });
  }

  await Promise.all(Object.values(promises));

  const results = {
    sprites: {
      ship0: (await promises["ship0"]) as Sprite,
      ship1: (await promises["ship1"]) as Sprite,
      core0: (await promises["core0"]) as Sprite,
    },
    textures: {
      sand0: (await promises["sand0"]) as Texture,
      noise0: (await promises["noise0"]) as Texture,
      metal0: (await promises["metal0"]) as Texture,
      arrow0: (await promises["arrow0"]) as Texture,
    },
    sounds: {
      music: new Howl({
        src: ["/static/2020-03-22_-_A_Simple_Chill_-_FesliyanStudios.com_-_David_Renda.mp3"],
        loop: true,
        volume: 0.25,
      }),
      shoot0: new Howl({ src: ["/static/shoot0.ogg"] }),
      hit0: new Howl({ src: ["/static/hit0.ogg"] }),
      explode0: new Howl({ src: ["/static/explode0.ogg"] }),
      click0: new Howl({ src: ["/static/click0.ogg"] }),
      powerup0: new Howl({ src: ["/static/powerup0.ogg"] }),
      powerup1: new Howl({ src: ["/static/powerup1.ogg"] }),
      engine0: new Howl({ src: ["/static/engine0.ogg"], loop: true }),
    },
  };

  return results;
}

function pot(original: HTMLImageElement) {
  const size = Math.max(original.width, original.height);
  let pot = 1;
  while (pot < size) {
    pot *= 2;
  }
  const powerOfTwo = document.createElement("canvas");
  powerOfTwo.width = powerOfTwo.height = pot;
  const ctx = powerOfTwo.getContext("2d")!;
  ctx.drawImage(original, 0, 0, pot, pot);
  return powerOfTwo;
}

function patchNormals(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let totalX = 0.0;
  let totalY = 0.0;
  let total = 0;
  for (let x = 0; x < canvas.width; x++) {
    for (let y = 0; y < canvas.height; y++) {
      const normal = imageDataGet(imageData, x, y);
      if (normal[3] < 127) {
        continue;
      }
      totalX += normal[0];
      totalY += normal[1];
      total++;
    }
  }
  const averageX = totalX / total;
  const averageY = totalY / total;
  const dx = Math.round(127.5 - averageX);
  const dy = Math.round(127.5 - averageY);
  for (let x = 0; x < canvas.width; x++) {
    for (let y = 0; y < canvas.height; y++) {
      const normal = imageDataGet(imageData, x, y);
      normal[0] += dx;
      normal[1] += dy;
      imageDataSet(imageData, x, y, normal);
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

async function loadTexture(url: string, urlNormal: string): Promise<Texture> {
  const [original, normal] = await Promise.all([loadImage(url), loadImage(urlNormal)]);

  const powerOfTwo = pot(original);
  const powerOfTwoNormal = pot(normal);

  const texture: Texture = {
    original,
    powerOfTwo,
    powerOfTwoNormal,
  };
  return texture;
}

async function loadSprite(url: string, urlNormal: string, scale: number): Promise<Sprite> {
  const [original, normal] = await Promise.all([loadImage(url), loadImage(urlNormal)]);

  const powerOfTwo = pot(original);
  const powerOfTwoNormal = pot(normal);
  patchNormals(powerOfTwoNormal);

  const outline = generateOutline(original);
  let radius = -Infinity;
  for (const point of outline) {
    point[0] *= scale;
    point[1] *= scale;
    radius = Math.max(radius, vec2.length(point));
  }
  const width = Math.max(...outline.map((p) => p[0])) - Math.min(...outline.map((p) => p[0]));
  const length = Math.max(...outline.map((p) => p[1])) - Math.min(...outline.map((p) => p[1]));

  const sprite: Sprite = {
    original,
    powerOfTwo,
    powerOfTwoNormal,
    outline,
    radius,
    scale,
    width,
    length,
  };
  return sprite;
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((accept, reject) => {
    const img = new Image();
    img.src = `/static/${url}`;
    img.onload = () => {
      accept(img);
    };
    img.onerror = () => {
      reject();
    };
  });
}

export function generateOutline(original: HTMLImageElement) {
  const operatingScale = 0.25;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = Math.round(operatingScale * original.width);
  canvas.height = Math.round(operatingScale * original.height);
  ctx.drawImage(original, 0, 0, canvas.width, canvas.height);

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

  // Scale path to original, non-optimized size.
  for (const p of path) {
    p[0] /= operatingScale;
    p[1] /= operatingScale;
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
    path[i][0] -= 0.5 * original.width;
    path[i][1] -= 0.5 * original.height;
    path[i][0] /= original.height;
    path[i][1] /= original.height;
    path[i][1] *= -1;
  }

  // Make it a full loop.
  path.push(path[0].slice());

  if (false) {
    ctx.strokeStyle = "white";
    for (let i = 0; i < path.length; i++) {
      const j = modulo(i + 1, path.length);
      ctx.moveTo(path[i][0] * original.height + 0.5 * original.width, path[i][1] * -original.height + 0.5 * original.height);
      ctx.lineTo(path[j][0] * original.height + 0.5 * original.width, path[j][1] * -original.height + 0.5 * original.height);
    }
    ctx.stroke();
    let index = 0;
    for (const point of path) {
      index++;
      ctx.fillStyle = "white";
      if (index === 0 || index === path.length - 1) {
        ctx.fillStyle = "red";
      }
      ctx.fillRect(
        point[0] * original.height + 0.5 * original.width - 1,
        point[1] * -original.height + 0.5 * original.height - 1,
        3,
        3
      );
    }
    document.body.appendChild(canvas);
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.zIndex = "2";
    throw new Error("debug stop");
  }

  return path as vec2[];
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

export function imageDataGet(data: ImageData, x: number, y: number) {
  const offset = 4 * (y * data.width + x);
  return [data.data[offset + 0], data.data[offset + 1], data.data[offset + 2], data.data[offset + 3]];
}

export function imageDataSet(data: ImageData, x: number, y: number, value: number[]) {
  const offset = 4 * (y * data.width + x);
  data.data[offset + 0] = value[0];
  data.data[offset + 1] = value[1];
  data.data[offset + 2] = value[2];
  data.data[offset + 3] = value[3];
}

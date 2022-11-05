import { generateOutline } from "./outline";

export type Resources = Awaited<ReturnType<typeof loadResources>>;

export interface Texture {
  original: HTMLImageElement;
  powerOfTwo: HTMLCanvasElement;
  outline?: number[][];
  scale: number;
}

export async function loadResources(callback: (fraction: number) => void) {
  const promises: Record<string, Promise<Texture>> = {
    ship0: loadTexture("RD3.png", 0.5, true),
    ship1: loadTexture("F5S4.png", 1.0, true),
  };

  const total = Object.keys(promises).length;
  let sum = 0;

  for (const key of Object.keys(promises)) {
    promises[key] = promises[key].then((value) => {
      sum++;
      callback(sum / total);
      return value;
    });
  }

  await Promise.all(Object.values(promises));

  const results: Record<string, Texture> = {};

  for (const key of Object.keys(promises)) {
    results[key] = await promises[key];
  }

  return results;
}

async function loadTexture(url: string, scale: number, outline: boolean): Promise<Texture> {
  const original = await loadImage(url);
  const size = Math.max(original.width, original.height);
  let pot = 1;
  while (pot < size) {
    pot *= 2;
  }
  const powerOfTwo = document.createElement("canvas");
  powerOfTwo.width = powerOfTwo.height = pot;
  const ctx = powerOfTwo.getContext("2d")!;
  ctx.drawImage(original, 0, 0, pot, pot);
  const texture: Texture = {
    original,
    powerOfTwo,
    scale,
  };
  if (outline) {
    texture.outline = generateOutline(texture);
    for (const point of texture.outline) {
      point[0] *= scale;
      point[1] *= scale;
    }
  }
  return texture;
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

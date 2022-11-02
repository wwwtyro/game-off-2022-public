export type Resources = Awaited<ReturnType<typeof loadResources>>;

interface Texture {
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
}

export async function loadResources(callback: (fraction: number) => void) {
  const promises: Record<string, Promise<Texture>> = {
    playerZero: loadTexture("RD3.png"),
    playerZeroNormal: loadTexture("RD3N.png"),
    ship0: loadTexture("F5S4.png"),
    ship0n: loadTexture("F5S4N.png"),
    enemyZero: loadTexture("tribase-u3-d0.png"),
    enemyZeroNormal: loadTexture("st3normal.png"),
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

async function loadTexture(url: string) {
  const img = await loadImage(url);
  const size = Math.max(img.width, img.height);
  let pot = 1;
  while (pot < size) {
    pot *= 2;
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = pot;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, pot, pot);
  return {
    width: img.width,
    height: img.height,
    canvas,
  };
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

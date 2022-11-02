export async function loadResources(callback: (fraction: number) => void) {
  const promises: Record<string, Promise<HTMLImageElement>> = {
    playerZero: loadSprite("RD3.png"),
    playerZeroNormal: loadSprite("RD3N.png"),
    enemyZero: loadSprite("tribase-u3-d0.png"),
    enemyZeroNormal: loadSprite("st3normal.png"),
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

  const results: Record<string, HTMLImageElement> = {};

  for (const key of Object.keys(promises)) {
    results[key] = await promises[key];
  }

  return results;
}

async function loadSprite(url: string) {
  return await loadImage(url);
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

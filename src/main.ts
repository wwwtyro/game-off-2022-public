import { Renderer } from "./renderer";
import { loadResources } from "./resources";

async function main() {
  const resources = await loadingScreen();
  const canvas = document.getElementById("render-canvas") as HTMLCanvasElement;
  canvas.style.display = "block";
  const renderer = new Renderer(canvas, resources);

  while (true) {
    renderer.render();
    await animationFrame();
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

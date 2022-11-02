import { loadResources } from "./resources";

async function main() {
  const resources = await loadingScreen();
}

async function loadingScreen() {
  const loadingDiv = document.getElementById("loading")!;
  loadingDiv.style.display = "block";
  const resources = await loadResources((fraction: number) => {
    loadingDiv.innerText = `Loading ${Math.round(100 * fraction)}%`;
  });
  // loadingDiv.style.display = "none";
  return resources;
}

main();

export {};

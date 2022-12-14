import RAPIER from "@dimforge/rapier2d-compat";
import { loadingScreen } from "./controller/loading";
import { mainMenu } from "./controller/main-menu";
import { setMenuResources } from "./controller/menu";

const version = localStorage.getItem("version");
if (version === null) {
  localStorage.clear();
  localStorage.setItem("version", "1");
  location.reload();
}

async function main() {
  await RAPIER.init();
  const resources = await loadingScreen();
  setMenuResources(resources);
  while (true) {
    await mainMenu(resources);
  }
}

main();

export {};

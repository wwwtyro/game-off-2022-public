import RAPIER from "@dimforge/rapier2d-compat";
import { loadingScreen } from "./controller/loading";
import { mainMenu } from "./controller/main-menu";
import { setMenuResources } from "./controller/menu";

async function main() {
  await RAPIER.init();
  const resources = await loadingScreen();
  setMenuResources(resources);
  await mainMenu(resources);
}

main();

export {};

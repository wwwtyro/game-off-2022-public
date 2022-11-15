import RAPIER from "@dimforge/rapier2d-compat";
import { loadingScreen } from "./controller/loading";
import { mainMenu } from "./controller/main-menu";

async function main() {
  await RAPIER.init();
  const resources = await loadingScreen();
  await mainMenu(resources);
}

main();

export {};

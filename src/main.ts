import RAPIER from "@dimforge/rapier2d-compat";
import { loadingScreen } from "./controller/loading";

async function main() {
  await RAPIER.init();
  await loadingScreen();
  console.log("game over");
}

main();

export {};

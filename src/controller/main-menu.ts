import { getPermanentUpgrades } from "../model/upgrades";
import { game } from "./game";
import { instructions } from "./instructions";
import { intro } from "./intro";
import { Resources } from "./loading";
import { MenuButton, Menu, MenuHTML, MenuUpgrades } from "./menu";
import { optionsMenu } from "./options-menu";
import { selectDrone } from "./select-drone";

export async function mainMenu(resources: Resources) {
  const menu = new Menu();
  menu.style.fontSize = "32px";
  menu.addItem(new MenuHTML(`<div style="text-align: center"><img src="static/title.png" class="title"></div>`));
  menu.addItem(
    new MenuButton("Play", async () => {
      menu.hide();
      resources.sounds.music.play();
      await intro();
      const selectedDrone = await selectDrone();
      await game(resources, selectedDrone);
      document.getElementById("render-canvas")!.style.display = "none";
      resources.sounds.music.stop();
      menu.show();
    })
  );
  menu.addItem(
    new MenuButton("Options", async () => {
      menu.hide();
      await optionsMenu(resources);
      menu.show();
    })
  );
  menu.addItem(
    new MenuButton("Instructions", async () => {
      menu.hide();
      await instructions();
      menu.show();
    })
  );
  menu.addItem(new MenuUpgrades(getPermanentUpgrades()));
  await menu.enter();
}

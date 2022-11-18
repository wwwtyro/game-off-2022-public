import { game } from "./game";
import { instructions } from "./instructions";
import { Resources } from "./loading";
import { MenuButton, Menu, MenuHTML } from "./menu";
import { optionsMenu } from "./options-menu";

export async function mainMenu(resources: Resources) {
  const menu = new Menu();
  menu.addItem(new MenuHTML(`<div style="text-align: center"><img src="static/title.png"></div>`));
  menu.addItem(
    new MenuButton("Play", async () => {
      menu.hide();
      const permanentUpgrades: string[] = JSON.parse(localStorage.getItem("permanentUpgrades") ?? JSON.stringify([]));
      resources.sounds.music.play();
      await game(resources, permanentUpgrades);
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
  await menu.enter();
}

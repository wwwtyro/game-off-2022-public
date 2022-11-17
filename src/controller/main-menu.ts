import { game } from "./game";
import { Resources } from "./loading";
import { MenuButton, Menu, MenuHTML } from "./menu";

export async function mainMenu(resources: Resources) {
  const menu = new Menu();
  menu.addItem(new MenuHTML(`<img src="/static/title.png">`));
  menu.addItem(
    new MenuButton("New Game", async () => {
      resources.sounds.click0.play();
      menu.hide();
      const permanentUpgrades: string[] = JSON.parse(localStorage.getItem("permanentUpgrades") ?? JSON.stringify([]));
      resources.sounds.music.play();
      await game(resources, permanentUpgrades);
      resources.sounds.music.stop();
      menu.show();
    })
  );
  await menu.enter();
}

import { Resources } from "./loading";
import { MenuButton, Menu, MenuHTML } from "./menu";

export async function loseGame(resources: Resources) {
  const menu = new Menu();
  menu.addItem(new MenuHTML(`<img src="static/died.png">`));
  menu.addItem(
    new MenuButton("Continue", async () => {
      resources.sounds.click0.play();
      menu.exit();
    })
  );
  await menu.enter();
}

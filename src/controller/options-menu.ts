import { Resources } from "./loading";
import { MenuButton, Menu, MenuHTML, MenuSlider } from "./menu";
import { resetGame } from "./reset-game";

export async function optionsMenu(resources: Resources) {
  const menu = new Menu();
  menu.style.background = "rgba(0, 0, 0, 0.5)";
  menu.style.borderRadius = "7px";
  menu.style.fontSize = "24px";
  menu.addItem(new MenuHTML(`<div style="text-align: center"><img src="static/options.png" height=96></div>`));
  menu.addItem(
    new MenuSlider("Master Volume", 0, 1, 0.01, Howler.volume(), (e) => {
      Howler.volume(parseFloat(e.target.value));
    })
  );
  menu.addItem(
    new MenuSlider("Music Volume", 0, 1, 0.01, resources.sounds.music.volume(), (e) => {
      resources.sounds.music.volume(parseFloat(e.target.value));
    })
  );
  menu.addItem(
    new MenuButton("Reset Game", async () => {
      menu.hide();
      await resetGame();
      menu.show();
    })
  );
  menu.addItem(
    new MenuButton("Back", () => {
      menu.exit();
    })
  );
  await menu.enter();
}

import { State } from "../model/model";
import { endGame } from "./end-game";
import { instructions } from "./instructions";
import { Resources } from "./loading";
import { MenuButton, Menu, MenuHTML, MenuSlider } from "./menu";

export async function inGameOptionsMenu(state: State, resources: Resources) {
  const menu = new Menu();
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
    new MenuButton("Instructions", async () => {
      menu.hide();
      await instructions();
      menu.show();
    })
  );
  menu.addItem(
    new MenuButton("Return To Game", () => {
      menu.exit();
    })
  );
  menu.addItem(
    new MenuButton("End Game", async () => {
      menu.hide();
      await endGame(state);
      if (state.player.armor < 0) {
        menu.exit();
      } else {
        menu.show();
      }
    })
  );
  await menu.enter();
}

import { State } from "../model/model";
import { MenuButton, Menu, MenuHTML } from "./menu";

export async function endGame(state: State) {
  const menu = new Menu();
  menu.addItem(new MenuHTML(`<div style="text-align: center; color: #FF0">Are you sure you want to exit the game?</div>`));
  menu.addItem(
    new MenuButton("Yes, do it!", () => {
      state.player.armor = -1;
      menu.exit();
    })
  );
  menu.addItem(
    new MenuButton("Wait, what? No don't do that!", () => {
      menu.exit();
    })
  );
  await menu.enter();
}

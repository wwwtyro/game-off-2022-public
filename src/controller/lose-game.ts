import { MenuButton, Menu, MenuHTML } from "./menu";

export async function loseGame() {
  const menu = new Menu();
  menu.addItem(new MenuHTML(`<img src="static/died.png">`));
  menu.addItem(
    new MenuButton("Continue", async () => {
      menu.exit();
    })
  );
  await menu.enter();
}

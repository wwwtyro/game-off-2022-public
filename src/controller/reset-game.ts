import { Resources } from "./loading";
import { MenuButton, Menu, MenuHTML, MenuSlider } from "./menu";

export async function resetGame(resources: Resources) {
  const menu = new Menu();
  menu.addItem(
    new MenuHTML(
      `<div style="text-align: center; color: #FF0">Are you sure you want to delete all your permanent upgrades and start over?</div>`
    )
  );
  menu.addItem(
    new MenuButton("Yes, do it!", () => {
      localStorage.clear();
      location.reload();
    })
  );
  menu.addItem(
    new MenuButton("Wait, what? No don't do that!", () => {
      menu.exit();
    })
  );
  await menu.enter();
}

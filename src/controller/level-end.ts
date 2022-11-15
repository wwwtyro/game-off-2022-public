import { State } from "../model/model";
import { getRandomUpgrades } from "../model/upgrades";
import { MenuButton, Menu, MenuHTML } from "./menu";

export async function levelEnd(state: State) {
  const selectedUpgrades = getRandomUpgrades(state.player, 3, false);
  const menu = new Menu();
  menu.style.background = "rgba(0, 0, 0, 0.75)";
  menu.style.border = "1px solid white";
  menu.style.borderRadius = "7px";
  menu.addItem(new MenuHTML("Select an upgrade to continue:"));
  for (const upgrade of selectedUpgrades) {
    menu.addItem(
      new MenuButton(
        upgrade.label,
        () => {
          upgrade.upgrade(state.player);
          menu.exit();
        },
        upgrade.icon,
        upgrade.color
      )
    );
  }
  await menu.enter();
}

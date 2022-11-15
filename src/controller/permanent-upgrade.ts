import { State } from "../model/model";
import { getRandomUpgrades } from "../model/upgrades";
import { MenuButton, Menu, MenuHTML } from "./menu";

export async function permanentUpgrade(state: State, permanentUpgrades: string[]) {
  const selectedUpgrades = getRandomUpgrades(state.player, 3, true);
  const menu = new Menu();
  menu.style.background = "rgba(0, 0, 0, 0.75)";
  menu.style.border = "1px solid white";
  menu.style.borderRadius = "7px";
  menu.addItem(new MenuHTML("Select a permanent upgrade to continue:"));
  for (const upgrade of selectedUpgrades) {
    menu.addItem(
      new MenuButton(
        upgrade.label,
        () => {
          upgrade.upgrade(state.player);
          permanentUpgrades.push(upgrade.label);
          localStorage.setItem("permanentUpgrades", JSON.stringify(permanentUpgrades));
          menu.exit();
        },
        upgrade.icon,
        upgrade.color
      )
    );
  }
  await menu.enter();
}

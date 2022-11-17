import { State } from "../model/model";
import { getRandomUpgrades } from "../model/upgrades";
import { Resources } from "./loading";
import { MenuButton, Menu, MenuHTML } from "./menu";

export async function levelEnd(state: State, resources: Resources) {
  const selectedUpgrades = getRandomUpgrades(state.player, 3, false);
  const menu = new Menu();
  menu.style.background = "rgba(0, 0, 0, 0.5)";
  menu.style.borderRadius = "7px";
  menu.style.fontSize = "24px";
  menu.addItem(new MenuHTML(`<div style="text-align: center"><img src="/static/upgrade.png" height=96></div>`));
  for (const upgrade of selectedUpgrades) {
    menu.addItem(
      new MenuButton(
        upgrade.label,
        () => {
          resources.sounds.click0.play();
          resources.sounds.powerup1.play();
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

import { State } from "../model/state";
import { getRandomUpgrades, upgradeDrone } from "../model/upgrades";
import { Resources } from "./loading";
import { Menu, MenuHTML, MenuUpgrades, MenuDOM, upgradeDom } from "./menu";

export async function levelEnd(state: State, resources: Resources) {
  const selectedUpgrades = getRandomUpgrades(state.player, 3);
  const menu = new Menu();
  menu.style.background = "rgba(0, 0, 0, 0.5)";
  menu.style.borderRadius = "7px";
  menu.style.fontSize = "24px";
  menu.addItem(new MenuHTML(`<div style="text-align: center"><img src="static/upgrade.png" class="title"></div>`));
  for (const upgrade of selectedUpgrades) {
    menu.addItem(
      new MenuDOM(upgradeDom(upgrade), () => {
        resources.sounds.powerup1.play();
        upgradeDrone(upgrade, state.player);
        menu.exit();
      })
    );
  }
  menu.addItem(new MenuUpgrades(state.player.tempUpgrades));
  await menu.enter();
}

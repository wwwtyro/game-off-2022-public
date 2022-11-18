import { getPermanentUpgrades, State } from "../model/model";
import { getRandomUpgrades, upgradeDrone } from "../model/upgrades";
import { Resources } from "./loading";
import { MenuButton, Menu, MenuHTML, MenuUpgrades } from "./menu";

export async function permanentUpgrade(state: State, resources: Resources) {
  const permanentUpgrades = getPermanentUpgrades();
  const selectedUpgrades = getRandomUpgrades(state.player, 3, true);
  const menu = new Menu();
  menu.style.background = "rgba(0, 0, 0, 0.5)";
  menu.style.borderRadius = "7px";
  menu.style.fontSize = "24px";
  menu.addItem(new MenuHTML(`<div style="text-align: center"><img src="static/permanent-upgrade.png" height=96></div>`));
  for (const upgrade of selectedUpgrades) {
    menu.addItem(
      new MenuButton(
        upgrade.label,
        () => {
          resources.sounds.click0.play();
          resources.sounds.powerup1.play();
          upgradeDrone(upgrade, state.player);
          permanentUpgrades.push(upgrade);
          localStorage.setItem("permanentUpgrades", JSON.stringify(permanentUpgrades.map((u) => u.label)));
          menu.exit();
        },
        upgrade.icon,
        upgrade.color
      )
    );
  }
  menu.addItem(new MenuUpgrades(permanentUpgrades));
  await menu.enter();
}

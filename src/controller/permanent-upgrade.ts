import { State } from "../model/state";
import { getPermanentUpgrades, getRandomUpgrades, upgradeDrone } from "../model/upgrades";
import { Resources } from "./loading";
import { Menu, MenuHTML, MenuUpgrades, MenuDOM, upgradeDom } from "./menu";

export async function permanentUpgrade(state: State, resources: Resources) {
  const permanentUpgrades = getPermanentUpgrades();
  const selectedUpgrades = getRandomUpgrades(state.player, 3, true);
  const menu = new Menu();
  menu.addItem(
    new MenuHTML(`<div style="text-align: center"><img src="static/permanent-upgrade.png" class="title" width=256></div>`)
  );
  for (const upgrade of selectedUpgrades) {
    menu.addItem(
      new MenuDOM(upgradeDom(upgrade), () => {
        resources.sounds.powerup1.play();
        upgradeDrone(upgrade, state.player);
        permanentUpgrades.push(upgrade);
        localStorage.setItem("permanentUpgrades", JSON.stringify(permanentUpgrades.map((u) => u.id)));
        state.newPermanentUpgrades.push(upgrade);
        menu.exit();
      })
    );
  }
  menu.addItem(new MenuUpgrades(permanentUpgrades));
  await menu.enter();
}

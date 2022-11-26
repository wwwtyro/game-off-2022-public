import { upgrades } from "../model/upgrades";
import { MenuButton, Menu, MenuHTML, MenuDOM, upgradeDom } from "./menu";

export async function instructions() {
  const menu = new Menu();
  menu.addItem(
    new MenuHTML(`
    <div style="text-align: center; color: #FF0">Instructions</div>
    <div style="font-family: 'Electrolize', sans-serif; font-size: 18px; font-weight: normal">
      <p>Use WASD, arrow keys, mouse, or touch to steer your drone.</p>

      <p>Follow the indicators on the edge of your screen to the enemy drones.</p>

      <p>Your drone will automatically point and shoot at nearby enemies.</p>

      <p>At the end of each level, select an upgrade. Sometimes, you'll be offered a permanent upgrade.
      Permanent upgrades are applied when selected and at the beginning of all following games.</p>

      <p>Defeat 100 levels to win the game.</p>
    </div>
  `)
  );
  menu.addItem(new MenuHTML(`<div style='color: yellow; text-align: center'>Upgrade Descriptions</div>`));
  for (const upgrade of upgrades) {
    menu.addItem(new MenuDOM(upgradeDom(upgrade)));
  }
  menu.addItem(
    new MenuButton("Back", () => {
      menu.exit();
    })
  );
  await menu.enter();
}

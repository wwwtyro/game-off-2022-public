import { State } from "../model/state";
import { MenuButton, Menu, MenuHTML, MenuUpgrades } from "./menu";

export async function loseGame(state: State) {
  const menu = new Menu();
  menu.addItem(
    new MenuHTML(`
    <div style="text-align: center"><img src="static/died.png" class="title"></div>
    <p style="font-family: 'Electrolize', sans-serif; font-size: 21px; font-weight: normal">
      While this iteration of your artificial being has been obliterated, you may 
      rest easy knowing that you will simply be reborn on Earth, better than ever, and
      launched again towards the alien menace.
    </p>
  `)
  );
  menu.addItem(new MenuHTML('<div style="text-align: center">New Permanent Upgrades</div>'));
  menu.addItem(new MenuUpgrades(state.newPermanentUpgrades));
  menu.addItem(
    new MenuButton("Continue", async () => {
      menu.exit();
    })
  );
  await menu.enter();
}

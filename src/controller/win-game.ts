import { State } from "../model/state";
import { MenuButton, Menu, MenuHTML, MenuUpgrades } from "./menu";

export async function winGame(state: State) {
  const menu = new Menu();
  menu.addItem(
    new MenuHTML(`
    <div style="text-align: center"><img src="static/victory.png" class="title"></div>
    <p style="font-family: 'Electrolize', sans-serif; font-size: 21px; font-weight: normal">
      At last, you've defeated the alien threat. Explosions begin to rock the massive vessel,
      rapidly reaching a crescendo of annihilation. Belatedly, you realize your engineers never
      provided you with the means to return home.
    </p>
    <p style="font-family: 'Electrolize', sans-serif; font-size: 21px; font-weight: normal">
      In a mild, artificial panic, you reach out for instructions. After a long pause, you receive
      a response:
    </p>
    <p style="font-family: 'Electrolize', sans-serif; font-size: 21px; font-weight: normal; font-style: italic; color: yellow; width: 75%; text-align: center; margin: auto">
      Thank you for your service. What you have accomplished will help defend our planet from the
      newly-discovered alien vessels approaching our planet even now. You will not be forgotten.
    </p>
  `)
  );
  if (state.newPermanentUpgrades.length > 0) {
    menu.addItem(new MenuHTML('<div style="text-align: center">New Permanent Upgrades</div>'));
    menu.addItem(new MenuUpgrades(state.newPermanentUpgrades));
  }
  menu.addItem(
    new MenuButton("Continue", async () => {
      menu.exit();
    })
  );
  await menu.enter();
}

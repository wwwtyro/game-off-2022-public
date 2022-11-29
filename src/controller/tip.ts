import { randomChoice } from "../util";
import { MenuButton, Menu, MenuHTML } from "./menu";

const tips = [
  "You'll start off very weak, die early and a lot, but you will become exponentially more powerful as you collect permanent upgrades across multiple runs.",
  "The rate at which you collect permanent upgrades increases as you collect more permanent upgrades.",
  "Droid beams are 1/10th as powerful as yours, but you can have more than ten of them.",
  "<span style='color: #F0F; font-weight: bold;'>Special beam upgrades</span> such as <span style='color: #F0F; font-weight: bold;'>Stun</span> and <span style='color: #F0F; font-weight: bold;'>Richochet</span> also apply to droid beams.",
  "Armor upgrades provide more defense than shield upgrades, but armor must be repaired by spending an upgrade while shields recharge automatically.",
  "It's a good idea to balance your upgrades. If you have ten power upgrades and one firing rate upgrade, taking another power upgrade will increase your DPS by 10%, but taking another firing rate upgrade will increase it by 100%.",
  "Many upgrades have limits. If you reach those limits, they will not consume space on your upgrade lottery.",
  "Missiles are ten times more powerful than beams and fire 1/10th as frequently for the same number of upgrades, but they do not need to be aimed and they have a 50% greater targeting range.",
  "There are limits to the number of times some upgrades can be taken, but those can be exceeded with the proper special drone unlocked. For example, the Fleet Drone can have a total of 48 droids, but 32 is the normal limit.",
  "The most common way to die is by approaching an enemy core carelessly and head-on.",
  "Droid firing range is the same as yours, but since they flit about in a cloud around you at some distance, they can extend your range.",
  "Droids are too small to be effectively targeted by the enemy, so they never take damage.",
  "Some enemy drones have shields that recharge too quickly to be overcome, but the cores have no shields, and all subordinate drones of a core will be destroyed when the core is destroyed.",
  "Enemy cores have no weapons.",
  "Enemy cores have no shields, so they can always eventually be destroyed.",
  "Enemy drones blow up shortly after their their parent core is destroyed.",
  "If you're having trouble hitting enemy drones with your beams, try getting a Rotation Speed upgrade.",
  "<span style='color: #F0F; font-weight: bold;'>Special upgrades</span> such as <span style='color: #F0F; font-weight: bold;'>Ricochet</span> and <span style='color: #F0F; font-weight: bold;'>Splash</span> cannot be made permanent.",
  "You have a one in ten chance of getting a permanent upgrade after each level.",
  "The instructions panel lists all available upgrades.",
  "You should probably always take any <span style='color: #F0F; font-weight: bold;'>special upgrades</span> you're offered.",
  "The Repair Armor upgrade only shows up in the lottery if your armor is damaged.",
  "All unlocked drones come with at least one <span style='color: #F0F; font-weight: bold;'>special upgrade</span>.",
];

export async function tip() {
  const menu = new Menu();
  const tip = randomChoice(tips);
  if (!tip) {
    menu.exit();
  }
  menu.addItem(
    new MenuHTML(
      `<div style="text-align: center; font-style: italic; margin-bottom: 32px"><span style="color: yellow;">Tip</span>: ${tip}</div>`
    )
  );
  menu.addItem(
    new MenuButton("Continue", () => {
      menu.exit();
    })
  );
  await menu.enter();
}

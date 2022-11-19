import { playerDrones } from "../model/player-drones";
import { Menu, MenuHTML } from "./menu";

export async function selectDrone() {
  const menu = new Menu();
  menu.style.background = "rgba(0, 0, 0, 0.75)";
  menu.style.borderRadius = "7px";
  menu.style.fontSize = "24px";

  let selectedDrone = playerDrones[0];
  menu.addItem(new MenuHTML(`<div style="text-align: center"><img src="static/select-drone.png" class="title"></div>`));
  for (const drone of playerDrones) {
    menu.addItem(
      new MenuHTML(
        `
      <div style="text-align: center; margin-bottom: 16px">
        <img src="${drone.url}" width=128 style="${drone.available() ? "" : "filter: saturate(0%)"}"><br>
        ${drone.name}<br>
        <span style="font-size:50%;">${drone.available() ? "Unlocked" : drone.unlock}</span>
      </div>
    `,
        drone.available()
          ? () => {
              selectedDrone = drone;
              menu.exit();
            }
          : undefined
      )
    );
  }
  await menu.enter();
  return selectedDrone;
}

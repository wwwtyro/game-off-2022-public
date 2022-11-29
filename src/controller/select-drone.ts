import { playerDrones } from "../model/player-drones";
import { cloneCanvas } from "../util";
import { Resources, Sprite } from "./loading";
import { Menu, MenuDOM, MenuHTML, upgradeListDom } from "./menu";

export async function selectDrone(resources: Resources) {
  const menu = new Menu();
  menu.style.fontSize = "24px";

  let selectedDrone = playerDrones[0];
  menu.addItem(new MenuHTML(`<div style="text-align: center"><img src="static/select-drone.png" class="title"></div>`));
  for (const drone of playerDrones) {
    const container = document.createElement("div");
    container.style.textAlign = "center";
    container.style.marginBottom = "32px";
    if (!drone.available()) {
      container.style.filter = "grayscale(100%) brightness(200%) brightness(70%) sepia(100%)";
    }
    const droneImage = cloneCanvas((resources.sprites as Record<string, Sprite>)[drone.spriteId].albedo.original);
    droneImage.style.width = "128px";
    const droneName = document.createElement("div");
    droneName.innerText = drone.name;
    const upgrades = document.createElement("div");
    upgrades.style.display = "flex";
    upgrades.style.justifyContent = "center";
    const upgradeList = upgradeListDom(drone.getUpgrades(), false);
    upgradeList.style.marginTop = "0px";
    upgrades.appendChild(upgradeList);
    const unlock = document.createElement("div");
    unlock.style.fontSize = "50%";
    unlock.innerText = "Available";
    if (!drone.available()) {
      unlock.innerText = drone.unlock;
    }

    container.appendChild(droneImage);
    container.appendChild(droneName);
    container.appendChild(unlock);
    container.appendChild(upgrades);

    menu.addItem(
      new MenuDOM(
        container,
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

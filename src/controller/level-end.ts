import { State } from "../model/model";
import { getRandomUpgrades } from "../model/upgrades";
import { animationFrame } from "../util";

export async function levelEnd(state: State) {
  const div = document.getElementById("center-content")!;
  div.innerHTML = "";
  div.style.display = "flex";
  div.style.flexDirection = "column";
  div.style.justifyContent = "center";
  div.style.rowGap = "16px";
  const title = document.createElement("div");
  title.innerText = "Select an upgrade to continue.";
  div.appendChild(title);
  const selectedUpgrades = getRandomUpgrades(state.player, 3);

  let done = false;

  for (const upgrade of selectedUpgrades) {
    const upgradeDiv = document.createElement("div");
    upgradeDiv.classList.add("upgrade");
    upgradeDiv.innerHTML = `
      <img src="/static/${upgrade.icon}" style="vertical-align: middle; margin-right: 32px" class="${upgrade.color}" width=64>
      ${upgrade.label}
    `;
    upgradeDiv.onclick = () => {
      upgrade.upgrade(state.player);
      done = true;
    };
    div.appendChild(upgradeDiv);
  }

  while (!done) {
    await animationFrame();
  }
  div.style.display = "none";
}

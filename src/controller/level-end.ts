import { State } from "../model/model";
import { Upgrade, upgrades } from "../model/upgrades";
import { animationFrame } from "../util";

function randomUpgrade(availableUpgrades: Upgrade[]) {
  availableUpgrades = availableUpgrades.slice();
  availableUpgrades.sort((a, b) => a.frequency - b.frequency);
  const totalFrequency = availableUpgrades.reduce((previous: number, current: Upgrade) => previous + current.frequency, 0);
  const randomIndex = totalFrequency * Math.random();
  let sum = 0;
  for (const upgrade of availableUpgrades) {
    if (randomIndex < sum + upgrade.frequency) {
      return upgrade;
    }
    sum += upgrade.frequency;
  }
  return null;
}

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
  let availableUpgrades = upgrades.filter((u) => u.available(state.player));
  const selectedUpgrades: Upgrade[] = [];
  for (let i = 0; i < 3; i++) {
    const selectedUpgrade = randomUpgrade(availableUpgrades);
    if (selectedUpgrade !== null) {
      availableUpgrades = availableUpgrades.filter((u) => u !== selectedUpgrade);
      selectedUpgrades.push(selectedUpgrade);
    }
  }

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

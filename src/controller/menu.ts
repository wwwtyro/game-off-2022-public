import { Upgrade } from "../model/upgrades";
import { animationFrame, cloneCanvas } from "../util";
import { Resources } from "./loading";

let resources: Resources;

export function setMenuResources(res: Resources) {
  resources = res;
}

function getIcon(id: string) {
  const original = (resources.icons as Record<string, HTMLCanvasElement>)[id];
  return cloneCanvas(original);
}

type Callback = (event?: any) => void | Promise<void>;

export function upgradeDom(upgrade: Upgrade) {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.alignItems = "center";
  const icon = getIcon(upgrade.icon);
  icon.style.width = icon.style.height = "48px";
  const textContainer = document.createElement("div");
  textContainer.style.marginLeft = "8px";
  const title = document.createElement("div");
  title.style.fontSize = "18px";
  title.style.marginBottom = "4px";
  title.innerText = upgrade.label;
  const description = document.createElement("div");
  description.style.fontSize = "12px";
  description.innerText = `${upgrade.description} Max: ${upgrade.max === Infinity ? "∞" : upgrade.max}`;
  container.appendChild(icon);
  container.appendChild(textContainer);
  textContainer.appendChild(title);
  textContainer.appendChild(description);
  return container;
}

class MenuItem {
  protected div: HTMLElement = document.createElement("div");
  protected disposer?: () => void;

  public get element() {
    return this.div;
  }

  public dispose() {
    if (this.disposer !== undefined) {
      this.disposer();
    }
  }
}

export class MenuHTML extends MenuItem {
  constructor(html: string, callback?: Callback) {
    super();
    this.div.innerHTML = html;
    if (callback) {
      this.div.style.cursor = "pointer";
      this.div.addEventListener("click", () => {
        resources.sounds.click0.play();
        callback();
      });
      this.disposer = () => {
        this.div.removeEventListener("click", callback);
      };
    }
  }
}

export class MenuDOM extends MenuItem {
  constructor(dom: HTMLElement, callback?: Callback) {
    super();
    this.div.appendChild(dom);
    if (callback) {
      this.div.style.cursor = "pointer";
      this.div.addEventListener("click", () => {
        resources.sounds.click0.play();
        callback();
      });
      this.disposer = () => {
        this.div.removeEventListener("click", callback);
      };
    }
  }
}

export class MenuButton extends MenuItem {
  constructor(private text: string, private callback: Callback) {
    super();
    this.div.innerHTML = `<span class='menubutton'>${this.text}</span>`;
    this.div.style.textAlign = "center";
    this.div.style.cursor = "pointer";
    this.div.addEventListener("click", () => {
      resources.sounds.click0.play();
      this.callback();
    });
    this.disposer = () => {
      this.div.removeEventListener("click", this.callback);
    };
  }
}

export class MenuSlider extends MenuItem {
  constructor(text: string, min: number, max: number, step: number, value: number, callback: Callback) {
    super();
    this.div.style.display = "flex";
    this.div.style.alignItems = "center";
    this.div.style.justifyContent = "space-between";
    const textSpan = document.createElement("span");
    textSpan.innerText = text;
    this.div.appendChild(textSpan);
    const slider = document.createElement("input");
    slider.style.marginLeft = "16px";
    slider.type = "range";
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step.toString();
    slider.value = value.toString();
    slider.addEventListener("input", callback);
    this.disposer = () => {
      slider.removeEventListener("input", callback);
    };
    this.div.appendChild(slider);
  }
}

export function upgradeListDom(upgrades: Upgrade[], showMax: boolean) {
  const container = document.createElement("div");
  upgrades.sort((a, b) => (a.frequency > b.frequency ? -1 : 1));
  const upgradeCount = new Map<Upgrade, number>();
  for (const upgrade of upgrades) {
    if (!upgradeCount.has(upgrade)) {
      upgradeCount.set(upgrade, 0);
    }
    upgradeCount.set(upgrade, upgradeCount.get(upgrade)! + 1);
  }
  container.style.margin = "auto";
  container.style.marginTop = "16px";
  container.style.display = "flex";
  container.style.justifyContent = "center";
  container.style.flexWrap = "wrap";
  container.style.width = `${48 * 6}px`;
  for (const [upgrade, count] of upgradeCount.entries()) {
    const div = document.createElement("div");
    div.style.display = "block";
    div.style.textAlign = "center";
    div.style.margin = "8px";
    div.title = `${upgrade.label}: ${upgrade.description}`;
    container.appendChild(div);
    const icon = getIcon(upgrade.icon);
    icon.style.width = "32px";
    icon.style.marginBottom = "-8px";
    div.appendChild(icon);
    const countDiv = document.createElement("div");
    if (showMax) {
      countDiv.innerText = `${count}/${upgrade.max === Infinity ? "∞" : upgrade.max}`;
    } else {
      countDiv.innerText = `${count}`;
    }
    countDiv.style.textAlign = "center";
    countDiv.style.color = "#FFF";
    countDiv.style.fontSize = "12px";
    countDiv.style.fontWeight = "bolder";
    div.appendChild(countDiv);
  }
  return container;
}

export class MenuUpgrades extends MenuItem {
  constructor(upgrades: Upgrade[]) {
    super();
    this.div = upgradeListDom(upgrades, true);
  }
}

export class Menu {
  private items: MenuItem[] = [];
  private div: HTMLDivElement;
  private exitFlag = false;

  constructor() {
    this.div = document.createElement("div");
    this.div.classList.add("center-content");
    document.getElementById("center-container")?.appendChild(this.div);
    this.hide();
  }

  public show() {
    this.div.style.display = "flex";
  }

  public hide() {
    this.div.style.display = "none";
  }

  public get style() {
    return this.div.style;
  }

  public addItem(item: MenuItem) {
    this.items.push(item);
  }

  public async enter() {
    for (const item of this.items) {
      this.div.appendChild(item.element);
    }
    this.show();
    while (!this.exitFlag) {
      await animationFrame();
    }
  }

  public exit() {
    this.items.forEach((i) => i.dispose());
    this.div.parentElement?.removeChild(this.div);
    this.exitFlag = true;
  }
}

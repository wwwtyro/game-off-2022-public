import { Upgrade } from "../model/upgrades";
import { animationFrame } from "../util";
import { Resources } from "./loading";

let resources: Resources;

export function setMenuResources(res: Resources) {
  resources = res;
}

type Callback = (event?: any) => void | Promise<void>;

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

export class MenuButton extends MenuItem {
  constructor(private text: string, private callback: Callback, private icon?: string, private iconClass?: string) {
    super();
    if (this.icon && this.iconClass) {
      this.div.innerHTML = `
        <div style="display: inline-block; margin-right: 8px; vertical-align: middle; width: 48px; height: 48px;">
          <img src="static/${this.icon}" class="${this.iconClass}" width=48>
        </div>
      
        <span class='menubutton'>${this.text}</span>
      `;
      this.div.style.textAlign = "left";
    } else {
      this.div.innerHTML = `<span class='menubutton'>${this.text}</span>`;
      this.div.style.textAlign = "center";
    }
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

export function upgradeHTML(upgrades: Upgrade[]) {
  const container = document.createElement("div");
  upgrades.sort((a, b) => (a.color > b.color ? -1 : 1));
  const upgradeCount = new Map<Upgrade, number>();
  for (const upgrade of upgrades) {
    if (!upgradeCount.has(upgrade)) {
      upgradeCount.set(upgrade, 0);
    }
    upgradeCount.set(upgrade, upgradeCount.get(upgrade)! + 1);
  }
  container.style.margin = "auto";
  container.style.display = "flex";
  container.style.justifyContent = "center";
  container.style.flexWrap = "wrap";
  container.style.width = `${48 * 5}px`;
  for (const [upgrade, count] of upgradeCount.entries()) {
    const div = document.createElement("div");
    div.style.display = "block";
    div.style.position = "relative";
    div.style.margin = "8px";
    container.appendChild(div);
    const img = document.createElement("img");
    img.src = `static/${upgrade.icon}`;
    img.classList.add(upgrade.color);
    img.width = 32;
    img.title = upgrade.label;
    div.appendChild(img);
    const countDiv = document.createElement("div");
    countDiv.innerText = `${count}`;
    countDiv.style.color = "#FFF";
    countDiv.style.fontSize = "12px";
    countDiv.style.fontWeight = "bolder";
    countDiv.style.textShadow = "1px 1px 0px #000";
    countDiv.style.display = "inline-block";
    countDiv.style.position = "absolute";
    countDiv.style.bottom = "0";
    countDiv.style.right = "0";
    div.appendChild(countDiv);
  }
  return container;
}

export class MenuUpgrades extends MenuItem {
  constructor(upgrades: Upgrade[]) {
    super();
    this.div = upgradeHTML(upgrades);
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

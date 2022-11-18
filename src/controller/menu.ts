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
  constructor(html: string) {
    super();
    this.div.innerHTML = html;
  }
}

export class MenuButton extends MenuItem {
  constructor(private text: string, private callback: Callback, private icon?: string, private iconClass?: string) {
    super();
    if (this.icon && this.iconClass) {
      this.div.innerHTML = `
        <img src="static/${this.icon}" style="vertical-align: middle; margin-right: 32px" class="${this.iconClass}" width=64>
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
    const textSpan = document.createElement("span");
    textSpan.innerText = text;
    this.div.appendChild(textSpan);
    const slider = document.createElement("input");
    slider.style.marginLeft = "16px";
    slider.style.float = "right";
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

export class Menu {
  private items: MenuItem[] = [];
  private div: HTMLDivElement;
  private exitFlag = false;

  constructor() {
    this.div = document.createElement("div");
    this.div.classList.add("center-content");
    document.getElementById("center-container")?.appendChild(this.div);
    this.style.background = "rgba(0, 0, 0, 0.5)";
    this.style.borderRadius = "7px";
    this.style.fontSize = "24px";
    this.style.maxWidth = "75%";
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

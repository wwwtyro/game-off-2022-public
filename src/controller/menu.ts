import { animationFrame } from "../util";

type Callback = () => void | Promise<void>;

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
      this.div.innerHTML = `<img src="/static/${this.icon}" style="vertical-align: middle; margin-right: 32px" class="menuicon ${this.iconClass}" width=64>${text}`;
      this.div.style.textAlign = "left";
    } else {
      this.div.innerText = `${this.text}`;
      this.div.style.textAlign = "center";
    }
    this.div.style.cursor = "pointer";
    this.div.addEventListener("click", this.callback);
    this.disposer = () => {
      this.div.removeEventListener("click", this.callback);
    };
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

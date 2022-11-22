export interface EventHandler {
  target: HTMLElement | Window;
  event: keyof HTMLElementEventMap;
  handler: (...args: any[]) => any;
}

export class EventManager {
  private handlers: EventHandler[] = [];

  public addEventListener(target: HTMLElement | Window, event: keyof HTMLElementEventMap, handler: (...args: any[]) => any) {
    this.handlers.push({
      target,
      event,
      handler,
    });
    target.addEventListener(event, handler);
  }

  public dispose() {
    for (const handler of this.handlers) {
      handler.target.removeEventListener(handler.event, handler.handler);
    }
  }
}

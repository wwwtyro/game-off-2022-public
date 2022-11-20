import { vec2 } from "gl-matrix";
import { Sprite } from "../controller/loading";
import { Drone } from "./drone";

export interface Droid {
  parent: Drone;
  sprite: Sprite;
  offset: vec2;
  position: vec2;
  rotation: number;
  targetRotation: number;
  ionCannonLastFired: number;
}

export function createDroid(parent: Drone): Droid {
  if (!parent.droidSprite) {
    throw new Error("Droid sprite not found.");
  }
  return {
    parent,
    sprite: parent.droidSprite,
    position: vec2.clone(parent.position),
    offset: vec2.random(vec2.create(), 1 * Math.random()),
    rotation: 0,
    targetRotation: 0,
    ionCannonLastFired: 0,
  };
}

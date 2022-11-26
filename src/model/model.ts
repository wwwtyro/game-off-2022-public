import { vec2 } from "gl-matrix";
import { Drone } from "./drone";

export type Team = "player" | "enemy";

export interface Missile {
  position: vec2;
  velocity: vec2;
  target: Drone;
  parent: Drone;
  timestamp: number;
}

export interface Beam {
  position: vec2;
  lastPosition: vec2;
  direction: vec2;
  velocity: number;
  timestamp: number;
  power: number;
  team: Team;
}

export type SparkSource = "armor" | "shields";

export interface Spark {
  position: vec2;
  lastPosition: vec2;
  direction: vec2;
  velocity: number;
  decay: number;
  source: SparkSource;
}

export interface Flame {
  position: vec2;
  scale: number;
  age: number;
}

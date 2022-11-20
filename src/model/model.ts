import { vec2 } from "gl-matrix";

export type Team = "player" | "enemy";

export interface Beam {
  position: vec2;
  lastPosition: vec2;
  direction: vec2;
  velocity: number;
  timestamp: number;
  power: number;
  team: Team;
}

export interface Spark {
  position: vec2;
  lastPosition: vec2;
  direction: vec2;
  velocity: number;
  energy: number;
  decay: number;
  smokey: boolean;
  source: "armor" | "shields";
}

export interface Flame {
  position: vec2;
  age: number;
}

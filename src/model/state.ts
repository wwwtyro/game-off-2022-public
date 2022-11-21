import RAPIER from "@dimforge/rapier2d-compat";
import { vec2 } from "gl-matrix";
import { Resources, Sprite } from "../controller/loading";
import { Drone, createDrone } from "./drone";
import { Beam, Spark, Flame, Missile } from "./model";
import { PlayerDrone } from "./player-drones";
import { getPermanentUpgrades, upgradeDrone } from "./upgrades";

export interface State {
  time: {
    last: number;
    now: number;
    dt: number;
  };
  world: RAPIER.World;
  camera: {
    position: vec2;
    fov: number;
    shake: number;
  };
  player: Drone;
  missiles: Missile[];
  enemies: Drone[];
  beams: Beam[];
  sparks: Spark[];
  flames: Flame[];
  keys: Record<string, boolean>;
  level: number;
  levelEndTimestamp: number | null;
}

export function buildState(resources: Resources, playerDrone: PlayerDrone): State {
  const world = new RAPIER.World({ x: 0, y: 0 });

  const state = {
    time: {
      last: 0,
      now: 0,
      dt: 0,
    },
    world,
    camera: {
      position: vec2.fromValues(0, 0),
      fov: 2,
      shake: 0,
    },
    player: createDrone(world, (resources.sprites as Record<string, Sprite>)[playerDrone.spriteId]),
    missiles: [],
    enemies: [],
    beams: [],
    sparks: [],
    flames: [],
    keys: {},
    level: 1,
    levelEndTimestamp: null,
  };

  state.player.armor = 5;
  state.player.maxArmor = 5;
  state.player.droidSprite = resources.sprites.playerDroid00;
  for (const upgrade of getPermanentUpgrades()) {
    upgradeDrone(upgrade, state.player);
  }
  for (const upgrade of playerDrone.getUpgrades()) {
    upgradeDrone(upgrade, state.player);
  }

  state.player.team = "player";

  return state;
}

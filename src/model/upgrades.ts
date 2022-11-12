import { State } from "./model";

export interface Upgrade {
  readonly label: string;
  readonly icon: string;
  readonly color: string;
  readonly frequency: number;
  readonly available: (state: State) => boolean;
  readonly upgrade: (state: State) => void;
}

const weaponColor = "filter-weapon";

export const upgrades: Upgrade[] = [
  {
    label: "Laser Firing Rate",
    icon: "laser-warning.svg",
    color: weaponColor,
    frequency: 1,
    available: (state: State) => {
      return state.player.firingRate < 30;
    },
    upgrade: (state: State) => {
      state.player.firingRate++;
    },
  },
  {
    label: "Laser Power",
    icon: "laser-blast.svg",
    color: weaponColor,
    frequency: 1,
    available: (_state: State) => {
      return true;
    },
    upgrade: (state: State) => {
      state.player.weaponPower++;
    },
  },
  {
    label: "Additional Laser",
    icon: "laser-turret.svg",
    color: weaponColor,
    frequency: 0.1,
    available: (state: State) => {
      return state.player.lasers < 10;
    },
    upgrade: (state: State) => {
      state.player.lasers++;
    },
  },
  {
    label: "Particle Beam Speed",
    icon: "laser-precision.svg",
    color: weaponColor,
    frequency: 1,
    available: (state: State) => {
      return state.player.beamSpeed < 10;
    },
    upgrade: (state: State) => {
      state.player.beamSpeed++;
    },
  },
];

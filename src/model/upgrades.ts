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
    icon: "laser-turret.svg",
    color: weaponColor,
    frequency: 1,
    available: (state: State) => {
      if (state.player.firingRate < 30) {
        return true;
      }
      return false;
    },
    upgrade: (state: State) => {
      state.player.firingRate++;
    },
  },
  {
    label: "Laser Power",
    icon: "laser-warning.svg",
    color: weaponColor,
    frequency: 1,
    available: (state: State) => {
      return true;
    },
    upgrade: (state: State) => {
      state.player.weaponPower++;
    },
  },
];

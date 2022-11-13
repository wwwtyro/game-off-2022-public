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
const shipColor = "filter-ship";
const armorColor = "filter-armor";
const shieldColor = "filter-shields";

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
  {
    label: "Rotation Speed",
    icon: "clockwise-rotation.svg",
    color: shipColor,
    frequency: 1,
    available: (state: State) => {
      return state.player.turningSpeed < 30;
    },
    upgrade: (state: State) => {
      state.player.turningSpeed++;
    },
  },
  {
    label: "Acceleration",
    icon: "speedometer.svg",
    color: shipColor,
    frequency: 1,
    available: (state: State) => {
      return state.player.acceleration < 5;
    },
    upgrade: (state: State) => {
      state.player.acceleration++;
    },
  },
  {
    label: "Increase Armor",
    icon: "armor-upgrade.svg",
    color: armorColor,
    frequency: 1,
    available: () => true,
    upgrade: (state: State) => {
      state.player.maxArmor += 1;
      state.player.armor += 1;
    },
  },
  {
    label: "Repair Armor",
    icon: "mighty-spanner.svg",
    color: armorColor,
    frequency: 1,
    available: (state: State) => state.player.armor < state.player.maxArmor,
    upgrade: (state: State) => {
      state.player.armor = state.player.maxArmor;
    },
  },
  {
    label: "Increase Shields",
    icon: "shieldcomb.svg",
    color: shieldColor,
    frequency: 1,
    available: () => true,
    upgrade: (state: State) => {
      state.player.maxShields++;
    },
  },
  {
    label: "Increase Shield Recharge Rate",
    icon: "electrical-crescent.svg",
    color: shieldColor,
    frequency: 1,
    available: (state: State) => state.player.maxShields > 0,
    upgrade: (state: State) => {
      state.player.maxShields++;
    },
  },
];

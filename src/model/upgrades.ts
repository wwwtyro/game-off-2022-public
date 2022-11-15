import { Drone } from "./model";

export interface Upgrade {
  readonly label: string;
  readonly icon: string;
  readonly color: string;
  readonly frequency: number;
  readonly available: (drone: Drone) => boolean;
  readonly upgrade: (drone: Drone) => void;
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
    available: (drone: Drone) => {
      return drone.firingRate < 30;
    },
    upgrade: (drone: Drone) => {
      drone.firingRate++;
    },
  },
  {
    label: "Laser Power",
    icon: "laser-blast.svg",
    color: weaponColor,
    frequency: 1,
    available: () => true,
    upgrade: (drone: Drone) => {
      drone.weaponPower++;
    },
  },
  {
    label: "Additional Laser",
    icon: "laser-turret.svg",
    color: weaponColor,
    frequency: 0.1,
    available: (drone: Drone) => {
      return drone.lasers < 10;
    },
    upgrade: (drone: Drone) => {
      drone.lasers++;
    },
  },
  {
    label: "Particle Beam Speed",
    icon: "laser-precision.svg",
    color: weaponColor,
    frequency: 1,
    available: (drone: Drone) => {
      return drone.beamSpeed < 10;
    },
    upgrade: (drone: Drone) => {
      drone.beamSpeed++;
    },
  },
  {
    label: "Rotation Speed",
    icon: "clockwise-rotation.svg",
    color: shipColor,
    frequency: 1,
    available: (drone: Drone) => {
      return drone.turningSpeed < 30;
    },
    upgrade: (drone: Drone) => {
      drone.turningSpeed++;
    },
  },
  {
    label: "Acceleration",
    icon: "speedometer.svg",
    color: shipColor,
    frequency: 1,
    available: (drone: Drone) => {
      return drone.acceleration < 5;
    },
    upgrade: (drone: Drone) => {
      drone.acceleration++;
    },
  },
  {
    label: "Increase Armor",
    icon: "armor-upgrade.svg",
    color: armorColor,
    frequency: 1,
    available: () => true,
    upgrade: (drone: Drone) => {
      drone.maxArmor += 1;
      drone.armor += 1;
    },
  },
  {
    label: "Repair Armor",
    icon: "mighty-spanner.svg",
    color: armorColor,
    frequency: 1,
    available: (drone: Drone) => drone.armor < drone.maxArmor,
    upgrade: (drone: Drone) => {
      drone.armor = drone.maxArmor;
    },
  },
  {
    label: "Increase Shields",
    icon: "shieldcomb.svg",
    color: shieldColor,
    frequency: 1,
    available: () => true,
    upgrade: (drone: Drone) => {
      drone.maxShields++;
    },
  },
  {
    label: "Increase Shield Recharge Rate",
    icon: "electrical-crescent.svg",
    color: shieldColor,
    frequency: 1,
    available: (drone: Drone) => drone.maxShields > 0,
    upgrade: (drone: Drone) => {
      drone.maxShields++;
    },
  },
];

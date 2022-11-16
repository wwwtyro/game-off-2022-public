import { Drone } from "./model";

export interface Upgrade {
  readonly label: string;
  readonly icon: string;
  readonly color: string;
  readonly frequency: number;
  readonly available: (drone: Drone) => boolean;
  readonly upgrade: (drone: Drone) => void;
  readonly permable: boolean;
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
    permable: true,
    available: (drone: Drone) => {
      return drone.firingRate < 15;
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
    permable: true,
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
    permable: true,
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
    permable: true,
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
    permable: true,
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
    permable: true,
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
    permable: true,
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
    permable: false,
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
    permable: true,
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
    permable: true,
    available: (drone: Drone) => drone.maxShields > 0,
    upgrade: (drone: Drone) => {
      drone.maxShields++;
    },
  },
];

function randomUpgrade(availableUpgrades: Upgrade[]) {
  availableUpgrades = availableUpgrades.slice();
  availableUpgrades.sort((a, b) => a.frequency - b.frequency);
  const totalFrequency = availableUpgrades.reduce((previous: number, current: Upgrade) => previous + current.frequency, 0);
  const randomIndex = totalFrequency * Math.random();
  let sum = 0;
  for (const upgrade of availableUpgrades) {
    if (randomIndex < sum + upgrade.frequency) {
      return upgrade;
    }
    sum += upgrade.frequency;
  }
  return null;
}

export function getRandomUpgrades(drone: Drone, count: number, permableOnly: boolean) {
  let availableUpgrades = upgrades.filter((u) => {
    if (!u.available(drone)) {
      return false;
    }
    if (permableOnly && !u.permable) {
      return false;
    }
    return true;
  });
  const selectedUpgrades: Upgrade[] = [];
  for (let i = 0; i < count; i++) {
    const selectedUpgrade = randomUpgrade(availableUpgrades);
    if (selectedUpgrade !== null) {
      availableUpgrades = availableUpgrades.filter((u) => u !== selectedUpgrade);
      selectedUpgrades.push(selectedUpgrade);
    }
  }
  return selectedUpgrades;
}

export function applyRandomUpgrade(drone: Drone, permableOnly: false) {
  const upgrades = getRandomUpgrades(drone, 1, permableOnly);
  for (const upgrade of upgrades) {
    upgrade.upgrade(drone);
  }
}

import { Drone } from "./model";

export interface Upgrade {
  readonly label: string;
  readonly icon: string;
  readonly color: string;
  readonly frequency: number;
  readonly available: (drone: Drone) => boolean;
  readonly _upgrade: (drone: Drone) => void;
  readonly permable: boolean;
}

const weaponColor = "filter-weapon";
const shipColor = "filter-ship";
const armorColor = "filter-armor";
const shieldColor = "filter-shields";

export const upgrades: Upgrade[] = [
  {
    label: "Ion Cannon Firing Rate",
    icon: "laser-warning.svg",
    color: weaponColor,
    frequency: 1,
    permable: true,
    available: (drone: Drone) => {
      return drone.ionCannonFiringRate < 15;
    },
    _upgrade: (drone: Drone) => {
      drone.ionCannonFiringRate++;
    },
  },
  {
    label: "Ion Cannon Power",
    icon: "laser-blast.svg",
    color: weaponColor,
    frequency: 1,
    permable: true,
    available: () => true,
    _upgrade: (drone: Drone) => {
      drone.ionCannonPower++;
    },
  },
  {
    label: "Additional Ion Cannon",
    icon: "laser-turret.svg",
    color: weaponColor,
    frequency: 0.1,
    permable: true,
    available: (drone: Drone) => {
      return drone.ionCannons < 10;
    },
    _upgrade: (drone: Drone) => {
      drone.ionCannons++;
    },
  },
  {
    label: "Ion Cannon Beam Speed",
    icon: "laser-precision.svg",
    color: weaponColor,
    frequency: 1,
    permable: true,
    available: (drone: Drone) => {
      return drone.ionCannonBeamSpeed < 10;
    },
    _upgrade: (drone: Drone) => {
      drone.ionCannonBeamSpeed++;
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
    _upgrade: (drone: Drone) => {
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
    _upgrade: (drone: Drone) => {
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
    _upgrade: (drone: Drone) => {
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
    _upgrade: (drone: Drone) => {
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
    _upgrade: (drone: Drone) => {
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
    _upgrade: (drone: Drone) => {
      drone.maxShields++;
    },
  },
];

export function upgradeDrone(upgrade: Upgrade, drone: Drone) {
  drone.tempUpgrades.push(upgrade);
  upgrade._upgrade(drone);
}

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
    upgradeDrone(upgrade, drone);
  }
}

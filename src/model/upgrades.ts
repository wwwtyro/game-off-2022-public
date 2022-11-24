import { createDroid } from "./droid";
import { Drone } from "./drone";

type UpgradeId =
  | "beam rate"
  | "beam power"
  | "additional cannon"
  | "beam speed"
  | "missile rate"
  | "missile power"
  | "rotation speed"
  | "acceleration"
  | "armor"
  | "repair armor"
  | "shields"
  | "shield recharge"
  | "battle droid"
  | "ricochet"
  | "stun"
  | "impact";

export interface Upgrade {
  readonly label: string;
  readonly id: UpgradeId;
  readonly icon: string;
  readonly color: string;
  readonly frequency: number;
  readonly available: (drone: Drone) => boolean;
  readonly _upgrade: (drone: Drone) => void;
  readonly permable: boolean;
  readonly oneOff?: boolean;
  readonly playerOnly?: boolean;
}

const weaponColor = "filter-weapon";
const shipColor = "filter-ship";
const armorColor = "filter-armor";
const shieldColor = "filter-shields";
const droidColor = "filter-droid";
const specialColor = "filter-special";
const missileColor = "filter-missile";

export const upgrades: Upgrade[] = [
  {
    label: "Ion Cannon Rate",
    id: "beam rate",
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
    label: "Ion Beam Power",
    id: "beam power",
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
    id: "additional cannon",
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
    label: "Ion Beam Speed",
    id: "beam speed",
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
    label: "Missile Rate",
    id: "missile rate",
    icon: "rocket.svg",
    color: missileColor,
    frequency: 0.25,
    permable: true,
    available: (drone: Drone) => {
      return drone.missileFiringRate < 30;
    },
    _upgrade: (drone: Drone) => {
      drone.missileFiringRate++;
    },
  },
  {
    label: "Missile Power",
    id: "missile power",
    icon: "incoming-rocket.svg",
    color: missileColor,
    frequency: 0.1,
    permable: true,
    available: (drone: Drone) => drone.missileFiringRate > 0,
    _upgrade: (drone: Drone) => {
      drone.missilePower++;
    },
  },
  {
    label: "Rotation Speed",
    id: "rotation speed",
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
    id: "acceleration",
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
    label: "Armor",
    id: "armor",
    icon: "armor-upgrade.svg",
    color: armorColor,
    frequency: 1,
    permable: true,
    available: () => true,
    _upgrade: (drone: Drone) => {
      drone.maxArmor += 5;
      drone.armor += 5;
    },
  },
  {
    label: "Repair Armor",
    id: "repair armor",
    icon: "mighty-spanner.svg",
    color: armorColor,
    frequency: 1,
    permable: false,
    oneOff: true,
    playerOnly: true,
    available: (drone: Drone) => drone.armor < drone.maxArmor,
    _upgrade: (drone: Drone) => {
      drone.armor = drone.maxArmor;
    },
  },
  {
    label: "Shields",
    id: "shields",
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
    label: "Shield Recharge",
    id: "shield recharge",
    icon: "electrical-crescent.svg",
    color: shieldColor,
    frequency: 1,
    permable: true,
    available: (drone: Drone) => drone.maxShields > 0,
    _upgrade: (drone: Drone) => {
      drone.maxShields++;
    },
  },
  {
    label: "Battle Droid",
    id: "battle droid",
    icon: "delivery-drone.svg",
    color: droidColor,
    frequency: 0.1,
    permable: true,
    playerOnly: true,
    available: (drone: Drone) => drone.droids.length < 10,
    _upgrade: (drone: Drone) => {
      drone.droids.push(createDroid(drone));
    },
  },
  {
    label: "Ricochet",
    id: "ricochet",
    icon: "laser-sparks.svg",
    color: specialColor,
    frequency: 0.01,
    permable: false,
    playerOnly: true,
    available: (drone: Drone) => drone.ricochet === false,
    _upgrade: (drone: Drone) => {
      drone.ricochet = true;
    },
  },
  {
    label: "Stun",
    id: "stun",
    icon: "sunbeams.svg",
    color: specialColor,
    frequency: 0.01,
    permable: false,
    playerOnly: true,
    available: (drone: Drone) => drone.stun === false,
    _upgrade: (drone: Drone) => {
      drone.stun = true;
    },
  },
  {
    label: "Impact",
    id: "impact",
    icon: "gooey-impact.svg",
    color: specialColor,
    frequency: 0.01,
    permable: false,
    playerOnly: true,
    available: (drone: Drone) => drone.impact === false,
    _upgrade: (drone: Drone) => {
      drone.impact = true;
    },
  },
];

export function getUpgrade(id: UpgradeId) {
  const upgrade = upgrades.find((u) => u.id === id);
  if (upgrade === undefined) {
    throw new Error(`No upgrade for ${id}`);
  }
  return upgrade;
}

export function upgradeDrone(upgrade: Upgrade, drone: Drone) {
  if (!upgrade.oneOff) {
    drone.tempUpgrades.push(upgrade);
  }
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

export function getRandomUpgrades(drone: Drone, count: number, permable = false) {
  let availableUpgrades = upgrades.filter((u) => {
    if (!u.available(drone)) {
      return false;
    }
    if (u.playerOnly && drone.team !== "player") {
      return false;
    }
    if (permable && !u.permable) {
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

export function applyRandomUpgrade(drone: Drone) {
  const upgrades = getRandomUpgrades(drone, 1);
  for (const upgrade of upgrades) {
    upgradeDrone(upgrade, drone);
  }
}

export function getPermanentUpgrades() {
  return (JSON.parse(localStorage.getItem("permanentUpgrades") ?? JSON.stringify([])) as UpgradeId[])
    .map((id) => upgrades.find((upgrade) => upgrade.id === id))
    .filter((upgrade) => upgrade !== undefined) as Upgrade[];
}

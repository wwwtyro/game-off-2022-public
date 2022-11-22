import { createDroid } from "./droid";
import { Drone } from "./drone";

export interface Upgrade {
  readonly label: string;
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
    label: "Missile Firing Rate",
    icon: "rocket.svg",
    color: missileColor,
    frequency: 1,
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
    oneOff: true,
    playerOnly: true,
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
  {
    label: "Battle Droid",
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
  return (JSON.parse(localStorage.getItem("permanentUpgrades") ?? JSON.stringify([])) as string[])
    .map((label) => upgrades.find((upgrade) => upgrade.label === label))
    .filter((upgrade) => upgrade !== undefined) as Upgrade[];
}

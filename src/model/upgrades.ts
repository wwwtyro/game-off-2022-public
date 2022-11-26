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
  | "impact"
  | "splash damage"
  | "droid deflection";

export interface Upgrade {
  readonly label: string;
  readonly id: UpgradeId;
  readonly icon: string;
  readonly frequency: number;
  readonly available: (drone: Drone) => boolean;
  readonly _upgrade: (drone: Drone) => void;
  readonly permable: boolean;
  readonly oneOff?: boolean;
  readonly playerOnly?: boolean;
}

export const upgrades: Upgrade[] = [
  {
    label: "Ion Cannon Firing Rate",
    id: "beam rate",
    icon: "laserWarningIcon",
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
    id: "beam power",
    icon: "laserBlastIcon",
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
    icon: "laserTurretIcon",
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
    icon: "laserPrecisionIcon",
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
    id: "missile rate",
    icon: "rocketIcon",
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
    icon: "incomingRocketIcon",
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
    icon: "clockwiseRotationIcon",
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
    label: "Speed",
    id: "acceleration",
    icon: "speedometerIcon",
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
    icon: "armorUpgradeIcon",
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
    icon: "mightySpannerIcon",
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
    icon: "shieldcombIcon",
    frequency: 1,
    permable: true,
    available: () => true,
    _upgrade: (drone: Drone) => {
      drone.maxShields++;
    },
  },
  {
    label: "Shield Recharge Rate",
    id: "shield recharge",
    icon: "electricalCrescentIcon",
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
    icon: "deliveryDroneIcon",
    frequency: 0.1,
    permable: true,
    playerOnly: true,
    available: (drone: Drone) => drone.droids.length < 32,
    _upgrade: (drone: Drone) => {
      drone.droids.push(createDroid(drone));
    },
  },
  {
    label: "Ricochet",
    id: "ricochet",
    icon: "laserSparksIcon",
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
    icon: "sunbeamsIcon",
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
    icon: "gooeyImpactIcon",
    frequency: 0.01,
    permable: false,
    playerOnly: true,
    available: (drone: Drone) => drone.impact === false,
    _upgrade: (drone: Drone) => {
      drone.impact = true;
    },
  },
  {
    label: "Splash Damage",
    id: "splash damage",
    icon: "dropletSplashIcon",
    frequency: 0.01,
    permable: false,
    playerOnly: true,
    available: (drone: Drone) => drone.splash === false,
    _upgrade: (drone: Drone) => {
      drone.splash = true;
    },
  },
  {
    label: "Droid Deflection",
    id: "droid deflection",
    icon: "divertIcon",
    frequency: 0.01,
    permable: false,
    playerOnly: true,
    available: (drone: Drone) => drone.deflect === false,
    _upgrade: (drone: Drone) => {
      drone.deflect = true;
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

(window as any).upgrades = upgrades; // degub

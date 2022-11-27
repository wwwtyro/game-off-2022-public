import { createDroid } from "./droid";
import { Drone } from "./drone";

export type UpgradeId =
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
  readonly description: string;
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
    description: "Increases the firing rate of your ion cannon by one beam per second.",
    id: "beam rate",
    icon: "laserWarningIcon",
    frequency: 1,
    permable: true,
    available: (drone: Drone) => {
      return drone.ionCannonFiringRate < 20;
    },
    _upgrade: (drone: Drone) => {
      drone.ionCannonFiringRate++;
    },
  },
  {
    label: "Ion Cannon Power",
    description: "Increases the destructive energy of your ion cannon by one megajoule.",
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
    description: "Increases the number of ion cannons on your drone.",
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
    description: "Increases the maximum speed of each ion beam by one meter per second.",
    id: "beam speed",
    icon: "laserPrecisionIcon",
    frequency: 1,
    permable: true,
    available: (drone: Drone) => {
      return drone.ionCannonBeamSpeed < 20;
    },
    _upgrade: (drone: Drone) => {
      drone.ionCannonBeamSpeed++;
    },
  },
  {
    label: "Missile Firing Rate",
    description: "Increases the firing rate of your missile launcher by one per ten seconds.",
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
    description: "Increases the destructive energy of your missiles by ten megajoules.",
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
    description: "Increases the turning speed of your drone by one radian per second.",
    id: "rotation speed",
    icon: "clockwiseRotationIcon",
    frequency: 1,
    permable: true,
    available: (drone: Drone) => {
      return drone.turningSpeed < 10;
    },
    _upgrade: (drone: Drone) => {
      drone.turningSpeed++;
    },
  },
  {
    label: "Speed",
    description: "Increases the acceleration of your drone by one meter per second².",
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
    description: "Increases the energy absorbed by your armor by five megajoules.",
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
    description: "Completely repair your armor.",
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
    description: "Increases the energy absorbed by your shields by one megajoule.",
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
    description: "Recharges the energy aborption of your shields by an additional one megajoule per second.",
    id: "shield recharge",
    icon: "electricalCrescentIcon",
    frequency: 1,
    permable: true,
    available: (drone: Drone) => drone.maxShields > 0,
    _upgrade: (drone: Drone) => {
      drone.shieldRecharge++;
    },
  },
  {
    label: "Battle Droid",
    description: "Adds an additional battle droid to your fleet.",
    id: "battle droid",
    icon: "deliveryDroneIcon",
    frequency: 0.25,
    permable: true,
    playerOnly: true,
    available: (drone: Drone) => drone.droids.length < 32,
    _upgrade: (drone: Drone) => {
      drone.droids.push(createDroid(drone));
    },
  },
  {
    label: "Ricochet",
    description: "Ion beams have a chance to be ricocheted into additional enemies.",
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
    description: "Temporarily slow any enemy struck by your ion beams.",
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
    description: "Enemies struck by your ion beams are knocked back and off target.",
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
    description: "Your missiles will damage nearby enemies when they explode.",
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
    description: "Your droids can now harmlessly deflect any enemy ion beams that get close to them into the ground.",
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

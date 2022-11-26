import { getPermanentUpgrades, getUpgrade, Upgrade, UpgradeId } from "./upgrades";

export interface PlayerDrone {
  name: string;
  unlock: string;
  spriteId: string;
  available: () => boolean;
  getUpgrades: () => Upgrade[];
}

interface UpgradeDescription {
  upgradeId: UpgradeId;
  count: number;
}

function getUpgradeList(descriptions: UpgradeDescription[]) {
  const list: Upgrade[] = [];
  for (const desc of descriptions) {
    const up = getUpgrade(desc.upgradeId);
    for (let i = 0; i < desc.count; i++) {
      list.push(up);
    }
  }
  return list;
}

export const playerDrones: PlayerDrone[] = [
  {
    name: "Base Combat Drone",
    unlock: "N/A",
    spriteId: "player00",
    available: () => true,
    getUpgrades: () => [],
  },
  {
    name: "Cannon Drone",
    unlock: "Unlocked at 10 Permanent Ion Beam Speed",
    spriteId: "player03",
    available: () => getPermanentUpgrades().filter((u) => u.id === "beam speed").length >= 10,
    getUpgrades: () => {
      return getUpgradeList([
        {
          upgradeId: "beam rate",
          count: 10,
        },
        {
          upgradeId: "beam power",
          count: 20,
        },
        {
          upgradeId: "beam speed",
          count: 10,
        },
        {
          upgradeId: "additional cannon",
          count: 5,
        },
        {
          upgradeId: "ricochet",
          count: 1,
        },
      ]);
    },
  },
  {
    name: "Fleet Drone",
    unlock: "Unlocked at 16 Permanent Battle Droids",
    spriteId: "player02",
    available: () => getPermanentUpgrades().filter((u) => u.id === "battle droid").length >= 16,
    getUpgrades: () => {
      return getUpgradeList([
        {
          upgradeId: "battle droid",
          count: 16,
        },
        {
          upgradeId: "droid deflection",
          count: 1,
        },
        {
          upgradeId: "stun",
          count: 1,
        },
      ]);
    },
  },
  {
    name: "Missile Drone",
    unlock: "Unlocked at 15 Permanent Missile Firing Rate",
    spriteId: "player01",
    available: () => getPermanentUpgrades().filter((u) => u.id === "missile rate").length >= 15,
    getUpgrades: () => {
      return getUpgradeList([
        {
          upgradeId: "missile rate",
          count: 15,
        },
        {
          upgradeId: "missile power",
          count: 10,
        },
        {
          upgradeId: "splash damage",
          count: 1,
        },
      ]);
    },
  },
  {
    name: "Heavy Drone",
    unlock: "Unlocked at 15 Permanent Armor",
    spriteId: "player04",
    available: () => getPermanentUpgrades().filter((u) => u.id === "armor").length >= 15,
    getUpgrades: () => {
      return getUpgradeList([
        {
          upgradeId: "armor",
          count: 50,
        },
        {
          upgradeId: "shields",
          count: 50,
        },
        {
          upgradeId: "shield recharge",
          count: 50,
        },
        {
          upgradeId: "impact",
          count: 1,
        },
      ]);
    },
  },
];

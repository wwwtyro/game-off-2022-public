import { getPermanentUpgrades } from "./model";
import { Upgrade, upgrades } from "./upgrades";

export interface PlayerDrone {
  name: string;
  unlock: string;
  spriteId: string;
  url: string;
  available: () => boolean;
  getUpgrades: () => Upgrade[];
}

export const playerDrones: PlayerDrone[] = [
  {
    name: "Base Combat Drone",
    unlock: "N/A",
    spriteId: "player00",
    url: "static/player-00-diffuse.png",
    available: () => true,
    getUpgrades: () => [],
  },
  {
    name: "Speed Drone",
    unlock: "Unlocked at 3 Acceleration",
    spriteId: "player01",
    url: "static/player-01-diffuse.png",
    available: () => getPermanentUpgrades().filter((u) => u.label === "Acceleration").length >= 3,
    getUpgrades: () => {
      const acceleration = upgrades.find((u) => u.label === "Acceleration");
      if (!acceleration) {
        throw new Error("Didn't find upgrade.");
      }
      const rotationSpeed = upgrades.find((u) => u.label === "Rotation Speed");
      if (!rotationSpeed) {
        throw new Error("Didn't find upgrade.");
      }
      return [
        acceleration,
        acceleration,
        acceleration,
        rotationSpeed,
        rotationSpeed,
        rotationSpeed,
        rotationSpeed,
        rotationSpeed,
        rotationSpeed,
        rotationSpeed,
        rotationSpeed,
        rotationSpeed,
        rotationSpeed,
      ];
    },
  },
  {
    name: "Shield Drone",
    unlock: "Unlocked at 10 Shield",
    spriteId: "player02",
    url: "static/player-02-diffuse.png",
    available: () => getPermanentUpgrades().filter((u) => u.label === "Increase Shields").length >= 10,
    getUpgrades: () => {
      const increaseShields = upgrades.find((u) => u.label === "Increase Shields");
      if (!increaseShields) {
        throw new Error("Didn't find upgrade.");
      }
      const increaseShieldRechargeRate = upgrades.find((u) => u.label === "Increase Shield Recharge Rate");
      if (!increaseShieldRechargeRate) {
        throw new Error("Didn't find upgrade.");
      }
      return [
        increaseShields,
        increaseShields,
        increaseShields,
        increaseShields,
        increaseShields,
        increaseShields,
        increaseShields,
        increaseShields,
        increaseShields,
        increaseShields,
        increaseShieldRechargeRate,
        increaseShieldRechargeRate,
        increaseShieldRechargeRate,
        increaseShieldRechargeRate,
        increaseShieldRechargeRate,
        increaseShieldRechargeRate,
        increaseShieldRechargeRate,
        increaseShieldRechargeRate,
        increaseShieldRechargeRate,
        increaseShieldRechargeRate,
      ];
    },
  },
  {
    name: "Cannon Drone",
    unlock: "Unlocked at 10 Ion Cannon Power",
    spriteId: "player03",
    url: "static/player-03-diffuse.png",
    available: () => getPermanentUpgrades().filter((u) => u.label === "Ion Cannon Power").length >= 10,
    getUpgrades: () => {
      const ionCannonFiringRate = upgrades.find((u) => u.label === "Ion Cannon Firing Rate");
      if (!ionCannonFiringRate) {
        throw new Error("Didn't find upgrade.");
      }
      const ionCannonPower = upgrades.find((u) => u.label === "Ion Cannon Power");
      if (!ionCannonPower) {
        throw new Error("Didn't find upgrade.");
      }
      const additionalIonCannon = upgrades.find((u) => u.label === "Additional Ion Cannon");
      if (!additionalIonCannon) {
        throw new Error("Didn't find upgrade.");
      }
      const ionCannonBeamSpeed = upgrades.find((u) => u.label === "Ion Cannon Beam Speed");
      if (!ionCannonBeamSpeed) {
        throw new Error("Didn't find upgrade.");
      }
      return [
        ionCannonFiringRate,
        ionCannonFiringRate,
        ionCannonFiringRate,
        ionCannonFiringRate,
        ionCannonFiringRate,
        ionCannonPower,
        ionCannonPower,
        ionCannonPower,
        ionCannonPower,
        ionCannonPower,
        additionalIonCannon,
        additionalIonCannon,
        additionalIonCannon,
        ionCannonBeamSpeed,
        ionCannonBeamSpeed,
        ionCannonBeamSpeed,
        ionCannonBeamSpeed,
        ionCannonBeamSpeed,
      ];
    },
  },
  {
    name: "Armor Drone",
    unlock: "Unlocked at 10 Armor",
    spriteId: "player04",
    url: "static/player-04-diffuse.png",
    available: () => getPermanentUpgrades().filter((u) => u.label === "Increase Armor").length >= 10,
    getUpgrades: () => {
      const increaseArmor = upgrades.find((u) => u.label === "Increase Armor");
      if (!increaseArmor) {
        throw new Error("Didn't find upgrade.");
      }
      const armorUpgrades: Upgrade[] = [];
      for (let i = 0; i < 50; i++) {
        armorUpgrades.push(increaseArmor);
      }
      return armorUpgrades;
    },
  },
];

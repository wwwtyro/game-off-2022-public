import { getPermanentUpgrades, getUpgrade, Upgrade } from "./upgrades";

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
    available: () => getPermanentUpgrades().filter((u) => u.id === "acceleration").length >= 3,
    getUpgrades: () => {
      const acceleration = getUpgrade("acceleration");
      const rotationSpeed = getUpgrade("rotation speed");
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
    available: () => getPermanentUpgrades().filter((u) => u.id === "shields").length >= 10,
    getUpgrades: () => {
      const increaseShields = getUpgrade("shields");
      const increaseShieldRechargeRate = getUpgrade("shield recharge");
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
    available: () => getPermanentUpgrades().filter((u) => u.id === "beam power").length >= 10,
    getUpgrades: () => {
      const ionCannonFiringRate = getUpgrade("beam rate");
      const ionCannonPower = getUpgrade("beam power");
      const additionalIonCannon = getUpgrade("additional cannon");
      const ionCannonBeamSpeed = getUpgrade("beam speed");
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
    available: () => getPermanentUpgrades().filter((u) => u.id === "armor").length >= 10,
    getUpgrades: () => {
      const increaseArmor = getUpgrade("armor");
      const armorUpgrades: Upgrade[] = [];
      for (let i = 0; i < 50; i++) {
        armorUpgrades.push(increaseArmor);
      }
      return armorUpgrades;
    },
  },
];

export const CONFIG = {
    MAP_SIZE: 2500,
    WORLD_SCALE: 1,
    PLAYER: {
        RADIUS: 15,
        BASE_SPEED: 5,
        HP: 100
    },
    ARMOR: {
        TIER1: 50,
        TIER2: 100,
        TIER3: 150
    },
    VISION: {
        CONE_ANGLE: 120, // Degrees
        RANGE: 600
    },
    WEAPONS: {
        PISTOL: { name: 'Pistol', damage: 15, fireRate: 400, reload: 1000, ammo: 12, color: 0x95a5a6 },
        SMG: { name: 'SMG', damage: 10, fireRate: 100, reload: 1500, ammo: 30, color: 0x34495e },
        SHOTGUN: { name: 'Shotgun', damage: 40, fireRate: 800, reload: 2000, ammo: 2, color: 0x7f8c8d }
    },
    LOOT: {
        SPAWN_COUNT: 60, // Less loot for smaller map
        TYPES: ['weapon', 'armor', 'powerup']
    },
    LOD: {
        RENDER_DISTANCE: 1200
    },
    COLORS: {
        GRASS: 0x27ae60,
        TREE: 0x2ecc71,
        STONE: 0x95a5a6,
        BUILDING: 0x34495e,
        ROOF: 0x2c3e50
    }
};

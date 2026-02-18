import { CONFIG } from './config.js';
import { isHost } from 'playroom';

export class LootManager {
    constructor(world, seed) {
        this.world = world;
        this.seed = seed;
        this.items = new Map(); // id -> { graphics, type, value }
    }

    random(s) {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    }

    generateLoot() {
        let currentSeed = this.seed + 999; // Offset for loot
        const loot = [];

        for (let i = 0; i < CONFIG.LOOT.SPAWN_COUNT; i++) {
            currentSeed++;
            const x = this.random(currentSeed) * CONFIG.MAP_SIZE;
            currentSeed++;
            const y = this.random(currentSeed) * CONFIG.MAP_SIZE;
            currentSeed++;

            const r = this.random(currentSeed);
            let type, value;

            if (r < 0.4) {
                type = 'weapon';
                const weapons = Object.keys(CONFIG.WEAPONS);
                value = weapons[Math.floor(this.random(currentSeed * 2) * weapons.length)];
            } else if (r < 0.7) {
                type = 'armor';
                value = Math.floor(this.random(currentSeed * 2) * 3) + 1; // T1, T2, T3
            } else {
                type = 'powerup';
                value = ['invisibility', 'damage', 'heal'][Math.floor(this.random(currentSeed * 2) * 3)];
            }

            loot.push({ id: `loot_${i}`, x, y, type, value });
        }
        return loot;
    }
}

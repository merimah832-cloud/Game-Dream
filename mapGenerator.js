import { CONFIG } from './config.js';

export class MapGenerator {
    constructor(seed) {
        this.seed = seed;
        this.objects = [];
    }

    // Simple pseudo-random helper
    random(s) {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    }

    generate() {
        this.objects = [];

        // Use seed for reproducibility
        let currentSeed = this.seed;

        // Generate Trees
        for (let i = 0; i < 400; i++) {
            currentSeed++;
            const x = this.random(currentSeed) * CONFIG.MAP_SIZE;
            currentSeed++;
            const y = this.random(currentSeed) * CONFIG.MAP_SIZE;

            this.objects.push({
                type: 'tree',
                x,
                y,
                radius: 30 + this.random(currentSeed) * 20
            });
        }

        // Generate Stones
        for (let i = 0; i < 200; i++) {
            currentSeed++;
            const x = this.random(currentSeed) * CONFIG.MAP_SIZE;
            currentSeed++;
            const y = this.random(currentSeed) * CONFIG.MAP_SIZE;

            this.objects.push({
                type: 'stone',
                x,
                y,
                radius: 20 + this.random(currentSeed) * 30
            });
        }

        // Generate simple rectangular buildings
        for (let i = 0; i < 15; i++) {
            currentSeed++;
            const x = this.random(currentSeed) * CONFIG.MAP_SIZE;
            currentSeed++;
            const y = this.random(currentSeed) * CONFIG.MAP_SIZE;

            this.objects.push({
                type: 'building',
                x,
                y,
                width: 200 + this.random(currentSeed) * 200,
                height: 150 + this.random(currentSeed) * 150
            });
        }

        return this.objects;
    }
}

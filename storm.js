import * as PIXI from 'pixi';
import { CONFIG } from './config.js';

export class StormManager {
    constructor(world) {
        this.world = world;
        this.graphics = new PIXI.Graphics();
        this.world.addChild(this.graphics);

        this.radius = CONFIG.MAP_SIZE * 0.7;
        this.center = { x: CONFIG.MAP_SIZE / 2, y: CONFIG.MAP_SIZE / 2 };
        this.targetRadius = this.radius;
        this.shrinkStartTime = Date.now();
    }

    update() {
        // Faster shrink for 5-10 min rounds
        const elapsed = (Date.now() - this.shrinkStartTime) / 1000;
        this.radius = Math.max(50, (CONFIG.MAP_SIZE * 0.7) - elapsed * 15); // 15 units instead of 5

        this.graphics.clear();

        // Draw the danger zone (it's what's OUTSIDE the circle)
        // We do this by filling the whole world and cutting a hole
        this.graphics.rect(0, 0, CONFIG.MAP_SIZE, CONFIG.MAP_SIZE);
        this.graphics.fill({ color: 0xff0000, alpha: 0.2 });

        // Use a hole to represent the safe zone
        this.graphics.circle(this.center.x, this.center.y, this.radius);
        this.graphics.cut();

        // Outline the danger zone
        this.graphics.circle(this.center.x, this.center.y, this.radius);
        this.graphics.stroke({ color: 0xff0000, width: 5 });
    }

    isInside(pos) {
        const dx = pos.x - this.center.x;
        const dy = pos.y - this.center.y;
        return Math.sqrt(dx * dx + dy * dy) <= this.radius;
    }
}

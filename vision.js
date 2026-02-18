import * as PIXI from 'pixi';
import { CONFIG } from './config.js';

export class VisionManager {
    constructor(app, world, player) {
        this.app = app;
        this.world = world;
        this.player = player;

        this.visionLayer = new PIXI.Graphics();
        this.visionMask = new PIXI.Graphics();

        this.setup();
    }

    setup() {
        // Dark overlay covering the world
        this.visionLayer.rect(0, 0, CONFIG.MAP_SIZE, CONFIG.MAP_SIZE);
        this.visionLayer.fill({ color: 0x000000, alpha: 0.85 });

        // Mask for the overlay
        this.visionLayer.mask = this.visionMask;
    }

    update() {
        this.visionMask.clear();

        const { x, y, rotation } = this.player;
        const halfCone = (CONFIG.VISION.CONE_ANGLE * Math.PI / 180) / 2;

        // FOV Cone
        this.visionMask.moveTo(x, y);
        this.visionMask.arc(x, y, CONFIG.VISION.RANGE, rotation - halfCone, rotation + halfCone);
        this.visionMask.fill(0xffffff);

        // Immediate circle around player
        this.visionMask.circle(x, y, CONFIG.PLAYER.RADIUS * 2.5);
        this.visionMask.fill(0xffffff);
    }
}

import * as PIXI from 'pixi';
import { CONFIG } from './config.js';

export class CombatManager {
    constructor(world, app) {
        this.world = world;
        this.app = app;
        this.bullets = [];
        this.lastFireTime = 0;
    }

    fire(player, weaponType) {
        const weapon = CONFIG.WEAPONS[weaponType || 'PISTOL'];
        const now = Date.now();

        if (now - this.lastFireTime < weapon.fireRate) return null;
        this.lastFireTime = now;

        const bullet = new PIXI.Graphics();
        bullet.circle(0, 0, 4);
        bullet.fill(0xffff00);

        // Spawn at player position + offset in direction
        const offset = 40;
        bullet.x = player.x + Math.cos(player.rotation) * offset;
        bullet.y = player.y + Math.sin(player.rotation) * offset;

        bullet.velocity = {
            x: Math.cos(player.rotation) * 15,
            y: Math.sin(player.rotation) * 15
        };

        bullet.damage = weapon.damage;
        bullet.ownerId = 'me'; // Playroom will handle networking

        this.world.addChild(bullet);
        this.bullets.push(bullet);

        return {
            x: bullet.x,
            y: bullet.y,
            vx: bullet.velocity.x,
            vy: bullet.velocity.y,
            damage: bullet.damage
        };
    }

    update() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.velocity.x;
            b.y += b.velocity.y;

            // Simple range limit or map limit
            if (Math.abs(b.x) > CONFIG.MAP_SIZE * 2 || Math.abs(b.y) > CONFIG.MAP_SIZE * 2) {
                this.world.removeChild(b);
                this.bullets.splice(i, 1);
            }
        }
    }
}

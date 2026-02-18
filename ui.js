import { CONFIG } from './config.js';

export class UIManager {
    constructor() {
        this.healthBar = document.getElementById('health-bar');
        this.armorBar = document.getElementById('armor-bar');
        this.weaponInfo = document.getElementById('weapon-info');
    }

    update(hp, armor, maxArmor = 150) {
        // Update Health
        const hpPercent = (hp / CONFIG.PLAYER.HP) * 100;
        this.healthBar.style.width = `${hpPercent}%`;

        // Update Armor
        // Armor bars are dynamic based on tier, 150 is the absolute max
        const armorPercent = (armor / maxArmor) * 100;
        this.armorBar.style.width = `${armorPercent}%`;

        // Hide armor bar if 0
        this.armorBar.parentElement.style.opacity = armor > 0 ? 1 : 0;
    }

    setWeaponInfo(name, ammo, total) {
        this.weaponInfo.textContent = `${name} | ${ammo}/${total}`;
    }
}

// PIXI is now global
import { CONFIG } from './config.js';
import { MapGenerator } from './mapGenerator.js';
import { VisionManager } from './vision.js';
import { MultiplayerManager } from './multiplayer.js';
import { UIManager } from './ui.js';
import { LootManager } from './loot.js';
import { CombatManager } from './combat.js';
import { StormManager } from './storm.js';
// Note: isHost might not be directly exported from the main playroom bundle sometimes
import * as Playroom from 'playroom';

// Global state
let app;
let player;
let world;
let visionManager;
let multiplayerManager;
let uiManager;
let lootManager;
let combatManager;
let stormManager;
let buildings = [];
let lootSprites = new Map();
let networkPlayers = new Map();
let isGameOver = false;

console.log("Game Dream: Script starting...");

async function init() {
    // 1. Initialize PixiJS Application
    console.log("Initializing PixiJS...");
    app = new PIXI.Application();
    await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: CONFIG.COLORS.GRASS,
        antialias: true,
        resizeTo: window
    });
    document.getElementById('game-container').appendChild(app.canvas);
    console.log("PixiJS initialized.");

    // 2. Setup World Container
    world = new PIXI.Container();
    app.stage.addChild(world);

    // 3. Generate Map
    const generator = new MapGenerator(12345); // Fixed seed for now
    const mapObjects = generator.generate();

    renderMap(mapObjects);

    // 4. Initialize UI
    uiManager = new UIManager();

    // 5. Initialize Multiplayer
    multiplayerManager = new MultiplayerManager({
        onJoin: (state) => setupNetworkPlayer(state),
        onQuit: (id) => removeNetworkPlayer(id)
    });
    console.log("Initializing Multiplayer...");
    await multiplayerManager.init();
    console.log("Multiplayer initialized.");

    // 5b. Setup Multiplayer RPCs
    multiplayerManager.getMyPlayer().onRPC("fire", (data) => {
        handleRemoteFire(data);
    });

    // 6. Generate Loot
    lootManager = new LootManager(world, 12345);
    const loot = lootManager.generateLoot();
    renderLoot(loot);

    // 7. Create Local Player
    const me = multiplayerManager.getMyPlayer();
    const spawn = me.getState('pos') || { x: CONFIG.MAP_SIZE / 2, y: CONFIG.MAP_SIZE / 2 };
    player = createPlayer(me.getProfile().color.hex || 0x3498db);
    player.x = spawn.x;
    player.y = spawn.y;
    world.addChild(player);

    // 7. Initialize Combat
    combatManager = new CombatManager(world, app);

    // 8. Initialize Storm
    stormManager = new StormManager(world);

    // 9. Setup Vision
    visionManager = new VisionManager(app, world, player);
    // Add vision layer to world so it stays in world coordinates
    world.addChild(visionManager.visionLayer);

    // 8. Setup Camera/Follow logic
    app.ticker.add(() => {
        if (isGameOver) return;

        updatePlayer();
        syncMultiplayer();
        combatManager.update();
        stormManager.update();
        centerCamera();
        visionManager.update();
        checkLoot();
        checkStormDamage();
        checkWinCondition();

        // Update HUD
        const me = multiplayerManager.getMyPlayer();
        const hp = me.getState('hp') || 100;
        const armor = me.getState('armor') || 0;
        uiManager.update(hp, armor);
    });

    // 9. Finalize
    document.getElementById('loading-overlay').style.display = 'none';
    console.log("Game Dream: Initialization complete.");
}

function renderMap(objects) {
    objects.forEach(obj => {
        const graphics = new PIXI.Graphics();

        if (obj.type === 'tree') {
            graphics.circle(0, 0, obj.radius);
            graphics.fill(CONFIG.COLORS.TREE);
        } else if (obj.type === 'stone') {
            graphics.poly([0, 0, obj.radius, 10, obj.radius, obj.radius - 5, 0, obj.radius]);
            graphics.fill(CONFIG.COLORS.STONE);
        } else if (obj.type === 'building') {
            graphics.rect(0, 0, obj.width, obj.height);
            graphics.fill(CONFIG.COLORS.BUILDING);

            // Add roof
            const roof = new PIXI.Graphics();
            roof.rect(0, 0, obj.width, obj.height);
            roof.fill({ color: CONFIG.COLORS.ROOF, alpha: 1 });
            graphics.addChild(roof);

            buildings.push({
                bounds: { x: obj.x, y: obj.y, w: obj.width, h: obj.height },
                roof: roof
            });
        }

        graphics.x = obj.x;
        graphics.y = obj.y;
        world.addChild(graphics);
    });
}

function createPlayer(color) {
    const p = new PIXI.Graphics();
    p.circle(0, 0, CONFIG.PLAYER.RADIUS);
    p.fill(color);

    // Direction indicator
    p.rect(0, -5, 35, 10);
    p.fill(0xffffff);

    p.x = CONFIG.MAP_SIZE / 2;
    p.y = CONFIG.MAP_SIZE / 2;
    return p;
}

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('mousedown', e => {
    if (e.button === 0) { // Left click
        const weaponType = multiplayerManager.getMyPlayer().getState('weaponType');
        const bulletData = combatManager.fire(player, weaponType);
        if (bulletData) {
            multiplayerManager.getMyPlayer().RPC("fire", bulletData);
        }
    }
});

function handleRemoteFire(data) {
    // Spawn bullet for remote player (visual only, collisions handled by each client or host)
    // For now, we'll just use the combatManager to spawn it
    const bullet = new PIXI.Graphics();
    bullet.circle(0, 0, 4);
    bullet.fill(0xffff00);
    bullet.x = data.x;
    bullet.y = data.y;
    bullet.velocity = { x: data.vx, y: data.vy };
    world.addChild(bullet);
    combatManager.bullets.push(bullet);
}

function updatePlayer() {
    let dx = 0;
    let dy = 0;

    if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    // Normalize speed
    if (dx !== 0 || dy !== 0) {
        const mag = Math.sqrt(dx * dx + dy * dy);
        player.x += (dx / mag) * CONFIG.PLAYER.BASE_SPEED;
        player.y += (dy / mag) * CONFIG.PLAYER.BASE_SPEED;
    }

    // Rotate to mouse
    const mouse = app.renderer.events.pointer;
    const angle = Math.atan2(mouse.y - app.screen.height / 2, mouse.x - app.screen.width / 2);
    player.rotation = angle;
}

function centerCamera() {
    world.x = -player.x + app.screen.width / 2;
    world.y = -player.y + app.screen.height / 2;
}

function checkBuildings() {
    buildings.forEach(b => {
        const isInside = (
            player.x >= b.bounds.x &&
            player.x <= b.bounds.x + b.bounds.w &&
            player.y >= b.bounds.y &&
            player.y <= b.bounds.y + b.bounds.h
        );

        // Transition alpha for premium feel
        const targetAlpha = isInside ? 0 : 1;
        b.roof.alpha += (targetAlpha - b.roof.alpha) * 0.1;
    });
}

function setupNetworkPlayer(state) {
    if (state.id === multiplayerManager.getMyPlayer().id) return;

    const p = createPlayer(state.getProfile().color.hex || 0x2ecc71);
    world.addChild(p);
    networkPlayers.set(state.id, { graphics: p, state });
}

function removeNetworkPlayer(id) {
    const p = networkPlayers.get(id);
    if (p) {
        world.removeChild(p.graphics);
        networkPlayers.delete(id);
    }
}

function syncMultiplayer() {
    // Send my state
    multiplayerManager.updateMyState(
        { x: player.x, y: player.y },
        player.rotation
    );

    // Update others
    networkPlayers.forEach((p, id) => {
        const targetPos = p.state.getState('pos');
        const targetRot = p.state.getState('rotation');

        if (targetPos) {
            // Simple interpolation for smoothness
            p.graphics.x += (targetPos.x - p.graphics.x) * 0.3;
            p.graphics.y += (targetPos.y - p.graphics.y) * 0.3;
        }
        if (targetRot !== undefined) {
            p.graphics.rotation = targetRot;
        }
    });
}

function renderLoot(loot) {
    loot.forEach(item => {
        const g = new PIXI.Graphics();
        if (item.type === 'weapon') {
            g.rect(-10, -5, 20, 10);
            g.fill(0xf1c40f);
        } else if (item.type === 'armor') {
            g.poly([0, -10, 10, 0, 0, 10, -10, 0]);
            g.fill(0x3498db);
        } else if (item.type === 'powerup') {
            g.circle(0, 0, 8);
            g.fill(0xe74c3c);
        }
        g.x = item.x;
        g.y = item.y;
        world.addChild(g);
        lootSprites.set(item.id, { graphics: g, data: item });
    });
}

function checkLoot() {
    const me = multiplayerManager.getMyPlayer();
    lootSprites.forEach((sprite, id) => {
        if (!sprite.graphics.visible) return;
        const dx = player.x - sprite.data.x;
        const dy = player.y - sprite.data.y;
        if (Math.sqrt(dx * dx + dy * dy) < 40) {
            if (me.getState(`picked_${id}`)) return;
            me.setState(`picked_${id}`, true);
            applyLoot(sprite.data);
            sprite.graphics.visible = false;
        }
    });
}

function applyLoot(item) {
    const me = multiplayerManager.getMyPlayer();
    if (item.type === 'armor') {
        const bonus = CONFIG.ARMOR[`TIER${item.value}`];
        me.setState('armor', Math.max(me.getState('armor') || 0, bonus));
    } else if (item.type === 'weapon') {
        me.setState('weaponType', item.value);
        const w = CONFIG.WEAPONS[item.value];
        uiManager.setWeaponInfo(w.name, w.ammo, w.ammo);
    } else if (item.value === 'heal') {
        me.setState('hp', 100);
        me.setState('armor', 150);
    }
}

function checkStormDamage() {
    const me = multiplayerManager.getMyPlayer();
    if (!stormManager.isInside({ x: player.x, y: player.y })) {
        const hp = me.getState('hp') || 100;
        const newHp = Math.max(0, hp - 0.2);
        me.setState('hp', newHp);

        if (newHp <= 0 && !isGameOver) {
            handleDeath();
        }
    }
}

function handleDeath() {
    if (isGameOver) return;
    isGameOver = true;
    player.visible = false;
    multiplayerManager.getMyPlayer().setState('dead', true);
    alert("YOU DIED! Better luck next time.");
}

function checkWinCondition() {
    if (isGameOver) return;

    if (multiplayerManager.players.size <= 1) return;

    let alivePlayers = [];
    multiplayerManager.players.forEach(p => {
        if (!p.getState('dead')) alivePlayers.push(p);
    });

    if (alivePlayers.length === 1) {
        const winner = alivePlayers[0];
        if (winner.id === multiplayerManager.getMyPlayer().id) {
            isGameOver = true;
            reportVictory(winner);
            alert("VICTORY ROYALE! You are the last one standing!");
        }
    }
}

async function reportVictory(winner) {
    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('chatId');
    if (!chatId) return;

    try {
        await fetch('https://YOUR_BACKEND_URL.io/api/report-win', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chatId: chatId,
                winnerName: winner.getProfile().name,
                winnerId: winner.id // Playroom ID, might need adjustment for persistent stats
            })
        });
    } catch (e) {
        console.error("Failed to report victory:", e);
    }
}

async function start() {
    try {
        await init();
    } catch (err) {
        console.error("Critical Init Error:", err);
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.background = 'rgba(255,0,0,0.8)';
            overlay.innerHTML = `КРИТИЧЕСКАЯ ОШИБКА: ${err.message}<br><br>Убедитесь, что вы используете локальный сервер (например, VS Code Live Server или npx serve), так как открытие файла напрямую (file://) блокирует работу игры.`;
            overlay.style.display = 'flex';
        } else {
            alert(`КРИТИЧЕСКАЯ ОШИБКА: ${err.message}`);
        }
    }
}

start();

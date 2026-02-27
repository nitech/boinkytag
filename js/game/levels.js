import { WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE, VALID_PLATFORM_TILES, setWorldSize } from './constants.js';
import { gameState, canvas } from './state.js';
import { Platform, BouncePad, BoostTile, Teleport, Enemy, Mushroom } from './entities.js';
import { Player } from './player.js';

export function getLevel1() {
    const platforms = [
        new Platform(0, WORLD_HEIGHT - 50, WORLD_WIDTH, 50, '#8B4513', 0),
    ];
    for (let layer = 0; layer < 25; layer++) {
        const y = WORLD_HEIGHT - 150 - (layer * 180);
        if (y < 0) break;
        for (let x = 0; x < WORLD_WIDTH; x += 400 + (layer % 4) * 100) {
            let platformWidth = 150 + (layer % 3) * 50;
            platformWidth = Math.floor(platformWidth / TILE_SIZE) * TILE_SIZE;
            if (platformWidth < TILE_SIZE) platformWidth = TILE_SIZE;
            if (x + platformWidth > WORLD_WIDTH) break;
            const tileIndex = VALID_PLATFORM_TILES[Math.floor(Math.random() * VALID_PLATFORM_TILES.length)];
            platforms.push(new Platform(x, y, platformWidth, 20, '#8B4513', tileIndex));
        }
    }
    const boostTiles = [];
    const validPlatforms = platforms.filter(p => p.y < WORLD_HEIGHT - 50);
    for (let i = 0; i < 5 && validPlatforms.length > 0; i++) {
        const randomPlatform = validPlatforms[Math.floor(Math.random() * validPlatforms.length)];
        boostTiles.push(new BoostTile(randomPlatform.x + (randomPlatform.width - TILE_SIZE) / 2, randomPlatform.y - TILE_SIZE));
    }
    const bouncePads = [];
    for (let i = 0; i < 16; i++) bouncePads.push(new BouncePad(250 + i * 500, WORLD_HEIGHT - 170, 48, 20));
    bouncePads.push(new BouncePad(1150, WORLD_HEIGHT - 300, 50, 20), new BouncePad(2050, WORLD_HEIGHT - 300, 50, 20), new BouncePad(3050, WORLD_HEIGHT - 300, 50, 20), new BouncePad(4050, WORLD_HEIGHT - 300, 50, 20), new BouncePad(5050, WORLD_HEIGHT - 300, 50, 20), new BouncePad(6050, WORLD_HEIGHT - 300, 50, 20), new BouncePad(7050, WORLD_HEIGHT - 300, 50, 20));
    bouncePads.push(new BouncePad(1550, WORLD_HEIGHT - 480, 50, 20), new BouncePad(2550, WORLD_HEIGHT - 480, 50, 20), new BouncePad(3550, WORLD_HEIGHT - 480, 50, 20), new BouncePad(4550, WORLD_HEIGHT - 480, 50, 20), new BouncePad(5550, WORLD_HEIGHT - 480, 50, 20), new BouncePad(6550, WORLD_HEIGHT - 480, 50, 20));
    return {
        platforms,
        boostTiles,
        bouncePads,
        teleports: [
            new Teleport(100, WORLD_HEIGHT - 100, WORLD_WIDTH - 150, WORLD_HEIGHT - 100),
            new Teleport(WORLD_WIDTH - 150, WORLD_HEIGHT - 100, 100, WORLD_HEIGHT - 100),
            new Teleport(WORLD_WIDTH / 4, WORLD_HEIGHT - 100, WORLD_WIDTH * 3 / 4, WORLD_HEIGHT - 100),
            new Teleport(WORLD_WIDTH * 3 / 4, WORLD_HEIGHT - 100, WORLD_WIDTH / 4, WORLD_HEIGHT - 100),
        ],
        spawnPoints: [
            { x: WORLD_WIDTH / 2 - 100, y: WORLD_HEIGHT - 100 },
            { x: WORLD_WIDTH / 2 + 100, y: WORLD_HEIGHT - 100 },
            { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT - 100 },
            { x: WORLD_WIDTH / 2 - 50, y: WORLD_HEIGHT - 100 },
        ],
        finishPoint: { x: WORLD_WIDTH - 120, y: 100, width: 80, height: 80 },
        enemies: [],
        mushrooms: []
    };
}

export function getLevel2() {
    const platforms = [
        new Platform(0, WORLD_HEIGHT - 50, WORLD_WIDTH, 50, '#8B4513', 2),
    ];
    for (let layer = 0; layer < 25; layer++) {
        const y = WORLD_HEIGHT - 150 - (layer * 180);
        if (y < 0) break;
        for (let x = 0; x < WORLD_WIDTH; x += 400 + (layer % 4) * 100) {
            let platformWidth = 150 + (layer % 3) * 50;
            platformWidth = Math.floor(platformWidth / TILE_SIZE) * TILE_SIZE;
            if (platformWidth < TILE_SIZE) platformWidth = TILE_SIZE;
            if (x + platformWidth > WORLD_WIDTH) break;
            const tileIndex = VALID_PLATFORM_TILES[Math.floor(Math.random() * VALID_PLATFORM_TILES.length)];
            platforms.push(new Platform(x, y, platformWidth, 20, '#8B4513', tileIndex));
        }
    }
    const boostTiles = [];
    const validPlatforms = platforms.filter(p => p.y < WORLD_HEIGHT - 50);
    for (let i = 0; i < 5 && validPlatforms.length > 0; i++) {
        const randomPlatform = validPlatforms[Math.floor(Math.random() * validPlatforms.length)];
        boostTiles.push(new BoostTile(randomPlatform.x + (randomPlatform.width - TILE_SIZE) / 2, randomPlatform.y - TILE_SIZE));
    }
    const bouncePads = [];
    for (let i = 0; i < 18; i++) bouncePads.push(new BouncePad(175 + i * 500, WORLD_HEIGHT - 170, 50, 20));
    bouncePads.push(new BouncePad(575, WORLD_HEIGHT - 330, 50, 20), new BouncePad(1575, WORLD_HEIGHT - 330, 50, 20), new BouncePad(2575, WORLD_HEIGHT - 330, 50, 20), new BouncePad(3575, WORLD_HEIGHT - 330, 50, 20), new BouncePad(4575, WORLD_HEIGHT - 330, 50, 20), new BouncePad(5575, WORLD_HEIGHT - 330, 50, 20), new BouncePad(6575, WORLD_HEIGHT - 330, 50, 20));
    bouncePads.push(new BouncePad(550, WORLD_HEIGHT - 510, 50, 20), new BouncePad(1550, WORLD_HEIGHT - 510, 50, 20), new BouncePad(2550, WORLD_HEIGHT - 510, 50, 20), new BouncePad(3550, WORLD_HEIGHT - 510, 50, 20), new BouncePad(4550, WORLD_HEIGHT - 510, 50, 20), new BouncePad(5550, WORLD_HEIGHT - 510, 50, 20), new BouncePad(6550, WORLD_HEIGHT - 510, 50, 20));
    return {
        platforms,
        boostTiles,
        bouncePads,
        teleports: [
            new Teleport(50, WORLD_HEIGHT - 100, WORLD_WIDTH - 100, WORLD_HEIGHT - 500),
            new Teleport(WORLD_WIDTH - 100, WORLD_HEIGHT - 500, 50, WORLD_HEIGHT - 100),
            new Teleport(WORLD_WIDTH / 2, WORLD_HEIGHT - 100, WORLD_WIDTH / 2, WORLD_HEIGHT - 2000),
        ],
        spawnPoints: [
            { x: WORLD_WIDTH / 2 - 100, y: WORLD_HEIGHT - 100 },
            { x: WORLD_WIDTH / 2 + 100, y: WORLD_HEIGHT - 100 },
            { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT - 100 },
            { x: WORLD_WIDTH / 2 - 50, y: WORLD_HEIGHT - 100 },
        ],
        finishPoint: { x: WORLD_WIDTH - 120, y: 100, width: 80, height: 80 },
        enemies: [],
        mushrooms: []
    };
}

export function getLevel3() {
    const platforms = [
        new Platform(0, WORLD_HEIGHT - 50, WORLD_WIDTH, 50, '#8B4513', 4),
    ];
    for (let layer = 0; layer < 40; layer++) {
        const y = WORLD_HEIGHT - 150 - (layer * 120);
        if (y < 0) break;
        for (let x = 0; x < WORLD_WIDTH; x += 180 + (layer % 5) * 30) {
            let platformWidth = 100 + (layer % 3) * 60;
            platformWidth = Math.floor(platformWidth / TILE_SIZE) * TILE_SIZE;
            if (platformWidth < TILE_SIZE) platformWidth = TILE_SIZE;
            if (x + platformWidth > WORLD_WIDTH) break;
            const tileIndex = VALID_PLATFORM_TILES[Math.floor(Math.random() * VALID_PLATFORM_TILES.length)];
            platforms.push(new Platform(x, y, platformWidth, 20, '#8B4513', tileIndex));
        }
    }
    const boostTiles = [];
    const validPlatforms = platforms.filter(p => p.y < WORLD_HEIGHT - 50);
    for (let i = 0; i < 5 && validPlatforms.length > 0; i++) {
        const randomPlatform = validPlatforms[Math.floor(Math.random() * validPlatforms.length)];
        boostTiles.push(new BoostTile(randomPlatform.x + (randomPlatform.width - TILE_SIZE) / 2, randomPlatform.y - TILE_SIZE));
    }
    const bouncePads = [];
    for (let i = 0; i < 20; i++) bouncePads.push(new BouncePad(150 + i * 400, WORLD_HEIGHT - 200, 50, 20));
    for (let i = 0; i < 19; i++) bouncePads.push(new BouncePad(350 + i * 400, WORLD_HEIGHT - 330, 50, 20));
    for (let i = 0; i < 12; i++) bouncePads.push(new BouncePad(600 + i * 600, WORLD_HEIGHT - 590, 50, 20));
    return {
        platforms,
        boostTiles,
        bouncePads,
        teleports: [
            new Teleport(50, WORLD_HEIGHT - 100, WORLD_WIDTH - 100, WORLD_HEIGHT - 600),
            new Teleport(WORLD_WIDTH - 100, WORLD_HEIGHT - 600, 50, WORLD_HEIGHT - 100),
            new Teleport(WORLD_WIDTH / 2 - 50, WORLD_HEIGHT - 100, WORLD_WIDTH / 2 - 50, WORLD_HEIGHT - 600),
            new Teleport(WORLD_WIDTH / 4, WORLD_HEIGHT - 100, WORLD_WIDTH * 3 / 4, WORLD_HEIGHT - 100),
        ],
        spawnPoints: [
            { x: WORLD_WIDTH / 2 - 100, y: WORLD_HEIGHT - 100 },
            { x: WORLD_WIDTH / 2 + 100, y: WORLD_HEIGHT - 100 },
            { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT - 100 },
            { x: WORLD_WIDTH / 2 - 50, y: WORLD_HEIGHT - 100 },
        ],
        finishPoint: { x: WORLD_WIDTH - 120, y: 100, width: 80, height: 80 },
        enemies: [],
        mushrooms: []
    };
}

export const levelGenerators = [getLevel1, getLevel2, getLevel3];

export function initPlayers(levelData) {
    gameState.players = [];
    const colors = ['#ff4444', '#4444ff', '#44ff44', '#ff44ff'];
    const level = levelData || levelGenerators[gameState.currentLevel]();
    for (let i = 0; i < gameState.playerCount; i++) {
        if (gameState.scores[i] === undefined) gameState.scores[i] = 0;
    }
    for (let i = 0; i < gameState.playerCount; i++) {
        const spawn = (level.spawnPoints && level.spawnPoints[i]) || { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT - 100 };
        const p = new Player(spawn.x, spawn.y, colors[i], i);
        if (gameState.gameMode === 'coop') {
            p.lives = 3;
            p.isIt = false;
        }
        gameState.players.push(p);
    }
    if (gameState.gameMode !== 'coop') {
        const randomItIndex = Math.floor(Math.random() * gameState.players.length);
        for (let i = 0; i < gameState.players.length; i++) {
            gameState.players[i].isIt = (i === randomItIndex);
        }
    }
    if (gameState.players.length > 0 && canvas) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        gameState.players.forEach(player => {
            const centerX = player.x + player.width / 2;
            const centerY = player.y + player.height / 2;
            minX = Math.min(minX, centerX);
            maxX = Math.max(maxX, centerX);
            minY = Math.min(minY, centerY);
            maxY = Math.max(maxY, centerY);
        });
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        gameState.camera.x = centerX;
        gameState.camera.y = centerY;
        const distanceX = maxX - minX;
        const distanceY = maxY - minY;
        const padding = 200;
        if (distanceX > 10 || distanceY > 10) {
            let desiredZoom = Math.min((canvas.width - padding * 2) / (distanceX + padding * 2), (canvas.height - padding * 2) / (distanceY + padding * 2));
            desiredZoom = Math.max(gameState.camera.minZoom, Math.min(gameState.camera.maxZoom, desiredZoom));
            gameState.camera.zoom = desiredZoom;
        } else {
            gameState.camera.zoom = 0.5;
        }
    }
}

export function loadLevel(levelSource, onLoaded) {
    if (!canvas) {
        console.error('Canvas not initialized!');
        return;
    }
    let level;
    if (typeof levelSource === 'number') {
        gameState.currentLevel = levelSource;
        level = levelGenerators[levelSource]();
        setWorldSize(8000, 4800);
    } else {
        gameState.currentLevel = 'custom';
        setWorldSize(levelSource.worldWidth || 8000, levelSource.worldHeight || 4800);
        const elements = levelSource.elements || levelSource;
        level = {
            platforms: (elements.platforms || []).map(p => new Platform(p.x, p.y, p.width, p.height, '#8B4513', p.tileIndex)),
            bouncePads: (elements.bouncePads || []).map(p => new BouncePad(p.x, p.y, p.width, p.height)),
            teleports: (elements.teleports || []).map(p => new Teleport(p.x, p.y, p.targetX, p.targetY)),
            boostTiles: (elements.boostTiles || []).map(p => new BoostTile(p.x, p.y)),
            spawnPoints: elements.spawnPoints || [],
            finishPoint: elements.finishPoint ? { ...elements.finishPoint } : { x: 7880, y: 100, width: 80, height: 80 },
            enemies: (elements.enemies || []).map(e => new Enemy(e.x, e.y, e.width || 40, e.height || 40)),
            mushrooms: (elements.mushrooms || []).map(m => new Mushroom(m.x, m.y, m.width || 48, m.height || 48))
        };
    }
    if (!level.finishPoint) level.finishPoint = { x: WORLD_WIDTH - 120, y: 100, width: 80, height: 80 };
    if (!level.enemies) level.enemies = [];
    if (!level.mushrooms) level.mushrooms = [];
    gameState.finishPoint = level.finishPoint;
    gameState.enemies = level.enemies || [];
    gameState.mushrooms = level.mushrooms || [];
    gameState.bouncePads = level.bouncePads;
    gameState.teleports = level.teleports;
    gameState.boostTiles = level.boostTiles;
    gameState.currentLevelData = level;
    initPlayers(level);
    if (typeof onLoaded === 'function') onLoaded();
}

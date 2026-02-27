export const gameState = {
    players: [],
    currentLevel: 0,
    playerCount: 2,
    gameMode: 'tag', // 'tag' | 'coop'
    gameRunning: false,
    startTime: null,
    gameDuration: 60,
    scores: {},
    roundProcessed: false,
    bouncePads: [],
    teleports: [],
    boostTiles: [],
    currentLevelData: null,
    camera: {
        x: 0,
        y: 0,
        zoom: 1,
        minZoom: 0.1,
        maxZoom: 1.5
    },
    isTestMode: false,
    selectedCustomLevel: null,
    finishPoint: null,
    enemies: [],
    mushrooms: [],
    coopLevelComplete: false,
    coopGameOver: false
};

export let canvas = null;
export let ctx = null;

export function setCanvas(c, context) {
    canvas = c;
    ctx = context;
}

export function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Expose for editor and menu (test mode, level loading)
if (typeof window !== 'undefined') window.gameState = gameState;

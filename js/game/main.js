import { setCanvas, resizeCanvas, gameState } from './state.js';
import { loadPiggyCharacter, loadGoldenPiggyCharacter, loadWorldTileset } from './assets.js';
import { updateMenuCharacterIcons, setupUIHandlers, setupTilesetViewer, initUI } from './ui.js';

async function init() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    const ctx = canvas.getContext('2d', { alpha: true });
    setCanvas(canvas, ctx);
    resizeCanvas();
    await loadPiggyCharacter();
    await loadGoldenPiggyCharacter();
    await loadWorldTileset();
    console.log('World tileset loaded');
    updateMenuCharacterIcons();
    setupUIHandlers();
    setupTilesetViewer();
    initUI();
    window.addEventListener('resize', resizeCanvas);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

import { gameState, resizeCanvas } from './state.js';
import { TILE_SIZE, playerControls } from './constants.js';
import { piggySprites, goldenPiggySprites, worldTileset } from './assets.js';
import { isMobile, keysPressed, touchControls } from './input.js';
import { loadLevel } from './levels.js';
import { gameLoop } from './loop.js';

export function updateScoreDisplay() {
    const scoreContainer = document.getElementById('score-container');
    if (!scoreContainer) return;
    scoreContainer.innerHTML = '';
    if (isMobile && gameState.playerCount === 2 && gameState.players.length >= 2) {
        const scoreText = document.createElement('div');
        scoreText.className = 'score-text-mobile';
        scoreText.textContent = `${gameState.scores[0] || 0}/${gameState.scores[1] || 0}`;
        scoreContainer.appendChild(scoreText);
        return;
    }
    gameState.players.forEach((player) => {
        const score = gameState.scores[player.id] || 0;
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        const characterImg = document.createElement('img');
        characterImg.className = 'score-character';
        let imageSet = false;
        if (player.id === 0 && piggySprites.length > 0) {
            const spriteData = piggySprites[0];
            if (spriteData?.image?.complete) {
                try {
                    const c = document.createElement('canvas');
                    c.width = spriteData.width;
                    c.height = spriteData.height;
                    const ctx = c.getContext('2d');
                    ctx.drawImage(spriteData.image, 0, 0);
                    characterImg.src = c.toDataURL();
                    imageSet = true;
                } catch (e) {}
            }
        } else if (player.id === 1 && goldenPiggySprites.length > 0) {
            const spriteData = goldenPiggySprites[0];
            if (spriteData?.image?.complete) {
                try {
                    const c = document.createElement('canvas');
                    c.width = spriteData.width;
                    c.height = spriteData.height;
                    const ctx = c.getContext('2d');
                    ctx.drawImage(spriteData.image, 0, 0);
                    characterImg.src = c.toDataURL();
                    imageSet = true;
                } catch (e) {}
            }
        }
        if (!imageSet) {
            characterImg.style.backgroundColor = player.color;
            characterImg.style.width = '40px';
            characterImg.style.height = '40px';
            characterImg.style.border = '2px solid #000';
        }
        const scoreNumber = document.createElement('div');
        scoreNumber.className = 'score-number';
        scoreNumber.textContent = score;
        scoreItem.appendChild(characterImg);
        scoreItem.appendChild(scoreNumber);
        scoreContainer.appendChild(scoreItem);
    });
}

export function updateMenuCharacterIcons() {
    for (let i = 1; i <= 4; i++) {
        const iconContainer = document.getElementById(`icon-p${i}`);
        if (!iconContainer) continue;
        let spriteData = null;
        let color = '#fff';
        if (i === 1 && piggySprites.length > 0) spriteData = piggySprites[0];
        else if (i === 2 && goldenPiggySprites.length > 0) spriteData = goldenPiggySprites[0];
        else color = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'][i - 1];
        if (spriteData?.image?.complete) {
            try {
                const c = document.createElement('canvas');
                c.width = spriteData.width;
                c.height = spriteData.height;
                c.getContext('2d').drawImage(spriteData.image, 0, 0);
                const img = document.createElement('img');
                img.src = c.toDataURL();
                iconContainer.innerHTML = '';
                iconContainer.appendChild(img);
            } catch (e) {}
        } else {
            iconContainer.style.color = color;
            iconContainer.style.fontWeight = 'bold';
            iconContainer.textContent = `P${i}`;
        }
    }
}

export function setupMobileControls() {
    if (!isMobile || gameState.playerCount !== 2) return;
    const gameScreen = document.getElementById('game-screen');
    if (!gameScreen) return;
    const existingControls = document.getElementById('mobile-controls');
    if (existingControls) existingControls.remove();
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'mobile-controls';
    controlsContainer.className = 'mobile-controls';
    const p1Controls = document.createElement('div');
    p1Controls.className = 'player-controls player-1-controls';
    p1Controls.innerHTML = '<div class="control-column"><button class="control-btn jump-btn" data-player="1" data-action="jump" aria-label="Hopp">↑</button><div class="control-row"><button class="control-btn left-btn" data-player="1" data-action="left" aria-label="Venstre">←</button><button class="control-btn right-btn" data-player="1" data-action="right" aria-label="Høyre">→</button></div></div>';
    const p2Controls = document.createElement('div');
    p2Controls.className = 'player-controls player-2-controls';
    p2Controls.innerHTML = '<div class="control-column"><button class="control-btn jump-btn" data-player="2" data-action="jump" aria-label="Hopp">↑</button><div class="control-row"><button class="control-btn left-btn" data-player="2" data-action="left" aria-label="Venstre">←</button><button class="control-btn right-btn" data-player="2" data-action="right" aria-label="Høyre">→</button></div></div>';
    controlsContainer.appendChild(p1Controls);
    controlsContainer.appendChild(p2Controls);
    gameScreen.appendChild(controlsContainer);
    const handleButtonTouchStart = (e) => {
        e.preventDefault();
        const btn = e.target.closest('.control-btn');
        if (!btn) return;
        const player = btn.dataset.player;
        const action = btn.dataset.action;
        if (player === '1') {
            if (action === 'jump') keysPressed[playerControls[0].up] = true;
            else touchControls.player1[action] = true;
        } else if (player === '2') {
            if (action === 'jump') keysPressed[playerControls[1].up] = true;
            else touchControls.player2[action] = true;
        }
        btn.classList.add('active');
    };
    const handleButtonTouchEnd = (e) => {
        const btn = e.target.closest('.control-btn');
        if (!btn) return;
        const player = btn.dataset.player;
        const action = btn.dataset.action;
        if (player === '1' && action !== 'jump') touchControls.player1[action] = false;
        else if (player === '2' && action !== 'jump') touchControls.player2[action] = false;
        btn.classList.remove('active');
    };
    const handleButtonTouchCancel = () => {
        touchControls.player1 = { left: false, right: false, jump: false };
        touchControls.player2 = { left: false, right: false, jump: false };
        controlsContainer.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
    };
    controlsContainer.addEventListener('touchstart', handleButtonTouchStart, { passive: false });
    controlsContainer.addEventListener('touchend', handleButtonTouchEnd, { passive: false });
    controlsContainer.addEventListener('touchcancel', handleButtonTouchCancel);
    controlsContainer.addEventListener('mousedown', (e) => { e.preventDefault(); handleButtonTouchStart(e); });
    controlsContainer.addEventListener('mouseup', (e) => { e.preventDefault(); handleButtonTouchEnd(e); });
    controlsContainer.addEventListener('mouseleave', handleButtonTouchCancel);
}

export function updateControlsVisibility(count) {
    for (let i = 1; i <= 4; i++) {
        const controlItem = document.getElementById(`controls-p${i}`);
        if (controlItem) {
            controlItem.classList.toggle('hidden', i > count);
        }
    }
}

export function showTilesetViewer() {
    if (!worldTileset?.complete) {
        alert('Tileset er ikke lastet ennå. Vent litt og prøv igjen.');
        return;
    }
    const modal = document.getElementById('tileset-viewer-modal');
    const content = document.getElementById('tileset-viewer-content');
    if (!modal || !content) return;
    const tilesPerRow = Math.floor(worldTileset.width / TILE_SIZE);
    const totalTiles = tilesPerRow * Math.floor(worldTileset.height / TILE_SIZE);
    const grid = document.createElement('div');
    grid.className = 'tileset-grid';
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = TILE_SIZE;
    tempCanvas.height = TILE_SIZE;
    const tempCtx = tempCanvas.getContext('2d', { alpha: true });
    tempCtx.imageSmoothingEnabled = false;
    for (let tileIndex = 0; tileIndex < totalTiles; tileIndex++) {
        const row = Math.floor(tileIndex / tilesPerRow);
        const col = tileIndex % tilesPerRow;
        tempCtx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
        tempCtx.drawImage(worldTileset, col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE, 0, 0, TILE_SIZE, TILE_SIZE);
        const tileItem = document.createElement('div');
        tileItem.className = 'tile-item';
        const preview = document.createElement('img');
        preview.className = 'tile-preview';
        preview.src = tempCanvas.toDataURL();
        const tileNumber = document.createElement('div');
        tileNumber.className = 'tile-number';
        tileNumber.textContent = `Tile ${tileIndex}`;
        tileItem.appendChild(preview);
        tileItem.appendChild(tileNumber);
        grid.appendChild(tileItem);
    }
    content.innerHTML = '';
    content.appendChild(grid);
    modal.classList.add('active');
}

export function closeTilesetViewer() {
    document.getElementById('tileset-viewer-modal')?.classList.remove('active');
}

export function setupTilesetViewer() {
    const viewerBtn = document.getElementById('tileset-viewer-btn');
    const closeBtn = document.getElementById('close-tileset-viewer');
    const modal = document.getElementById('tileset-viewer-modal');
    if (viewerBtn) viewerBtn.addEventListener('click', showTilesetViewer);
    if (closeBtn) closeBtn.addEventListener('click', closeTilesetViewer);
    if (modal) {
        modal.addEventListener('click', (e) => { if (e.target === modal) closeTilesetViewer(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('active')) closeTilesetViewer(); });
    }
}

export function setupUIHandlers() {
    const startBtn = document.getElementById('start-btn');
    const menuBtn = document.getElementById('menu-btn');
    if (!startBtn || !menuBtn) return;
    gameState.onRoundEnd = updateScoreDisplay;
    window.startGame = (testMode = false) => {
        if (isMobile) gameState.playerCount = 2;
        gameState.scores = {};
        gameState.roundProcessed = false;
        gameState.coopLevelComplete = false;
        gameState.coopGameOver = false;
        gameState.isTestMode = testMode === true;
        if (gameState.selectedCustomLevel) loadLevel(gameState.selectedCustomLevel, afterLoad);
        else loadLevel(gameState.currentLevel, afterLoad);
        function afterLoad() {
            updateScoreDisplay();
        }
        const mBtn = document.getElementById('menu-btn');
        if (mBtn) mBtn.textContent = gameState.isTestMode ? 'Til editoren' : 'Meny';
        gameState.gameRunning = true;
        gameState.startTime = Date.now();
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('game-screen').classList.add('active');
        resizeCanvas();
        if (isMobile && gameState.playerCount === 2) setupMobileControls();
        else document.getElementById('mobile-controls')?.remove();
        updateScoreDisplay();
        gameLoop();
    };
    startBtn.addEventListener('click', () => window.startGame());
    menuBtn.addEventListener('click', () => {
        gameState.gameRunning = false;
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('mobile-controls')?.remove();
        document.getElementById('coop-overlay')?.style.setProperty('display', 'none');
        if (gameState.isTestMode) document.getElementById('editor-screen').classList.add('active');
        else document.getElementById('menu-screen').classList.add('active');
    });
    const coopOverlayBtn = document.getElementById('coop-overlay-btn');
    if (coopOverlayBtn) coopOverlayBtn.addEventListener('click', () => menuBtn.click());
}

function showGameSetupForMode(mode) {
    gameState.gameMode = mode;
    const modeSelect = document.getElementById('mode-select');
    const gameSetup = document.getElementById('game-setup');
    if (modeSelect) modeSelect.style.display = 'none';
    if (gameSetup) gameSetup.style.display = 'block';
    const btn1 = document.querySelector('.player-count-btn[data-count="1"]');
    const btn3 = document.querySelector('.player-count-btn[data-count="3"]');
    const btn4 = document.querySelector('.player-count-btn[data-count="4"]');
    if (mode === 'coop') {
        if (btn1) btn1.style.display = '';
        if (btn3) btn3.style.display = 'none';
        if (btn4) btn4.style.display = 'none';
        gameState.playerCount = 2;
        document.querySelectorAll('.player-count-btn').forEach(b => b.classList.remove('selected'));
        const twoBtn = document.querySelector('.player-count-btn[data-count="2"]');
        if (twoBtn) twoBtn.classList.add('selected');
    } else {
        if (btn1) btn1.style.display = 'none';
        if (btn3) btn3.style.display = '';
        if (btn4) btn4.style.display = '';
        gameState.playerCount = 2;
        document.querySelectorAll('.player-count-btn').forEach(b => b.classList.remove('selected'));
        const twoBtn = document.querySelector('.player-count-btn[data-count="2"]');
        if (twoBtn) twoBtn.classList.add('selected');
    }
    updateControlsVisibility(gameState.playerCount);
}

export function initUI() {
    const modeTagBtn = document.getElementById('mode-tag-btn');
    const modeCoopBtn = document.getElementById('mode-coop-btn');
    const mapEditorBtn = document.getElementById('map-editor-btn');
    const backToModeBtn = document.getElementById('back-to-mode-btn');
    if (modeTagBtn) modeTagBtn.addEventListener('click', () => showGameSetupForMode('tag'));
    if (modeCoopBtn) modeCoopBtn.addEventListener('click', () => showGameSetupForMode('coop'));
    if (mapEditorBtn) {
        mapEditorBtn.addEventListener('click', () => {
            if (window.editor) window.editor.showLevelLoader('editorEntry');
        });
    }
    if (backToModeBtn) {
        backToModeBtn.addEventListener('click', () => {
            document.getElementById('game-setup').style.display = 'none';
            document.getElementById('mode-select').style.display = '';
        });
    }
    const firstLevelBtn = document.querySelector('.level-btn');
    if (firstLevelBtn) firstLevelBtn.classList.add('selected');
    if (isMobile) {
        gameState.playerCount = 2;
        document.querySelector('.player-count-btn[data-count="3"]')?.style.setProperty('display', 'none');
        document.querySelector('.player-count-btn[data-count="4"]')?.style.setProperty('display', 'none');
    }
    const defaultPlayerBtn = document.querySelector('.player-count-btn[data-count="2"]');
    if (defaultPlayerBtn) {
        defaultPlayerBtn.classList.add('selected');
        if (!isMobile) gameState.playerCount = 2;
        updateControlsVisibility(gameState.playerCount);
    }
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            if (btn.dataset.level !== undefined) {
                gameState.currentLevel = parseInt(btn.dataset.level);
                gameState.selectedCustomLevel = null;
            }
        });
    });
    document.querySelectorAll('.player-count-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (isMobile && parseInt(btn.dataset.count) !== 2) return;
            document.querySelectorAll('.player-count-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            gameState.playerCount = parseInt(btn.dataset.count);
            updateControlsVisibility(gameState.playerCount);
        });
    });
}

import { gameState, ctx, canvas } from './state.js';
import { handleInput } from './input.js';
import { checkCollisions } from './collision.js';
import { updateCamera, cameraForPlayer } from './camera.js';
import { SPLIT_THRESHOLD } from './constants.js';

function drawWorld(cam, viewport) {
    const vp = viewport || { x: 0, y: 0, width: canvas.width, height: canvas.height };
    ctx.save();
    ctx.beginPath();
    ctx.rect(vp.x, vp.y, vp.width, vp.height);
    ctx.clip();
    ctx.translate(vp.x + vp.width / 2, vp.y + vp.height / 2);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);
    const level = gameState.currentLevelData;
    level.platforms.forEach(platform => platform.draw());
    gameState.bouncePads.forEach(pad => pad.draw());
    gameState.teleports.forEach(tp => tp.draw());
    gameState.boostTiles.forEach(bt => bt.draw());
    const fp = gameState.finishPoint;
    if (fp) {
        ctx.fillStyle = 'rgba(0, 200, 0, 0.5)';
        ctx.strokeStyle = '#0a0';
        ctx.lineWidth = 3 / cam.zoom;
        ctx.fillRect(fp.x, fp.y, fp.width, fp.height);
        ctx.strokeRect(fp.x, fp.y, fp.width, fp.height);
    }
    (gameState.enemies || []).forEach(e => e.draw());
    (gameState.mushrooms || []).forEach(m => m.draw());
    gameState.players.forEach(player => player.draw());
    ctx.restore();
}

export function gameLoop() {
    if (!gameState.gameRunning || !canvas || !ctx) return;
    if (gameState.coopGameOver || gameState.coopLevelComplete) {
        requestAnimationFrame(gameLoop);
        return;
    }
    const level = gameState.currentLevelData;
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    handleInput();
    gameState.teleports.forEach(tp => tp.update());
    gameState.boostTiles.forEach(bt => bt.update());
    gameState.players.forEach(player => player.update(level.platforms));
    checkCollisions();
    const isCoop2P = gameState.gameMode === 'coop' && gameState.playerCount === 2 && gameState.players.length >= 2;
    if (isCoop2P) {
        const p1 = gameState.players[0];
        const p2 = gameState.players[1];
        const cx1 = p1.x + p1.width / 2;
        const cy1 = p1.y + p1.height / 2;
        const cx2 = p2.x + p2.width / 2;
        const cy2 = p2.y + p2.height / 2;
        const dist = Math.sqrt((cx2 - cx1) ** 2 + (cy2 - cy1) ** 2);
        if (dist >= SPLIT_THRESHOLD) {
            const halfW = canvas.width / 2;
            drawWorld(cameraForPlayer(0, halfW, canvas.height), { x: 0, y: 0, width: halfW, height: canvas.height });
            drawWorld(cameraForPlayer(1, halfW, canvas.height), { x: halfW, y: 0, width: halfW, height: canvas.height });
            ctx.save();
            ctx.resetTransform();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.moveTo(halfW, 0);
            ctx.lineTo(halfW, canvas.height);
            ctx.stroke();
            ctx.restore();
        } else {
            updateCamera();
            drawWorld(gameState.camera, null);
        }
    } else {
        updateCamera();
        drawWorld(gameState.camera, null);
    }
    if (gameState.gameMode === 'coop') {
        const overlay = document.getElementById('coop-overlay');
        const overlayText = document.getElementById('coop-overlay-text');
        const livesContainer = document.getElementById('lives-container');
        const timerWrap = document.querySelector('#game-ui > div');
        if (livesContainer) {
            livesContainer.style.display = '';
            livesContainer.innerHTML = gameState.players.map((p, i) => `P${i + 1}: ${'♥'.repeat(p.lives || 0)}${'♡'.repeat(3 - (p.lives || 0))}`).join('  ');
        }
        if (timerWrap) timerWrap.style.display = 'none';
        if (gameState.coopLevelComplete && overlay && overlayText) {
            overlay.style.display = 'flex';
            overlayText.textContent = 'Level complete!';
        } else if (gameState.coopGameOver && overlay && overlayText) {
            overlay.style.display = 'flex';
            overlayText.textContent = 'Game over';
        }
    } else {
        const livesContainer = document.getElementById('lives-container');
        const timerWrap = document.querySelector('#game-ui > div');
        if (livesContainer) livesContainer.style.display = 'none';
        if (timerWrap) timerWrap.style.display = '';
    }
    if (gameState.gameMode === 'tag' && gameState.startTime) {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const remaining = Math.max(0, gameState.gameDuration - elapsed);
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        const timerElement = document.getElementById('timer');
        if (timerElement) timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        if (remaining <= 0 && !gameState.roundProcessed) {
            const playerNotIt = gameState.players.find(p => !p.isIt);
            if (playerNotIt) {
                gameState.scores[playerNotIt.id] = (gameState.scores[playerNotIt.id] || 0) + 1;
                gameState.roundProcessed = true;
                gameState.startTime = Date.now();
                if (typeof gameState.onRoundEnd === 'function') gameState.onRoundEnd();
            }
        }
        if (remaining >= gameState.gameDuration - 1) gameState.roundProcessed = false;
    }
    requestAnimationFrame(gameLoop);
}

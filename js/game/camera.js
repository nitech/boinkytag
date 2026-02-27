import { WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';
import { gameState, canvas } from './state.js';

export function updateCamera() {
    if (gameState.players.length === 0 || !canvas) return;
    const cam = gameState.camera;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    gameState.players.forEach(player => {
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;
        minX = Math.min(minX, centerX);
        maxX = Math.max(maxX, centerX);
        minY = Math.min(minY, centerY);
        maxY = Math.max(maxY, centerY);
    });
    const distanceX = maxX - minX;
    const distanceY = maxY - minY;
    const padding = 200;
    const minDistance = 80;
    const adjustedDistanceX = Math.max(distanceX, minDistance);
    const adjustedDistanceY = Math.max(distanceY, minDistance);
    let desiredZoom = Math.min((canvas.width - padding) / (adjustedDistanceX + padding), (canvas.height - padding) / (adjustedDistanceY + padding));
    desiredZoom = Math.max(cam.minZoom, Math.min(cam.maxZoom, desiredZoom));
    cam.zoom += (desiredZoom - cam.zoom) * 0.1;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    cam.x += (centerX - cam.x) * 0.1;
    cam.y += (centerY - cam.y) * 0.1;
    const viewWidth = canvas.width / cam.zoom;
    const viewHeight = canvas.height / cam.zoom;
    cam.x = Math.max(viewWidth / 2, Math.min(WORLD_WIDTH - viewWidth / 2, cam.x));
    cam.y = Math.max(viewHeight / 2, Math.min(WORLD_HEIGHT - viewHeight / 2, cam.y));
}

export function cameraForPlayer(playerIndex, viewWidth = null, viewHeight = null) {
    const player = gameState.players[playerIndex];
    if (!player || !canvas) return gameState.camera;
    const cam = gameState.camera;
    const vw = viewWidth ?? canvas.width;
    const vh = viewHeight ?? canvas.height;
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    const worldViewW = vw / cam.zoom;
    const worldViewH = vh / cam.zoom;
    return {
        x: Math.max(worldViewW / 2, Math.min(WORLD_WIDTH - worldViewW / 2, centerX)),
        y: Math.max(worldViewH / 2, Math.min(WORLD_HEIGHT - worldViewH / 2, centerY)),
        zoom: cam.zoom,
        minZoom: cam.minZoom,
        maxZoom: cam.maxZoom
    };
}

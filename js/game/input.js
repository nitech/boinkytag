import { gameState } from './state.js';
import { playerControls } from './constants.js';

export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    ('ontouchstart' in window && (window.innerWidth <= 768 || window.innerHeight <= 768));

export const keys = {};
export const keysPressed = {};

export const touchControls = {
    player1: { left: false, right: false, jump: false },
    player2: { left: false, right: false, jump: false }
};

document.addEventListener('keydown', (e) => {
    if (!keys[e.code]) keysPressed[e.code] = true;
    keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    keysPressed[e.code] = false;
});

export function handleInput() {
    if (!gameState.gameRunning) return;
    gameState.players.forEach((player, index) => {
        if (index >= playerControls.length) return;
        const controls = playerControls[index];
        player.velocityX = 0;
        if (isMobile && gameState.playerCount === 2) {
            const touchState = index === 0 ? touchControls.player1 : touchControls.player2;
            if (touchState.left) player.velocityX = -player.speed;
            if (touchState.right) player.velocityX = player.speed;
        } else {
            if (keys[controls.left]) player.velocityX = -player.speed;
            if (keys[controls.right]) player.velocityX = player.speed;
        }
        if (keysPressed[controls.up]) {
            if (player.jumpsUsed < player.maxJumps) {
                player.velocityY = -player.jumpPower;
                player.jumpsUsed++;
                player.onGround = false;
            }
        }
    });
    Object.keys(keysPressed).forEach(key => { keysPressed[key] = false; });
}

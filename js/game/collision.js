import { WORLD_HEIGHT, TILE_SIZE } from './constants.js';
import { gameState } from './state.js';
import { BoostTile } from './entities.js';

export function checkCollisions() {
    if (!gameState.currentLevelData) return;
    gameState.players.forEach(player => {
        gameState.bouncePads.forEach(pad => {
            if (pad.checkCollision(player)) {
                player.velocityY = -pad.bouncePower;
                player.onGround = false;
            }
        });
    });
    gameState.players.forEach(player => {
        gameState.teleports.forEach(teleport => {
            if (teleport.checkCollision(player)) {
                player.x = teleport.targetX;
                player.y = teleport.targetY;
                teleport.used = true;
            }
        });
    });
    gameState.players.forEach(player => {
        for (let i = gameState.boostTiles.length - 1; i >= 0; i--) {
            const boostTile = gameState.boostTiles[i];
            if (boostTile.checkCollision(player)) {
                player.boostTime = Date.now() + 8000;
                gameState.boostTiles.splice(i, 1);
                const level = gameState.currentLevelData;
                if (level?.platforms) {
                    const validPlatforms = level.platforms.filter(p => p.y < WORLD_HEIGHT - 50);
                    if (validPlatforms.length > 0) {
                        const randomPlatform = validPlatforms[Math.floor(Math.random() * validPlatforms.length)];
                        gameState.boostTiles.push(new BoostTile(randomPlatform.x + (randomPlatform.width - TILE_SIZE) / 2, randomPlatform.y - TILE_SIZE));
                    }
                }
                break;
            }
        }
    });
    if (gameState.gameMode === 'tag') {
        const playerWithTag = gameState.players.find(p => p.isIt);
        if (playerWithTag && playerWithTag.tagImmunityTime <= Date.now()) {
            for (const otherPlayer of gameState.players) {
                if (playerWithTag.id === otherPlayer.id) continue;
                if (playerWithTag.collidesWith(otherPlayer)) {
                    playerWithTag.isIt = false;
                    otherPlayer.isIt = true;
                    otherPlayer.tagImmunityTime = Date.now() + 2000;
                    break;
                }
            }
        }
        return;
    }
    if (gameState.gameMode === 'coop') {
        const fp = gameState.finishPoint;
        const enemies = gameState.enemies || [];
        const mushrooms = gameState.mushrooms || [];
        gameState.players.forEach(player => {
            enemies.forEach(enemy => {
                if (enemy.dead) return;
                if (!enemy.overlaps(player)) return;
                if (enemy.isStomp(player)) {
                    enemy.dead = true;
                    player.velocityY = -8;
                } else {
                    if (player.lives !== undefined && (player.invincibleUntil || 0) <= Date.now()) {
                        player.lives = Math.max(0, (player.lives || 3) - 1);
                        player.invincibleUntil = Date.now() + 1500;
                    }
                }
            });
            mushrooms.forEach(mush => {
                if (mush.checkCollision(player)) {
                    mush.collected = true;
                    if (player.lives !== undefined) player.lives = Math.min(3, (player.lives || 0) + 1);
                }
            });
        });
        if (fp && gameState.players.length > 0 && gameState.players.every(p => {
            return p.x < fp.x + fp.width && p.x + p.width > fp.x &&
                p.y < fp.y + fp.height && p.y + p.height > fp.y;
        })) {
            gameState.coopLevelComplete = true;
        }
        const anyDead = gameState.players.some(p => (p.lives || 0) <= 0);
        if (anyDead) gameState.coopGameOver = true;
    }
}

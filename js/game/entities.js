import { ctx } from './state.js';
import { worldTileset } from './assets.js';
import { TILE_SIZE } from './constants.js';

export class Platform {
    constructor(x, y, width, height, color = '#8B4513', tileIndex = 0) {
        this.x = x;
        this.y = y;
        this.width = Math.floor(width / TILE_SIZE) * TILE_SIZE;
        if (this.width < TILE_SIZE) this.width = TILE_SIZE;
        this.height = height;
        this.color = color;
        this.tileIndex = tileIndex;
    }

    draw() {
        if (!ctx || !worldTileset) return;
        ctx.imageSmoothingEnabled = false;
        const numTiles = Math.floor(this.width / TILE_SIZE);
        const tilesPerRow = Math.floor(worldTileset.width / TILE_SIZE);
        const tileRow = Math.floor(this.tileIndex / tilesPerRow);
        const tileCol = this.tileIndex % tilesPerRow;
        const spriteX = tileCol * TILE_SIZE;
        const spriteY = tileRow * TILE_SIZE;
        for (let i = 0; i < numTiles; i++) {
            const tileX = this.x + (i * TILE_SIZE);
            ctx.drawImage(
                worldTileset,
                spriteX, spriteY, TILE_SIZE, TILE_SIZE,
                tileX, this.y, TILE_SIZE, this.height
            );
        }
    }
}

export class BouncePad {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = Math.floor(width / TILE_SIZE) * TILE_SIZE;
        if (this.width < TILE_SIZE) this.width = TILE_SIZE;
        this.height = height;
        this.bouncePower = 33;
    }

    draw() {
        if (!ctx || !worldTileset) return;
        ctx.imageSmoothingEnabled = false;
        const numTiles = Math.floor(this.width / TILE_SIZE);
        const tilesPerRow = Math.floor(worldTileset.width / TILE_SIZE);
        const tileIndex = 133;
        const tileRow = Math.floor(tileIndex / tilesPerRow);
        const tileCol = tileIndex % tilesPerRow;
        const spriteX = tileCol * TILE_SIZE;
        const spriteY = tileRow * TILE_SIZE;
        for (let i = 0; i < numTiles; i++) {
            const tileX = this.x + (i * TILE_SIZE);
            ctx.drawImage(
                worldTileset,
                spriteX, spriteY, TILE_SIZE, TILE_SIZE,
                tileX, this.y, TILE_SIZE, this.height
            );
        }
    }

    checkCollision(player) {
        return player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y;
    }
}

export class BoostTile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE * 3;
        this.height = TILE_SIZE * 3;
        this.tileIndex = 87;
        this.pulse = 0;
    }

    update() {
        this.pulse += 0.1;
    }

    draw() {
        if (!ctx || !worldTileset) return;
        ctx.imageSmoothingEnabled = false;
        const tilesPerRow = Math.floor(worldTileset.width / TILE_SIZE);
        const tileRow = Math.floor(this.tileIndex / tilesPerRow);
        const tileCol = this.tileIndex % tilesPerRow;
        const spriteX = tileCol * TILE_SIZE;
        const spriteY = tileRow * TILE_SIZE;
        ctx.drawImage(
            worldTileset,
            spriteX, spriteY, TILE_SIZE, TILE_SIZE,
            this.x, this.y, this.width, this.height
        );
    }

    checkCollision(player) {
        return player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y;
    }
}

export class Teleport {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.targetX = targetX;
        this.targetY = targetY;
        this.used = false;
        this.pulse = 0;
    }

    update() {
        this.pulse += 0.1;
    }

    draw() {
        if (!ctx || this.used) return;
        const alpha = 0.5 + Math.sin(this.pulse) * 0.3;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚡', this.x + this.width / 2, this.y + this.height / 2 + 7);
        ctx.globalAlpha = 1;
    }

    checkCollision(player) {
        if (this.used) return false;
        return player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y;
    }
}

export class Enemy {
    constructor(x, y, width = 40, height = 40) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.dead = false;
    }

    draw() {
        if (!ctx || this.dead) return;
        ctx.fillStyle = '#c00';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, Math.min(this.width, this.height) / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#800';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    overlaps(player) {
        return player.x < this.x + this.width && player.x + player.width > this.x &&
            player.y < this.y + this.height && player.y + player.height > this.y;
    }

    isStomp(player) {
        return player.velocityY > 0 && player.y + player.height - player.velocityY <= this.y + 10;
    }
}

export class Mushroom {
    constructor(x, y, width = 48, height = 48) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.collected = false;
    }

    draw() {
        if (!ctx || this.collected) return;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y + this.height / 2, this.width, this.height / 2);
        ctx.fillStyle = '#dc143c';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 4, this.width / 2, this.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    checkCollision(player) {
        return !this.collected && player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y;
    }
}

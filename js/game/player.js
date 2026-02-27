import { canvas, ctx } from './state.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';
import { piggySprites, goldenPiggySprites, piggyCharacter, goldenPiggyCharacter } from './assets.js';

export class Player {
    constructor(x, y, color, id) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.color = color;
        this.id = id;
        this.speed = 5;
        this.isIt = false;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.jumpPower = 12;
        this.gravity = 0.6;
        this.tagImmunityTime = 0;
        this.animationFrame = 0;
        this.lastAnimationTime = Date.now();
        this.isMoving = false;
        this.jumpsUsed = 0;
        this.maxJumps = 2;
        this.jumpPressed = false;
        this.sparkleTrail = [];
        this.lastTrailPosition = { x, y };
        this.trailUpdateInterval = 50;
        this.lastTrailUpdate = Date.now();
        this.boostTime = 0;
        this.boostParticles = [];
        this.baseSpeed = this.speed;
        this.baseJumpPower = this.jumpPower;
        this.lives = 3; // used in co-op mode
        this.invincibleUntil = 0; // co-op: no damage while > Date.now()
    }

    update(platforms) {
        if (!canvas) return;
        const isBoosted = this.boostTime > Date.now();
        if (isBoosted) {
            this.speed = this.baseSpeed * 1.5;
            this.jumpPower = this.baseJumpPower * 1.5;
        } else {
            this.speed = this.baseSpeed;
            this.jumpPower = this.baseJumpPower;
        }
        if (isBoosted) {
            const currentTime = Date.now();
            if (currentTime - this.lastTrailUpdate >= 50) {
                const particleCount = 2 + Math.floor(Math.random() * 3);
                for (let i = 0; i < particleCount; i++) {
                    this.boostParticles.push({
                        x: this.x + this.width / 2 + (Math.random() - 0.5) * this.width,
                        y: this.y + this.height / 2 + (Math.random() - 0.5) * this.height,
                        vx: (Math.random() - 0.5) * 2,
                        vy: -Math.random() * 1 - 0.5,
                        color: `hsl(${Math.random() * 360}, 100%, ${50 + Math.random() * 50}%)`,
                        life: 1.0,
                        size: 3 + Math.random() * 3
                    });
                }
                this.lastTrailUpdate = currentTime;
            }
        }
        this.boostParticles = this.boostParticles.filter(particle => {
            particle.life -= 0.016;
            particle.vy += 0.3;
            particle.x += particle.vx;
            particle.y += particle.vy;
            return particle.life > 0;
        });
        if (!this.onGround) this.velocityY += this.gravity;
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.onGround = false;
        for (const platform of platforms) {
            if (this.collidesWith(platform)) {
                if (this.velocityY > 0 && this.y - this.height < platform.y + 10) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.onGround = true;
                    this.jumpsUsed = 0;
                }
                if (this.velocityX > 0 && this.x - this.width < platform.x + 10 && this.y + this.height > platform.y && this.y < platform.y + platform.height) {
                    this.x = platform.x - this.width;
                    this.velocityX = 0;
                } else if (this.velocityX < 0 && this.x > platform.x + platform.width - 10 && this.y + this.height > platform.y && this.y < platform.y + platform.height) {
                    this.x = platform.x + platform.width;
                    this.velocityX = 0;
                }
            }
        }
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > WORLD_WIDTH) this.x = WORLD_WIDTH - this.width;
        if (this.y < 0) { this.y = 0; this.velocityY = 0; }
        if (this.y + this.height > WORLD_HEIGHT) {
            this.y = WORLD_HEIGHT - this.height;
            this.velocityY = 0;
            this.onGround = true;
            this.jumpsUsed = 0;
        }
        this.velocityX *= 0.85;
        this.isMoving = Math.abs(this.velocityX) > 0.1 || Math.abs(this.velocityY) > 0.1;
        if (this.isIt && this.isMoving) {
            const currentTime = Date.now();
            const distance = Math.sqrt(Math.pow(this.x - this.lastTrailPosition.x, 2) + Math.pow(this.y - this.lastTrailPosition.y, 2));
            if (currentTime - this.lastTrailUpdate >= this.trailUpdateInterval || distance > 10) {
                this.sparkleTrail.push({
                    x: this.x + this.width / 2,
                    y: this.y + this.height / 2,
                    life: 1.0,
                    size: 4 + Math.random() * 3,
                    angle: Math.random() * Math.PI * 2,
                    speed: 0.3 + Math.random() * 0.4
                });
                this.lastTrailPosition = { x: this.x, y: this.y };
                this.lastTrailUpdate = currentTime;
            }
        }
        this.sparkleTrail = this.sparkleTrail.filter(sparkle => {
            sparkle.life -= 0.008;
            sparkle.y += sparkle.speed;
            sparkle.x += Math.sin(sparkle.angle) * 0.5;
            return sparkle.life > 0;
        });
        const currentTime = Date.now();
        if (this.id === 0 && piggySprites.length > 0) {
            if (this.isMoving) {
                if (currentTime - this.lastAnimationTime >= 150) {
                    this.animationFrame = (this.animationFrame + 1) % piggySprites.length;
                    this.lastAnimationTime = currentTime;
                }
            } else {
                this.animationFrame = 0;
                this.lastAnimationTime = currentTime;
            }
        } else if (this.id === 1 && goldenPiggySprites.length > 0) {
            if (this.isMoving) {
                if (currentTime - this.lastAnimationTime >= 150) {
                    this.animationFrame = (this.animationFrame + 1) % goldenPiggySprites.length;
                    this.lastAnimationTime = currentTime;
                }
            } else {
                this.animationFrame = 0;
                this.lastAnimationTime = currentTime;
            }
        }
    }

    collidesWith(rect) {
        return this.x < rect.x + rect.width &&
            this.x + this.width > rect.x &&
            this.y < rect.y + rect.height &&
            this.y + this.height > rect.y;
    }

    draw() {
        if (!ctx) return;
        const hasImmunity = this.tagImmunityTime > Date.now() || this.invincibleUntil > Date.now();
        const blinkAlpha = hasImmunity ? 0.4 + Math.sin(Date.now() / 150) * 0.4 : 1;
        if (this.id === 0 && piggySprites.length > 0 && piggyCharacter?.layers?.[0]?.sprites) {
            ctx.save();
            if (hasImmunity) ctx.globalAlpha = blinkAlpha;
            else ctx.globalAlpha = 1;
            ctx.imageSmoothingEnabled = false;
            ctx.globalCompositeOperation = 'source-over';
            let maxWidth = 0, maxHeight = 0;
            for (const spriteData of piggySprites) {
                maxWidth = Math.max(maxWidth, spriteData.width);
                maxHeight = Math.max(maxHeight, spriteData.height);
            }
            const scale = Math.min(this.width / maxWidth, this.height / maxHeight);
            const sprites = piggyCharacter.layers[0].sprites;
            if (this.isMoving) {
                const spriteData = piggySprites[this.animationFrame];
                const sprite = sprites[this.animationFrame];
                if (spriteData?.image?.complete && sprite) {
                    const drawX = this.x + (sprite.x || 0) * scale;
                    const drawY = this.y + (sprite.y || 0) * scale;
                    ctx.drawImage(spriteData.image, drawX, drawY, spriteData.width * scale, spriteData.height * scale);
                }
            } else {
                for (let i = 0; i < piggySprites.length; i++) {
                    const spriteData = piggySprites[i];
                    const sprite = sprites[i];
                    if (spriteData?.image?.complete && sprite) {
                        const drawX = this.x + (sprite.x || 0) * scale;
                        const drawY = this.y + (sprite.y || 0) * scale;
                        ctx.drawImage(spriteData.image, drawX, drawY, spriteData.width * scale, spriteData.height * scale);
                    }
                }
            }
            ctx.restore();
        } else if (this.id === 1 && goldenPiggySprites.length > 0 && goldenPiggyCharacter?.layers?.[0]?.sprites) {
            ctx.save();
            if (hasImmunity) ctx.globalAlpha = blinkAlpha;
            else ctx.globalAlpha = 1;
            ctx.imageSmoothingEnabled = false;
            ctx.globalCompositeOperation = 'source-over';
            let maxWidth = 0, maxHeight = 0;
            for (const spriteData of goldenPiggySprites) {
                maxWidth = Math.max(maxWidth, spriteData.width);
                maxHeight = Math.max(maxHeight, spriteData.height);
            }
            const scale = Math.min(this.width / maxWidth, this.height / maxHeight);
            const sprites = goldenPiggyCharacter.layers[0].sprites;
            if (this.isMoving) {
                const spriteData = goldenPiggySprites[this.animationFrame];
                const sprite = sprites[this.animationFrame];
                if (spriteData?.image?.complete && sprite) {
                    const drawX = this.x + (sprite.x || 0) * scale;
                    const drawY = this.y + (sprite.y || 0) * scale;
                    ctx.drawImage(spriteData.image, drawX, drawY, spriteData.width * scale, spriteData.height * scale);
                }
            } else {
                for (let i = 0; i < goldenPiggySprites.length; i++) {
                    const spriteData = goldenPiggySprites[i];
                    const sprite = sprites[i];
                    if (spriteData?.image?.complete && sprite) {
                        const drawX = this.x + (sprite.x || 0) * scale;
                        const drawY = this.y + (sprite.y || 0) * scale;
                        ctx.drawImage(spriteData.image, drawX, drawY, spriteData.width * scale, spriteData.height * scale);
                    }
                }
            }
            ctx.restore();
        } else {
            if (hasImmunity) ctx.globalAlpha = blinkAlpha;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((this.id + 1).toString(), this.x + this.width / 2, this.y + this.height / 2);
        }
        if (this.isIt) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            const time = Date.now();
            const centerX = this.x + this.width / 2;
            const centerY = this.y - 28;
            const hue1 = (time * 0.04) % 360;
            const hue2 = (hue1 + 120) % 360;
            const stars = [
                { radius: 10, points: 5, innerScale: 0.45, orbit: 6, rotationSpeed: 0.003, color: `hsl(${hue1}, 90%, 70%)` },
                { radius: 13, points: 5, innerScale: 0.5, orbit: 10, rotationSpeed: -0.0045, color: `hsl(${hue2}, 95%, 65%)` }
            ];
            for (const star of stars) {
                ctx.save();
                const orbitAngle = time * star.rotationSpeed;
                const orbitX = centerX + Math.cos(orbitAngle) * star.orbit;
                const orbitY = centerY + Math.sin(orbitAngle) * star.orbit;
                ctx.translate(orbitX, orbitY);
                ctx.rotate(orbitAngle * 2);
                const hueMatch = /hsl\(([^,]+),/i.exec(star.color);
                const baseHue = hueMatch ? Number(hueMatch[1]) : 50;
                const px = Math.max(2, Math.floor(star.radius / 3));
                const pattern = [[0, -2], [0, -1], [-1, -1], [1, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1], [1, 1], [0, 1], [0, 2]];
                pattern.forEach(([ox, oy], idx) => {
                    const hueJitter = Math.sin(time * 0.01 + idx) * 6;
                    const satVal = Math.min(100, Math.max(0, 90 + Math.sin(time * 0.02 + idx * 0.5) * 5));
                    const lightVal = Math.min(100, Math.max(0, 70 + Math.sin(time * 0.015 + idx * 0.3) * 5));
                    ctx.fillStyle = `hsl(${Number(baseHue) + hueJitter}, ${satVal}%, ${lightVal}%)`;
                    ctx.fillRect(ox * px, oy * px, px, px);
                });
                ctx.restore();
            }
            ctx.restore();
        }
        if (this.isIt && this.sparkleTrail.length > 0) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            for (const sparkle of this.sparkleTrail) {
                const alpha = sparkle.life;
                const size = sparkle.size * sparkle.life;
                if (size > 0.5 && alpha > 0) {
                    ctx.fillStyle = `hsla(50, 50%, 90%, ${alpha})`;
                    const flamePattern = [[0, 0], [1, 0], [-1, 0], [0, -1], [1, -1], [0, 1], [1, 1], [-1, 1], [2, 0], [-2, 0], [0, -2], [1, -2]];
                    for (const pixel of flamePattern) {
                        const pixelX = Math.floor(sparkle.x + pixel[0] * (size / 4));
                        const pixelY = Math.floor(sparkle.y + pixel[1] * (size / 4));
                        ctx.fillRect(pixelX, pixelY, Math.max(1, Math.floor(size / 4)), Math.max(1, Math.floor(size / 4)));
                    }
                }
            }
            ctx.restore();
        }
        if (this.boostParticles.length > 0) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            for (const particle of this.boostParticles) {
                const alpha = particle.life;
                const size = Math.max(1, Math.floor(particle.size * particle.life));
                if (size > 0 && alpha > 0) {
                    ctx.fillStyle = particle.color;
                    ctx.globalAlpha = alpha;
                    ctx.fillRect(Math.floor(particle.x - size / 2), Math.floor(particle.y - size / 2), size, size);
                }
            }
            ctx.restore();
        }
        ctx.globalAlpha = 1;
    }
}

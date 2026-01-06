// Game world constants - 4x larger
const WORLD_WIDTH = 8000;
const WORLD_HEIGHT = 4800;

// Game state
let gameState = {
    players: [],
    currentLevel: 0,
    playerCount: 2,
    gameRunning: false,
    startTime: null,
    gameDuration: 60, // 60 seconds (1 minute)
    scores: {}, // Player scores: { playerId: score }
    roundProcessed: false, // Track if current round end has been processed
    bouncePads: [],
    teleports: [],
    currentLevelData: null,
    camera: {
        x: 0,
        y: 0,
        zoom: 1,
        minZoom: 0.1,
        maxZoom: 1.5
    }
};

// Canvas setup - wait for DOM
let canvas, ctx;

// Character sprite data for player 1
let piggyCharacter = null;
let piggySprites = [];

// Character sprite data for player 2
let goldenPiggyCharacter = null;
let goldenPiggySprites = [];

// World tileset sprite sheet
let worldTileset = null;
const TILE_SIZE = 16; // Each sprite is 16x16 pixels

// Set canvas size (viewport size, not world size)
function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Remove white background from image
function removeWhiteBackground(img) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext('2d', { alpha: true });
    
    tempCtx.drawImage(img, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    
    // Remove white/light pixels (make them transparent)
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // If pixel is white or very light, make it transparent
        if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0; // Set alpha to 0
        }
    }
    
    tempCtx.putImageData(imageData, 0, 0);
    const newImg = new Image();
    newImg.src = tempCanvas.toDataURL();
    return new Promise((resolve) => {
        newImg.onload = () => resolve(newImg);
        newImg.onerror = () => resolve(img); // Fallback to original
    });
}

// Load piggy character
async function loadPiggyCharacter() {
    try {
        const response = await fetch('piggy.json');
        piggyCharacter = await response.json();
        
        // Load all sprites as images
        piggySprites = [];
        if (piggyCharacter.layers && piggyCharacter.layers[0] && piggyCharacter.layers[0].sprites) {
            for (let sprite of piggyCharacter.layers[0].sprites) {
                const img = new Image();
                img.src = sprite.base64;
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve; // Continue even if image fails to load
                });
                
                // Remove white background
                const processedImg = await removeWhiteBackground(img);
                
                piggySprites.push({
                    image: processedImg,
                    x: sprite.x,
                    y: sprite.y,
                    width: sprite.width,
                    height: sprite.height
                });
            }
        }
        console.log('Piggy character loaded:', piggySprites.length, 'sprites');
    } catch (error) {
        console.error('Failed to load piggy character:', error);
    }
}

// Load golden piggy character
async function loadGoldenPiggyCharacter() {
    try {
        const response = await fetch('golden_piggy.json');
        goldenPiggyCharacter = await response.json();
        
        // Load all sprites as images
        goldenPiggySprites = [];
        if (goldenPiggyCharacter.layers && goldenPiggyCharacter.layers[0] && goldenPiggyCharacter.layers[0].sprites) {
            for (let sprite of goldenPiggyCharacter.layers[0].sprites) {
                const img = new Image();
                img.src = sprite.base64;
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve; // Continue even if image fails to load
                });
                
                // Remove white background
                const processedImg = await removeWhiteBackground(img);
                
                goldenPiggySprites.push({
                    image: processedImg,
                    x: sprite.x,
                    y: sprite.y,
                    width: sprite.width,
                    height: sprite.height
                });
            }
        }
        console.log('Golden piggy character loaded:', goldenPiggySprites.length, 'sprites');
    } catch (error) {
        console.error('Failed to load golden piggy character:', error);
    }
}

// Initialize when DOM is ready
async function init() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    ctx = canvas.getContext('2d', { alpha: true });
    resizeCanvas();
    
    // Load characters
    await loadPiggyCharacter();
    await loadGoldenPiggyCharacter();
    
    // Load world tileset
    worldTileset = new Image();
    worldTileset.src = 'world_tileset.png';
    await new Promise((resolve, reject) => {
        worldTileset.onload = resolve;
        worldTileset.onerror = reject;
    });
    console.log('World tileset loaded');
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.addEventListener('resize', resizeCanvas);

// Player class
class Player {
    constructor(x, y, color, id) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.color = color;
        this.id = id;
        this.speed = 5;
        this.isIt = false; // Will be set randomly in initPlayers()
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.jumpPower = 12; // Reduced for more controlled jumping
        this.gravity = 0.6;
        this.tagImmunityTime = 0; // Timestamp when tag immunity expires (0 = no immunity)
        this.animationFrame = 0; // Current animation frame
        this.lastAnimationTime = Date.now(); // Last time animation was updated
        this.isMoving = false; // Track if player is moving
        this.jumpsUsed = 0; // Number of jumps used (for double jump)
        this.maxJumps = 2; // Maximum number of jumps allowed
        this.jumpPressed = false; // Track if jump key was just pressed (not held)
    }

    update(platforms) {
        if (!canvas) return;
        
        // Apply gravity
        if (!this.onGround) {
            this.velocityY += this.gravity;
        }

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Collision with platforms
        this.onGround = false;
        for (let platform of platforms) {
            if (this.collidesWith(platform)) {
                // Only check collision if player is falling down (can land on top)
                // If player is moving up, they can pass through platforms
                if (this.velocityY > 0) {
                    // Top collision (landing on platform) - only when falling down
                    if (this.y - this.height < platform.y + 10) {
                        this.y = platform.y - this.height;
                        this.velocityY = 0;
                        this.onGround = true;
                        this.jumpsUsed = 0; // Reset jumps when landing
                    }
                }
                // Side collisions (still apply when moving horizontally)
                if (this.velocityX > 0 && this.x - this.width < platform.x + 10 && this.y + this.height > platform.y && this.y < platform.y + platform.height) {
                    this.x = platform.x - this.width;
                    this.velocityX = 0;
                } else if (this.velocityX < 0 && this.x > platform.x + platform.width - 10 && this.y + this.height > platform.y && this.y < platform.y + platform.height) {
                    this.x = platform.x + platform.width;
                    this.velocityX = 0;
                }
            }
        }

        // Boundary collision (world boundaries)
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > WORLD_WIDTH) this.x = WORLD_WIDTH - this.width;
        if (this.y < 0) {
            this.y = 0;
            this.velocityY = 0;
        }
        if (this.y + this.height > WORLD_HEIGHT) {
            this.y = WORLD_HEIGHT - this.height;
            this.velocityY = 0;
            this.onGround = true;
            this.jumpsUsed = 0; // Reset jumps when landing on ground
        }

        // Friction
        this.velocityX *= 0.85;
        
        // Update animation state
        this.isMoving = Math.abs(this.velocityX) > 0.1 || Math.abs(this.velocityY) > 0.1;
        
        // Update animation frame if moving (for players with character sprites)
        const currentTime = Date.now();
        if (this.id === 0 && piggySprites.length > 0) {
            // Player 1 with piggy character
            if (this.isMoving) {
                const animationSpeed = 150; // Milliseconds per frame
                const timeSinceLastFrame = currentTime - this.lastAnimationTime;
                
                if (timeSinceLastFrame >= animationSpeed) {
                    this.animationFrame = (this.animationFrame + 1) % piggySprites.length;
                    this.lastAnimationTime = currentTime;
                }
            } else {
                // Reset to first frame when not moving
                this.animationFrame = 0;
                this.lastAnimationTime = currentTime;
            }
        } else if (this.id === 1 && goldenPiggySprites.length > 0) {
            // Player 2 with golden piggy character
            if (this.isMoving) {
                const animationSpeed = 150; // Milliseconds per frame
                const timeSinceLastFrame = currentTime - this.lastAnimationTime;
                
                if (timeSinceLastFrame >= animationSpeed) {
                    this.animationFrame = (this.animationFrame + 1) % goldenPiggySprites.length;
                    this.lastAnimationTime = currentTime;
                }
            } else {
                // Reset to first frame when not moving
                this.animationFrame = 0;
                this.lastAnimationTime = currentTime;
            }
        }
    }

    collidesWith(rect) {
        // Check if this player collides with another rectangle (player or platform)
        const collision = this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
        return collision;
    }

    draw() {
        if (!ctx) return;
        
        // Check if player has tag immunity (blinking effect)
        const hasImmunity = this.tagImmunityTime > Date.now();
        const blinkAlpha = hasImmunity ? 0.4 + Math.sin(Date.now() / 150) * 0.4 : 1;
        
        // Draw player 1 with piggy character sprite, player 2 with golden piggy, others with colored rectangle
        if (this.id === 0 && piggySprites.length > 0) {
            // Draw piggy character for player 1
            ctx.save();
            
            // Set alpha for blinking if immune
            if (hasImmunity) {
                ctx.globalAlpha = blinkAlpha;
            } else {
                ctx.globalAlpha = 1;
            }
            
            // Disable image smoothing for pixel-perfect rendering
            ctx.imageSmoothingEnabled = false;
            
            // Use source-over composite to preserve transparency
            ctx.globalCompositeOperation = 'source-over';
            
            // Find the largest sprite dimensions to calculate scale
            let maxWidth = 0, maxHeight = 0;
            for (let spriteData of piggySprites) {
                maxWidth = Math.max(maxWidth, spriteData.width);
                maxHeight = Math.max(maxHeight, spriteData.height);
            }
            
            // Calculate scale to fit player size (40x40)
            const scaleX = this.width / maxWidth;
            const scaleY = this.height / maxHeight;
            const scale = Math.min(scaleX, scaleY);
            
            // Draw the current animation frame (or all sprites if not moving)
            if (this.isMoving) {
                // Draw only the current animation frame when moving
                const spriteData = piggySprites[this.animationFrame];
                const sprite = piggyCharacter.layers[0].sprites[this.animationFrame];
                
                if (spriteData && spriteData.image.complete && sprite) {
                    const drawX = this.x + (sprite.x || 0) * scale;
                    const drawY = this.y + (sprite.y || 0) * scale;
                    const drawWidth = spriteData.width * scale;
                    const drawHeight = spriteData.height * scale;
                    
                    ctx.drawImage(
                        spriteData.image,
                        drawX,
                        drawY,
                        drawWidth,
                        drawHeight
                    );
                }
            } else {
                // Draw all sprites when idle (they overlay each other)
                for (let i = 0; i < piggySprites.length; i++) {
                    const spriteData = piggySprites[i];
                    const sprite = piggyCharacter.layers[0].sprites[i];
                    
                    if (spriteData.image.complete && sprite) {
                        const drawX = this.x + (sprite.x || 0) * scale;
                        const drawY = this.y + (sprite.y || 0) * scale;
                        const drawWidth = spriteData.width * scale;
                        const drawHeight = spriteData.height * scale;
                        
                        ctx.drawImage(
                            spriteData.image,
                            drawX,
                            drawY,
                            drawWidth,
                            drawHeight
                        );
                    }
                }
            }
            
            ctx.restore();
        } else if (this.id === 1 && goldenPiggySprites.length > 0) {
            // Draw golden piggy character for player 2
            ctx.save();
            
            // Set alpha for blinking if immune
            if (hasImmunity) {
                ctx.globalAlpha = blinkAlpha;
            } else {
                ctx.globalAlpha = 1;
            }
            
            // Disable image smoothing for pixel-perfect rendering
            ctx.imageSmoothingEnabled = false;
            
            // Use source-over composite to preserve transparency
            ctx.globalCompositeOperation = 'source-over';
            
            // Find the largest sprite dimensions to calculate scale
            let maxWidth = 0, maxHeight = 0;
            for (let spriteData of goldenPiggySprites) {
                maxWidth = Math.max(maxWidth, spriteData.width);
                maxHeight = Math.max(maxHeight, spriteData.height);
            }
            
            // Calculate scale to fit player size (40x40)
            const scaleX = this.width / maxWidth;
            const scaleY = this.height / maxHeight;
            const scale = Math.min(scaleX, scaleY);
            
            // Draw the current animation frame (or all sprites if not moving)
            if (this.isMoving) {
                // Draw only the current animation frame when moving
                const spriteData = goldenPiggySprites[this.animationFrame];
                const sprite = goldenPiggyCharacter.layers[0].sprites[this.animationFrame];
                
                if (spriteData && spriteData.image.complete && sprite) {
                    const drawX = this.x + (sprite.x || 0) * scale;
                    const drawY = this.y + (sprite.y || 0) * scale;
                    const drawWidth = spriteData.width * scale;
                    const drawHeight = spriteData.height * scale;
                    
                    ctx.drawImage(
                        spriteData.image,
                        drawX,
                        drawY,
                        drawWidth,
                        drawHeight
                    );
                }
            } else {
                // Draw all sprites when idle (they overlay each other)
                for (let i = 0; i < goldenPiggySprites.length; i++) {
                    const spriteData = goldenPiggySprites[i];
                    const sprite = goldenPiggyCharacter.layers[0].sprites[i];
                    
                    if (spriteData.image.complete && sprite) {
                        const drawX = this.x + (sprite.x || 0) * scale;
                        const drawY = this.y + (sprite.y || 0) * scale;
                        const drawWidth = spriteData.width * scale;
                        const drawHeight = spriteData.height * scale;
                        
                        ctx.drawImage(
                            spriteData.image,
                            drawX,
                            drawY,
                            drawWidth,
                            drawHeight
                        );
                    }
                }
            }
            
            ctx.restore();
        } else {
            // Apply blinking effect if immune (for other players)
            if (hasImmunity) {
                ctx.globalAlpha = blinkAlpha;
            }
            // Draw other players with colored rectangle
            // Draw player with shadow for better visibility
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            // Draw player
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Draw border (thicker for better visibility)
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            // Draw player number for debugging
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((this.id + 1).toString(), this.x + this.width / 2, this.y + this.height / 2);
        }

        // Draw "it" indicator (white arrow)
        if (this.isIt) {
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y - 25);
            ctx.lineTo(this.x + this.width / 2 - 12, this.y - 5);
            ctx.lineTo(this.x + this.width / 2 + 12, this.y - 5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        
        // Reset alpha
        ctx.globalAlpha = 1;
    }
}

// Platform class
class Platform {
    constructor(x, y, width, height, color = '#8B4513', spriteIndex = 1) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.spriteIndex = spriteIndex; // 1 or 2 for sprite 1 or sprite 2
    }

    draw() {
        if (!ctx || !worldTileset) return;
        
        // Disable image smoothing for pixel-perfect rendering
        ctx.imageSmoothingEnabled = false;
        
        // Calculate how many tiles we need to draw
        const numTiles = Math.ceil(this.width / TILE_SIZE);
        
        // Sprite 1 is at (0, 0) and sprite 2 is at (16, 0) in the tileset
        const spriteX = (this.spriteIndex - 1) * TILE_SIZE;
        const spriteY = 0;
        
        // Draw each tile in the platform
        for (let i = 0; i < numTiles; i++) {
            const tileX = this.x + (i * TILE_SIZE);
            const drawWidth = Math.min(TILE_SIZE, this.x + this.width - tileX);
            
            ctx.drawImage(
                worldTileset,
                spriteX, spriteY, TILE_SIZE, TILE_SIZE, // Source: sprite from tileset
                tileX, this.y, drawWidth, this.height // Destination: position on canvas
            );
        }
    }
}

// Bounce pad class
class BouncePad {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.bouncePower = 33; // Adjusted to jump approximately 5 platform heights (platforms are ~180px apart)
    }

    draw() {
        if (!ctx || !worldTileset) return;
        
        // Disable image smoothing for pixel-perfect rendering
        ctx.imageSmoothingEnabled = false;
        
        // Calculate how many tiles we need to draw
        const numTiles = Math.ceil(this.width / TILE_SIZE);
        
        // Tile 5 is at position 5 * TILE_SIZE = 80 pixels from the left
        const spriteX = 5 * TILE_SIZE; // Tile 5
        const spriteY = 0;
        
        // Draw each tile in the bounce pad
        for (let i = 0; i < numTiles; i++) {
            const tileX = this.x + (i * TILE_SIZE);
            const drawWidth = Math.min(TILE_SIZE, this.x + this.width - tileX);
            
            ctx.drawImage(
                worldTileset,
                spriteX, spriteY, TILE_SIZE, TILE_SIZE, // Source: tile 5 from tileset
                tileX, this.y, drawWidth, this.height // Destination: position on canvas
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

// Teleport class
class Teleport {
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
        
        // Draw teleport symbol
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

// Level definitions (functions that return level data based on world size)
function getLevel1() {
    const platforms = [
        new Platform(0, WORLD_HEIGHT - 50, WORLD_WIDTH, 50, '#8B4513', 1), // Ground - sprite 1
    ];
    
    // Generate platforms in layers going up to the top
    // Each layer is spaced about 150-180 pixels apart vertically
    for (let layer = 0; layer < 25; layer++) {
        const y = WORLD_HEIGHT - 150 - (layer * 180);
        if (y < 0) break; // Stop if we've reached the top
        
        // Create platforms across the width, with more spacing
        for (let x = 0; x < WORLD_WIDTH; x += 400 + (layer % 4) * 100) {
            const platformWidth = 150 + (layer % 3) * 50;
            if (x + platformWidth > WORLD_WIDTH) break;
            // Alternate between sprite 1 and 2
            const spriteIndex = (layer % 2 === 0) ? 1 : 2;
            platforms.push(new Platform(x, y, platformWidth, 20, '#8B4513', spriteIndex));
        }
    }
    
    return {
        platforms: platforms,
        bouncePads: [
            // Ground level bounce pads
            new BouncePad(250, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(750, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(1250, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(1750, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(2250, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(2750, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(3250, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(3750, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(4250, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(4750, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(5250, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(5750, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(6250, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(6750, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(7250, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(7750, WORLD_HEIGHT - 170, 50, 20),
            // Higher level bounce pads
            new BouncePad(1150, WORLD_HEIGHT - 300, 50, 20),
            new BouncePad(2050, WORLD_HEIGHT - 300, 50, 20),
            new BouncePad(3050, WORLD_HEIGHT - 300, 50, 20),
            new BouncePad(4050, WORLD_HEIGHT - 300, 50, 20),
            new BouncePad(5050, WORLD_HEIGHT - 300, 50, 20),
            new BouncePad(6050, WORLD_HEIGHT - 300, 50, 20),
            new BouncePad(7050, WORLD_HEIGHT - 300, 50, 20),
            // Even higher bounce pads
            new BouncePad(1550, WORLD_HEIGHT - 480, 50, 20),
            new BouncePad(2550, WORLD_HEIGHT - 480, 50, 20),
            new BouncePad(3550, WORLD_HEIGHT - 480, 50, 20),
            new BouncePad(4550, WORLD_HEIGHT - 480, 50, 20),
            new BouncePad(5550, WORLD_HEIGHT - 480, 50, 20),
            new BouncePad(6550, WORLD_HEIGHT - 480, 50, 20),
        ],
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
        ]
    };
}

function getLevel2() {
    const platforms = [
        new Platform(0, WORLD_HEIGHT - 50, WORLD_WIDTH, 50, '#8B4513', 2), // Ground - sprite 2
    ];
    
    // Generate platforms in layers going up to the top
    // Each layer is spaced about 150-180 pixels apart vertically
    for (let layer = 0; layer < 25; layer++) {
        const y = WORLD_HEIGHT - 150 - (layer * 180);
        if (y < 0) break; // Stop if we've reached the top
        
        // Create platforms across the width, with more spacing
        for (let x = 0; x < WORLD_WIDTH; x += 400 + (layer % 4) * 100) {
            const platformWidth = 150 + (layer % 3) * 50;
            if (x + platformWidth > WORLD_WIDTH) break;
            // Alternate between sprite 1 and 2
            const spriteIndex = (layer % 2 === 0) ? 2 : 1;
            platforms.push(new Platform(x, y, platformWidth, 20, '#8B4513', spriteIndex));
        }
    }
    
    return {
        platforms: platforms,
        bouncePads: [
            // Ground level bounce pads
            new BouncePad(175, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(575, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(975, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(1375, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(1775, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(2175, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(2575, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(2975, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(3375, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(3775, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(4175, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(4575, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(4975, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(5375, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(5775, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(6175, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(6575, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(6975, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(7375, WORLD_HEIGHT - 170, 50, 20),
            // Higher level bounce pads
            new BouncePad(575, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(1575, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(2575, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(3575, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(4575, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(5575, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(6575, WORLD_HEIGHT - 330, 50, 20),
            // Even higher bounce pads
            new BouncePad(550, WORLD_HEIGHT - 510, 50, 20),
            new BouncePad(1550, WORLD_HEIGHT - 510, 50, 20),
            new BouncePad(2550, WORLD_HEIGHT - 510, 50, 20),
            new BouncePad(3550, WORLD_HEIGHT - 510, 50, 20),
            new BouncePad(4550, WORLD_HEIGHT - 510, 50, 20),
            new BouncePad(5550, WORLD_HEIGHT - 510, 50, 20),
            new BouncePad(6550, WORLD_HEIGHT - 510, 50, 20),
        ],
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
        ]
    };
}

function getLevel3() {
    const platforms = [
        new Platform(0, WORLD_HEIGHT - 50, WORLD_WIDTH, 50, '#8B4513', 1), // Ground - sprite 1
    ];
    
    // Generate platforms in layers going up to the top
    // Each layer is spaced about 120-150 pixels apart vertically
    for (let layer = 0; layer < 40; layer++) {
        const y = WORLD_HEIGHT - 150 - (layer * 120);
        if (y < 0) break; // Stop if we've reached the top
        
        // Create platforms across the width, with some variation
        for (let x = 0; x < WORLD_WIDTH; x += 180 + (layer % 5) * 30) {
            const platformWidth = 100 + (layer % 3) * 60;
            if (x + platformWidth > WORLD_WIDTH) break;
            // Alternate between sprite 1 and 2 based on x position
            const spriteIndex = (Math.floor(x / 200) % 2 === 0) ? 1 : 2;
            platforms.push(new Platform(x, y, platformWidth, 20, '#8B4513', spriteIndex));
        }
    }
    
    return {
        platforms: platforms,
        bouncePads: [
            // Ground level bounce pads
            new BouncePad(150, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(550, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(950, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(1350, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(1750, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(2150, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(2550, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(2950, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(3350, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(3750, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(4150, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(4550, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(4950, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(5350, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(5750, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(6150, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(6550, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(6950, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(7350, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(7750, WORLD_HEIGHT - 200, 50, 20),
            // Higher level bounce pads
            new BouncePad(350, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(750, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(1150, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(1550, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(1950, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(2350, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(2750, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(3150, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(3550, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(3950, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(4350, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(4750, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(5150, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(5550, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(5950, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(6350, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(6750, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(7150, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(7550, WORLD_HEIGHT - 330, 50, 20),
            // Even higher bounce pads
            new BouncePad(600, WORLD_HEIGHT - 590, 50, 20),
            new BouncePad(1200, WORLD_HEIGHT - 590, 50, 20),
            new BouncePad(1800, WORLD_HEIGHT - 590, 50, 20),
            new BouncePad(2400, WORLD_HEIGHT - 590, 50, 20),
            new BouncePad(3000, WORLD_HEIGHT - 590, 50, 20),
            new BouncePad(3600, WORLD_HEIGHT - 590, 50, 20),
            new BouncePad(4200, WORLD_HEIGHT - 590, 50, 20),
            new BouncePad(4800, WORLD_HEIGHT - 590, 50, 20),
            new BouncePad(5400, WORLD_HEIGHT - 590, 50, 20),
            new BouncePad(6000, WORLD_HEIGHT - 590, 50, 20),
            new BouncePad(6600, WORLD_HEIGHT - 590, 50, 20),
            new BouncePad(7200, WORLD_HEIGHT - 590, 50, 20),
        ],
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
        ]
    };
}

const levelGenerators = [getLevel1, getLevel2, getLevel3];

// Initialize players
function initPlayers() {
    gameState.players = [];
    const colors = ['#ff4444', '#4444ff', '#44ff44', '#ff44ff'];
    const level = levelGenerators[gameState.currentLevel]();
    
    // Initialize scores if not already set
    for (let i = 0; i < gameState.playerCount; i++) {
        if (gameState.scores[i] === undefined) {
            gameState.scores[i] = 0;
        }
    }
    
    for (let i = 0; i < gameState.playerCount; i++) {
        const spawn = level.spawnPoints[i];
        const player = new Player(spawn.x, spawn.y, colors[i], i);
        gameState.players.push(player);
    }
    
    // Random player is "it"
    const randomItIndex = Math.floor(Math.random() * gameState.players.length);
    for (let i = 0; i < gameState.players.length; i++) {
        gameState.players[i].isIt = (i === randomItIndex);
    }
    
    // Immediately position camera on players
    if (gameState.players.length > 0 && canvas) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
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
        
        // Set initial zoom to ensure players are visible
        const distanceX = maxX - minX;
        const distanceY = maxY - minY;
        const padding = 200;
        
        if (distanceX > 10 || distanceY > 10) {
            const desiredZoomX = (canvas.width - padding * 2) / (distanceX + padding * 2);
            const desiredZoomY = (canvas.height - padding * 2) / (distanceY + padding * 2);
            let desiredZoom = Math.min(desiredZoomX, desiredZoomY);
            desiredZoom = Math.max(gameState.camera.minZoom, Math.min(gameState.camera.maxZoom, desiredZoom));
            gameState.camera.zoom = desiredZoom;
        } else {
            // If players are close together, use a good default zoom
            gameState.camera.zoom = 0.5;
        }
    }
}

// Load level
function loadLevel(levelIndex) {
    if (!canvas) {
        console.error('Canvas not initialized!');
        return;
    }
    gameState.currentLevel = levelIndex;
    const level = levelGenerators[levelIndex]();
    
    gameState.bouncePads = level.bouncePads;
    gameState.teleports = level.teleports;
    gameState.currentLevelData = level;
    
    // Initialize players first (this will set camera position)
    initPlayers();
    
    // Update score display after players are initialized
    updateScoreDisplay();
}

// Input handling
const keys = {};
const keysPressed = {}; // Track keys that were just pressed (not held)
const playerControls = [
    { left: 'KeyA', right: 'KeyD', up: 'KeyW' },
    { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp' },
    { left: 'KeyJ', right: 'KeyL', up: 'KeyI' },
    { left: 'KeyF', right: 'KeyH', up: 'KeyT' }
];

document.addEventListener('keydown', (e) => {
    if (!keys[e.code]) {
        keysPressed[e.code] = true; // Mark as just pressed
    }
    keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    keysPressed[e.code] = false;
});

function handleInput() {
    if (!gameState.gameRunning) return;
    
    gameState.players.forEach((player, index) => {
        if (index >= playerControls.length) return;
        
        const controls = playerControls[index];
        player.velocityX = 0;
        
        if (keys[controls.left]) {
            player.velocityX = -player.speed;
        }
        if (keys[controls.right]) {
            player.velocityX = player.speed;
        }
        
        // Handle jump with double jump support
        if (keysPressed[controls.up]) {
            // Only jump if we haven't used all jumps
            if (player.jumpsUsed < player.maxJumps) {
                player.velocityY = -player.jumpPower;
                player.jumpsUsed++;
                player.onGround = false;
            }
        }
    });
    
    // Clear all pressed flags after processing all players
    Object.keys(keysPressed).forEach(key => {
        keysPressed[key] = false;
    });
}

// Update camera based on player positions
function updateCamera() {
    if (gameState.players.length === 0 || !canvas) return;
    
    const cam = gameState.camera;
    
    // Calculate center point between all players
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    gameState.players.forEach(player => {
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;
        minX = Math.min(minX, centerX);
        maxX = Math.max(maxX, centerX);
        minY = Math.min(minY, centerY);
        maxY = Math.max(maxY, centerY);
    });
    
    // Calculate distance between furthest players
    const distanceX = maxX - minX;
    const distanceY = maxY - minY;
    
    // If players are at same position, use default zoom
    if (distanceX < 10 && distanceY < 10) {
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        cam.x += (centerX - cam.x) * 0.1;
        cam.y += (centerY - cam.y) * 0.1;
        return;
    }
    
    // Calculate desired zoom based on distance
    // Add padding (200 pixels on each side)
    const padding = 200;
    const desiredZoomX = (canvas.width - padding) / (distanceX + padding);
    const desiredZoomY = (canvas.height - padding) / (distanceY + padding);
    let desiredZoom = Math.min(desiredZoomX, desiredZoomY);
    
    // Clamp zoom
    desiredZoom = Math.max(cam.minZoom, Math.min(cam.maxZoom, desiredZoom));
    
    // Smooth zoom transition
    cam.zoom += (desiredZoom - cam.zoom) * 0.1;
    
    // Calculate camera center (average of all players)
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Smooth camera movement
    cam.x += (centerX - cam.x) * 0.1;
    cam.y += (centerY - cam.y) * 0.1;
    
    // Keep camera within world bounds
    const viewWidth = canvas.width / cam.zoom;
    const viewHeight = canvas.height / cam.zoom;
    cam.x = Math.max(viewWidth / 2, Math.min(WORLD_WIDTH - viewWidth / 2, cam.x));
    cam.y = Math.max(viewHeight / 2, Math.min(WORLD_HEIGHT - viewHeight / 2, cam.y));
}

// Check collisions
function checkCollisions() {
    if (!gameState.currentLevelData) return;
    
    // Check bounce pads
    gameState.players.forEach(player => {
        gameState.bouncePads.forEach(pad => {
            if (pad.checkCollision(player)) {
                player.velocityY = -pad.bouncePower;
                player.onGround = false;
            }
        });
    });
    
    // Check teleports
    gameState.players.forEach(player => {
        gameState.teleports.forEach(teleport => {
            if (teleport.checkCollision(player)) {
                player.x = teleport.targetX;
                player.y = teleport.targetY;
                teleport.used = true;
            }
        });
    });
    
    // Check tagging - must be done after all updates
    // Only one player should have tag at a time, so find the player with tag first
    const playerWithTag = gameState.players.find(p => p.isIt);
    
    if (playerWithTag) {
        // Check if player with tag is still immune (2 second cooldown after getting tagged)
        const isImmune = playerWithTag.tagImmunityTime > Date.now();
        
        if (!isImmune) {
            // Check collision with all other players
            for (let otherPlayer of gameState.players) {
                // Skip if same player
                if (playerWithTag.id === otherPlayer.id) continue;
                
                // Check if they are colliding
                const isColliding = playerWithTag.collidesWith(otherPlayer);
                if (isColliding) {
                    // Tag! Transfer "it" status to the player who was tagged
                    playerWithTag.isIt = false;
                    otherPlayer.isIt = true;
                    // Set 2 second immunity for the newly tagged player
                    otherPlayer.tagImmunityTime = Date.now() + 2000;
                    console.log(`TAG! Player ${otherPlayer.id + 1} (${otherPlayer.color}) is now "it"!`);
                    // Break after first tag to avoid multiple tags in same frame
                    break;
                }
            }
        }
    }
}

// Game loop
function gameLoop() {
    if (!gameState.gameRunning || !canvas || !ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Handle input
    handleInput();
    
    // Update teleports
    gameState.teleports.forEach(tp => tp.update());
    
    // Update players
    const level = gameState.currentLevelData;
    gameState.players.forEach(player => {
        player.update(level.platforms);
    });
    
    // Check collisions
    checkCollisions();
    
    // Update camera
    updateCamera();
    
    // Apply camera transform
    ctx.save();
    const cam = gameState.camera;
    
    // Translate to center of screen
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Scale (zoom)
    ctx.scale(cam.zoom, cam.zoom);
    
    // Translate to camera position (inverse)
    ctx.translate(-cam.x, -cam.y);
    
    // Draw level
    level.platforms.forEach(platform => platform.draw());
    gameState.bouncePads.forEach(pad => pad.draw());
    gameState.teleports.forEach(tp => tp.draw());
    
    // Draw players
    gameState.players.forEach(player => player.draw());
    
    // Restore transform
    ctx.restore();
    
    // Update timer (countdown)
    if (gameState.startTime) {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const remaining = Math.max(0, gameState.gameDuration - elapsed);
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = 
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        
        // Check if time is up (only once per round)
        if (remaining <= 0 && !gameState.roundProcessed) {
            // Time's up! Award point to player who is NOT "it"
            const playerNotIt = gameState.players.find(p => !p.isIt);
            if (playerNotIt) {
                gameState.scores[playerNotIt.id] = (gameState.scores[playerNotIt.id] || 0) + 1;
                console.log(`Tid er ute! Spiller ${playerNotIt.id + 1} får 1 poeng!`);
                updateScoreDisplay();
                
                // Mark this round as processed
                gameState.roundProcessed = true;
                
                // Reset timer for next round
                gameState.startTime = Date.now();
            }
        }
        
        // Reset roundProcessed flag when new round starts (remaining time is back to full duration)
        if (remaining >= gameState.gameDuration - 1) {
            gameState.roundProcessed = false;
        }
    }
    
    requestAnimationFrame(gameLoop);
}

// Update score display with character graphics
function updateScoreDisplay() {
    const scoreContainer = document.getElementById('score-container');
    if (!scoreContainer) return;
    
    // Clear existing score items
    scoreContainer.innerHTML = '';
    
    // Create score display for each player
    gameState.players.forEach((player, index) => {
        const score = gameState.scores[player.id] || 0;
        
        // Create score item container
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        
        // Create character image
        const characterImg = document.createElement('img');
        characterImg.className = 'score-character';
        
        // Set character image based on player ID
        let imageSet = false;
        if (player.id === 0 && piggySprites.length > 0) {
            // Use first frame of piggy character
            const spriteData = piggySprites[0];
            if (spriteData && spriteData.image && spriteData.image.complete) {
                try {
                    // Convert canvas/image to data URL
                    const canvas = document.createElement('canvas');
                    canvas.width = spriteData.width;
                    canvas.height = spriteData.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(spriteData.image, 0, 0);
                    characterImg.src = canvas.toDataURL();
                    imageSet = true;
                } catch (e) {
                    console.warn('Failed to convert piggy sprite to data URL:', e);
                }
            }
        } else if (player.id === 1 && goldenPiggySprites.length > 0) {
            // Use first frame of golden piggy character
            const spriteData = goldenPiggySprites[0];
            if (spriteData && spriteData.image && spriteData.image.complete) {
                try {
                    // Convert canvas/image to data URL
                    const canvas = document.createElement('canvas');
                    canvas.width = spriteData.width;
                    canvas.height = spriteData.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(spriteData.image, 0, 0);
                    characterImg.src = canvas.toDataURL();
                    imageSet = true;
                } catch (e) {
                    console.warn('Failed to convert golden piggy sprite to data URL:', e);
                }
            }
        }
        
        // Fallback: use colored square for other players or if image failed
        if (!imageSet) {
            characterImg.style.backgroundColor = player.color;
            characterImg.style.width = '40px';
            characterImg.style.height = '40px';
            characterImg.style.border = '2px solid #000';
        }
        
        // Create score number
        const scoreNumber = document.createElement('div');
        scoreNumber.className = 'score-number';
        scoreNumber.textContent = score;
        
        // Append to score item
        scoreItem.appendChild(characterImg);
        scoreItem.appendChild(scoreNumber);
        
        // Append to container
        scoreContainer.appendChild(scoreItem);
    });
}

// UI event handlers
function setupUIHandlers() {
    const startBtn = document.getElementById('start-btn');
    const menuBtn = document.getElementById('menu-btn');
    
    if (!startBtn || !menuBtn) {
        console.error('UI elements not found');
        return;
    }
    
    startBtn.addEventListener('click', () => {
        gameState.playerCount = parseInt(document.getElementById('player-count').value);
        // Reset scores when starting new game
        gameState.scores = {};
        gameState.roundProcessed = false;
        loadLevel(gameState.currentLevel);
        gameState.gameRunning = true;
        gameState.startTime = Date.now();
        
        document.getElementById('menu-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        
        updateScoreDisplay();
        gameLoop();
    });

    menuBtn.addEventListener('click', () => {
        gameState.gameRunning = false;
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('menu-screen').classList.add('active');
    });
}

// Setup UI handlers when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupUIHandlers);
} else {
    setupUIHandlers();
}

document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        gameState.currentLevel = parseInt(btn.dataset.level);
    });
});

// Select first level by default - wait for DOM
function initUI() {
    const firstLevelBtn = document.querySelector('.level-btn');
    if (firstLevelBtn) {
        firstLevelBtn.classList.add('selected');
    }
}

// Wait for DOM to be ready for UI initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
} else {
    initUI();
}

// Handle canvas resize
window.addEventListener('resize', () => {
    resizeCanvas();
    // No need to reload level since world size is fixed
});

// Test function to verify tagging works - can be called from console
window.testTagging = function() {
    if (gameState.players.length < 2) {
        console.log('Need at least 2 players to test tagging');
        return;
    }
    
    const player1 = gameState.players[0];
    const player2 = gameState.players[1];
    
    console.log('Before tagging:');
    console.log('Player 1 isIt:', player1.isIt, 'Position:', player1.x, player1.y);
    console.log('Player 2 isIt:', player2.isIt, 'Position:', player2.x, player2.y);
    
    // Move players to overlap (direct collision)
    player1.x = player2.x;
    player1.y = player2.y;
    
    console.log('Players moved together. Checking collision...');
    console.log('Collision check:', player1.collidesWith(player2));
    
    // Force collision check in the game's checkCollisions function
    checkCollisions();
    
    console.log('After tagging:');
    console.log('Player 1 isIt:', player1.isIt);
    console.log('Player 2 isIt:', player2.isIt);
};


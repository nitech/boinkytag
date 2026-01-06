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

// Set canvas size (viewport size, not world size)
function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Initialize when DOM is ready
function init() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    ctx = canvas.getContext('2d');
    resizeCanvas();
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
        this.isIt = id === 0; // First player is "it" initially
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.jumpPower = 25; // Increased to allow reaching higher platforms
        this.gravity = 0.6;
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
                // Top collision (landing on platform)
                if (this.velocityY > 0 && this.y - this.height < platform.y + 10) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.onGround = true;
                }
                // Bottom collision (hitting ceiling)
                else if (this.velocityY < 0 && this.y > platform.y + platform.height - 10) {
                    this.y = platform.y + platform.height;
                    this.velocityY = 0;
                }
                // Side collisions
                if (this.velocityX > 0 && this.x - this.width < platform.x + 10) {
                    this.x = platform.x - this.width;
                    this.velocityX = 0;
                } else if (this.velocityX < 0 && this.x > platform.x + platform.width - 10) {
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
        }

        // Friction
        this.velocityX *= 0.85;
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
    }
}

// Platform class
class Platform {
    constructor(x, y, width, height, color = '#8B4513') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

// Bounce pad class
class BouncePad {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.bouncePower = 15;
    }

    draw() {
        if (!ctx) return;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#00cc00';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw arrow up
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + 5);
        ctx.lineTo(this.x + this.width / 2 - 8, this.y + this.height - 5);
        ctx.lineTo(this.x + this.width / 2 + 8, this.y + this.height - 5);
        ctx.closePath();
        ctx.fill();
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
    return {
        platforms: [
            new Platform(0, WORLD_HEIGHT - 50, WORLD_WIDTH, 50), // Ground
            // Left section - lowered platforms
            new Platform(200, WORLD_HEIGHT - 150, 150, 20), // Lowered by 30
            new Platform(500, WORLD_HEIGHT - 220, 150, 20), // Lowered by 60
            new Platform(800, WORLD_HEIGHT - 150, 150, 20), // Lowered by 30
            new Platform(1100, WORLD_HEIGHT - 280, 150, 20), // Lowered by 70
            new Platform(200, WORLD_HEIGHT - 350, 200, 20), // Lowered by 100
            new Platform(600, WORLD_HEIGHT - 350, 200, 20), // Lowered by 100
            // Middle-left section
            new Platform(2000, WORLD_HEIGHT - 160, 150, 20), // Lowered by 40
            new Platform(2300, WORLD_HEIGHT - 240, 150, 20), // Lowered by 60
            new Platform(2600, WORLD_HEIGHT - 150, 150, 20), // Lowered by 30
            new Platform(2900, WORLD_HEIGHT - 320, 200, 20), // Lowered by 80
            new Platform(3200, WORLD_HEIGHT - 200, 150, 20), // Lowered by 50
            // Center section
            new Platform(4000, WORLD_HEIGHT - 160, 200, 20), // Lowered by 40
            new Platform(4300, WORLD_HEIGHT - 280, 150, 20), // Lowered by 70
            new Platform(4600, WORLD_HEIGHT - 150, 150, 20), // Lowered by 30
            new Platform(4900, WORLD_HEIGHT - 360, 200, 20), // Lowered by 90
            new Platform(5200, WORLD_HEIGHT - 240, 150, 20), // Lowered by 60
            // Middle-right section
            new Platform(6000, WORLD_HEIGHT - 200, 150, 20), // Lowered by 50
            new Platform(6300, WORLD_HEIGHT - 320, 150, 20), // Lowered by 80
            new Platform(6600, WORLD_HEIGHT - 150, 150, 20), // Lowered by 30
            new Platform(6900, WORLD_HEIGHT - 280, 200, 20), // Lowered by 70
            // Right section
            new Platform(7400, WORLD_HEIGHT - 160, 150, 20), // Lowered by 40
            new Platform(7700, WORLD_HEIGHT - 240, 150, 20), // Lowered by 60
        ],
        bouncePads: [
            new BouncePad(250, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(750, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(1150, WORLD_HEIGHT - 300, 50, 20),
            new BouncePad(2050, WORLD_HEIGHT - 180, 50, 20),
            new BouncePad(4050, WORLD_HEIGHT - 180, 50, 20),
            new BouncePad(6050, WORLD_HEIGHT - 220, 50, 20),
            new BouncePad(7450, WORLD_HEIGHT - 180, 50, 20),
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
    return {
        platforms: [
            new Platform(0, WORLD_HEIGHT - 50, WORLD_WIDTH, 50), // Ground
            // Left section
            new Platform(150, WORLD_HEIGHT - 150, 100, 20),
            new Platform(350, WORLD_HEIGHT - 230, 100, 20),
            new Platform(550, WORLD_HEIGHT - 310, 100, 20),
            new Platform(750, WORLD_HEIGHT - 230, 100, 20),
            new Platform(950, WORLD_HEIGHT - 150, 100, 20),
            new Platform(1150, WORLD_HEIGHT - 230, 100, 20),
            new Platform(300, WORLD_HEIGHT - 410, 200, 20),
            new Platform(700, WORLD_HEIGHT - 410, 200, 20),
            new Platform(500, WORLD_HEIGHT - 490, 300, 20),
            // Middle-left section
            new Platform(2000, WORLD_HEIGHT - 200, 100, 20),
            new Platform(2200, WORLD_HEIGHT - 320, 100, 20),
            new Platform(2400, WORLD_HEIGHT - 150, 100, 20),
            new Platform(2600, WORLD_HEIGHT - 400, 200, 20),
            new Platform(2800, WORLD_HEIGHT - 250, 100, 20),
            new Platform(3000, WORLD_HEIGHT - 480, 300, 20),
            // Center section
            new Platform(4000, WORLD_HEIGHT - 150, 100, 20),
            new Platform(4200, WORLD_HEIGHT - 280, 100, 20),
            new Platform(4400, WORLD_HEIGHT - 410, 200, 20),
            new Platform(4600, WORLD_HEIGHT - 230, 100, 20),
            new Platform(4800, WORLD_HEIGHT - 360, 100, 20),
            new Platform(5000, WORLD_HEIGHT - 490, 300, 20),
            // Middle-right section
            new Platform(6000, WORLD_HEIGHT - 200, 100, 20),
            new Platform(6200, WORLD_HEIGHT - 330, 100, 20),
            new Platform(6400, WORLD_HEIGHT - 160, 100, 20),
            new Platform(6600, WORLD_HEIGHT - 420, 200, 20),
            new Platform(6800, WORLD_HEIGHT - 270, 100, 20),
            // Right section
            new Platform(7400, WORLD_HEIGHT - 150, 100, 20),
            new Platform(7600, WORLD_HEIGHT - 300, 100, 20),
            new Platform(7800, WORLD_HEIGHT - 450, 200, 20),
        ],
        bouncePads: [
            new BouncePad(175, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(575, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(975, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(550, WORLD_HEIGHT - 510, 50, 20),
            new BouncePad(2050, WORLD_HEIGHT - 220, 50, 20),
            new BouncePad(4050, WORLD_HEIGHT - 170, 50, 20),
            new BouncePad(6050, WORLD_HEIGHT - 220, 50, 20),
            new BouncePad(7450, WORLD_HEIGHT - 170, 50, 20),
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
    return {
        platforms: [
            new Platform(0, WORLD_HEIGHT - 50, WORLD_WIDTH, 50), // Ground
            // Left section - low row
            new Platform(100, WORLD_HEIGHT - 180, 120, 20),
            new Platform(300, WORLD_HEIGHT - 180, 120, 20),
            new Platform(500, WORLD_HEIGHT - 180, 120, 20),
            new Platform(700, WORLD_HEIGHT - 180, 120, 20),
            new Platform(900, WORLD_HEIGHT - 180, 120, 20),
            new Platform(1100, WORLD_HEIGHT - 180, 120, 20),
            // Left section - medium row
            new Platform(200, WORLD_HEIGHT - 310, 120, 20),
            new Platform(400, WORLD_HEIGHT - 310, 120, 20),
            new Platform(600, WORLD_HEIGHT - 310, 120, 20),
            new Platform(800, WORLD_HEIGHT - 310, 120, 20),
            new Platform(1000, WORLD_HEIGHT - 310, 120, 20),
            // Left section - high platforms
            new Platform(300, WORLD_HEIGHT - 440, 200, 20),
            new Platform(700, WORLD_HEIGHT - 440, 200, 20),
            new Platform(500, WORLD_HEIGHT - 570, 300, 20),
            // Middle-left section
            new Platform(2000, WORLD_HEIGHT - 200, 120, 20),
            new Platform(2200, WORLD_HEIGHT - 200, 120, 20),
            new Platform(2400, WORLD_HEIGHT - 330, 120, 20),
            new Platform(2600, WORLD_HEIGHT - 330, 120, 20),
            new Platform(2800, WORLD_HEIGHT - 460, 200, 20),
            new Platform(3000, WORLD_HEIGHT - 200, 120, 20),
            // Center section
            new Platform(4000, WORLD_HEIGHT - 180, 120, 20),
            new Platform(4200, WORLD_HEIGHT - 180, 120, 20),
            new Platform(4400, WORLD_HEIGHT - 310, 120, 20),
            new Platform(4600, WORLD_HEIGHT - 310, 120, 20),
            new Platform(4800, WORLD_HEIGHT - 440, 200, 20),
            new Platform(5000, WORLD_HEIGHT - 570, 300, 20),
            new Platform(5200, WORLD_HEIGHT - 180, 120, 20),
            // Middle-right section
            new Platform(6000, WORLD_HEIGHT - 200, 120, 20),
            new Platform(6200, WORLD_HEIGHT - 330, 120, 20),
            new Platform(6400, WORLD_HEIGHT - 330, 120, 20),
            new Platform(6600, WORLD_HEIGHT - 460, 200, 20),
            new Platform(6800, WORLD_HEIGHT - 200, 120, 20),
            // Right section
            new Platform(7400, WORLD_HEIGHT - 180, 120, 20),
            new Platform(7600, WORLD_HEIGHT - 180, 120, 20),
            new Platform(7800, WORLD_HEIGHT - 310, 120, 20),
        ],
        bouncePads: [
            new BouncePad(150, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(550, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(950, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(350, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(750, WORLD_HEIGHT - 330, 50, 20),
            new BouncePad(600, WORLD_HEIGHT - 590, 50, 20),
            new BouncePad(2050, WORLD_HEIGHT - 220, 50, 20),
            new BouncePad(4050, WORLD_HEIGHT - 200, 50, 20),
            new BouncePad(6050, WORLD_HEIGHT - 220, 50, 20),
            new BouncePad(7450, WORLD_HEIGHT - 200, 50, 20),
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
    
    for (let i = 0; i < gameState.playerCount; i++) {
        const spawn = level.spawnPoints[i];
        const player = new Player(spawn.x, spawn.y, colors[i], i);
        gameState.players.push(player);
    }
    
    // First player is "it"
    gameState.players[0].isIt = true;
    for (let i = 1; i < gameState.players.length; i++) {
        gameState.players[i].isIt = false;
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
}

// Input handling
const keys = {};
const playerControls = [
    { left: 'KeyA', right: 'KeyD', up: 'KeyW' },
    { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp' },
    { left: 'KeyJ', right: 'KeyL', up: 'KeyI' },
    { left: 'KeyF', right: 'KeyH', up: 'KeyT' }
];

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
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
        if (keys[controls.up] && player.onGround) {
            player.velocityY = -player.jumpPower;
            player.onGround = false;
        }
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
    gameState.players.forEach(player => {
        if (!player.isIt) return;
        
        gameState.players.forEach(otherPlayer => {
            // Skip if same player or other player is already "it"
            if (player.id === otherPlayer.id || otherPlayer.isIt) return;
            
            // Simple collision check - players are touching
            const isColliding = player.collidesWith(otherPlayer);
            if (isColliding) {
                // Tag! Transfer "it" status to the player who was tagged
                player.isIt = false;
                otherPlayer.isIt = true;
                console.log(`TAG! Player ${otherPlayer.id + 1} (${otherPlayer.color}) is now "it"!`);
            }
        });
    });
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
    
    // Update timer
    if (gameState.startTime) {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('timer').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    requestAnimationFrame(gameLoop);
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
        loadLevel(gameState.currentLevel);
        gameState.gameRunning = true;
        gameState.startTime = Date.now();
        
        document.getElementById('menu-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        
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



const menuCanvas = document.getElementById('menuCanvas');
const menuCtx = menuCanvas.getContext('2d');
let menuAnimationId;
let menuParticles = [];

function resizeMenuCanvas() {
    menuCanvas.width = window.innerWidth;
    menuCanvas.height = window.innerHeight;
}

class MenuParticle {
    constructor() {
        this.reset();
        // Start with random life to avoid popping in all at once
        this.life = Math.random();
    }

    reset() {
        this.x = Math.random() * menuCanvas.width;
        this.y = Math.random() * menuCanvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        // Game colors: purple, blue, white, yellow (stars)
        const colors = [
            '#667eea', // Blue
            '#764ba2', // Purple
            '#ffffff', // White
            '#ffd700'  // Gold
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.size = 2 + Math.random() * 4;
        this.life = 0;
        this.maxLife = 2 + Math.random() * 2; // Last 2-4 seconds
        this.growth = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life += 0.016;

        if (this.life >= this.maxLife ||
            this.x < 0 || this.x > menuCanvas.width ||
            this.y < 0 || this.y > menuCanvas.height) {
            this.reset();
        }
    }

    draw() {
        menuCtx.fillStyle = this.color;

        // Blink/fade effect
        const opacity = Math.sin((this.life / this.maxLife) * Math.PI);
        menuCtx.globalAlpha = opacity * 0.6;

        // Pixelated draw
        menuCtx.fillRect(
            Math.floor(this.x),
            Math.floor(this.y),
            Math.floor(this.size),
            Math.floor(this.size)
        );

        menuCtx.globalAlpha = 1.0;
    }
}

function initMenuParticles() {
    menuParticles = [];
    // Create density based on screen size
    const particleCount = Math.floor((window.innerWidth * window.innerHeight) / 10000);

    for (let i = 0; i < particleCount; i++) {
        menuParticles.push(new MenuParticle());
    }
}

function animateMenu() {
    menuCtx.clearRect(0, 0, menuCanvas.width, menuCanvas.height);

    menuParticles.forEach(p => {
        p.update();
        p.draw();
    });

    if (document.getElementById('menu-screen').classList.contains('active')) {
        menuAnimationId = requestAnimationFrame(animateMenu);
    }
}

window.addEventListener('resize', () => {
    resizeMenuCanvas();
    initMenuParticles();
});

// Start when loaded
window.addEventListener('load', () => {
    resizeMenuCanvas();
    initMenuParticles();
    animateMenu();
});

// Handle visibility changes (if game starts, stop animation)
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.target.id === 'menu-screen') {
            if (mutation.target.classList.contains('active')) {
                resizeMenuCanvas();
                animateMenu();
            } else {
                cancelAnimationFrame(menuAnimationId);
            }
        }
    });
});

observer.observe(document.getElementById('menu-screen'), { attributes: true, attributeFilter: ['class'] });

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Image-smoothing disabled for perfect crisp pixel graphics
ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;

// Real Physics variables to match standard gameplay
const GRAVITY = 0.22;
const FLAP = -4.8;
const SPAWN_RATE = 100;
const PIPE_SPEED = 2.2;
const PIPE_GAP = 115;

let bird = { x: 60, y: 200, velocity: 0, width: 34, height: 24, rotation: 0 };
let pipes = [];
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;
let gameState = 'START'; 
let frameCount = 0;

const images = {};
const imageSources = {
    bg: './assets/images/bg.png',
    bird: './assets/images/flappybird.png',
    topPipe: './assets/images/toppipe.png',
    bottomPipe: './assets/images/bottompipe.png'
};

let loadedImages = 0;
const totalImages = Object.keys(imageSources).length;

function imageLoaded() {
    loadedImages++;
    if (loadedImages === totalImages) {
        requestAnimationFrame(gameLoop);
    }
}

for (let key in imageSources) {
    images[key] = new Image();
    images[key].src = imageSources[key];
    images[key].onload = imageLoaded;
    images[key].onerror = () => imageLoaded();
}

// Input Controllers
window.addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); handleAction(); } });
window.addEventListener('touchstart', (e) => { e.preventDefault(); handleAction(); }, { passive: false });

function handleAction() {
    if (gameState === 'START') {
        gameState = 'PLAYING';
        resetGame();
    } else if (gameState === 'PLAYING') {
        bird.velocity = FLAP;
    } else if (gameState === 'GAMEOVER') {
        gameState = 'PLAYING';
        resetGame();
    }
}

function resetGame() {
    bird.y = 200;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes = [];
    score = 0;
    frameCount = 0;
}

function update() {
    if (gameState !== 'PLAYING') return;

    frameCount++;
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    // Advanced Rotation Effect based on bird velocity
    if (bird.velocity < 0) {
        bird.rotation = Math.max(-0.4, bird.velocity * 0.08);
    } else if (bird.velocity > 0) {
        bird.rotation = Math.min(0.7, bird.velocity * 0.08);
    }

    if (bird.y + bird.height >= canvas.height - 40 || bird.y <= 0) {
        gameState = 'GAMEOVER';
    }

    if (frameCount % SPAWN_RATE === 0) {
        let minHeight = 50;
        let maxHeight = canvas.height - PIPE_GAP - minHeight - 60;
        let topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        
        pipes.push({ x: canvas.width, topHeight: topHeight, passed: false });
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;

        // Collision box tweaks for perfect edge detection
        if (
            bird.x + 4 < pipes[i].x + 52 &&
            bird.x + bird.width - 4 > pipes[i].x &&
            (bird.y + 4 < pipes[i].topHeight || bird.y + bird.height - 4 > pipes[i].topHeight + PIPE_GAP)
        ) {
            gameState = 'GAMEOVER';
        }

        if (!pipes[i].passed && pipes[i].x + 26 < bird.x) {
            score++;
            pipes[i].passed = true;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('flappyHighScore', highScore);
            }
        }

        if (pipes[i].x + 52 < 0) pipes.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background
    if (images.bg.complete) {
        ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);
    }

    // Draw Pipes
    pipes.forEach(pipe => {
        if (images.topPipe.complete) {
            ctx.drawImage(images.topPipe, pipe.x, pipe.topHeight - 320, 52, 320);
        }
        if (images.bottomPipe.complete) {
            ctx.drawImage(images.bottomPipe, pipe.x, pipe.topHeight + PIPE_GAP, 52, 320);
        }
    });

    // Draw Bird with Rotation Physics
    if (images.bird.complete) {
        ctx.save();
        ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        ctx.rotate(bird.rotation);
        ctx.drawImage(images.bird, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
        ctx.restore();
    }

    // Modern Overlay rendering
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    
    if (gameState === 'PLAYING') {
        ctx.font = 'bold 40px Arial';
        ctx.fillText(score, canvas.width / 2, 60);
        ctx.strokeText(score, canvas.width / 2, 60);
    } else if (gameState === 'START') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('Tap / Space to Fly', canvas.width / 2, canvas.height / 2);
    } else if (gameState === 'GAMEOVER') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFF';
        
        ctx.font = 'bold 32px Arial';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 40);
        
        ctx.font = '22px Arial';
        ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText('Best: ' + highScore, canvas.width / 2, canvas.height / 2 + 45);
        
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('Tap to Restart', canvas.width / 2, canvas.height / 2 + 90);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

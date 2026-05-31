const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Retro pixel graphics enable karne ke liye filter
ctx.imageSmoothingEnabled = false;

// 🔥 SPEED & PHYSICS CONFIG (Super fast responsive)
const GRAVITY = 0.25;
const FLAP = -5.0;
const PIPE_SPEED = 2.2;
const PIPE_GAP = 110;
const SPAWN_RATE = 90; // Har 90 frames mein pipe spawn hoga

let bird = { x: 60, y: 200, velocity: 0, width: 34, height: 24, rotation: 0 };
let pipes = [];
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;
let gameState = 'START'; // START, PLAYING, GAMEOVER
let frameCount = 0;

// Images Loading Setup
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
    images[key].onerror = () => imageLoaded(); // Image miss hone par bhi game crash nahi hoga
}

// 🔥 INSTANT INPUT CONTROLLER (0ms delay)
function handleAction() {
    if (gameState === 'START') {
        gameState = 'PLAYING';
        resetGame();
    } else if (gameState === 'PLAYING') {
        bird.velocity = FLAP; // Phatak se jump!
    } else if (gameState === 'GAMEOVER') {
        gameState = 'PLAYING';
        resetGame();
    }
}

// Controls binding
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleAction();
    }
});

canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    handleAction();
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleAction();
}, { passive: false });


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

    // Angle tilt based on physics velocity
    if (bird.velocity < 0) {
        bird.rotation = -0.3;
    } else if (bird.velocity > 3) {
        bird.rotation = 0.6;
    } else {
        bird.rotation = 0;
    }

    // Border checks
    if (bird.y + bird.height >= canvas.height - 40 || bird.y <= 0) {
        gameState = 'GAMEOVER';
    }

    // Pipe manager
    if (frameCount % SPAWN_RATE === 0) {
        let minHeight = 40;
        let maxHeight = canvas.height - PIPE_GAP - minHeight - 60;
        let topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        pipes.push({ x: canvas.width, topHeight: topHeight, passed: false });
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;

        // Collision logic
        if (
            bird.x + 4 < pipes[i].x + 52 &&
            bird.x + bird.width - 4 > pipes[i].x &&
            (bird.y + 4 < pipes[i].topHeight || bird.y + bird.height - 4 > pipes[i].topHeight + PIPE_GAP)
        ) {
            gameState = 'GAMEOVER';
        }

        // Score tracker
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
    ctx.imageSmoothingEnabled = false;

    // 1. Draw Background
    if (images.bg.complete && images.bg.naturalWidth !== 0) {
        ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Draw Pipes
    pipes.forEach(pipe => {
        if (images.topPipe.complete && images.topPipe.naturalWidth !== 0) {
            ctx.drawImage(images.topPipe, pipe.x, pipe.topHeight - 320, 52, 320);
        } else {
            ctx.fillStyle = '#73bf2e';
            ctx.fillRect(pipe.x, 0, 52, pipe.topHeight);
        }
        
        if (images.bottomPipe.complete && images.bottomPipe.naturalWidth !== 0) {
            ctx.drawImage(images.bottomPipe, pipe.x, pipe.topHeight + PIPE_GAP, 52, 320);
        } else {
            ctx.fillStyle = '#73bf2e';
            ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, 52, canvas.height - (pipe.topHeight + PIPE_GAP));
        }
    });

    // 3. Draw Bird with Rotation
    if (images.bird.complete && images.bird.naturalWidth !== 0) {
        ctx.save();
        ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        ctx.rotate(bird.rotation);
        ctx.drawImage(images.bird, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
        ctx.restore();
    } else {
        ctx.fillStyle = '#f7db05';
        ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
    }

    // 4. Ground element drawing
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.fillStyle = '#73bf2e';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 8);

    // 5. HUD Text Overlay
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    
    if (gameState === 'PLAYING') {
        ctx.font = 'bold 40px Impact, Arial';
        ctx.fillText(score, canvas.width / 2, 60);
        ctx.strokeText(score, canvas.width / 2, 60);
    } else if (gameState === 'START') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 28px Impact, Arial';
        ctx.fillText('FLAPPY BIRD', canvas.width / 2, canvas.height / 2 - 40);
        ctx.strokeText('FLAPPY BIRD', canvas.width / 2, canvas.height / 2 - 40);
        
        ctx.font = 'bold 18px Arial';
        ctx.fillText('TAP TO START', canvas.width / 2, canvas.height / 2 + 20);
    } else if (gameState === 'GAMEOVER') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFF';
        
        ctx.font = 'bold 36px Impact, Arial';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
        ctx.strokeText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.font = 'bold 22px Arial';
        ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 5);
        ctx.fillText('Best: ' + highScore, canvas.width / 2, canvas.height / 2 + 35);
        
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('TAP TO RESTART', canvas.width / 2, canvas.height / 2 + 85);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

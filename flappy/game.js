const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Sharp graphics filter
ctx.imageSmoothingEnabled = false;

// Physics Config (Instantly snappy)
const GRAVITY = 1300;  
const FLAP = -340;     
const PIPE_SPEED = 150; 
const PIPE_GAP = 115;
const SPAWN_RATE = 1.5; 

let bird = { x: 60, y: 200, velocity: 0, width: 34, height: 24, rotation: 0 };
let pipes = [];
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;
let gameState = 'START'; 

let lastTime = 0;
let pipeSpawnTimer = 0;

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
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
}

for (let key in imageSources) {
    images[key] = new Image();
    images[key].src = imageSources[key];
    images[key].onload = imageLoaded;
    images[key].onerror = () => imageLoaded();
}

// 🔥 ZERO-DELAY INPUT CONTROLLERS (Super Fast Response)
window.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault(); // Browser ko scroll karne se rokna
        handleAction();
    }
});

// Mobile ke liye pointerdown/touchstart bina kisi delay ke
window.addEventListener('pointerdown', function(e) {
    if (e.target === canvas) {
        e.preventDefault();
        handleAction();
    }
}, { passive: false });

function handleAction() {
    if (gameState === 'START') {
        gameState = 'PLAYING';
        resetGame();
    } else if (gameState === 'PLAYING') {
        bird.velocity = FLAP; // Instant jump!
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
    pipeSpawnTimer = 0;
}

function update(dt) {
    if (gameState !== 'PLAYING') return;

    bird.velocity += GRAVITY * dt;
    bird.y += bird.velocity * dt;

    // Smooth rotation physics
    if (bird.velocity < 0) {
        bird.rotation = Math.max(-0.4, bird.velocity * 0.002);
    } else {
        bird.rotation = Math.min(0.7, bird.velocity * 0.0015);
    }

    if (bird.y + bird.height >= canvas.height - 40 || bird.y <= 0) {
        gameState = 'GAMEOVER';
    }

    pipeSpawnTimer += dt;
    if (pipeSpawnTimer >= SPAWN_RATE) {
        pipeSpawnTimer = 0;
        let minHeight = 50;
        let maxHeight = canvas.height - PIPE_GAP - minHeight - 60;
        let topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        pipes.push({ x: canvas.width, topHeight: topHeight, passed: false });
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED * dt;

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

    if (images.bg.complete) ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);

    pipes.forEach(pipe => {
        if (images.topPipe.complete) ctx.drawImage(images.topPipe, pipe.x, pipe.topHeight - 320, 52, 320);
        if (images.bottomPipe.complete) ctx.drawImage(images.bottomPipe, pipe.x, pipe.topHeight + PIPE_GAP, 52, 320);
    });

    if (images.bird.complete) {
        ctx.save();
        ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        ctx.rotate(bird.rotation);
        ctx.drawImage(images.bird, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
        ctx.restore();
    }

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

function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastTime = timestamp;

    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
}

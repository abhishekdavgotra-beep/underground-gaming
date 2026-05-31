// --- ORIGINAL CORE ENGINE (Nolanjp Style) ---
var canvas = document.getElementById("canvas") || document.getElementById("gameCanvas");
if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "canvas";
    document.body.appendChild(canvas);
}
var ctx = canvas.getContext("2d");

canvas.width = 320;
canvas.height = 480;

var score = 0;
var highscore = localStorage.getItem("flappyHighScore") || 0;
var state = 0; // 0: Start, 1: Playing, 2: GameOver
var frame = 0;

var bird = {
    x: 60,
    y: 150,
    w: 34,
    h: 24,
    gravity: 0.25,
    velocity: 0,
    jump: -4.6,
    rotation: 0
};

var pipes = [];
var pipeGap = 100;
var pipeSpeed = 2;

// --- IMAGES OBJECT SETUP ---
var images = {};
var src = {
    bg: "./assets/images/bg.png",
    bird: "./assets/images/flappybird.png",
    top: "./assets/images/toppipe.png",
    bottom: "./assets/images/bottompipe.png"
};

var loaded = 0;
for (var key in src) {
    images[key] = new Image();
    images[key].src = src[key];
    images[key].onload = function() { loaded++; };
}

// --- 🔥 INTERACTION CONTROLLER (NO 2-DAY DELAY LAG!) ---
function doAction() {
    if (state === 0) {
        state = 1;
        pipes = [];
        score = 0;
        bird.y = 150;
        bird.velocity = 0;
    } else if (state === 1) {
        bird.velocity = bird.jump; // Snappy instant jump!
    } else if (state === 2) {
        state = 0;
    }
}

// Global window controls (Dono Keyboard aur click/touch ke liye instantly active)
window.addEventListener("keydown", function(e) {
    if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        doAction();
    }
});

// Purana touchstart delay bypass karne ka asli tareeka
window.addEventListener("pointerdown", function(e) {
    // Sirf tab trigger hoga jab screen par click ho (overlay blocker ko bypass karega)
    doAction();
}, { passive: true });

// --- GAME LOGIC LOOP ---
function update() {
    if (state !== 1) return;

    frame++;
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // Smooth physics angle rotation
    if (bird.velocity < 0) {
        bird.rotation = -0.3;
    } else if (bird.velocity > 4) {
        bird.rotation = 0.7;
    } else {
        bird.rotation = 0;
    }

    if (bird.y + bird.h >= canvas.height - 40 || bird.y <= 0) {
        endGame();
    }

    // Spawn pipes smoothly
    if (frame % 100 === 0) {
        var topH = Math.floor(Math.random() * (canvas.height - pipeGap - 120)) + 40;
        pipes.push({ x: canvas.width, top: topH, passed: false });
    }

    for (var i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;

        // Strict pixel-perfect hitbox mapping
        if (
            bird.x + 4 < pipes[i].x + 52 &&
            bird.x + bird.w - 4 > pipes[i].x &&
            (bird.y + 4 < pipes[i].top || bird.y + bird.h - 4 > pipes[i].top + pipeGap)
        ) {
            endGame();
        }

        if (!pipes[i].passed && pipes[i].x + 26 < bird.x) {
            score++;
            pipes[i].passed = true;
            if (score > highscore) {
                highscore = score;
                localStorage.setItem("flappyHighScore", highscore);
            }
        }

        if (pipes[i].x + 52 < 0) pipes.splice(i, 1);
    }
}

function endGame() {
    state = 2;
}

// --- CANVAS GRAPHICS RENDERER ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false; // Crisp pixel layout filter

    // 1. Draw Background
    if (images.bg.complete) ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);

    // 2. Draw Pipes
    pipes.forEach(function(p) {
        if (images.top.complete) ctx.drawImage(images.top, p.x, p.top - 320, 52, 320);
        if (images.bottom.complete) ctx.drawImage(images.bottom, p.x, p.top + pipeGap, 52, 320);
    });

    // 3. Draw Bird with Smooth Rotation
    if (images.bird.complete) {
        ctx.save();
        ctx.translate(bird.x + bird.w / 2, bird.y + bird.h / 2);
        ctx.rotate(bird.rotation);
        ctx.drawImage(images.bird, -bird.w / 2, -bird.h / 2, bird.w, bird.h);
        ctx.restore();
    }

    // 4. Score Display & UI Overlays
    ctx.fillStyle = "#FFF";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.textAlign = "center";

    if (state === 1) {
        ctx.font = 'bold 36px Arial';
        ctx.fillText(score, canvas.width / 2, 60);
        ctx.strokeText(score, canvas.width / 2, 60);
    } else if (state === 0) {
        // Draw Retro title block manually if img fails
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FFF";
        ctx.font = 'bold 24px Arial';
        ctx.fillText("FLAPPY BIRD", canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '16px Arial';
        ctx.fillStyle = "#FFD700";
        ctx.fillText("TAP ANYWHERE TO START", canvas.width / 2, canvas.height / 2 + 20);
    } else if (state === 2) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FFF";
        ctx.font = 'bold 28px Arial';
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '20px Arial';
        ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText("Best: " + highscore, canvas.width / 2, canvas.height / 2 + 40);
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = "#FFD700";
        ctx.fillText("TAP TO RESTART", canvas.width / 2, canvas.height / 2 + 80);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();

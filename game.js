const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const startScreenElement = document.getElementById('startScreen');

let gameState = 'start';
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
highScoreElement.textContent = highScore;

const player = {
    x: 100,
    y: 200,
    width: 40,
    height: 40,
    velocity: 0,
    gravity: 0.5,
    jumpPower: -10,
    color: '#4CAF50'
};

const obstacles = [];
const particles = [];

class Obstacle {
    constructor() {
        this.width = 30;
        this.height = Math.random() * 150 + 50;
        this.x = canvas.width;
        this.y = Math.random() > 0.5 ? 0 : canvas.height - this.height;
        this.speed = 4 + Math.floor(score / 5);
        this.color = '#e74c3c';
        this.passed = false;
    }

    update() {
        this.x -= this.speed;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(this.x, this.y, this.width, 5);
        if (this.y > 0) {
            ctx.fillRect(this.x, this.y + this.height - 5, this.width, 5);
        }
    }

    collidesWith(player) {
        // プレイヤーの中央座標を計算（当たり判定を中央1ピクセルに縮小）
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const hitboxSize = 2; // 当たり判定のサイズ（2x2ピクセル）
        
        return playerCenterX - hitboxSize/2 < this.x + this.width &&
               playerCenterX + hitboxSize/2 > this.x &&
               playerCenterY - hitboxSize/2 < this.y + this.height &&
               playerCenterY + hitboxSize/2 > this.y;
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = Math.random() * 4 - 2;
        this.vy = Math.random() * 4 - 2;
        this.size = Math.random() * 3 + 1;
        this.life = 1;
        this.decay = 0.02;
        this.color = `hsl(${Math.random() * 60 + 200}, 70%, 50%)`;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.98;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }
}

function jump() {
    if (gameState === 'playing') {
        player.velocity = player.jumpPower;
        
        for (let i = 0; i < 5; i++) {
            particles.push(new Particle(
                player.x + player.width / 2,
                player.y + player.height
            ));
        }
    }
}

function startGame() {
    gameState = 'playing';
    score = 0;
    player.y = 200;
    player.velocity = 0;
    obstacles.length = 0;
    particles.length = 0;
    startScreenElement.style.display = 'none';
    gameOverElement.style.display = 'none';
}

function endGame() {
    gameState = 'gameover';
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
    
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('highScore', highScore);
    }
}

function updatePlayer() {
    player.velocity += player.gravity;
    player.y += player.velocity;

    if (player.y < 0) {
        player.y = 0;
        player.velocity = 0;
    }

    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.velocity = 0;
    }
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    ctx.fillStyle = '#45a049';
    ctx.fillRect(player.x + 5, player.y + 5, 10, 10);
    ctx.fillRect(player.x + 25, player.y + 5, 10, 10);
    
    ctx.fillStyle = '#333';
    ctx.fillRect(player.x + 7, player.y + 7, 6, 6);
    ctx.fillRect(player.x + 27, player.y + 7, 6, 6);
    
    const mouthY = player.y + 25;
    ctx.fillStyle = '#333';
    ctx.fillRect(player.x + 10, mouthY, 20, 3);
}

function updateObstacles() {
    if (Math.random() < 0.02 && obstacles.length < 5) {
        obstacles.push(new Obstacle());
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.update();

        if (!obstacle.passed && obstacle.x + obstacle.width < player.x) {
            obstacle.passed = true;
            score++;
            scoreElement.textContent = score;
            
            for (let j = 0; j < 10; j++) {
                particles.push(new Particle(
                    player.x + player.width / 2,
                    player.y + player.height / 2
                ));
            }
        }

        if (obstacle.collidesWith(player)) {
            endGame();
        }

        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.update();
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98D8C8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 3; i++) {
        const x = (Date.now() / 50 + i * 200) % (canvas.width + 100) - 50;
        ctx.beginPath();
        ctx.arc(x, 50 + i * 30, 30, 0, Math.PI * 2);
        ctx.fill();
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();

    if (gameState === 'playing') {
        updatePlayer();
        updateObstacles();
        updateParticles();
        
        drawPlayer();
        obstacles.forEach(obstacle => obstacle.draw());
        particles.forEach(particle => particle.draw());
    }

    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        
        if (gameState === 'start' || gameState === 'gameover') {
            startGame();
        } else if (gameState === 'playing') {
            jump();
        }
    }
});

gameLoop();
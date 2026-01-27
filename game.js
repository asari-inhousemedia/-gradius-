// ============================================
// GRADIUS - Browser Edition
// Ein klassischer Horizontal-Shooter
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Audio Context für Sound-Effekte
let audioCtx = null;

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// Sound-Effekte Generator
const SoundFX = {
    shoot: () => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.1);
    },

    laser: () => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.15);
    },

    explosion: () => {
        if (!audioCtx) return;
        const bufferSize = audioCtx.sampleRate * 0.3;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = audioCtx.createBufferSource();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        noise.start(audioCtx.currentTime);
    },

    powerUp: () => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(523, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.35);
    },

    hit: () => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.2);
    },

    missile: () => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
    }
};

// Spielzustand
const game = {
    running: false,
    score: 0,
    lives: 3,
    powerLevel: 0,
    selectedPower: 0,
    difficulty: 1,
    frame: 0
};

// Power-Up System
const powerUps = {
    speed: 0,      // 0-5 levels
    missile: false,
    double: false,
    laser: false,
    options: [],   // max 4 options
    shield: false
};

// Spieler
const player = {
    x: 100,
    y: 300,
    width: 40,
    height: 20,
    speed: 5,
    baseSpeed: 5,
    shootCooldown: 0,
    invincible: 0,
    trail: []
};

// Spielobjekte
let bullets = [];
let missiles = [];
let enemies = [];
let enemyBullets = [];
let particles = [];
let powerCapsules = [];
let stars = [];

// Tastatureingabe
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Enter' && game.running) {
        activatePowerUp();
    }
    if (e.code === 'Space') {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// UI Elemente
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreValue = document.getElementById('score-value');
const livesValue = document.getElementById('lives-value');
const finalScore = document.getElementById('final-score');
const powerItems = document.querySelectorAll('.power-item');

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Sterne-Hintergrund initialisieren
function initStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 3 + 1
        });
    }
}

// Spiel starten
function startGame() {
    if (!audioCtx) initAudio();

    game.running = true;
    game.score = 0;
    game.lives = 3;
    game.powerLevel = 0;
    game.selectedPower = 0;
    game.difficulty = 1;
    game.frame = 0;

    powerUps.speed = 0;
    powerUps.missile = false;
    powerUps.double = false;
    powerUps.laser = false;
    powerUps.options = [];
    powerUps.shield = false;

    player.x = 100;
    player.y = 300;
    player.speed = player.baseSpeed;
    player.invincible = 120;
    player.trail = [];

    bullets = [];
    missiles = [];
    enemies = [];
    enemyBullets = [];
    particles = [];
    powerCapsules = [];

    initStars();
    updateUI();

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    requestAnimationFrame(gameLoop);
}

// Power-Up aktivieren
function activatePowerUp() {
    if (game.powerLevel <= 0) return;

    SoundFX.powerUp();
    game.powerLevel--;

    switch (game.selectedPower) {
        case 0: // Speed
            if (powerUps.speed < 5) {
                powerUps.speed++;
                player.speed = player.baseSpeed + powerUps.speed * 1.5;
            }
            break;
        case 1: // Missile
            powerUps.missile = true;
            break;
        case 2: // Double
            powerUps.double = true;
            powerUps.laser = false;
            break;
        case 3: // Laser
            powerUps.laser = true;
            powerUps.double = false;
            break;
        case 4: // Option
            if (powerUps.options.length < 4) {
                powerUps.options.push({
                    x: player.x - 30 * (powerUps.options.length + 1),
                    y: player.y,
                    trail: []
                });
            }
            break;
        case 5: // Shield (?)
            powerUps.shield = true;
            break;
    }

    updateUI();
}

// UI aktualisieren
function updateUI() {
    scoreValue.textContent = game.score;
    livesValue.textContent = game.lives;

    powerItems.forEach((item, index) => {
        item.classList.remove('available', 'selected', 'active');
        if (index === game.selectedPower && game.powerLevel > 0) {
            item.classList.add('selected');
        }

        // Aktive Power-Ups markieren
        if ((index === 0 && powerUps.speed > 0) ||
            (index === 1 && powerUps.missile) ||
            (index === 2 && powerUps.double) ||
            (index === 3 && powerUps.laser) ||
            (index === 4 && powerUps.options.length > 0) ||
            (index === 5 && powerUps.shield)) {
            item.classList.add('active');
        }
    });
}

// Spieler zeichnen
function drawPlayer() {
    ctx.save();

    // Blinken wenn unverwundbar
    if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // Schild zeichnen
    if (powerUps.shield) {
        ctx.beginPath();
        ctx.arc(player.x + 10, player.y, 30, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 200, 255, 0.1)';
        ctx.fill();
    }

    // Raumschiff (Vic Viper Style)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width, player.y);
    ctx.lineTo(player.x, player.y - player.height / 2);
    ctx.lineTo(player.x + 10, player.y);
    ctx.lineTo(player.x, player.y + player.height / 2);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.ellipse(player.x + 25, player.y, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Triebwerk-Flamme
    const flameLength = 10 + Math.random() * 10;
    ctx.fillStyle = '#f80';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x - flameLength, player.y - 3);
    ctx.lineTo(player.x - flameLength * 0.7, player.y);
    ctx.lineTo(player.x - flameLength, player.y + 3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// Options zeichnen
function drawOptions() {
    powerUps.options.forEach((option, index) => {
        // Option-Körper
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(option.x, option.y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(option.x, option.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Leuchteffekt
        ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(option.x, option.y, 15 + Math.sin(game.frame * 0.2) * 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Schüsse zeichnen
function drawBullets() {
    bullets.forEach(bullet => {
        if (bullet.isLaser) {
            // Laser
            ctx.fillStyle = '#0ff';
            ctx.fillRect(bullet.x, bullet.y - 2, bullet.width, 4);
            ctx.fillStyle = '#fff';
            ctx.fillRect(bullet.x, bullet.y - 1, bullet.width, 2);
        } else {
            // Normaler Schuss
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.ellipse(bullet.x + 5, bullet.y, 8, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(bullet.x + 5, bullet.y, 4, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// Raketen zeichnen
function drawMissiles() {
    missiles.forEach(missile => {
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.moveTo(missile.x + 15, missile.y);
        ctx.lineTo(missile.x, missile.y - 4);
        ctx.lineTo(missile.x, missile.y + 4);
        ctx.closePath();
        ctx.fill();

        // Raketenflamme
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.moveTo(missile.x, missile.y);
        ctx.lineTo(missile.x - 8, missile.y - 2);
        ctx.lineTo(missile.x - 8, missile.y + 2);
        ctx.closePath();
        ctx.fill();
    });
}

// Gegner zeichnen
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        switch (enemy.type) {
            case 'basic':
                // Einfacher Gegner
                ctx.fillStyle = '#f44';
                ctx.beginPath();
                ctx.moveTo(-15, 0);
                ctx.lineTo(0, -10);
                ctx.lineTo(15, 0);
                ctx.lineTo(0, 10);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#800';
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'wave':
                // Wellenförmiger Gegner
                ctx.fillStyle = '#4f4';
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#080';
                ctx.fillRect(-8, -2, 16, 4);
                break;

            case 'shooter':
                // Schießender Gegner
                ctx.fillStyle = '#f80';
                ctx.fillRect(-12, -8, 24, 16);
                ctx.fillStyle = '#840';
                ctx.fillRect(-15, -4, 6, 8);
                ctx.fillStyle = '#ff0';
                ctx.beginPath();
                ctx.arc(5, 0, 4, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'big':
                // Großer Gegner
                ctx.fillStyle = '#808';
                ctx.beginPath();
                ctx.moveTo(-25, 0);
                ctx.lineTo(-15, -20);
                ctx.lineTo(15, -15);
                ctx.lineTo(25, 0);
                ctx.lineTo(15, 15);
                ctx.lineTo(-15, 20);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#f0f';
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        ctx.restore();
    });
}

// Gegnerische Schüsse zeichnen
function drawEnemyBullets() {
    ctx.fillStyle = '#f00';
    enemyBullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Power-Kapseln zeichnen
function drawPowerCapsules() {
    powerCapsules.forEach(capsule => {
        // Äußere Kapsel
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.ellipse(capsule.x, capsule.y, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Innerer Kern
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.ellipse(capsule.x, capsule.y, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Leuchteffekt
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(capsule.x, capsule.y, 20 + Math.sin(game.frame * 0.3) * 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Partikel zeichnen
function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// Sterne zeichnen
function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        ctx.globalAlpha = 0.3 + star.size * 0.3;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1;
}

// Explosion erstellen
function createExplosion(x, y, color = '#ff8800', count = 20) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
        const speed = 2 + Math.random() * 4;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            decay: 0.02 + Math.random() * 0.02,
            size: 2 + Math.random() * 4,
            color: color
        });
    }
}

// Spieler bewegen
function movePlayer() {
    // Trail für Options speichern
    player.trail.unshift({ x: player.x, y: player.y });
    if (player.trail.length > 60) player.trail.pop();

    if (keys['ArrowUp'] || keys['KeyW']) {
        player.y = Math.max(20, player.y - player.speed);
    }
    if (keys['ArrowDown'] || keys['KeyS']) {
        player.y = Math.min(canvas.height - 20, player.y + player.speed);
    }
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.x = Math.max(20, player.x - player.speed);
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.x = Math.min(canvas.width - 50, player.x + player.speed);
    }

    if (player.invincible > 0) player.invincible--;
}

// Options bewegen
function moveOptions() {
    powerUps.options.forEach((option, index) => {
        const trailIndex = (index + 1) * 12;
        if (player.trail[trailIndex]) {
            option.x = player.trail[trailIndex].x;
            option.y = player.trail[trailIndex].y;
        }
    });
}

// Schießen
function shoot() {
    if (keys['Space'] && player.shootCooldown <= 0) {
        if (powerUps.laser) {
            // Laser
            SoundFX.laser();
            bullets.push({
                x: player.x + player.width,
                y: player.y,
                width: 100,
                speed: 0,
                damage: 2,
                isLaser: true,
                life: 10
            });
            player.shootCooldown = 15;
        } else {
            // Normale Schüsse
            SoundFX.shoot();
            bullets.push({
                x: player.x + player.width,
                y: player.y,
                width: 15,
                speed: 12,
                damage: 1,
                isLaser: false
            });

            if (powerUps.double) {
                bullets.push({
                    x: player.x + player.width,
                    y: player.y - 20,
                    width: 15,
                    speed: 12,
                    vy: -3,
                    damage: 1,
                    isLaser: false
                });
            }

            // Options schießen auch
            powerUps.options.forEach(option => {
                bullets.push({
                    x: option.x + 10,
                    y: option.y,
                    width: 15,
                    speed: 12,
                    damage: 1,
                    isLaser: false
                });
            });

            player.shootCooldown = 8;
        }

        // Raketen
        if (powerUps.missile && game.frame % 30 < 5) {
            SoundFX.missile();
            missiles.push({
                x: player.x,
                y: player.y + 15,
                speed: 6,
                vy: 4
            });
        }
    }

    if (player.shootCooldown > 0) player.shootCooldown--;
}

// Schüsse bewegen
function moveBullets() {
    bullets = bullets.filter(bullet => {
        if (bullet.isLaser) {
            bullet.x = player.x + player.width;
            bullet.y = player.y;
            bullet.life--;
            return bullet.life > 0;
        }
        bullet.x += bullet.speed;
        if (bullet.vy) bullet.y += bullet.vy;
        return bullet.x < canvas.width + 20;
    });

    missiles = missiles.filter(missile => {
        missile.x += missile.speed;
        missile.y += missile.vy;

        // Am Boden explodieren
        if (missile.y > canvas.height - 10) {
            createExplosion(missile.x, canvas.height - 10, '#ff4400', 10);
            return false;
        }
        return missile.x < canvas.width + 20;
    });
}

// Gegner spawnen
function spawnEnemies() {
    const spawnRate = Math.max(30, 90 - game.difficulty * 5);

    if (game.frame % spawnRate === 0) {
        const type = Math.random();
        let enemy;

        if (type < 0.4) {
            // Basic enemy
            enemy = {
                type: 'basic',
                x: canvas.width + 20,
                y: Math.random() * (canvas.height - 100) + 50,
                speed: 3 + Math.random() * 2,
                health: 1,
                score: 100
            };
        } else if (type < 0.7) {
            // Wave enemy
            enemy = {
                type: 'wave',
                x: canvas.width + 20,
                y: canvas.height / 2,
                speed: 2,
                amplitude: 100 + Math.random() * 100,
                frequency: 0.03 + Math.random() * 0.02,
                phase: Math.random() * Math.PI * 2,
                health: 2,
                score: 150
            };
        } else if (type < 0.9) {
            // Shooter enemy
            enemy = {
                type: 'shooter',
                x: canvas.width + 20,
                y: Math.random() * (canvas.height - 100) + 50,
                speed: 1.5,
                health: 3,
                score: 200,
                shootTimer: 60
            };
        } else {
            // Big enemy
            enemy = {
                type: 'big',
                x: canvas.width + 30,
                y: Math.random() * (canvas.height - 150) + 75,
                speed: 1,
                health: 10,
                score: 500
            };
        }

        enemies.push(enemy);
    }

    // Power-Kapsel spawnen
    if (game.frame % 300 === 0) {
        powerCapsules.push({
            x: canvas.width + 20,
            y: Math.random() * (canvas.height - 100) + 50,
            speed: 2
        });
    }
}

// Gegner bewegen
function moveEnemies() {
    enemies.forEach(enemy => {
        enemy.x -= enemy.speed;

        if (enemy.type === 'wave') {
            enemy.y = canvas.height / 2 + Math.sin(enemy.x * enemy.frequency + enemy.phase) * enemy.amplitude;
        }

        if (enemy.type === 'shooter') {
            enemy.shootTimer--;
            if (enemy.shootTimer <= 0) {
                // Auf Spieler schießen
                const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(angle) * 5,
                    vy: Math.sin(angle) * 5
                });
                enemy.shootTimer = 90;
            }
        }
    });

    enemies = enemies.filter(e => e.x > -50);

    // Gegnerische Schüsse bewegen
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        return bullet.x > -10 && bullet.x < canvas.width + 10 &&
               bullet.y > -10 && bullet.y < canvas.height + 10;
    });

    // Power-Kapseln bewegen
    powerCapsules = powerCapsules.filter(capsule => {
        capsule.x -= capsule.speed;
        return capsule.x > -30;
    });
}

// Kollisionserkennung
function checkCollisions() {
    // Schüsse vs Gegner
    bullets.forEach(bullet => {
        enemies.forEach(enemy => {
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 25) {
                enemy.health -= bullet.damage;
                if (!bullet.isLaser) {
                    bullet.x = -100; // Markieren zum Entfernen
                }

                if (enemy.health <= 0) {
                    createExplosion(enemy.x, enemy.y);
                    SoundFX.explosion();
                    game.score += enemy.score;
                    enemy.x = -1000; // Markieren zum Entfernen
                }
            }
        });
    });

    // Raketen vs Gegner
    missiles.forEach(missile => {
        enemies.forEach(enemy => {
            const dx = missile.x - enemy.x;
            const dy = missile.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 30) {
                enemy.health -= 3;
                createExplosion(missile.x, missile.y, '#ff4400', 15);
                SoundFX.explosion();
                missile.x = -100;

                if (enemy.health <= 0) {
                    createExplosion(enemy.x, enemy.y);
                    game.score += enemy.score;
                    enemy.x = -1000;
                }
            }
        });
    });

    // Spieler vs Gegner / Gegner-Schüsse
    if (player.invincible <= 0) {
        let hit = false;

        enemies.forEach(enemy => {
            const dx = player.x + 20 - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 30) {
                hit = true;
            }
        });

        enemyBullets.forEach(bullet => {
            const dx = player.x + 20 - bullet.x;
            const dy = player.y - bullet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 15) {
                hit = true;
                bullet.x = -100;
            }
        });

        if (hit) {
            if (powerUps.shield) {
                powerUps.shield = false;
                SoundFX.hit();
                player.invincible = 60;
            } else {
                playerDeath();
            }
        }
    }

    // Spieler vs Power-Kapseln
    powerCapsules.forEach(capsule => {
        const dx = player.x + 20 - capsule.x;
        const dy = player.y - capsule.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 30) {
            SoundFX.powerUp();
            game.powerLevel = Math.min(6, game.powerLevel + 1);
            game.selectedPower = Math.min(5, game.powerLevel - 1);
            capsule.x = -100;
            updateUI();
        }
    });

    // Aufräumen
    bullets = bullets.filter(b => b.x > -50);
    missiles = missiles.filter(m => m.x > -50);
    enemies = enemies.filter(e => e.x > -100);
    powerCapsules = powerCapsules.filter(c => c.x > -50);
    enemyBullets = enemyBullets.filter(b => b.x > -50);
}

// Spieler-Tod
function playerDeath() {
    SoundFX.explosion();
    createExplosion(player.x + 20, player.y, '#fff', 40);

    game.lives--;

    // Power-Ups verlieren
    powerUps.speed = 0;
    powerUps.missile = false;
    powerUps.double = false;
    powerUps.laser = false;
    powerUps.options = [];
    powerUps.shield = false;
    player.speed = player.baseSpeed;
    player.trail = [];

    if (game.lives <= 0) {
        gameOver();
    } else {
        player.x = 100;
        player.y = 300;
        player.invincible = 180;
    }

    updateUI();
}

// Game Over
function gameOver() {
    game.running = false;
    finalScore.textContent = game.score;
    gameOverScreen.classList.remove('hidden');
}

// Partikel aktualisieren
function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.vx *= 0.98;
        p.vy *= 0.98;
        return p.life > 0;
    });
}

// Sterne aktualisieren
function updateStars() {
    stars.forEach(star => {
        star.x -= star.speed;
        if (star.x < 0) {
            star.x = canvas.width;
            star.y = Math.random() * canvas.height;
        }
    });
}

// Schwierigkeit erhöhen
function updateDifficulty() {
    if (game.frame % 600 === 0 && game.difficulty < 10) {
        game.difficulty++;
    }
}

// Hauptspielschleife
function gameLoop() {
    if (!game.running) return;

    game.frame++;

    // Hintergrund
    ctx.fillStyle = '#000010';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Updates
    updateStars();
    movePlayer();
    moveOptions();
    shoot();
    moveBullets();
    spawnEnemies();
    moveEnemies();
    checkCollisions();
    updateParticles();
    updateDifficulty();
    updateUI();

    // Zeichnen
    drawStars();
    drawParticles();
    drawBullets();
    drawMissiles();
    drawPowerCapsules();
    drawEnemies();
    drawEnemyBullets();
    drawOptions();
    drawPlayer();

    requestAnimationFrame(gameLoop);
}

// Initialisierung
initStars();

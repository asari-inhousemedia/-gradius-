// ============================================
// GRADIUS - Browser Edition
// Ein klassischer Horizontal-Shooter
// Mit Boss-Kämpfen, Level-System, 2-Spieler Modus
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
    },

    bossAlert: () => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.setValueAtTime(440, audioCtx.currentTime + 0.2);
        osc.frequency.setValueAtTime(220, audioCtx.currentTime + 0.4);
        osc.frequency.setValueAtTime(440, audioCtx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.8);
    },

    bossExplosion: () => {
        if (!audioCtx) return;
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const bufferSize = audioCtx.sampleRate * 0.5;
                const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let j = 0; j < bufferSize; j++) {
                    data[j] = (Math.random() * 2 - 1) * (1 - j / bufferSize);
                }
                const noise = audioCtx.createBufferSource();
                const gain = audioCtx.createGain();
                const filter = audioCtx.createBiquadFilter();
                noise.buffer = buffer;
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, audioCtx.currentTime);
                filter.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(audioCtx.destination);
                gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                noise.start(audioCtx.currentTime);
            }, i * 150);
        }
    },

    levelUp: () => {
        if (!audioCtx) return;
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                osc.start(audioCtx.currentTime);
                osc.stop(audioCtx.currentTime + 0.2);
            }, i * 100);
        });
    }
};

// Spielzustand
const game = {
    running: false,
    paused: false,
    score: 0,
    lives: 3,
    powerLevel: 0,
    selectedPower: 0,
    difficulty: 1,
    frame: 0,
    level: 1,
    levelProgress: 0,
    levelLength: 2000, // Frames bis zum Boss
    bossActive: false,
    bossDefeated: false,
    levelTransition: false,
    levelTransitionTimer: 0,
    twoPlayerMode: false,
    gameMode: '1player' // '1player' oder '2player'
};

// Highscore System
const highscores = {
    scores: [],
    maxScores: 10,

    load() {
        const saved = localStorage.getItem('gradius_highscores');
        if (saved) {
            this.scores = JSON.parse(saved);
        }
    },

    save() {
        localStorage.setItem('gradius_highscores', JSON.stringify(this.scores));
    },

    add(score, level, mode) {
        const entry = {
            score: score,
            level: level,
            mode: mode,
            date: new Date().toLocaleDateString('de-DE')
        };
        this.scores.push(entry);
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, this.maxScores);
        this.save();
        return this.scores.findIndex(s => s === entry) + 1;
    },

    getTopScore() {
        return this.scores.length > 0 ? this.scores[0].score : 0;
    }
};

// Power-Up System
const createPowerUps = () => ({
    speed: 0,
    missile: false,
    double: false,
    laser: false,
    options: [],
    shield: false,
    // Neue Waffen
    spread: false,
    homing: false,
    wave: false,
    plasma: false
});

// Waffen-Typen für Sammelsteine
const weaponTypes = [
    { name: 'SPREAD', color: '#ff00ff', key: 'spread' },
    { name: 'HOMING', color: '#00ffff', key: 'homing' },
    { name: 'WAVE', color: '#ffff00', key: 'wave' },
    { name: 'PLASMA', color: '#ff8800', key: 'plasma' }
];

// Spieler-Template
const createPlayer = (isPlayer2 = false) => ({
    x: isPlayer2 ? 60 : 100,
    y: isPlayer2 ? 400 : 300,
    width: 40,
    height: 20,
    speed: 5,
    baseSpeed: 5,
    shootCooldown: 0,
    invincible: 0,
    trail: [],
    active: true,
    isPlayer2: isPlayer2,
    color: isPlayer2 ? '#00ff88' : '#ffffff',
    cockpitColor: isPlayer2 ? '#ff0088' : '#0af',
    powerUps: createPowerUps(),
    powerLevel: 0,
    selectedPower: 0,
    lives: 3
});

// Spieler
let player1 = createPlayer(false);
let player2 = createPlayer(true);

// Spielobjekte
let bullets = [];
let missiles = [];
let enemies = [];
let enemyBullets = [];
let particles = [];
let powerCapsules = [];
let weaponCapsules = [];
let stars = [];
let boss = null;

// Tastatureingabe
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    // Pause-Funktion (ESC)
    if (e.code === 'Escape' && game.running) {
        togglePause();
    }

    // Power-Up aktivieren
    if (e.code === 'Enter' && game.running && !game.paused) {
        activatePowerUp(player1);
    }
    if ((e.code === 'AltRight' || e.code === 'AltLeft') && game.running && !game.paused && game.twoPlayerMode) {
        activatePowerUp(player2);
        e.preventDefault();
    }

    if (e.code === 'Space' || e.code === 'MetaRight' || e.code === 'MetaLeft') {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// UI Elemente
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen');
const startBtn = document.getElementById('start-btn');
const start2PBtn = document.getElementById('start-2p-btn');
const restartBtn = document.getElementById('restart-btn');
const resumeBtn = document.getElementById('resume-btn');
const quitBtn = document.getElementById('quit-btn');
const scoreValue = document.getElementById('score-value');
const livesValue = document.getElementById('lives-value');
const livesValue2 = document.getElementById('lives-value-2');
const levelValue = document.getElementById('level-value');
const finalScore = document.getElementById('final-score');
const highscoreValue = document.getElementById('highscore-value');
const powerItems = document.querySelectorAll('.power-item');
const powerItems2 = document.querySelectorAll('.power-item-p2');
const bossHealthBar = document.getElementById('boss-health-bar');
const bossHealthFill = document.getElementById('boss-health-fill');
const highscoreList = document.getElementById('highscore-list');

// Event Listeners
if (startBtn) startBtn.addEventListener('click', () => startGame('1player'));
if (start2PBtn) start2PBtn.addEventListener('click', () => startGame('2player'));
if (restartBtn) restartBtn.addEventListener('click', () => startGame(game.gameMode));
if (resumeBtn) resumeBtn.addEventListener('click', togglePause);
if (quitBtn) quitBtn.addEventListener('click', quitToMenu);

// Pause-Funktion
function togglePause() {
    game.paused = !game.paused;
    if (pauseScreen) {
        pauseScreen.classList.toggle('hidden', !game.paused);
    }
    if (!game.paused) {
        requestAnimationFrame(gameLoop);
    }
}

function quitToMenu() {
    game.running = false;
    game.paused = false;
    if (pauseScreen) pauseScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
}

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
function startGame(mode = '1player') {
    if (!audioCtx) initAudio();

    highscores.load();

    game.running = true;
    game.paused = false;
    game.score = 0;
    game.lives = 3;
    game.powerLevel = 0;
    game.selectedPower = 0;
    game.difficulty = 1;
    game.frame = 0;
    game.level = 1;
    game.levelProgress = 0;
    game.bossActive = false;
    game.bossDefeated = false;
    game.levelTransition = false;
    game.gameMode = mode;
    game.twoPlayerMode = (mode === '2player');

    player1 = createPlayer(false);
    player1.invincible = 120;

    if (game.twoPlayerMode) {
        player2 = createPlayer(true);
        player2.invincible = 120;
        player2.active = true;
    } else {
        player2.active = false;
    }

    bullets = [];
    missiles = [];
    enemies = [];
    enemyBullets = [];
    particles = [];
    powerCapsules = [];
    weaponCapsules = [];
    boss = null;

    initStars();
    updateUI();

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    if (pauseScreen) pauseScreen.classList.add('hidden');

    requestAnimationFrame(gameLoop);
}

// Power-Up aktivieren
function activatePowerUp(player) {
    if (player.powerLevel <= 0 || !player.active) return;

    SoundFX.powerUp();
    player.powerLevel--;

    switch (player.selectedPower) {
        case 0: // Speed
            if (player.powerUps.speed < 5) {
                player.powerUps.speed++;
                player.speed = player.baseSpeed + player.powerUps.speed * 1.5;
            }
            break;
        case 1: // Missile
            player.powerUps.missile = true;
            break;
        case 2: // Double
            player.powerUps.double = true;
            player.powerUps.laser = false;
            break;
        case 3: // Laser
            player.powerUps.laser = true;
            player.powerUps.double = false;
            break;
        case 4: // Option
            if (player.powerUps.options.length < 4) {
                player.powerUps.options.push({
                    x: player.x - 30 * (player.powerUps.options.length + 1),
                    y: player.y,
                    trail: []
                });
            }
            break;
        case 5: // Shield
            player.powerUps.shield = true;
            break;
    }

    updateUI();
}

// UI aktualisieren
function updateUI() {
    if (scoreValue) scoreValue.textContent = game.score;
    if (livesValue) livesValue.textContent = player1.lives;
    if (livesValue2) {
        livesValue2.textContent = player2.lives;
        livesValue2.parentElement.style.display = game.twoPlayerMode ? 'block' : 'none';
    }
    if (levelValue) levelValue.textContent = game.level;
    if (highscoreValue) highscoreValue.textContent = highscores.getTopScore();

    // Power-Bar Spieler 1
    powerItems.forEach((item, index) => {
        item.classList.remove('available', 'selected', 'active');
        if (index === player1.selectedPower && player1.powerLevel > 0) {
            item.classList.add('selected');
        }
        if ((index === 0 && player1.powerUps.speed > 0) ||
            (index === 1 && player1.powerUps.missile) ||
            (index === 2 && player1.powerUps.double) ||
            (index === 3 && player1.powerUps.laser) ||
            (index === 4 && player1.powerUps.options.length > 0) ||
            (index === 5 && player1.powerUps.shield)) {
            item.classList.add('active');
        }
    });

    // Power-Bar Spieler 2
    if (game.twoPlayerMode && powerItems2) {
        powerItems2.forEach((item, index) => {
            item.classList.remove('available', 'selected', 'active');
            if (index === player2.selectedPower && player2.powerLevel > 0) {
                item.classList.add('selected');
            }
            if ((index === 0 && player2.powerUps.speed > 0) ||
                (index === 1 && player2.powerUps.missile) ||
                (index === 2 && player2.powerUps.double) ||
                (index === 3 && player2.powerUps.laser) ||
                (index === 4 && player2.powerUps.options.length > 0) ||
                (index === 5 && player2.powerUps.shield)) {
                item.classList.add('active');
            }
        });
    }

    // Boss Health Bar
    if (bossHealthBar) {
        bossHealthBar.style.display = (boss && game.bossActive) ? 'block' : 'none';
        if (boss && bossHealthFill) {
            const healthPercent = (boss.health / boss.maxHealth) * 100;
            bossHealthFill.style.width = healthPercent + '%';
        }
    }
}

// Spieler zeichnen
function drawPlayer(player) {
    if (!player.active) return;

    ctx.save();

    // Blinken wenn unverwundbar
    if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // Schild zeichnen
    if (player.powerUps.shield) {
        ctx.beginPath();
        ctx.arc(player.x + 10, player.y, 30, 0, Math.PI * 2);
        ctx.strokeStyle = player.isPlayer2 ? 'rgba(255, 0, 200, 0.7)' : 'rgba(0, 200, 255, 0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = player.isPlayer2 ? 'rgba(255, 0, 200, 0.1)' : 'rgba(0, 200, 255, 0.1)';
        ctx.fill();
    }

    // Raumschiff
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width, player.y);
    ctx.lineTo(player.x, player.y - player.height / 2);
    ctx.lineTo(player.x + 10, player.y);
    ctx.lineTo(player.x, player.y + player.height / 2);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = player.cockpitColor;
    ctx.beginPath();
    ctx.ellipse(player.x + 25, player.y, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Triebwerk-Flamme
    const flameLength = 10 + Math.random() * 10;
    ctx.fillStyle = player.isPlayer2 ? '#0f8' : '#f80';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x - flameLength, player.y - 3);
    ctx.lineTo(player.x - flameLength * 0.7, player.y);
    ctx.lineTo(player.x - flameLength, player.y + 3);
    ctx.closePath();
    ctx.fill();

    // Spieler-Nummer Indikator
    if (game.twoPlayerMode) {
        ctx.fillStyle = player.isPlayer2 ? '#0f8' : '#fff';
        ctx.font = '10px Courier New';
        ctx.fillText(player.isPlayer2 ? 'P2' : 'P1', player.x + 15, player.y - 15);
    }

    ctx.restore();
}

// Options zeichnen
function drawOptions(player) {
    if (!player.active) return;

    player.powerUps.options.forEach((option) => {
        ctx.fillStyle = player.isPlayer2 ? '#ff0088' : '#ff8800';
        ctx.beginPath();
        ctx.arc(option.x, option.y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = player.isPlayer2 ? '#ff88cc' : '#ffcc00';
        ctx.beginPath();
        ctx.arc(option.x, option.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = player.isPlayer2 ? 'rgba(255, 0, 136, 0.3)' : 'rgba(255, 200, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(option.x, option.y, 15 + Math.sin(game.frame * 0.2) * 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Schüsse zeichnen
function drawBullets() {
    bullets.forEach(bullet => {
        if (bullet.isLaser) {
            ctx.fillStyle = bullet.color || '#0ff';
            ctx.fillRect(bullet.x, bullet.y - 2, bullet.width, 4);
            ctx.fillStyle = '#fff';
            ctx.fillRect(bullet.x, bullet.y - 1, bullet.width, 2);
        } else if (bullet.isSpread) {
            ctx.fillStyle = '#ff00ff';
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (bullet.isHoming) {
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.moveTo(bullet.x + 8, bullet.y);
            ctx.lineTo(bullet.x - 4, bullet.y - 4);
            ctx.lineTo(bullet.x - 4, bullet.y + 4);
            ctx.closePath();
            ctx.fill();
        } else if (bullet.isWave) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.radius || 5, 0, Math.PI * 2);
            ctx.stroke();
        } else if (bullet.isPlasma) {
            const gradient = ctx.createRadialGradient(bullet.x, bullet.y, 0, bullet.x, bullet.y, 10);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#ff8800');
            gradient.addColorStop(1, 'rgba(255, 136, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 10, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Normaler Schuss
            const bulletColor = bullet.isPlayer2 ? '#0f8' : '#ff0';
            ctx.fillStyle = bulletColor;
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
        ctx.fillStyle = missile.isPlayer2 ? '#0f8' : '#f00';
        ctx.beginPath();
        ctx.moveTo(missile.x + 15, missile.y);
        ctx.lineTo(missile.x, missile.y - 4);
        ctx.lineTo(missile.x, missile.y + 4);
        ctx.closePath();
        ctx.fill();

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
                ctx.fillStyle = '#4f4';
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#080';
                ctx.fillRect(-8, -2, 16, 4);
                break;

            case 'shooter':
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

            case 'fast':
                ctx.fillStyle = '#ff0';
                ctx.beginPath();
                ctx.moveTo(15, 0);
                ctx.lineTo(-10, -8);
                ctx.lineTo(-5, 0);
                ctx.lineTo(-10, 8);
                ctx.closePath();
                ctx.fill();
                break;

            case 'spiral':
                ctx.fillStyle = '#0ff';
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2 + game.frame * 0.1;
                    const r = 12;
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                break;
        }

        ctx.restore();
    });
}

// Boss zeichnen
function drawBoss() {
    if (!boss || !game.bossActive) return;

    ctx.save();
    ctx.translate(boss.x, boss.y);

    // Boss-Typ bestimmt Aussehen
    switch (boss.type) {
        case 1: // Big Core
            // Hauptkörper
            ctx.fillStyle = '#4444aa';
            ctx.beginPath();
            ctx.moveTo(-60, 0);
            ctx.lineTo(-40, -40);
            ctx.lineTo(40, -30);
            ctx.lineTo(60, 0);
            ctx.lineTo(40, 30);
            ctx.lineTo(-40, 40);
            ctx.closePath();
            ctx.fill();

            // Kern (Schwachstelle)
            ctx.fillStyle = boss.coreVulnerable ? '#ff0000' : '#880000';
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();

            // Panzerplatten
            if (boss.armor > 0) {
                ctx.fillStyle = '#666688';
                for (let i = 0; i < boss.armor; i++) {
                    ctx.fillRect(-50 + i * 25, -35, 20, 70);
                }
            }

            // Leuchteffekt
            ctx.fillStyle = `rgba(255, 0, 0, ${0.3 + Math.sin(game.frame * 0.1) * 0.2})`;
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.fill();
            break;

        case 2: // Tetran
            // Rotierende Arme
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2 + boss.rotation;
                ctx.save();
                ctx.rotate(angle);
                ctx.fillStyle = '#aa4444';
                ctx.fillRect(20, -10, 50, 20);
                ctx.fillStyle = '#ff8888';
                ctx.beginPath();
                ctx.arc(70, 0, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Zentrum
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.fill();

            // Kern
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            break;

        case 3: // Golem
            // Massiver Körper
            ctx.fillStyle = '#555555';
            ctx.fillRect(-70, -50, 140, 100);

            // Gesicht
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(-30, -10, 12, 0, Math.PI * 2);
            ctx.arc(30, -10, 12, 0, Math.PI * 2);
            ctx.fill();

            // Mund/Kanone
            ctx.fillStyle = '#333333';
            ctx.fillRect(-20, 15, 40, 25);

            // Arme
            ctx.fillStyle = '#666666';
            ctx.fillRect(-90, -20, 25, 40);
            ctx.fillRect(65, -20, 25, 40);

            // Schwachpunkt (Kern in der Mitte)
            if (boss.phase >= 2) {
                ctx.fillStyle = '#00ff00';
                ctx.beginPath();
                ctx.arc(0, 0, 15 + Math.sin(game.frame * 0.2) * 3, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
    }

    ctx.restore();

    // Boss-Name anzeigen
    if (boss.showName > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${boss.showName / 120})`;
        ctx.font = 'bold 24px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(boss.name, canvas.width / 2, 80);
        boss.showName--;
    }
}

// Gegnerische Schüsse zeichnen
function drawEnemyBullets() {
    enemyBullets.forEach(bullet => {
        if (bullet.isBossBullet) {
            ctx.fillStyle = '#ff00ff';
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#f00';
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// Power-Kapseln zeichnen
function drawPowerCapsules() {
    powerCapsules.forEach(capsule => {
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.ellipse(capsule.x, capsule.y, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.ellipse(capsule.x, capsule.y, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(capsule.x, capsule.y, 20 + Math.sin(game.frame * 0.3) * 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Waffen-Kapseln zeichnen
function drawWeaponCapsules() {
    weaponCapsules.forEach(capsule => {
        const weapon = weaponTypes[capsule.weaponType];

        // Äußerer Glow
        ctx.fillStyle = weapon.color + '44';
        ctx.beginPath();
        ctx.arc(capsule.x, capsule.y, 25 + Math.sin(game.frame * 0.2) * 5, 0, Math.PI * 2);
        ctx.fill();

        // Kristall-Form
        ctx.fillStyle = weapon.color;
        ctx.beginPath();
        ctx.moveTo(capsule.x, capsule.y - 18);
        ctx.lineTo(capsule.x + 12, capsule.y);
        ctx.lineTo(capsule.x, capsule.y + 18);
        ctx.lineTo(capsule.x - 12, capsule.y);
        ctx.closePath();
        ctx.fill();

        // Innerer Glanz
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(capsule.x, capsule.y - 10);
        ctx.lineTo(capsule.x + 5, capsule.y);
        ctx.lineTo(capsule.x, capsule.y + 10);
        ctx.lineTo(capsule.x - 5, capsule.y);
        ctx.closePath();
        ctx.fill();

        // Waffen-Name
        ctx.fillStyle = '#fff';
        ctx.font = '10px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(weapon.name, capsule.x, capsule.y + 30);
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

// Level-Übergang zeichnen
function drawLevelTransition() {
    if (!game.levelTransition) return;

    const alpha = Math.min(1, game.levelTransitionTimer / 60);
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${game.level}`, canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Courier New';
    ctx.fillText('GET READY!', canvas.width / 2, canvas.height / 2 + 30);
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
function movePlayer(player, controls) {
    if (!player.active) return;

    // Trail für Options speichern
    player.trail.unshift({ x: player.x, y: player.y });
    if (player.trail.length > 60) player.trail.pop();

    if (keys[controls.up]) {
        player.y = Math.max(20, player.y - player.speed);
    }
    if (keys[controls.down]) {
        player.y = Math.min(canvas.height - 20, player.y + player.speed);
    }
    if (keys[controls.left]) {
        player.x = Math.max(20, player.x - player.speed);
    }
    if (keys[controls.right]) {
        player.x = Math.min(canvas.width - 50, player.x + player.speed);
    }

    if (player.invincible > 0) player.invincible--;
}

// Options bewegen
function moveOptions(player) {
    if (!player.active) return;

    player.powerUps.options.forEach((option, index) => {
        const trailIndex = (index + 1) * 12;
        if (player.trail[trailIndex]) {
            option.x = player.trail[trailIndex].x;
            option.y = player.trail[trailIndex].y;
        }
    });
}

// Schießen
function shoot(player, fireKey, fireKey2 = null) {
    if (!player.active) return;

    if ((keys[fireKey] || (fireKey2 && keys[fireKey2])) && player.shootCooldown <= 0) {
        if (player.powerUps.laser) {
            SoundFX.laser();
            bullets.push({
                x: player.x + player.width,
                y: player.y,
                width: 100,
                speed: 0,
                damage: 2,
                isLaser: true,
                life: 10,
                isPlayer2: player.isPlayer2
            });
            player.shootCooldown = 15;
        } else if (player.powerUps.spread) {
            SoundFX.shoot();
            for (let i = -2; i <= 2; i++) {
                bullets.push({
                    x: player.x + player.width,
                    y: player.y,
                    width: 8,
                    speed: 10,
                    vy: i * 2,
                    damage: 1,
                    isSpread: true,
                    isPlayer2: player.isPlayer2
                });
            }
            player.shootCooldown = 12;
        } else if (player.powerUps.homing) {
            SoundFX.shoot();
            bullets.push({
                x: player.x + player.width,
                y: player.y,
                width: 10,
                speed: 8,
                vy: 0,
                damage: 2,
                isHoming: true,
                isPlayer2: player.isPlayer2
            });
            player.shootCooldown = 20;
        } else if (player.powerUps.wave) {
            SoundFX.laser();
            bullets.push({
                x: player.x + player.width,
                y: player.y,
                radius: 5,
                speed: 6,
                damage: 1,
                isWave: true,
                isPlayer2: player.isPlayer2
            });
            player.shootCooldown = 10;
        } else if (player.powerUps.plasma) {
            SoundFX.laser();
            bullets.push({
                x: player.x + player.width,
                y: player.y,
                width: 20,
                speed: 7,
                damage: 4,
                isPlasma: true,
                isPlayer2: player.isPlayer2
            });
            player.shootCooldown = 25;
        } else {
            // Normale Schüsse
            SoundFX.shoot();
            bullets.push({
                x: player.x + player.width,
                y: player.y,
                width: 15,
                speed: 12,
                damage: 1,
                isPlayer2: player.isPlayer2
            });

            if (player.powerUps.double) {
                bullets.push({
                    x: player.x + player.width,
                    y: player.y - 20,
                    width: 15,
                    speed: 12,
                    vy: -3,
                    damage: 1,
                    isPlayer2: player.isPlayer2
                });
            }

            // Options schießen auch
            player.powerUps.options.forEach(option => {
                bullets.push({
                    x: option.x + 10,
                    y: option.y,
                    width: 15,
                    speed: 12,
                    damage: 1,
                    isPlayer2: player.isPlayer2
                });
            });

            player.shootCooldown = 8;
        }

        // Raketen
        if (player.powerUps.missile && game.frame % 30 < 5) {
            SoundFX.missile();
            missiles.push({
                x: player.x,
                y: player.y + 15,
                speed: 6,
                vy: 4,
                isPlayer2: player.isPlayer2
            });
        }
    }

    if (player.shootCooldown > 0) player.shootCooldown--;
}

// Schüsse bewegen
function moveBullets() {
    bullets = bullets.filter(bullet => {
        if (bullet.isLaser) {
            // Laser folgt dem Spieler
            const owner = bullet.isPlayer2 ? player2 : player1;
            if (owner.active) {
                bullet.x = owner.x + owner.width;
                bullet.y = owner.y;
            }
            bullet.life--;
            return bullet.life > 0;
        }

        if (bullet.isHoming && enemies.length > 0) {
            // Zielsuchend
            let closest = null;
            let closestDist = Infinity;
            enemies.forEach(enemy => {
                const dist = Math.sqrt((enemy.x - bullet.x) ** 2 + (enemy.y - bullet.y) ** 2);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = enemy;
                }
            });
            if (closest) {
                const angle = Math.atan2(closest.y - bullet.y, closest.x - bullet.x);
                bullet.vy += Math.sin(angle) * 0.5;
                bullet.vy = Math.max(-5, Math.min(5, bullet.vy));
            }
        }

        if (bullet.isWave) {
            bullet.radius += 0.5;
            if (bullet.radius > 30) return false;
        }

        bullet.x += bullet.speed;
        if (bullet.vy) bullet.y += bullet.vy;
        return bullet.x < canvas.width + 20 && bullet.y > -20 && bullet.y < canvas.height + 20;
    });

    missiles = missiles.filter(missile => {
        missile.x += missile.speed;
        missile.y += missile.vy;

        if (missile.y > canvas.height - 10) {
            createExplosion(missile.x, canvas.height - 10, '#ff4400', 10);
            return false;
        }
        return missile.x < canvas.width + 20;
    });
}

// Boss spawnen
function spawnBoss() {
    game.bossActive = true;
    SoundFX.bossAlert();

    const bossTypes = [
        {
            type: 1,
            name: 'BIG CORE',
            health: 100,
            maxHealth: 100,
            x: canvas.width + 100,
            y: canvas.height / 2,
            targetX: canvas.width - 100,
            speed: 2,
            armor: 4,
            coreVulnerable: false,
            attackTimer: 0,
            attackPattern: 0,
            showName: 120
        },
        {
            type: 2,
            name: 'TETRAN',
            health: 150,
            maxHealth: 150,
            x: canvas.width + 100,
            y: canvas.height / 2,
            targetX: canvas.width - 120,
            speed: 1.5,
            rotation: 0,
            attackTimer: 0,
            showName: 120
        },
        {
            type: 3,
            name: 'GOLEM',
            health: 200,
            maxHealth: 200,
            x: canvas.width + 100,
            y: canvas.height / 2,
            targetX: canvas.width - 100,
            speed: 1,
            phase: 1,
            attackTimer: 0,
            moveTimer: 0,
            showName: 120
        }
    ];

    // Boss basierend auf Level wählen
    const bossIndex = (game.level - 1) % bossTypes.length;
    boss = { ...bossTypes[bossIndex] };

    // Skalierung nach Level
    boss.health = Math.floor(boss.health * (1 + (game.level - 1) * 0.3));
    boss.maxHealth = boss.health;
}

// Boss bewegen und angreifen
function updateBoss() {
    if (!boss || !game.bossActive) return;

    // Einfahren
    if (boss.x > boss.targetX) {
        boss.x -= boss.speed;
        return;
    }

    boss.attackTimer++;

    switch (boss.type) {
        case 1: // Big Core
            // Auf und ab bewegen
            boss.y += Math.sin(game.frame * 0.02) * 2;

            // Panzerung zerstört -> Kern verwundbar
            boss.coreVulnerable = boss.armor <= 0;

            // Angriffsmuster
            if (boss.attackTimer % 60 === 0) {
                // Laser-Salve
                for (let i = -2; i <= 2; i++) {
                    enemyBullets.push({
                        x: boss.x - 60,
                        y: boss.y + i * 15,
                        vx: -8,
                        vy: 0,
                        isBossBullet: true
                    });
                }
            }
            break;

        case 2: // Tetran
            boss.rotation += 0.03;
            boss.y = canvas.height / 2 + Math.sin(game.frame * 0.015) * 150;

            // Rotierendes Schussmuster
            if (boss.attackTimer % 30 === 0) {
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2 + boss.rotation;
                    const armX = boss.x + Math.cos(angle) * 70;
                    const armY = boss.y + Math.sin(angle) * 70;

                    const bulletAngle = Math.atan2(player1.y - armY, player1.x - armX);
                    enemyBullets.push({
                        x: armX,
                        y: armY,
                        vx: Math.cos(bulletAngle) * 5,
                        vy: Math.sin(bulletAngle) * 5,
                        isBossBullet: true
                    });
                }
            }
            break;

        case 3: // Golem
            // Bewegung
            boss.moveTimer++;
            if (boss.moveTimer > 120) {
                boss.targetY = 100 + Math.random() * (canvas.height - 200);
                boss.moveTimer = 0;
            }
            if (boss.targetY) {
                if (boss.y < boss.targetY) boss.y += 1.5;
                if (boss.y > boss.targetY) boss.y -= 1.5;
            }

            // Phasen basierend auf Gesundheit
            if (boss.health < boss.maxHealth * 0.3) boss.phase = 3;
            else if (boss.health < boss.maxHealth * 0.6) boss.phase = 2;

            // Angriffe
            if (boss.attackTimer % (80 - boss.phase * 20) === 0) {
                // Streufeuer
                for (let i = 0; i < 3 + boss.phase; i++) {
                    const spread = (i - (2 + boss.phase) / 2) * 0.2;
                    enemyBullets.push({
                        x: boss.x - 20,
                        y: boss.y + 20,
                        vx: -6,
                        vy: spread * 6,
                        isBossBullet: true
                    });
                }
            }

            // Phase 3: Zusätzliche Raketen
            if (boss.phase >= 3 && boss.attackTimer % 120 === 0) {
                for (let i = 0; i < 3; i++) {
                    enemyBullets.push({
                        x: boss.x - 70,
                        y: boss.y + (i - 1) * 30,
                        vx: -4,
                        vy: 0,
                        isBossBullet: true,
                        homing: true
                    });
                }
            }
            break;
    }
}

// Gegner spawnen
function spawnEnemies() {
    if (game.bossActive || game.levelTransition) return;

    const spawnRate = Math.max(30, 90 - game.difficulty * 5 - game.level * 3);

    if (game.frame % spawnRate === 0) {
        const type = Math.random();
        let enemy;

        if (type < 0.3) {
            enemy = {
                type: 'basic',
                x: canvas.width + 20,
                y: Math.random() * (canvas.height - 100) + 50,
                speed: 3 + Math.random() * 2,
                health: 1,
                score: 100
            };
        } else if (type < 0.5) {
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
        } else if (type < 0.7) {
            enemy = {
                type: 'shooter',
                x: canvas.width + 20,
                y: Math.random() * (canvas.height - 100) + 50,
                speed: 1.5,
                health: 3,
                score: 200,
                shootTimer: 60
            };
        } else if (type < 0.85) {
            enemy = {
                type: 'fast',
                x: canvas.width + 20,
                y: Math.random() * (canvas.height - 100) + 50,
                speed: 6 + Math.random() * 2,
                health: 1,
                score: 120
            };
        } else if (type < 0.95) {
            enemy = {
                type: 'spiral',
                x: canvas.width + 20,
                y: Math.random() * (canvas.height - 100) + 50,
                speed: 2,
                health: 4,
                score: 250,
                angle: 0
            };
        } else {
            enemy = {
                type: 'big',
                x: canvas.width + 30,
                y: Math.random() * (canvas.height - 150) + 75,
                speed: 1,
                health: 10 + game.level * 2,
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

    // Waffen-Kapsel spawnen (seltener)
    if (game.frame % 600 === 0) {
        weaponCapsules.push({
            x: canvas.width + 20,
            y: Math.random() * (canvas.height - 100) + 50,
            speed: 1.5,
            weaponType: Math.floor(Math.random() * weaponTypes.length)
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

        if (enemy.type === 'spiral') {
            enemy.angle += 0.1;
            enemy.y += Math.sin(enemy.angle) * 3;
        }

        if (enemy.type === 'shooter') {
            enemy.shootTimer--;
            if (enemy.shootTimer <= 0) {
                // Auf nächsten Spieler schießen
                let target = player1;
                if (game.twoPlayerMode && player2.active) {
                    const dist1 = Math.abs(enemy.x - player1.x) + Math.abs(enemy.y - player1.y);
                    const dist2 = Math.abs(enemy.x - player2.x) + Math.abs(enemy.y - player2.y);
                    target = dist2 < dist1 ? player2 : player1;
                }

                const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
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
        // Homing Bullets
        if (bullet.homing) {
            let target = player1;
            if (game.twoPlayerMode && player2.active) {
                const dist1 = Math.sqrt((player1.x - bullet.x) ** 2 + (player1.y - bullet.y) ** 2);
                const dist2 = Math.sqrt((player2.x - bullet.x) ** 2 + (player2.y - bullet.y) ** 2);
                target = dist2 < dist1 ? player2 : player1;
            }
            const angle = Math.atan2(target.y - bullet.y, target.x - bullet.x);
            bullet.vx += Math.cos(angle) * 0.1;
            bullet.vy += Math.sin(angle) * 0.1;
            const speed = Math.sqrt(bullet.vx ** 2 + bullet.vy ** 2);
            if (speed > 6) {
                bullet.vx = (bullet.vx / speed) * 6;
                bullet.vy = (bullet.vy / speed) * 6;
            }
        }

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

    // Waffen-Kapseln bewegen
    weaponCapsules = weaponCapsules.filter(capsule => {
        capsule.x -= capsule.speed;
        return capsule.x > -30;
    });
}

// Kollisionserkennung
function checkCollisions() {
    const players = game.twoPlayerMode ? [player1, player2] : [player1];

    // Schüsse vs Gegner
    bullets.forEach(bullet => {
        enemies.forEach(enemy => {
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const hitRadius = bullet.isWave ? bullet.radius : 25;

            if (dist < hitRadius) {
                enemy.health -= bullet.damage;
                if (!bullet.isLaser && !bullet.isWave) {
                    bullet.x = -100;
                }

                if (enemy.health <= 0) {
                    createExplosion(enemy.x, enemy.y);
                    SoundFX.explosion();
                    game.score += enemy.score;
                    enemy.x = -1000;
                }
            }
        });

        // Schüsse vs Boss
        if (boss && game.bossActive) {
            const dx = bullet.x - boss.x;
            const dy = bullet.y - boss.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let canDamage = false;
            let hitRadius = 50;

            switch (boss.type) {
                case 1: // Big Core
                    if (boss.armor > 0) {
                        // Panzerung treffen
                        if (dist < 60 && bullet.x < boss.x) {
                            boss.armor--;
                            if (!bullet.isLaser) bullet.x = -100;
                            SoundFX.hit();
                            createExplosion(bullet.x, bullet.y, '#666688', 5);
                        }
                    } else if (dist < 30) {
                        canDamage = true;
                    }
                    break;
                case 2: // Tetran
                    if (dist < 40) canDamage = true;
                    break;
                case 3: // Golem
                    if (boss.phase >= 2 && dist < 30) {
                        canDamage = true;
                    } else if (dist < 80) {
                        if (!bullet.isLaser) bullet.x = -100;
                        SoundFX.hit();
                    }
                    break;
            }

            if (canDamage) {
                boss.health -= bullet.damage;
                if (!bullet.isLaser && !bullet.isWave) {
                    bullet.x = -100;
                }
                SoundFX.hit();
                createExplosion(bullet.x, bullet.y, '#ff0000', 5);

                if (boss.health <= 0) {
                    defeatBoss();
                }
            }
        }
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

        // Raketen vs Boss
        if (boss && game.bossActive) {
            const dx = missile.x - boss.x;
            const dy = missile.y - boss.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 60) {
                if (boss.type === 1 && boss.armor > 0) {
                    boss.armor--;
                } else if (boss.type !== 3 || boss.phase >= 2) {
                    boss.health -= 5;
                }
                createExplosion(missile.x, missile.y, '#ff4400', 15);
                SoundFX.explosion();
                missile.x = -100;

                if (boss.health <= 0) {
                    defeatBoss();
                }
            }
        }
    });

    // Spieler vs Gegner / Gegner-Schüsse
    players.forEach(player => {
        if (!player.active || player.invincible > 0) return;

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

        // Boss-Kollision
        if (boss && game.bossActive) {
            const dx = player.x + 20 - boss.x;
            const dy = player.y - boss.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 60) {
                hit = true;
            }
        }

        if (hit) {
            if (player.powerUps.shield) {
                player.powerUps.shield = false;
                SoundFX.hit();
                player.invincible = 60;
            } else {
                playerDeath(player);
            }
        }
    });

    // Spieler vs Power-Kapseln
    players.forEach(player => {
        if (!player.active) return;

        powerCapsules.forEach(capsule => {
            const dx = player.x + 20 - capsule.x;
            const dy = player.y - capsule.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 30) {
                SoundFX.powerUp();
                player.powerLevel = Math.min(6, player.powerLevel + 1);
                player.selectedPower = Math.min(5, player.powerLevel - 1);
                capsule.x = -100;
                updateUI();
            }
        });

        // Waffen-Kapseln
        weaponCapsules.forEach(capsule => {
            const dx = player.x + 20 - capsule.x;
            const dy = player.y - capsule.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 30) {
                SoundFX.powerUp();
                const weapon = weaponTypes[capsule.weaponType];

                // Alte Spezialwaffen deaktivieren
                player.powerUps.spread = false;
                player.powerUps.homing = false;
                player.powerUps.wave = false;
                player.powerUps.plasma = false;
                player.powerUps.laser = false;
                player.powerUps.double = false;

                // Neue Waffe aktivieren
                player.powerUps[weapon.key] = true;

                capsule.x = -100;

                // Anzeige
                createExplosion(capsule.x, capsule.y, weapon.color, 15);
            }
        });
    });

    // Aufräumen
    bullets = bullets.filter(b => b.x > -50);
    missiles = missiles.filter(m => m.x > -50);
    enemies = enemies.filter(e => e.x > -100);
    powerCapsules = powerCapsules.filter(c => c.x > -50);
    weaponCapsules = weaponCapsules.filter(c => c.x > -50);
    enemyBullets = enemyBullets.filter(b => b.x > -50);
}

// Boss besiegt
function defeatBoss() {
    SoundFX.bossExplosion();

    // Mehrere Explosionen
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const x = boss.x + (Math.random() - 0.5) * 100;
            const y = boss.y + (Math.random() - 0.5) * 80;
            createExplosion(x, y, '#ff8800', 30);
        }, i * 100);
    }

    game.score += 5000 * game.level;
    game.bossDefeated = true;
    game.bossActive = false;
    boss = null;

    // Level-Übergang starten
    setTimeout(() => {
        startLevelTransition();
    }, 1500);
}

// Level-Übergang
function startLevelTransition() {
    game.levelTransition = true;
    game.levelTransitionTimer = 0;
    SoundFX.levelUp();
}

function updateLevelTransition() {
    if (!game.levelTransition) return;

    game.levelTransitionTimer++;

    if (game.levelTransitionTimer >= 180) {
        game.level++;
        game.levelProgress = 0;
        game.bossDefeated = false;
        game.levelTransition = false;
        game.difficulty = Math.min(10, game.difficulty + 1);

        // Bonus-Leben alle 3 Level
        if (game.level % 3 === 0) {
            player1.lives++;
            if (game.twoPlayerMode) player2.lives++;
        }

        updateUI();
    }
}

// Spieler-Tod
function playerDeath(player) {
    SoundFX.explosion();
    createExplosion(player.x + 20, player.y, '#fff', 40);

    player.lives--;

    // Power-Ups verlieren
    player.powerUps = createPowerUps();
    player.speed = player.baseSpeed;
    player.trail = [];
    player.powerLevel = 0;

    if (player.lives <= 0) {
        player.active = false;

        // Prüfen ob alle Spieler tot sind
        if (!player1.active && (!game.twoPlayerMode || !player2.active)) {
            gameOver();
        }
    } else {
        player.x = player.isPlayer2 ? 60 : 100;
        player.y = player.isPlayer2 ? 400 : 300;
        player.invincible = 180;
    }

    updateUI();
}

// Game Over
function gameOver() {
    game.running = false;

    const rank = highscores.add(game.score, game.level, game.gameMode);

    if (finalScore) finalScore.textContent = game.score;

    // Highscore-Liste aktualisieren
    if (highscoreList) {
        highscoreList.innerHTML = '';
        highscores.scores.slice(0, 5).forEach((entry, index) => {
            const li = document.createElement('div');
            li.className = 'highscore-entry';
            li.innerHTML = `<span>${index + 1}.</span> <span>${entry.score}</span> <span>Lv.${entry.level}</span>`;
            if (index === rank - 1) li.classList.add('new-score');
            highscoreList.appendChild(li);
        });
    }

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

// Schwierigkeit und Level-Fortschritt
function updateDifficulty() {
    if (game.bossActive || game.levelTransition) return;

    game.levelProgress++;

    // Boss spawnen am Ende des Levels
    if (game.levelProgress >= game.levelLength && !game.bossDefeated) {
        spawnBoss();
    }

    if (game.frame % 600 === 0 && game.difficulty < 10) {
        game.difficulty++;
    }
}

// Steuerungskonfiguration
const controls1 = {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight'
};

const controls2 = {
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD'
};

// Hauptspielschleife
function gameLoop() {
    if (!game.running) return;
    if (game.paused) return;

    game.frame++;

    // Hintergrund
    ctx.fillStyle = '#000010';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Updates
    updateStars();
    updateLevelTransition();

    if (!game.levelTransition) {
        movePlayer(player1, controls1);
        moveOptions(player1);
        shoot(player1, 'Space');

        if (game.twoPlayerMode && player2.active) {
            movePlayer(player2, controls2);
            moveOptions(player2);
            shoot(player2, 'MetaRight', 'MetaLeft');
        }

        moveBullets();
        spawnEnemies();
        moveEnemies();
        updateBoss();
        checkCollisions();
        updateDifficulty();
    }

    updateParticles();
    updateUI();

    // Zeichnen
    drawStars();
    drawParticles();
    drawBullets();
    drawMissiles();
    drawPowerCapsules();
    drawWeaponCapsules();
    drawEnemies();
    drawBoss();
    drawEnemyBullets();

    if (player1.active) {
        drawOptions(player1);
        drawPlayer(player1);
    }
    if (game.twoPlayerMode && player2.active) {
        drawOptions(player2);
        drawPlayer(player2);
    }

    drawLevelTransition();

    // Level-Fortschrittsanzeige
    if (!game.bossActive && !game.levelTransition) {
        const progress = game.levelProgress / game.levelLength;
        ctx.fillStyle = '#333';
        ctx.fillRect(10, canvas.height - 10, canvas.width - 20, 5);
        ctx.fillStyle = '#0af';
        ctx.fillRect(10, canvas.height - 10, (canvas.width - 20) * progress, 5);
    }

    requestAnimationFrame(gameLoop);
}

// Highscores laden beim Start
highscores.load();

// Initialisierung
initStars();

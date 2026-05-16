// 游戏状态
const GameState = {
    START: 'start',
    PLAYING: 'playing',
    PAUSED: 'paused',
    DIALOG: 'dialog',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// ===== 游戏内货币系统 =====
let starCoins = 0;  // 当前局的星星币
let totalStarCoins = 0; // 累计总星星币（从 localStorage 读取）

function initStarCoins() {
    try {
        totalStarCoins = parseInt(localStorage.getItem('totalStarCoins') || '0');
    } catch(e) { totalStarCoins = 0; }
}

function addStarCoins(amount) {
    starCoins += amount;
    totalStarCoins += amount;
    try {
        localStorage.setItem('totalStarCoins', totalStarCoins.toString());
    } catch(e) {}
    updateCoinHUD();
}

function updateCoinHUD() {
    const el = document.getElementById('coinCount');
    if (el) el.textContent = totalStarCoins;
    const el2 = document.getElementById('coinCountIngame');
    if (el2) el2.textContent = starCoins;
}

// ===== 道具组合系统 =====
// 记录玩家最近收集的道具（用于检测心+星组合）
let recentlyCollected = [];
let loveExplosionActive = false;
let loveExplosionTimer = 0; // 剩余帧数（10秒 = 600帧）
const LOVE_EXPLOSION_DURATION = 600; // 10秒

function checkItemCombination(itemType) {
    // 记录最近收集的道具，最多保留3个，5秒内
    const now = Date.now();
    recentlyCollected.push({ type: itemType, time: now });
    // 清除超过5秒的记录
    recentlyCollected = recentlyCollected.filter(i => now - i.time < 5000);

    // 检查是否同时有心和星
    const hasHeart = recentlyCollected.some(i => i.type === 'heart');
    const hasStar  = recentlyCollected.some(i => i.type === 'star');

    if (hasHeart && hasStar && !loveExplosionActive) {
        triggerLoveExplosion();
        recentlyCollected = []; // 消耗掉
    }
}

function triggerLoveExplosion() {
    loveExplosionActive = true;
    loveExplosionTimer = LOVE_EXPLOSION_DURATION;
    // 播放特殊音效
    if (canPlaySound) {
        playSound(523.25, 0.2, 'sine', 0.15);
        setTimeout(() => playSound(659.25, 0.2, 'sine', 0.15), 80);
        setTimeout(() => playSound(783.99, 0.2, 'sine', 0.15), 160);
        setTimeout(() => playSound(1046.50, 0.3, 'triangle', 0.12), 240);
    }
    showFloatingTip('💖 爱的爆发！双倍得分+无敌 10秒！', 2500);
    // 屏幕特效
    createParticles(player.x, player.y, 'rgb(255,50,150)', 25);
}

function updateLoveExplosion() {
    if (!loveExplosionActive) return;
    loveExplosionTimer--;
    if (loveExplosionTimer <= 0) {
        loveExplosionActive = false;
        loveExplosionTimer = 0;
        showFloatingTip('爱的爆发结束', 1200);
    }
}

// ===== 本地排行榜系统 =====
function getLeaderboard() {
    try {
        const data = localStorage.getItem('leaderboard');
        return data ? JSON.parse(data) : [];
    } catch(e) { return []; }
}

function saveLeaderboard(entries) {
    try {
        localStorage.setItem('leaderboard', JSON.stringify(entries));
    } catch(e) {}
}

function addLeaderboardEntry(playerScore, levelReached) {
    const entries = getLeaderboard();
    const now = new Date();
    const dateStr = `${now.getMonth()+1}/${now.getDate()}`;
    entries.push({ score: playerScore, level: levelReached, date: dateStr });
    // 按分数降序排列，只保留前10名
    entries.sort((a, b) => b.score - a.score);
    const top10 = entries.slice(0, 10);
    saveLeaderboard(top10);
    return top10;
}

// ===== 增强音效系统 =====
function playJumpSound() {
    if (!canPlaySound) return;
    try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain); gain.connect(audioContext.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(520, audioContext.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.18);
        osc.start(); osc.stop(audioContext.currentTime + 0.18);
    } catch(e) {}
}

function playHurtSound() {
    if (!canPlaySound) return;
    try {
        // 低沉震颤音效
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain); gain.connect(audioContext.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(80, audioContext.currentTime + 0.25);
        gain.gain.setValueAtTime(0.18, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        osc.start(); osc.stop(audioContext.currentTime + 0.3);
    } catch(e) {}
}

function playCollectSound(type) {
    if (!canPlaySound) return;
    try {
        const freqMap = { heart: 659.25, mushroom: 523.25, candy: 587.33, star: 880.00 };
        const freq = freqMap[type] || 660;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain); gain.connect(audioContext.destination);
        osc.type = type === 'star' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq * 0.8, audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(freq, audioContext.currentTime + 0.05);
        osc.frequency.linearRampToValueAtTime(freq * 1.2, audioContext.currentTime + 0.15);
        gain.gain.setValueAtTime(0.14, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.22);
        osc.start(); osc.stop(audioContext.currentTime + 0.22);
    } catch(e) {}
}

function playVictorySound() {
    if (!canPlaySound) return;
    try {
        const melody = [523.25, 659.25, 783.99, 1046.50, 880.00, 1046.50];
        const timings = [0, 0.15, 0.30, 0.45, 0.65, 0.80];
        melody.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain); gain.connect(audioContext.destination);
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const t = audioContext.currentTime + timings[i];
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
            gain.gain.linearRampToValueAtTime(0, t + 0.18);
            osc.start(t); osc.stop(t + 0.2);
        });
    } catch(e) {}
}

function playLevelClearSound() {
    if (!canPlaySound) return;
    try {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain); gain.connect(audioContext.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            const t = audioContext.currentTime + i * 0.12;
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            osc.start(t); osc.stop(t + 0.15);
        });
    } catch(e) {}
}

// 游戏配置
const CONFIG = {
    GRAVITY: 0.65,          // 优化：增加重力让跳跃弧度更自然（已调整0.55→0.65）
    JUMP_FORCE: -12.5,      // 优化：增大跳跃力让跳跃更有力
    MOVE_SPEED: 5,          // 优化：最大移动速度
    CROUCH_SPEED: 1.5,
    // 移动惯性参数
    ACCEL: 1.2,             // 加速度
    DECEL: 0.76,            // 减速摩擦系数（0~1，越小停得越快）（已调整0.82→0.76）
    // 土狼时间与跳跃缓冲
    COYOTE_FRAMES: 8,       // 离开平台后仍可跳跃的帧数
    JUMP_BUFFER_FRAMES: 8   // 提前按跳跃键的缓冲帧数
};

// 难度配置
let gameDifficulty = 'normal'; // easy, normal, hard

// 根据难度调整游戏参数
function applyDifficultySettings(difficulty) {
    gameDifficulty = difficulty;
    const baseConfig = CONFIG;
    
    // 难度系数
    const difficultyFactors = {
        easy: { gravity: 0.5, jumpForce: -11, moveSpeed: 4.5, accel: 1.0, decel: 0.8, enemySpeed: 0.8, spawnRate: 0.7 },
        normal: { gravity: 0.65, jumpForce: -12.5, moveSpeed: 5.0, accel: 1.2, decel: 0.76, enemySpeed: 1.0, spawnRate: 1.0 },
        hard: { gravity: 0.8, jumpForce: -14, moveSpeed: 5.5, accel: 1.4, decel: 0.7, enemySpeed: 1.3, spawnRate: 1.4 }
    };
    
    const factors = difficultyFactors[difficulty] || difficultyFactors.normal;
    
    // 应用系数到CONFIG（创建新对象，避免修改原始常量）
    CONFIG.GRAVITY = factors.gravity;
    CONFIG.JUMP_FORCE = factors.jumpForce;
    CONFIG.MOVE_SPEED = factors.moveSpeed;
    CONFIG.ACCEL = factors.accel;
    CONFIG.DECEL = factors.decel;
    
    // 设置全局难度因子
    window.difficultyFactor = factors.enemySpeed;
    window.difficultySpawnRate = factors.spawnRate;
    
    console.log(`已应用难度设置: ${difficulty}`, factors);
}

// 初始化时从本地存储加载难度设置
function loadDifficultySetting() {
    // 优先从游戏进度系统加载难度设置
    if (window.GameProgress && typeof window.GameProgress.getCurrentProgress === 'function') {
        const progress = window.GameProgress.getCurrentProgress();
        if (progress && progress.settings && progress.settings.difficulty) {
            gameDifficulty = progress.settings.difficulty;
            console.log('从游戏进度系统加载难度:', gameDifficulty);
        }
    } else {
        // 回退到旧的本地存储
        try {
            const saved = localStorage.getItem('gameDifficulty');
            if (saved && ['easy', 'normal', 'hard'].includes(saved)) {
                gameDifficulty = saved;
            }
        } catch(e) {}
    }
    
    // 更新下拉菜单
    const select = document.getElementById('difficultySelect');
    if (select) select.value = gameDifficulty;
    
    applyDifficultySettings(gameDifficulty);
}

// 保存难度设置
function saveDifficultySetting(difficulty) {
    try {
        localStorage.setItem('gameDifficulty', difficulty);
    } catch(e) {}
}

// 获取Canvas和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏状态管理
let gameState = GameState.START;
let currentLevel = 1;
let lives = 3;
let score = 0;          // 得分系统
let starsCollected = 0;
let dialogQueue = [];
let currentDialog = null;

// ===== 连击系统 =====
let comboCount = 0;          // 当前连击数
let comboTimer = 0;          // 连击超时计时（帧）
const COMBO_TIMEOUT = 300;   // 5秒（60fps*5）不收集则重置
const COMBO_THRESHOLDS = [1, 3, 6, 10]; // 达到此数量时升级倍率
// 连击倍率：1连=x1, 3连=x1.5, 6连=x2, 10连=x3
function getComboMultiplier() {
    if (comboCount >= 10) return 3;
    if (comboCount >= 6)  return 2;
    if (comboCount >= 3)  return 1.5;
    return 1;
}
function updateCombo() {
    if (comboCount > 0) {
        comboTimer--;
        if (comboTimer <= 0) {
            comboCount = 0;
            updateComboHUD();
        }
    }
}
function addCombo() {
    comboCount++;
    comboTimer = COMBO_TIMEOUT;
    updateComboHUD();
    // 升级提示
    const mult = getComboMultiplier();
    if (comboCount === 3)  showFloatingTip('🔥 连击 x1.5！', 800);
    if (comboCount === 6)  showFloatingTip('⚡ 连击 x2！', 800);
    if (comboCount === 10) showFloatingTip('💥 连击 x3！', 800);
}
function updateComboHUD() {
    const el = document.getElementById('comboDisplay');
    if (!el) return;
    const mult = getComboMultiplier();
    if (comboCount >= 3) {
        el.style.display = 'block';
        el.textContent = `🔥${comboCount}连 x${mult}`;
        el.style.color = mult >= 3 ? '#ff4444' : mult >= 2 ? '#ff8800' : '#ffdd00';
    } else {
        el.style.display = 'none';
    }
}

// ===== 道具磁吸常量 =====
const MAGNET_RANGE = 60;    // 磁吸触发范围（px）
const MAGNET_SPEED = 4;     // 磁吸移动速度（px/帧）

// 道具分值表
const ITEM_SCORES = {
    heart:      50,
    mushroom:   30,
    candy:      40,
    star:       100,
    starfish:   60,
    pearl:      80,
    rainbow:    70,
    cloudcandy: 50,
    rose:       100
};

// 相机
let camera = { x: 0, y: 0 };

// 粒子系统
let particles = [];

// 屏幕抖动效果
let screenShake = 0;
let screenShakeDuration = 0;

// ── 视觉特效增强系统 ──
// 地面尘土粒子
let dustParticles = [];
// 收集特效（放大消失+光圈扩散）
let collectEffects = [];
// 受伤特效（屏幕红色闪光）
let hurtFlash = 0; // 帧计数，>0时显示红色闪光
let hurtFlashMax = 18;
// 角色后退效果
let playerKnockback = 0;
let playerKnockbackDir = 0;
// Squash & Stretch 参数
let playerSquash = 1.0;   // Y方向缩放（<1拉伸，>1压缩）
let playerStretch = 1.0;  // X方向缩放（<1拉伸，>1压缩）
let playerBobOffset = 0;  // 奔跑上下摆动偏移
// 落地状态跟踪（用于落地压缩和尘埃）
let wasJumpingLastFrame = false;

// 音频上下文（用于生成音效）
let audioContext = null;
let canPlaySound = false;

// 输入控制
const keys = {};
let isCrouching = false;

// 防止重复启动 / 游戏循环 ID（提前声明，避免暂时性死区）
let gameStarted = false;
let gameLoopId = null;

// 主角对象
const player = {
    x: 100,
    y: 400,
    width: 30,
    height: 40,
    velocityX: 0,           // 水平速度（用于惯性移动）
    velocityY: 0,
    isJumping: false,
    hasShield: false,
    speedBoost: 0,
    jumpBoost: 0,
    invulnerable: 0,
    color: '#4169E1',
    // 土狼时间：离地后仍可跳跃的剩余帧数
    coyoteTimer: 0,
    // 跳跃缓冲：提前按跳键的剩余有效帧数
    jumpBufferTimer: 0,
    // 上次跳跃是否为二段跳（用于连跳音效）
    jumpCount: 0
};

// 关卡数据（length=1600，玩家需要真正走到末尾才能遇到小秋）
const levels = {
    1: {
        name: '青草地平线',
        background: '#87CEEB',
        groundColor: '#90EE90',
        obstacles: [
            { type: 'ball', x: 300,  y: 450, width: 40, height: 40, speed: 1.2, direction:  1 },
            { type: 'ball', x: 600,  y: 450, width: 40, height: 40, speed: 1.2, direction: -1 },
            { type: 'ball', x: 900,  y: 450, width: 40, height: 40, speed: 1.2, direction:  1 },
            { type: 'ball', x: 1200, y: 450, width: 40, height: 40, speed: 1.2, direction: -1 },
            { type: 'pit',  x: 450,  y: 500, width: 60, height: 100 },
            { type: 'pit',  x: 750,  y: 500, width: 60, height: 100 },
            { type: 'pit',  x: 1050, y: 500, width: 60, height: 100 },
            { type: 'pit',  x: 1350, y: 500, width: 60, height: 100 }
        ],
        items: [
            { type: 'heart',    x: 250,  y: 350, collected: false },
            { type: 'mushroom', x: 550,  y: 350, collected: false },
            { type: 'heart',    x: 850,  y: 350, collected: false },
            { type: 'candy',    x: 1150, y: 350, collected: false }
        ],
        length: 1600,
        girlX: 1550
    },
    2: {
        name: '星空隧道',
        background: '#191970',
        groundColor: '#483D8B',
        obstacles: [
            { type: 'cloud', x: 250,  y: 250, width: 50, height: 30, speed: 1.0, direction:  1 },
            { type: 'cloud', x: 450,  y: 180, width: 50, height: 30, speed: 1.0, direction: -1 },
            { type: 'cloud', x: 700,  y: 320, width: 50, height: 30, speed: 1.0, direction:  1 },
            { type: 'cloud', x: 950,  y: 220, width: 50, height: 30, speed: 1.0, direction: -1 },
            { type: 'cloud', x: 1150, y: 300, width: 50, height: 30, speed: 1.0, direction:  1 },
            { type: 'cloud', x: 1350, y: 200, width: 50, height: 30, speed: 1.0, direction: -1 },
            { type: 'ball',  x: 400,  y: 450, width: 35, height: 35, speed: 1.5, direction:  1 },
            { type: 'ball',  x: 800,  y: 450, width: 35, height: 35, speed: 1.5, direction: -1 },
            { type: 'ball',  x: 1200, y: 450, width: 35, height: 35, speed: 1.5, direction:  1 },
            { type: 'pit',   x: 300,  y: 500, width: 40, height: 100 },
            { type: 'pit',   x: 550,  y: 500, width: 40, height: 100 },
            { type: 'pit',   x: 780,  y: 500, width: 40, height: 100 },
            { type: 'pit',   x: 1020, y: 500, width: 40, height: 100 },
            { type: 'pit',   x: 1280, y: 500, width: 40, height: 100 }
        ],
        items: [
            { type: 'heart',    x: 350,  y: 400, collected: false },
            { type: 'candy',    x: 650,  y: 380, collected: false },
            { type: 'mushroom', x: 950,  y: 350, collected: false },
            { type: 'heart',    x: 1250, y: 400, collected: false }
        ],
        length: 1600,
        girlX: 1550
    },
    3: {
        name: '花海小径',
        background: '#FFB6C1',
        groundColor: '#FFA07A',
        obstacles: [
            { type: 'thorn', x: 350,  y: 450, width: 60, height: 60, speed: 1.5, direction:  1 },
            { type: 'thorn', x: 700,  y: 450, width: 60, height: 60, speed: 1.5, direction: -1 },
            { type: 'thorn', x: 1050, y: 450, width: 60, height: 60, speed: 1.5, direction:  1 },
            { type: 'thorn', x: 1350, y: 450, width: 60, height: 60, speed: 1.5, direction: -1 },
            { type: 'cloud', x: 500,  y: 300, width: 50, height: 30, speed: 0.6, direction:  1 },
            { type: 'cloud', x: 900,  y: 200, width: 50, height: 30, speed: 0.6, direction: -1 },
            { type: 'cloud', x: 1200, y: 280, width: 50, height: 30, speed: 0.6, direction:  1 },
            { type: 'pit',   x: 450,  y: 500, width: 50, height: 100 },
            { type: 'pit',   x: 850,  y: 500, width: 50, height: 100 },
            { type: 'pit',   x: 1150, y: 500, width: 50, height: 100 }
        ],
        items: [
            { type: 'heart',    x: 280,  y: 350, collected: false },
            { type: 'mushroom', x: 580,  y: 350, collected: false },
            { type: 'star',     x: 400,  y: 300, collected: false },
            { type: 'star',     x: 600,  y: 300, collected: false },
            { type: 'star',     x: 800,  y: 300, collected: false },
            { type: 'star',     x: 1000, y: 300, collected: false },
            { type: 'star',     x: 1200, y: 300, collected: false }
        ],
        length: 1600,
        girlX: 1550
    },
    4: {
        name: '深海梦境',
        background: '#003366',
        groundColor: '#001a33',
        obstacles: [
            // 水母（上下浮动的圆形障碍）
            { type: 'jellyfish', x: 320,  y: 300, width: 44, height: 44, speed: 0.8, direction: 1, baseY: 300 },
            { type: 'jellyfish', x: 620,  y: 250, width: 44, height: 44, speed: 0.9, direction: -1, baseY: 250 },
            { type: 'jellyfish', x: 900,  y: 320, width: 44, height: 44, speed: 0.7, direction: 1, baseY: 320 },
            { type: 'jellyfish', x: 1180, y: 270, width: 44, height: 44, speed: 1.0, direction: -1, baseY: 270 },
            { type: 'jellyfish', x: 1420, y: 300, width: 44, height: 44, speed: 0.85, direction: 1, baseY: 300 },
            // 珊瑚刺（固定障碍）
            { type: 'coral',     x: 480,  y: 440, width: 50, height: 60 },
            { type: 'coral',     x: 780,  y: 440, width: 50, height: 60 },
            { type: 'coral',     x: 1080, y: 440, width: 50, height: 60 },
            { type: 'coral',     x: 1330, y: 440, width: 50, height: 60 },
            // 陷阱坑
            { type: 'pit',       x: 380,  y: 500, width: 50, height: 100 },
            { type: 'pit',       x: 700,  y: 500, width: 50, height: 100 },
            { type: 'pit',       x: 1000, y: 500, width: 55, height: 100 },
            { type: 'pit',       x: 1280, y: 500, width: 55, height: 100 }
        ],
        items: [
            { type: 'starfish',  x: 250,  y: 350, collected: false },
            { type: 'pearl',     x: 450,  y: 300, collected: false },
            { type: 'starfish',  x: 650,  y: 350, collected: false },
            { type: 'pearl',     x: 850,  y: 300, collected: false },
            { type: 'starfish',  x: 1050, y: 350, collected: false },
            { type: 'pearl',     x: 1250, y: 300, collected: false },
            { type: 'starfish',  x: 1400, y: 350, collected: false },
            { type: 'pearl',     x: 550,  y: 250, collected: false }
        ],
        length: 1800,
        girlX: 1750,
        // 关卡对话
        dialog: [
            { speaker: '挑战者', text: '这片深海...好美，到处都是神秘的蓝光。', emotion: '轻声赞叹' },
            { speaker: '挑战者', text: '我心爱的人，你是不是也曾来过这里？我感觉到了你留下的痕迹...', emotion: '深情呢喃' }
        ]
    },
    5: {
        name: '云端天空',
        background: '#e8f4ff',
        groundColor: '#c8d8f0',
        obstacles: [
            // 飞鸟（水平飞行）
            { type: 'bird', x: 300,  y: 200, width: 48, height: 28, speed: 2.0, direction:  1 },
            { type: 'bird', x: 600,  y: 160, width: 48, height: 28, speed: 2.2, direction: -1 },
            { type: 'bird', x: 880,  y: 240, width: 48, height: 28, speed: 1.8, direction:  1 },
            { type: 'bird', x: 1150, y: 180, width: 48, height: 28, speed: 2.0, direction: -1 },
            { type: 'bird', x: 1420, y: 220, width: 48, height: 28, speed: 2.3, direction:  1 },
            // 旋风（旋转障碍）
            { type: 'whirlwind', x: 420,  y: 380, width: 52, height: 52, speed: 1.0, direction:  1 },
            { type: 'whirlwind', x: 750,  y: 360, width: 52, height: 52, speed: 1.2, direction: -1 },
            { type: 'whirlwind', x: 1050, y: 380, width: 52, height: 52, speed: 1.0, direction:  1 },
            { type: 'whirlwind', x: 1350, y: 360, width: 52, height: 52, speed: 1.1, direction: -1 },
            // 陷阱坑
            { type: 'pit',       x: 350,  y: 500, width: 60, height: 100 },
            { type: 'pit',       x: 680,  y: 500, width: 60, height: 100 },
            { type: 'pit',       x: 1000, y: 500, width: 60, height: 100 },
            { type: 'pit',       x: 1300, y: 500, width: 65, height: 100 }
        ],
        items: [
            { type: 'rainbow',    x: 220,  y: 320, collected: false },
            { type: 'cloudcandy', x: 480,  y: 350, collected: false },
            { type: 'rainbow',    x: 700,  y: 310, collected: false },
            { type: 'cloudcandy', x: 920,  y: 340, collected: false },
            { type: 'rainbow',    x: 1130, y: 320, collected: false },
            { type: 'cloudcandy', x: 1380, y: 350, collected: false },
            { type: 'rainbow',    x: 580,  y: 250, collected: false },
            { type: 'cloudcandy', x: 1200, y: 260, collected: false }
        ],
        length: 1900,
        girlX: 1850,
        // 关卡对话
        dialog: [
            { speaker: '挑战者', text: '越来越近了，我能感觉到...', emotion: '激动而坚定' },
            { speaker: '心爱的人', text: '...（心爱的人的声音从云端传来）加油...', emotion: '遥远而温柔' }
        ]
    },
    6: {
        name: '心意殿堂',
        background: '#2d0a1e',
        groundColor: '#6b1a3a',
        obstacles: [
            // 爱心守卫（来回移动的心形障碍）
            { type: 'heartGuard', x: 280,  y: 430, width: 48, height: 48, speed: 1.8, direction:  1 },
            { type: 'heartGuard', x: 560,  y: 430, width: 48, height: 48, speed: 2.0, direction: -1 },
            { type: 'heartGuard', x: 840,  y: 430, width: 48, height: 48, speed: 1.8, direction:  1 },
            { type: 'heartGuard', x: 1120, y: 430, width: 48, height: 48, speed: 2.2, direction: -1 },
            { type: 'heartGuard', x: 1400, y: 430, width: 48, height: 48, speed: 2.0, direction:  1 },
            { type: 'heartGuard', x: 1680, y: 430, width: 48, height: 48, speed: 2.2, direction: -1 },
            // 玫瑰刺（固定）
            { type: 'thorn', x: 430,  y: 450, width: 55, height: 55 },
            { type: 'thorn', x: 720,  y: 450, width: 55, height: 55 },
            { type: 'thorn', x: 1000, y: 450, width: 55, height: 55 },
            { type: 'thorn', x: 1260, y: 450, width: 55, height: 55 },
            { type: 'thorn', x: 1520, y: 450, width: 55, height: 55 },
            // 陷阱坑
            { type: 'pit', x: 360,  y: 500, width: 55, height: 100 },
            { type: 'pit', x: 660,  y: 500, width: 55, height: 100 },
            { type: 'pit', x: 960,  y: 500, width: 55, height: 100 },
            { type: 'pit', x: 1200, y: 500, width: 55, height: 100 },
            { type: 'pit', x: 1460, y: 500, width: 60, height: 100 },
            { type: 'pit', x: 1700, y: 500, width: 60, height: 100 }
        ],
        items: [
            { type: 'rose',     x: 220,  y: 340, collected: false },
            { type: 'heart',    x: 480,  y: 300, collected: false },
            { type: 'rose',     x: 630,  y: 340, collected: false },
            { type: 'heart',    x: 800,  y: 260, collected: false },
            { type: 'rose',     x: 920,  y: 340, collected: false },
            { type: 'heart',    x: 1070, y: 300, collected: false },
            { type: 'rose',     x: 1180, y: 340, collected: false },
            { type: 'star',     x: 350,  y: 260, collected: false },
            { type: 'star',     x: 580,  y: 240, collected: false },
            { type: 'star',     x: 850,  y: 230, collected: false },
            { type: 'star',     x: 1100, y: 250, collected: false },
            { type: 'star',     x: 1350, y: 240, collected: false },
            { type: 'rose',     x: 1500, y: 300, collected: false },
            { type: 'heart',    x: 1650, y: 260, collected: false }
        ],
        length: 2000,
        girlX: 1950,
        dialog: [
            { speaker: '挑战者',  text: '心爱的人！我终于找到这里了...心意殿堂，原来你一直在这里等我。', emotion: '激动颤抖' },
            { speaker: '心爱的人', text: '你真的来了。我知道你一定会来的。', emotion: '温柔含泪' },
            { speaker: '挑战者',  text: '不管有多少阻碍，我都不会停下脚步。这份心意，我要亲手交到你手里。', emotion: '深情坚定' },
            { speaker: '心爱的人', text: '我们之间，不需要那么多话。你来了，就够了。', emotion: '幸福微笑' },
            { speaker: '系统', text: '💖 恭喜通关！你们的故事，在心意殿堂里画下了最美的句点。', emotion: '温柔旁白' }
        ]
    }
};

// 事件监听
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // ESC 键切换暂停
    if (e.key === 'Escape') {
        togglePause();
        return;
    }
    
    if (e.key === 'ArrowDown' && gameState === GameState.PLAYING) {
        isCrouching = true;
        player.height = 20;
    }
    
    // 跳跃输入：使用跳跃缓冲，不立即触发，由 updatePlayer 处理
    if (e.key === 'ArrowUp' && gameState === GameState.PLAYING) {
        player.jumpBufferTimer = CONFIG.JUMP_BUFFER_FRAMES;
    }
    
    if (e.key === ' ' && gameState === GameState.DIALOG) {
        nextDialog();
    }
});

// 暂停/继续切换函数
function togglePause() {
    if (gameState === GameState.PLAYING) {
        gameState = GameState.PAUSED;
        const btn = document.getElementById('pauseBtn');
        if (btn) btn.textContent = '▶';
    } else if (gameState === GameState.PAUSED) {
        gameState = GameState.PLAYING;
        const btn = document.getElementById('pauseBtn');
        if (btn) btn.textContent = '⏸';
        // 重启游戏循环（避免循环停止）
        if (!gameLoopId) gameLoopId = requestAnimationFrame(gameLoop);
    }
}

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    
    if (e.key === 'ArrowDown' && gameState === GameState.PLAYING) {
        isCrouching = false;
        player.height = 40;
    }
});

// 开始游戏
function startGame() {
    // 防止重复启动游戏循环
    if (gameStarted) {
        console.log('游戏已经在运行中');
        return;
    }
    gameStarted = true;
    
    document.getElementById('startScreen').style.display = 'none';
    gameState = GameState.DIALOG;
    
    // 初始化音频系统（首次点击时初始化）
    if (!audioContext) {
        initAudio();
    }
    
    // 播放开始音效
    if (canPlaySound) {
        playSound(523.25, 0.2, 'sine', 0.15); // C5
        setTimeout(() => playSound(659.25, 0.2, 'sine', 0.15), 100); // E5
        // 延迟 500ms 启动背景音乐，避免与开始音效重叠
        setTimeout(() => startBGM(), 500);
    }
    
    // 开篇对话
    dialogQueue = [
        { speaker: '挑战者', text: '我会在花海的尽头等你，不管路上有多少阻碍，我都一定要找到你，把这份心意送到你身边。', emotion: '温柔且坚定' },
        { speaker: '系统', text: '欢迎来到奔赴心意的冒险，勇敢穿越障碍，奔赴心爱之人的身边吧！', emotion: '温柔女声' }
    ];
    
    showNextDialog();
    gameLoop();
}

// 显示对话
function showDialog(speaker, text, emotion = '') {
    const dialogBox = document.getElementById('dialogBox');
    dialogBox.style.display = 'block';
    dialogBox.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; color: #ffd700;">${speaker}${emotion ? ` (${emotion})` : ''}：</div>
        <div>${text}</div>
        <div style="text-align: right; margin-top: 10px; font-size: 12px; color: #aaa;">按空格键继续</div>
    `;
}

function showFloatingTip(text, duration = 1500) {
    const tip = document.getElementById('floatingTip');
    tip.textContent = text;
    tip.style.display = 'block';
    
    setTimeout(() => {
        tip.style.display = 'none';
    }, duration);
}

// 创建粒子特效
function createParticles(x, y, color, count = 8) {
    // 解析 rgb(r,g,b) 或 #rrggbb 为各通道整数，避免字符串替换崩溃
    let r = 255, g = 200, b = 0;
    const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (rgbMatch) {
        r = parseInt(rgbMatch[1]);
        g = parseInt(rgbMatch[2]);
        b = parseInt(rgbMatch[3]);
    } else if (color.startsWith('#')) {
        const hex = color.slice(1);
        r = parseInt(hex.slice(0,2), 16);
        g = parseInt(hex.slice(2,4), 16);
        b = parseInt(hex.slice(4,6), 16);
    }
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x + Math.random() * 20 - 10,
            y: y + Math.random() * 20 - 10,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3 - 2,
            life: 30,
            maxLife: 30,
            r, g, b
        });
    }
}

// ── 创建地面尘土粒子（奔跑时脚下）
function createRunDust(x, y) {
    for (let i = 0; i < 3; i++) {
        const side = (Math.random() - 0.5) * 12;
        dustParticles.push({
            x: x + side,
            y: y,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -(Math.random() * 1.5 + 0.5),
            r: Math.random() * 4 + 2,
            life: 18 + Math.floor(Math.random() * 10),
            maxLife: 28,
            type: 'run'
        });
    }
}

// ── 创建落地尘埃爆发（落地时左右散开）
function createLandDust(x, y) {
    for (let i = 0; i < 10; i++) {
        const angle = Math.PI + (Math.random() - 0.5) * Math.PI;
        const speed = Math.random() * 2.5 + 0.8;
        dustParticles.push({
            x: x + (Math.random() - 0.5) * 16,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.5,
            r: Math.random() * 5 + 3,
            life: 22 + Math.floor(Math.random() * 8),
            maxLife: 30,
            type: 'land'
        });
    }
}

// ── 创建道具收集特效（放大消失 + 粒子爆炸 + 光圈扩散）
function createCollectEffect(x, y, color) {
    // 粒子爆炸
    let r = 255, g = 200, b = 0;
    const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (rgbMatch) { r = parseInt(rgbMatch[1]); g = parseInt(rgbMatch[2]); b = parseInt(rgbMatch[3]); }
    else if (color.startsWith('#')) {
        const hex = color.slice(1);
        r = parseInt(hex.slice(0,2),16); g = parseInt(hex.slice(2,4),16); b = parseInt(hex.slice(4,6),16);
    }

    for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const speed = Math.random() * 3 + 1.5;
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            life: 35, maxLife: 35, r, g, b,
            size: Math.random() * 4 + 2
        });
    }

    // 光圈扩散 + 放大消失特效
    collectEffects.push({
        x, y,
        r: 8, // 初始半径
        maxR: 48,
        life: 28,
        maxLife: 28,
        r_val: r, g_val: g, b_val: b
    });
    // 第二圈（延迟）
    collectEffects.push({
        x, y,
        r: 4,
        maxR: 36,
        life: 20,
        maxLife: 20,
        r_val: r, g_val: g, b_val: b,
        delay: 6
    });
}

// ── 触发受伤特效（红色屏幕闪光 + 角色后退）
function triggerHurtEffect(knockbackDir) {
    hurtFlash = hurtFlashMax;
    playerKnockback = 18;   // 后退帧数
    playerKnockbackDir = knockbackDir || -1; // -1=向左, 1=向右
}

// 更新粒子
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        
        // 移除死亡的粒子
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// 渲染粒子
function renderParticles() {
    for (const p of particles) {
        const alpha = p.life / (p.maxLife || 30);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ── 更新尘土粒子
function updateDustParticles() {
    for (let i = dustParticles.length - 1; i >= 0; i--) {
        const d = dustParticles[i];
        if (d.delay && d.delay > 0) { d.delay--; continue; }
        d.x += d.vx;
        d.y += d.vy;
        d.vy += 0.08; // 轻微重力
        d.r *= 0.95;
        d.life--;
        if (d.life <= 0 || d.r < 0.5) dustParticles.splice(i, 1);
    }
}

// ── 渲染尘土粒子
function renderDustParticles() {
    for (const d of dustParticles) {
        if (d.delay && d.delay > 0) continue;
        const alpha = (d.life / d.maxLife) * 0.55;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = currentLevel === 2 ? '#8877cc' : (currentLevel === 3 ? '#d4a06a' : '#c8b870');
        ctx.shadowBlur = 4;
        ctx.shadowColor = currentLevel === 2 ? '#6655aa' : '#a89060';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ── 更新收集特效
function updateCollectEffects() {
    for (let i = collectEffects.length - 1; i >= 0; i--) {
        const e = collectEffects[i];
        if (e.delay && e.delay > 0) { e.delay--; continue; }
        e.r += (e.maxR - e.r) * 0.18;
        e.life--;
        if (e.life <= 0) collectEffects.splice(i, 1);
    }
}

// ── 渲染收集特效（光圈扩散）
function renderCollectEffects() {
    for (const e of collectEffects) {
        if (e.delay && e.delay > 0) continue;
        const alpha = (e.life / e.maxLife) * 0.75;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `rgba(${e.r_val},${e.g_val},${e.b_val},1)`;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = `rgba(${e.r_val},${e.g_val},${e.b_val},0.8)`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// 触发屏幕抖动
function shakeScreen(intensity = 10, duration = 15) {
    screenShake = Math.max(screenShake, intensity);
    screenShakeDuration = Math.max(screenShakeDuration, duration);
}

// 更新屏幕抖动
function updateScreenShake() {
    if (screenShakeDuration > 0) {
        screenShakeDuration--;
        if (screenShakeDuration <= 0) {
            screenShake = 0;
        }
    }
}

// 播放音效
function playSound(frequency, duration = 0.1, type = 'sine', volume = 0.2) {
    if (!canPlaySound) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.log('音效播放失败:', e);
    }
}

// 初始化音频系统
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        canPlaySound = true;
    } catch (e) {
        console.log('音频初始化失败:', e);
        canPlaySound = false;
    }
}

function nextDialog() {
    if (dialogQueue.length > 0) {
        const dialog = dialogQueue.shift();
        showDialog(dialog.speaker, dialog.text, dialog.emotion);
    } else {
        document.getElementById('dialogBox').style.display = 'none';
        if (pendingLevelTransition) {
            doLevelTransition();
        } else {
            gameState = GameState.PLAYING;
        }
    }
}

function showNextDialog() {
    nextDialog();
}

// 更新游戏
function update() {
    if (gameState !== GameState.PLAYING) return;
    
    // 更新玩家
    updatePlayer();
    
    // 更新障碍
    updateObstacles();
    
    // 更新粒子特效
    updateParticles();
    
    // 更新尘土粒子
    updateDustParticles();
    
    // 更新收集特效
    updateCollectEffects();
    
    // 更新受伤闪光
    if (hurtFlash > 0) hurtFlash--;
    
    // 更新屏幕抖动
    updateScreenShake();
    
    // 检查道具收集（只检查屏幕内的道具）
    checkItems();
    
    // 检查碰撞
    checkCollisions();
    
    // 检查是否到达终点
    checkWinCondition();
    
    // 更新相机
    updateCamera();
    
    // 更新UI
    updateUI();
    
    // 更新进度条
    updateProgressBar();
    
    // 更新连击计时
    updateCombo();
    
    // 更新爱的爆发计时
    updateLoveExplosion();
}

function updatePlayer() {
    // 更新无敌时间
    if (player.invulnerable > 0) player.invulnerable--;
    
    // ──── 确定有效最大速度 ────
    let maxSpeed = CONFIG.MOVE_SPEED;
    if (maxSpeed <= 0 || maxSpeed > 10) maxSpeed = 5;
    if (isCrouching) maxSpeed = CONFIG.CROUCH_SPEED;
    if (player.speedBoost > 0) maxSpeed *= 1.5;
    if (maxSpeed > 8) maxSpeed = 8;

    // 后退效果
    if (playerKnockback > 0) {
        player.x += playerKnockbackDir * 2.5;
        playerKnockback--;
    }
    
    // ──── 惯性移动（加速/减速） ────
    const accel = CONFIG.ACCEL || 1.2;
    const decel = CONFIG.DECEL || 0.82;
    
    if (keys['ArrowLeft']) {
        player.velocityX = Math.max((player.velocityX || 0) - accel, -maxSpeed);
    } else if (keys['ArrowRight']) {
        player.velocityX = Math.min((player.velocityX || 0) + accel, maxSpeed);
    } else {
        player.velocityX = (player.velocityX || 0) * decel;
        if (Math.abs(player.velocityX) < 0.15) player.velocityX = 0;
    }
    player.x += player.velocityX;
    
    const isMoving = Math.abs(player.velocityX) > 0.3;
    
    // ──── 重力 ────
    let gravity = CONFIG.GRAVITY;
    if (gravity <= 0 || gravity > 2) gravity = 0.55;
    
    const prevIsJumping = player.isJumping;
    player.velocityY += gravity;
    player.y += player.velocityY;
    
    // ──── 跳跃缓冲递减 ────
    if (player.jumpBufferTimer > 0) player.jumpBufferTimer--;
    
    // ──── 地面碰撞 ────
    if (player.y >= 460) {
        player.y = 460;
        // 落地：触发压缩特效和落地尘埃
        if (prevIsJumping || wasJumpingLastFrame) {
            playerSquash = 1.35;   // 落地压缩（宽扁）
            playerStretch = 0.72;
            createLandDust(player.x + player.width / 2, player.y + player.height);
        }
        player.velocityY = 0;
        player.isJumping = false;
        player.jumpCount = 0;
        // 落地时重置土狼时间（落地后可以用缓冲跳）
        player.coyoteTimer = CONFIG.COYOTE_FRAMES;
    } else {
        // 离地时递减土狼时间
        if (player.coyoteTimer > 0 && !player.isJumping) {
            player.coyoteTimer--;
        } else if (player.isJumping) {
            // 跳跃中不补充土狼时间
        }
    }
    wasJumpingLastFrame = player.isJumping;

    // ──── 处理跳跃（土狼时间 + 跳跃缓冲） ────
    if (player.jumpBufferTimer > 0) {
        const canJumpCoyote = !player.isJumping || player.coyoteTimer > 0;
        if (canJumpCoyote) {
            const jumpMult = player.jumpBoost > 0 ? 1.5 : 1;
            player.velocityY = CONFIG.JUMP_FORCE * jumpMult;
            player.isJumping = true;
            player.coyoteTimer = 0;
            player.jumpBufferTimer = 0;
            player.jumpCount = 1;
            // 跳跃音效：增强版
            playJumpSound();
            // 跳跃拉伸
            playerSquash = 0.72;
            playerStretch = 1.3;
        }
    }
    
    // 边界限制 —— 右边界跟随关卡长度
    const currentLevelData2 = levels[currentLevel];
    const levelMaxX = currentLevelData2 ? currentLevelData2.length - 10 : 1590;
    player.x = Math.max(0, Math.min(player.x, levelMaxX));
    
    // 更新道具效果
    if (player.speedBoost > 0) player.speedBoost--;
    if (player.jumpBoost > 0) player.jumpBoost--;

    // ── Squash & Stretch 动画逻辑 ──
    const now2 = Date.now();
    if (player.isJumping) {
        // 跳跃中：根据速度方向拉伸
        if (player.velocityY < 0) {
            // 上升：垂直拉伸（苗条高挑）
            playerSquash = Math.max(0.78, playerSquash * 0.92 + 0.78 * 0.08);
            playerStretch = Math.min(1.22, playerStretch * 0.92 + 1.22 * 0.08);
        } else {
            // 下降：略微压缩预备
            playerSquash = Math.min(1.08, playerSquash * 0.92 + 1.08 * 0.08);
            playerStretch = Math.max(0.94, playerStretch * 0.92 + 0.94 * 0.08);
        }
        playerBobOffset = 0;
    } else if (isMoving && !isCrouching) {
        // 奔跑：平滑回弹到正常比例
        playerSquash = playerSquash * 0.8 + 1.0 * 0.2;
        playerStretch = playerStretch * 0.8 + 1.0 * 0.2;
        // 轻微上下摆动
        playerBobOffset = Math.sin(now2 * 0.015) * 2.5;
        // 每隔一步生成脚下尘土
        if (Math.floor(now2 / 120) !== Math.floor((now2 - 16) / 120)) {
            createRunDust(player.x + player.width / 2, player.y + player.height - 2);
        }
    } else {
        // 静止/下蹲：平滑回归到1
        playerSquash = playerSquash * 0.8 + 1.0 * 0.2;
        playerStretch = playerStretch * 0.8 + 1.0 * 0.2;
        playerBobOffset = playerBobOffset * 0.7;
    }
}

function updateObstacles() {
    const level = levels[currentLevel];
    if (!level || !level.obstacles) return;
    
    // 障碍物的移动范围：左边不少于100，右边不超过 girlX-100，避免堵在终点
    const obstacleMaxX = (level.girlX || 1550) - 100;
    
    level.obstacles.forEach(obstacle => {
        if (obstacle.type === 'ball' || obstacle.type === 'thorn') {
            obstacle.x += obstacle.speed * obstacle.direction * (window.difficultyFactor || 1);
            
            if (obstacle.x <= 100 || obstacle.x >= obstacleMaxX) {
                obstacle.direction *= -1;
                // 修正越界
                obstacle.x = Math.max(100, Math.min(obstacle.x, obstacleMaxX));
            }
        } else if (obstacle.type === 'cloud') {
            obstacle.y += obstacle.speed * obstacle.direction * (window.difficultyFactor || 1);
            
            if (obstacle.y <= 150 || obstacle.y >= 350) {
                obstacle.direction *= -1;
                obstacle.y = Math.max(150, Math.min(obstacle.y, 350));
            }
        } else if (obstacle.type === 'jellyfish') {
            // 水母：上下浮动（sin函数驱动）
            const t = Date.now() * 0.001;
            obstacle.y = obstacle.baseY + Math.sin(t * obstacle.speed * (window.difficultyFactor || 1) + obstacle.x * 0.01) * 40;
        } else if (obstacle.type === 'bird') {
            // 飞鸟：水平飞行，到达边界折返
            obstacle.x += obstacle.speed * obstacle.direction * (window.difficultyFactor || 1);
            if (obstacle.x <= 80 || obstacle.x >= obstacleMaxX) {
                obstacle.direction *= -1;
                obstacle.x = Math.max(80, Math.min(obstacle.x, obstacleMaxX));
            }
        } else if (obstacle.type === 'whirlwind') {
            // 旋风：水平移动 + 旋转角度累积
            obstacle.x += obstacle.speed * obstacle.direction * (window.difficultyFactor || 1);
            if (!obstacle.angle) obstacle.angle = 0;
            obstacle.angle += 0.08;
            if (obstacle.x <= 100 || obstacle.x >= obstacleMaxX) {
                obstacle.direction *= -1;
                obstacle.x = Math.max(100, Math.min(obstacle.x, obstacleMaxX));
            }
        }
        // coral（珊瑚）固定不动，无需处理
        // heartGuard（爱心守卫）水平来回移动
        if (obstacle.type === 'heartGuard') {
            obstacle.x += obstacle.speed * obstacle.direction * (window.difficultyFactor || 1);
            if (obstacle.x <= 80 || obstacle.x >= obstacleMaxX) {
                obstacle.direction *= -1;
                obstacle.x = Math.max(80, Math.min(obstacle.x, obstacleMaxX));
            }
        }
    });
}

function checkItems() {
    const level = levels[currentLevel];
    
    level.items.forEach(item => {
        if (!item.collected) {
            const dx = player.x - item.x;
            const dy = player.y - item.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 道具磁吸：在 MAGNET_RANGE 范围内自动向玩家移动
            if (distance < MAGNET_RANGE && distance > 30) {
                const ratio = MAGNET_SPEED / distance;
                item.x += dx * ratio;
                item.y += dy * ratio;
            }
            
            if (distance < 30) {
                collectItem(item);
            }
        }
    });
}

function collectItem(item) {
    item.collected = true;
    
    // 连击系统
    addCombo();
    const comboMult = getComboMultiplier();
    
    // 得分加分（爱的爆发双倍 × 连击倍率）
    const basePoints = ITEM_SCORES[item.type] || 0;
    let points = basePoints * comboMult;
    if (loveExplosionActive) points *= 2;
    points = Math.round(points);
    if (points > 0) {
        score += points;
        const label = (comboMult > 1 || loveExplosionActive)
            ? `+${points}分 ${loveExplosionActive ? '💖双倍' : ''} ${comboMult > 1 ? `x${comboMult}连击` : ''}`
            : `+${points}分`;
        showFloatingTip(label.trim(), 800);
    }
    
    // 星星币奖励
    const COIN_REWARDS = { heart: 5, mushroom: 3, candy: 4, star: 10, starfish: 6, pearl: 8, rainbow: 7, cloudcandy: 5, rose: 10 };
    const coins = COIN_REWARDS[item.type] || 2;
    addStarCoins(coins);
    
    // 播放收集音效（增强版）
    playCollectSound(item.type);
    
    // 添加粒子特效
    let particleColor;
    
    switch (item.type) {
        case 'heart':
            player.hasShield = true;
            particleColor = 'rgb(255, 20, 147)';
            setTimeout(() => showFloatingTip('获得护盾！', 1200), 900);
            break;
        case 'mushroom':
            player.jumpBoost = 300;
            particleColor = 'rgb(255, 69, 0)';
            setTimeout(() => showFloatingTip('跳跃力提升！', 1200), 900);
            break;
        case 'candy':
            player.speedBoost = 300;
            particleColor = 'rgb(255, 215, 0)';
            setTimeout(() => showFloatingTip('速度提升！', 1200), 900);
            break;
        case 'star':
            starsCollected++;
            particleColor = 'rgb(255, 255, 0)';
            if (starsCollected === 5) {
                dialogQueue = [{ speaker: '系统', text: '解锁隐藏回忆，继续奔赴你的心意吧！', emotion: '' }];
                gameState = GameState.DIALOG;
                showNextDialog();
            } else {
                setTimeout(() => showFloatingTip(`星光碎片 ${starsCollected}/5`, 1000), 900);
            }
            break;
        case 'starfish':
            player.hasShield = true;
            particleColor = 'rgb(255, 140, 0)';
            setTimeout(() => showFloatingTip('海星护盾！', 1200), 900);
            break;
        case 'pearl':
            player.jumpBoost = 300;
            particleColor = 'rgb(220, 220, 255)';
            setTimeout(() => showFloatingTip('珍珠跳跃提升！', 1200), 900);
            break;
        case 'rainbow':
            player.speedBoost = 300;
            particleColor = 'rgb(150, 100, 255)';
            setTimeout(() => showFloatingTip('彩虹加速！', 1200), 900);
            break;
        case 'cloudcandy':
            player.hasShield = true;
            player.jumpBoost = 150;
            particleColor = 'rgb(255, 200, 220)';
            setTimeout(() => showFloatingTip('云朵甜蜜！', 1200), 900);
            break;
        case 'rose':
            // 玫瑰：双倍得分5秒 + 护盾
            player.hasShield = true;
            particleColor = 'rgb(220, 20, 80)';
            setTimeout(() => showFloatingTip('💐 玫瑰祝福！护盾+100分', 1200), 900);
            break;
    }
    
    // 道具收集时Squash&Stretch弹跳感
    playerSquash = 0.8;
    playerStretch = 1.28;

    // 使用增强收集特效（放大消失+粒子爆炸+光圈扩散）
    if (particleColor) {
        createCollectEffect(item.x, item.y, particleColor);
    }
    
    // 检查道具组合（心+星触发爱的爆发）
    if (item.type === 'heart' || item.type === 'star') {
        checkItemCombination(item.type);
    }
}

function checkCollisions() {
    // 如果处于无敌状态，不进行碰撞检测
    if (player.invulnerable > 0) return;
    
    const level = levels[currentLevel];
    
    level.obstacles.forEach(obstacle => {
        if (checkCollision(player, obstacle)) {
            if (obstacle.type === 'pit') {
                // 掉落陷阱
                lives--;
                // 触发屏幕抖动 + 受伤特效
                shakeScreen();
                triggerHurtEffect(-1);
                
                if (lives <= 0) {
                    gameOver();
                } else {
                    // 重置位置并设置无敌时间（120帧=2秒）
                    player.x = 100;
                    player.y = 400;
                    player.velocityX = 0;
                    player.velocityY = 0;
                    player.invulnerable = 120;
                    player.coyoteTimer = 0;
                    player.jumpBufferTimer = 0;
                    player.jumpCount = 0;
                    // 使用浮动提示，不阻塞游戏
                    showFloatingTip('小心陷阱！', 1000);
                }
            } else {
                // 碰撞敌人
                if (player.hasShield) {
                    player.hasShield = false;
                    // 设置无敌时间（60帧=1秒）
                    player.invulnerable = 60;
                    // 触发屏幕抖动 + 轻微受伤特效
                    shakeScreen(8, 10);
                    triggerHurtEffect(player.x > obstacle.x ? 1 : -1);
                    // 移除护盾提示，玩家能看到护盾消失
                } else {
                    lives--;
                    // 触发屏幕抖动 + 受伤特效
                    shakeScreen();
                    triggerHurtEffect(player.x > obstacle.x ? 1 : -1);
                    
                    if (lives <= 0) {
                        gameOver();
                    } else {
                        // 重置位置并设置无敌时间（120帧=2秒）
                        player.x = 100;
                        player.y = 400;
                        player.velocityX = 0;
                        player.velocityY = 0;
                        player.invulnerable = 120;
                        player.coyoteTimer = 0;
                        player.jumpBufferTimer = 0;
                        player.jumpCount = 0;
                        // 使用浮动提示，不阻塞游戏
                        showFloatingTip('机会 -1', 1000);
                    }
                }
            }
        }
    });
}

function checkCollision(a, b) {
    // 优化碰撞检测：使用缩小后的碰撞盒（比视觉形象小4px），减少卡墙卡地板问题
    const margin = 4;
    return (a.x + margin) < (b.x + b.width) &&
           (a.x + a.width - margin) > b.x &&
           (a.y + margin) < (b.y + b.height) &&
           (a.y + a.height - margin) > b.y;
}

function checkWinCondition() {
    const level = levels[currentLevel];
    
    // girlX 和 player.x 都是世界坐标，直接比较
    if (Math.abs(player.x - level.girlX) < 50 && player.y < 480) {
        // 通关第6关才是最终胜利；目前已实现5关，第6关待第二轮完成
        const maxLevel = Object.keys(levels).length;
        if (currentLevel < maxLevel) {
            nextLevel();
        } else {
            victory();
        }
    }
}

// 标记是否正在过关（防止重复触发）
let levelTransitioning = false;
let pendingLevelTransition = false; // 对话结束后是否执行切关

function nextLevel() {
    if (levelTransitioning) return;
    levelTransitioning = true;
    
    gameState = GameState.DIALOG;
    
    let text, emotion;
    if (currentLevel === 1) {
        text = '第一关顺利通过啦，心爱的人，我离你又近了一步！';
        emotion = '轻声自语';
    } else if (currentLevel === 2) {
        text = '马上就要到花海了，心爱的人，我离你又近了一步！';
        emotion = '语气激动，带着期待';
    } else if (currentLevel === 3) {
        text = '穿越花海，一片深邃的蓝色出现在眼前…心爱的人，你在哪里？';
        emotion = '好奇而激动';
    } else if (currentLevel === 4) {
        text = '深海的秘密守护着我们的回忆，我感受到你的气息越来越近了，心爱的人！';
        emotion = '深情激动';
    } else {
        text = '每一步都离你更近，心爱的人，我马上就到！';
        emotion = '坚定而温柔';
    }

    // 设置标记：对话结束后执行切关
    pendingLevelTransition = true;
    dialogQueue = [{ speaker: '挑战者', text, emotion }];
    nextDialog();
}

// 执行实际切关操作
function doLevelTransition() {
    const overlay = document.getElementById('levelTransitionOverlay');
    
    // 淡入遮罩
    if (overlay) {
        overlay.style.transition = 'opacity 0.4s ease';
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
    }
    
    setTimeout(() => {
        currentLevel++;
        camera.x = 0;
        resetPlayer();
        resetLevel();
        levelTransitioning = false;
        pendingLevelTransition = false;
        document.getElementById('dialogBox').style.display = 'none';
        gameState = GameState.PLAYING;
        
        // 淡出遮罩
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.style.pointerEvents = 'none'; }, 400);
        }
    }, 420); // 稍等遮罩完全不透明后切关
}

function resetPlayer() {
    player.x = 100;
    player.y = 400;
    player.width = 30;
    player.height = 40;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isJumping = false;
    player.hasShield = false;
    player.speedBoost = 0;
    player.jumpBoost = 0;
    player.invulnerable = 0;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
    player.jumpCount = 0;
}

function resetLevel() {
    const level = levels[currentLevel];
    
    level.items.forEach(item => {
        item.collected = false;
    });
}

function resetAllLevels() {
    // 重置所有关卡的道具状态
    for (let levelNum in levels) {
        const level = levels[levelNum];
        level.items.forEach(item => {
            item.collected = false;
        });
    }
}

function updateCamera() {
    const level = levels[currentLevel];
    const levelWidth = level ? level.length : 1600;
    camera.x = Math.max(0, player.x - 400);
    camera.x = Math.min(camera.x, levelWidth - 800); // 不超过关卡末尾
}

function updateUI() {
    document.getElementById('level').textContent = currentLevel;
    document.getElementById('lives').textContent = lives;
    document.getElementById('stars').textContent = starsCollected;
    // 同时更新两处得分元素（兼容旧版 id=score 和新增 id=scoreHud）
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = score;
    const scoreHudEl = document.getElementById('scoreHud');
    if (scoreHudEl) scoreHudEl.textContent = score;
}

// 更新顶部进度条
function updateProgressBar() {
    const level = levels[currentLevel];
    if (!level) return;
    const pct = Math.min(100, Math.max(0, (player.x / level.length) * 100));
    const fill = document.getElementById('progressFill');
    const icon = document.getElementById('progressIcon');
    const pctLabel = document.getElementById('progressPercent');
    if (fill) fill.style.width = pct.toFixed(1) + '%';
    if (icon) icon.style.left = pct.toFixed(1) + '%';
    if (pctLabel) pctLabel.textContent = Math.floor(pct) + '%';
}

function victory() {
    gameState = GameState.VICTORY;
    stopGameLoop(); // 立即停止循环，不继续跑 6 秒
    stopBGM();      // 停止背景音乐
    
    // 保存通关统计到 localStorage
    try {
        localStorage.setItem('maxLevel', '3');
        const prevBest = localStorage.getItem('bestScore');
        if (!prevBest || score > parseInt(prevBest)) {
            localStorage.setItem('bestScore', score);
        }
        // 收集进度（所有关卡道具总数）
        const totalItems = Object.values(levels).reduce((sum, l) => sum + (l.items ? l.items.length : 0), 0);
        const collected = Object.values(levels).reduce((sum, l) => sum + (l.items ? l.items.filter(i => i.collected).length : 0), 0);
        const rate = Math.round(collected / totalItems * 100);
        localStorage.setItem('collectionRate', rate + '%');
    } catch(e) {}

    dialogQueue = [
        { speaker: '挑战者', text: '我终于找到你了，不管路上有多少阻碍，我都想走到你身边，告诉你，我喜欢你。', emotion: '略带羞涩，眼神真诚' },
        { speaker: '心爱的人', text: '我知道，我一直在这里等你，我也喜欢你。', emotion: '温柔微笑，眼神温柔' },
        { speaker: '系统', text: '恭喜你！成功奔赴心意，通关成功！愿每一份坚定的心意，都能抵达想去的地方～', emotion: '温柔女声' }
    ];

    showNextDialog();

    setTimeout(() => {
        document.getElementById('gameOverTitle').textContent = '通关成功！';
        document.getElementById('gameOverMessage').textContent = starsCollected === 5 ?
            '你收集了所有星光碎片，解锁了隐藏剧情！' :
            '你成功找到了心爱的人！';
        const finalScoreEl = document.getElementById('finalScoreDisplay');
        if (finalScoreEl) finalScoreEl.textContent = `最终得分：${score} 分`;
        document.getElementById('gameOverScreen').style.display = 'flex';
    }, 6000);
}

function gameOver() {
    gameState = GameState.GAME_OVER;
    stopGameLoop();
    stopBGM(); // 停止背景音乐
    // 保存最高关卡
    try {
        const prev = parseInt(localStorage.getItem('maxLevel') || '1');
        if (currentLevel > prev) localStorage.setItem('maxLevel', currentLevel);
    } catch(e) {}
    document.getElementById('gameOverTitle').textContent = '挑战失败';
    document.getElementById('gameOverMessage').textContent = '挑战者没能抵达终点...';
    const finalScoreEl = document.getElementById('finalScoreDisplay');
    if (finalScoreEl) finalScoreEl.textContent = `本次得分：${score} 分`;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// ─── 视差背景装饰（持久化随机数据，只初始化一次） ───────────────────
const bgDecorations = {
    level1Clouds: Array.from({ length: 8 }, (_, i) => ({
        x: i * 210 + 60,
        baseY: 55 + Math.floor(Math.random() * 55),
        r1: 22 + Math.floor(Math.random() * 12),
        r2: 30 + Math.floor(Math.random() * 16),
        r3: 20 + Math.floor(Math.random() * 10),
        alpha: 0.55 + Math.floor(Math.random() * 30) / 100
    })),
    level1Flowers: Array.from({ length: 30 }, (_, i) => ({
        x: i * 54 + 18,
        color: ['#FF69B4','#FF1493','#FFD700','#FF6347','#DA70D6','#FF85C8'][i % 6],
        r: 5 + (i % 3)
    })),
    level2Stars: Array.from({ length: 130 }, (_, i) => ({
        x: (i * 12.5) % 1600,
        y: (i * 7.3) % 420,
        r: 0.8 + (i % 4) * 0.5,
        phase: (i * 0.8) % (Math.PI * 2),
        speed: 0.02 + (i % 5) * 0.008
    })),
    level3Flowers: Array.from({ length: 34 }, (_, i) => ({
        x: i * 48 + 12,
        y: 490 + (i % 3) * 4,
        color: ['#FF69B4','#FF1493','#FFA500','#9370DB','#FF6347','#32CD32'][i % 6],
        r: 7 + (i % 4),
        petals: 5 + (i % 2)
    })),
    // 第4关：深海泡泡和海草装饰
    level4Bubbles: Array.from({ length: 60 }, (_, i) => ({
        x: (i * 31.7) % 1800,
        baseY: 50 + (i * 13.3) % 420,
        r: 2 + (i % 5) * 1.2,
        phase: (i * 0.6) % (Math.PI * 2),
        speed: 0.01 + (i % 4) * 0.006
    })),
    level4Seaweed: Array.from({ length: 22 }, (_, i) => ({
        x: i * 85 + 30,
        h: 35 + (i % 4) * 12,
        color: ['#00a86b','#008060','#20c080','#006050'][i % 4],
        sway: (i * 0.7) % (Math.PI * 2)
    })),
    // 第5关：云朵装饰和彩虹装饰
    level5Clouds: Array.from({ length: 14 }, (_, i) => ({
        x: i * 140 + 50,
        baseY: 40 + (i % 5) * 30,
        r1: 20 + (i % 4) * 8,
        r2: 28 + (i % 3) * 10,
        r3: 18 + (i % 4) * 6,
        alpha: 0.6 + (i % 4) * 0.08
    })),
    level5Rainbows: Array.from({ length: 4 }, (_, i) => ({
        x: i * 480 + 200,
        y: 80 + (i % 3) * 40,
        size: 80 + (i % 3) * 40
    }))
};

// 辅助：绘制装饰花朵
function drawDecorFlower(cx, cy, r, color, petals) {
    petals = petals || 5;
    ctx.save();
    ctx.fillStyle = color;
    for (let p = 0; p < petals; p++) {
        const a = (p / petals) * Math.PI * 2;
        const px = cx + Math.cos(a) * r * 0.6;
        const py = cy + Math.sin(a) * r * 0.6;
        ctx.beginPath();
        ctx.ellipse(px, py, r * 0.45, r * 0.28, a, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

// 辅助：贝塞尔标准心形（cx,cy 为心形中心，size 为大小）
function drawHeartShape(cx, cy, size) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + size * 0.3);
    ctx.bezierCurveTo(cx - size * 1.0, cy - size * 0.4, cx - size * 1.8, cy + size * 0.5, cx, cy + size * 1.5);
    ctx.bezierCurveTo(cx + size * 1.8, cy + size * 0.5, cx + size * 1.0, cy - size * 0.4, cx, cy + size * 0.3);
    ctx.closePath();
}

// 渲染游戏
function render() {
    const now = Date.now();
    const level = levels[currentLevel];

    // ── 修复硬编码蓝色：按关卡配置填充底层背景 ──
    if (currentLevel === 2) {
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, '#060620'); bg.addColorStop(1, '#1a0a3d');
        ctx.fillStyle = bg;
    } else if (currentLevel === 3) {
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, '#ffd6e8'); bg.addColorStop(1, '#ffe8d0');
        ctx.fillStyle = bg;
    } else if (currentLevel === 4) {
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, '#001833'); bg.addColorStop(1, '#003366');
        ctx.fillStyle = bg;
    } else if (currentLevel === 5) {
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, '#e8f4ff'); bg.addColorStop(1, '#c8d8f0');
        ctx.fillStyle = bg;
    } else if (currentLevel === 6) {
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, '#1a0010'); bg.addColorStop(1, '#3d0a20');
        ctx.fillStyle = bg;
    } else {
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, '#87CEEB'); bg.addColorStop(1, '#b8eecc');
        ctx.fillStyle = bg;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === GameState.PLAYING || gameState === GameState.DIALOG) {
        ctx.save();
        
        // 应用屏幕抖动效果
        if (screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * screenShake;
            const shakeY = (Math.random() - 0.5) * screenShake;
            ctx.translate(shakeX, shakeY);
        }
        
        ctx.translate(-camera.x, 0);
        
        // ════════ 1. 背景渐变 ════════
        const bgGradient = ctx.createLinearGradient(0, 0, 0, 500);
        if (currentLevel === 1) {
            bgGradient.addColorStop(0, '#87CEEB');
            bgGradient.addColorStop(0.65, '#b5e8f5');
            bgGradient.addColorStop(1, '#c8f5c8');
        } else if (currentLevel === 2) {
            bgGradient.addColorStop(0, '#060620');
            bgGradient.addColorStop(0.5, '#121245');
            bgGradient.addColorStop(1, '#2d1b6e');
        } else if (currentLevel === 3) {
            bgGradient.addColorStop(0, '#ffd6e8');
            bgGradient.addColorStop(0.6, '#ffbcd4');
            bgGradient.addColorStop(1, '#ffcfa8');
        } else if (currentLevel === 4) {
            bgGradient.addColorStop(0, '#001020');
            bgGradient.addColorStop(0.4, '#002244');
            bgGradient.addColorStop(0.8, '#003366');
            bgGradient.addColorStop(1, '#004488');
        } else if (currentLevel === 5) {
            bgGradient.addColorStop(0, '#c8e8ff');
            bgGradient.addColorStop(0.4, '#dff0ff');
            bgGradient.addColorStop(0.8, '#f0f8ff');
            bgGradient.addColorStop(1, '#fff8f0');
        } else if (currentLevel === 6) {
            bgGradient.addColorStop(0, '#1a0010');
            bgGradient.addColorStop(0.3, '#3d0a20');
            bgGradient.addColorStop(0.7, '#6b1a3a');
            bgGradient.addColorStop(1, '#8b2050');
        } else {
            bgGradient.addColorStop(0, '#87CEEB');
            bgGradient.addColorStop(0.65, '#b5e8f5');
            bgGradient.addColorStop(1, '#c8f5c8');
        }
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, level.length, 500);

        // ════════ 2. 视差装饰层 ════════
        if (currentLevel === 1) {
            // 远景云朵（视差 * 0.3，慢速）
            ctx.save();
            ctx.translate(camera.x * 0.3, 0);
            bgDecorations.level1Clouds.forEach(c => {
                ctx.save();
                ctx.globalAlpha = c.alpha;
                ctx.fillStyle = 'rgba(255,255,255,0.88)';
                ctx.shadowBlur = 18; ctx.shadowColor = '#fff';
                ctx.beginPath();
                ctx.arc(c.x, c.baseY, c.r1, 0, Math.PI * 2);
                ctx.arc(c.x + c.r1 * 1.1, c.baseY - 8, c.r2, 0, Math.PI * 2);
                ctx.arc(c.x + c.r1 * 2.2, c.baseY, c.r3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.restore();
            });
            ctx.restore();
            // 地面小花（近景，视差 0.15）
            ctx.save();
            ctx.translate(camera.x * 0.15, 0);
            bgDecorations.level1Flowers.forEach(f => {
                ctx.save(); ctx.globalAlpha = 0.75;
                drawDecorFlower(f.x, 496, f.r, f.color, 5);
                ctx.restore();
            });
            ctx.restore();
        }

        if (currentLevel === 2) {
            // 闪烁星空（视差 * 0.1）
            ctx.save();
            ctx.translate(camera.x * 0.1, 0);
            bgDecorations.level2Stars.forEach(s => {
                const flicker = 0.35 + 0.65 * Math.abs(Math.sin(now * s.speed + s.phase));
                ctx.globalAlpha = flicker;
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = s.r * 3.5; ctx.shadowColor = '#aad4ff';
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
            });
            ctx.shadowBlur = 0; ctx.globalAlpha = 1;
            // 星云条带
            const nebula = ctx.createLinearGradient(200, 0, 1400, 400);
            nebula.addColorStop(0, 'rgba(80,0,120,0)');
            nebula.addColorStop(0.3, 'rgba(80,20,160,0.11)');
            nebula.addColorStop(0.7, 'rgba(30,80,200,0.09)');
            nebula.addColorStop(1, 'rgba(80,0,120,0)');
            ctx.fillStyle = nebula;
            ctx.fillRect(0, 0, level.length, 400);
            ctx.restore();
        }

        if (currentLevel === 3) {
            // 彩色花朵地面装饰（视差 0.12）
            ctx.save();
            ctx.translate(camera.x * 0.12, 0);
            bgDecorations.level3Flowers.forEach(f => {
                ctx.save(); ctx.globalAlpha = 0.82;
                drawDecorFlower(f.x, f.y, f.r, f.color, f.petals);
                ctx.restore();
            });
            ctx.restore();
        }

        if (currentLevel === 4) {
            // 深海泡泡（浮动效果，视差0.08）
            ctx.save();
            ctx.translate(camera.x * 0.08, 0);
            bgDecorations.level4Bubbles.forEach(b => {
                const floatY = b.baseY + Math.sin(now * b.speed + b.phase) * 15;
                const alpha = 0.2 + 0.25 * Math.abs(Math.sin(now * 0.001 + b.phase));
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = 'rgba(100,200,255,0.8)';
                ctx.lineWidth = 1;
                ctx.shadowBlur = 6; ctx.shadowColor = '#00ccff';
                ctx.beginPath(); ctx.arc(b.x, floatY, b.r, 0, Math.PI * 2); ctx.stroke();
                // 小高光
                ctx.globalAlpha = alpha * 0.6;
                ctx.fillStyle = 'rgba(200,240,255,0.5)';
                ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, floatY - b.r * 0.3, b.r * 0.28, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            });
            ctx.shadowBlur = 0;
            ctx.restore();
            // 海草装饰（近景，视差0.15）
            ctx.save();
            ctx.translate(camera.x * 0.15, 0);
            bgDecorations.level4Seaweed.forEach((sw, i) => {
                const sway = Math.sin(now * 0.001 + sw.sway) * 8;
                ctx.save();
                ctx.globalAlpha = 0.7;
                ctx.strokeStyle = sw.color;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.shadowBlur = 4; ctx.shadowColor = sw.color;
                ctx.beginPath();
                ctx.moveTo(sw.x, 500);
                ctx.quadraticCurveTo(sw.x + sway, 500 - sw.h * 0.6, sw.x + sway * 0.5, 500 - sw.h);
                ctx.stroke();
                ctx.restore();
            });
            ctx.restore();
        }

        if (currentLevel === 5) {
            // 云朵装饰（视差 0.2）
            ctx.save();
            ctx.translate(camera.x * 0.2, 0);
            bgDecorations.level5Clouds.forEach(c => {
                ctx.save();
                ctx.globalAlpha = c.alpha;
                ctx.fillStyle = 'rgba(255,255,255,0.92)';
                ctx.shadowBlur = 22; ctx.shadowColor = 'rgba(200,220,255,0.8)';
                ctx.beginPath();
                ctx.arc(c.x, c.baseY, c.r1, 0, Math.PI * 2);
                ctx.arc(c.x + c.r1 * 1.1, c.baseY - 10, c.r2, 0, Math.PI * 2);
                ctx.arc(c.x + c.r1 * 2.2, c.baseY, c.r3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.restore();
            });
            ctx.restore();
            // 彩虹装饰（远景，视差0.05）
            ctx.save();
            ctx.translate(camera.x * 0.05, 0);
            bgDecorations.level5Rainbows.forEach(rb => {
                const colors = ['rgba(255,0,0,0.15)','rgba(255,127,0,0.15)','rgba(255,255,0,0.15)','rgba(0,200,0,0.12)','rgba(0,0,255,0.12)','rgba(139,0,255,0.1)'];
                for (let ci = 0; ci < colors.length; ci++) {
                    ctx.save();
                    ctx.strokeStyle = colors[ci];
                    ctx.lineWidth = 8;
                    ctx.globalAlpha = 0.6;
                    ctx.beginPath();
                    ctx.arc(rb.x, rb.y, rb.size - ci * 8, Math.PI, 0, false);
                    ctx.stroke();
                    ctx.restore();
                }
            });
            ctx.restore();
        }

        // ════════ 3. 地面 ════════
        const groundGrad = ctx.createLinearGradient(0, 500, 0, 600);
        if (currentLevel === 1) {
            groundGrad.addColorStop(0, '#6dce6d'); groundGrad.addColorStop(1, '#3a9e3a');
        } else if (currentLevel === 2) {
            groundGrad.addColorStop(0, '#2a1a6e'); groundGrad.addColorStop(1, '#180d45');
        } else if (currentLevel === 3) {
            groundGrad.addColorStop(0, '#e87050'); groundGrad.addColorStop(1, '#c04020');
        } else if (currentLevel === 4) {
            groundGrad.addColorStop(0, '#004488'); groundGrad.addColorStop(1, '#002244');
        } else if (currentLevel === 5) {
            groundGrad.addColorStop(0, '#a0c0e8'); groundGrad.addColorStop(1, '#7090b8');
        } else if (currentLevel === 6) {
            groundGrad.addColorStop(0, '#8b2050'); groundGrad.addColorStop(1, '#5a0a2a');
        } else {
            groundGrad.addColorStop(0, '#6dce6d'); groundGrad.addColorStop(1, '#3a9e3a');
        }
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 500, level.length, 100);

        // 地面纹理
        if (currentLevel === 1) {
            ctx.strokeStyle = 'rgba(40,160,40,0.38)'; ctx.lineWidth = 1.5;
            for (let gi = 0; gi < level.length; gi += 16) {
                ctx.beginPath(); ctx.moveTo(gi, 500); ctx.lineTo(gi + 5, 492);
                ctx.lineTo(gi + 10, 498); ctx.lineTo(gi + 16, 492); ctx.stroke();
            }
        }
        if (currentLevel === 3) {
            ctx.strokeStyle = 'rgba(255,120,80,0.38)'; ctx.lineWidth = 1;
            for (let gi = 0; gi < level.length; gi += 18) {
                ctx.beginPath(); ctx.moveTo(gi, 500); ctx.lineTo(gi + 4, 494);
                ctx.lineTo(gi + 9, 500); ctx.stroke();
            }
        }
        if (currentLevel === 4) {
            // 深海底部沙纹
            ctx.strokeStyle = 'rgba(0,100,200,0.3)'; ctx.lineWidth = 1;
            for (let gi = 0; gi < level.length; gi += 20) {
                ctx.beginPath(); ctx.moveTo(gi, 505); ctx.quadraticCurveTo(gi + 10, 500, gi + 20, 505); ctx.stroke();
            }
        }
        if (currentLevel === 5) {
            // 云海地面涟漪
            ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5;
            for (let gi = 0; gi < level.length; gi += 24) {
                ctx.beginPath(); ctx.moveTo(gi, 502); ctx.quadraticCurveTo(gi + 12, 496, gi + 24, 502); ctx.stroke();
            }
        }
        
        // 只渲染屏幕内的障碍（性能优化）
        const screenLeft = camera.x - 60;
        const screenRight = camera.x + canvas.width + 60;

        // ════════ 4. 障碍物（视觉大升级） ════════
        level.obstacles.forEach(obstacle => {
            if (obstacle.x + obstacle.width < screenLeft || obstacle.x > screenRight) return;
            const ocx = obstacle.x + obstacle.width / 2;
            const ocy = obstacle.y + obstacle.height / 2;

            if (obstacle.type === 'ball') {
                // 心形飞弹
                ctx.save();
                const pulse = 1 + 0.08 * Math.sin(now * 0.005 + obstacle.x * 0.01);
                ctx.translate(ocx, ocy);
                ctx.scale(pulse, pulse);
                ctx.shadowBlur = 15; ctx.shadowColor = '#ff4499';
                // 外光晕
                const rg = ctx.createRadialGradient(0, 0, 2, 0, 0, obstacle.width / 2 + 5);
                rg.addColorStop(0, 'rgba(255,120,180,0.35)');
                rg.addColorStop(1, 'rgba(255,40,110,0)');
                ctx.fillStyle = rg;
                ctx.beginPath(); ctx.arc(0, 0, obstacle.width / 2 + 7, 0, Math.PI * 2); ctx.fill();
                // 心形
                const hs = obstacle.width / 2 / 1.8;
                drawHeartShape(0, -hs * 0.3, hs);
                const hg = ctx.createRadialGradient(-hs * 0.3, -hs * 0.3, 1, 0, 0, hs * 2);
                hg.addColorStop(0, '#ff88bb'); hg.addColorStop(1, '#cc0044');
                ctx.fillStyle = hg;
                ctx.fill();
                // 高光
                ctx.fillStyle = 'rgba(255,200,220,0.5)';
                ctx.beginPath(); ctx.ellipse(-hs * 0.4, -hs * 0.5, hs * 0.35, hs * 0.2, -0.5, 0, Math.PI * 2); ctx.fill();
                ctx.restore();

            } else if (obstacle.type === 'cloud') {
                // 发光障碍云块
                ctx.save();
                ctx.shadowBlur = 22;
                ctx.shadowColor = currentLevel === 3 ? 'rgba(255,160,190,0.8)' : 'rgba(160,200,255,0.8)';
                ctx.fillStyle = currentLevel === 3 ? 'rgba(255,215,230,0.92)' : 'rgba(225,238,255,0.92)';
                ctx.beginPath();
                ctx.arc(obstacle.x + 10, obstacle.y + 16, 14, 0, Math.PI * 2);
                ctx.arc(obstacle.x + 26, obstacle.y + 11, 20, 0, Math.PI * 2);
                ctx.arc(obstacle.x + 43, obstacle.y + 16, 15, 0, Math.PI * 2);
                ctx.arc(obstacle.x + 26, obstacle.y + 22, 18, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(60,40,10,0.55)';
                ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center';
                ctx.fillText('⚡', obstacle.x + 27, obstacle.y + 21);
                ctx.restore();

            } else if (obstacle.type === 'thorn') {
                // 玫瑰刺风格
                ctx.save();
                const stemG = ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x + obstacle.width, obstacle.y);
                stemG.addColorStop(0, '#4a1a00'); stemG.addColorStop(0.5, '#7a2a00'); stemG.addColorStop(1, '#4a1a00');
                ctx.fillStyle = stemG;
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                for (let ti = 0; ti < 4; ti++) {
                    const tx = obstacle.x + ti * (obstacle.width / 3.6) + 5;
                    ctx.fillStyle = ti % 2 === 0 ? '#1a6620' : '#228B22';
                    ctx.shadowBlur = 4; ctx.shadowColor = '#00ff00';
                    ctx.beginPath();
                    ctx.moveTo(tx, obstacle.y); ctx.lineTo(tx - 7, obstacle.y - 14); ctx.lineTo(tx + 7, obstacle.y - 14);
                    ctx.closePath(); ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = '#cc3300';
                    ctx.beginPath();
                    ctx.moveTo(tx + 10, obstacle.y + 10); ctx.lineTo(tx + 18, obstacle.y + 4); ctx.lineTo(tx + 10, obstacle.y + 18);
                    ctx.closePath(); ctx.fill();
                }
                // 花苞
                ctx.shadowBlur = 6; ctx.shadowColor = '#ff88aa';
                ctx.fillStyle = '#cc2244';
                ctx.beginPath(); ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y - 4, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ff6688';
                ctx.beginPath(); ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y - 5, 3, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
                ctx.restore();

            } else if (obstacle.type === 'pit') {
                // 深渊陷阱
                ctx.save();
                const pitG = ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x, obstacle.y + obstacle.height);
                pitG.addColorStop(0, '#1a1a2e'); pitG.addColorStop(1, '#000008');
                ctx.fillStyle = pitG;
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                ctx.strokeStyle = 'rgba(80,40,150,0.55)'; ctx.lineWidth = 2;
                ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                ctx.fillStyle = 'rgba(60,0,120,0.12)';
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, 20);
                ctx.restore();

            } else if (obstacle.type === 'jellyfish') {
                // 水母：半透明紫蓝色，上下浮动（在updateObstacles已处理y）
                ctx.save();
                ctx.shadowBlur = 18; ctx.shadowColor = '#aa66ff';
                const jg = ctx.createRadialGradient(ocx, ocy, 2, ocx, ocy, obstacle.width / 2);
                jg.addColorStop(0, 'rgba(200,120,255,0.9)');
                jg.addColorStop(0.6, 'rgba(120,60,220,0.7)');
                jg.addColorStop(1, 'rgba(60,0,160,0.2)');
                ctx.fillStyle = jg;
                ctx.beginPath(); ctx.arc(ocx, ocy, obstacle.width / 2, Math.PI, 0); ctx.closePath(); ctx.fill();
                // 触手
                ctx.strokeStyle = 'rgba(180,100,255,0.5)'; ctx.lineWidth = 1.5;
                for (let ji = -2; ji <= 2; ji++) {
                    const jox = ocx + ji * 7;
                    ctx.beginPath(); ctx.moveTo(jox, ocy);
                    ctx.quadraticCurveTo(jox + Math.sin(now * 0.003 + ji) * 6, ocy + 12, jox, ocy + 20);
                    ctx.stroke();
                }
                ctx.restore();

            } else if (obstacle.type === 'coral') {
                // 珊瑚刺：橙红色尖刺群
                ctx.save();
                ctx.shadowBlur = 8; ctx.shadowColor = '#ff6600';
                const coralG = ctx.createLinearGradient(obstacle.x, obstacle.y + obstacle.height, obstacle.x, obstacle.y);
                coralG.addColorStop(0, '#cc3300'); coralG.addColorStop(1, '#ff6622');
                ctx.fillStyle = coralG;
                const cw = obstacle.width / 5;
                for (let ci = 0; ci < 5; ci++) {
                    const cx2 = obstacle.x + ci * cw + cw / 2;
                    const ch = obstacle.height * (0.6 + (ci % 2) * 0.3);
                    ctx.beginPath();
                    ctx.moveTo(cx2 - cw * 0.4, obstacle.y + obstacle.height);
                    ctx.lineTo(cx2, obstacle.y + obstacle.height - ch);
                    ctx.lineTo(cx2 + cw * 0.4, obstacle.y + obstacle.height);
                    ctx.closePath(); ctx.fill();
                }
                ctx.restore();

            } else if (obstacle.type === 'bird') {
                // 飞鸟：简单M形翅膀
                ctx.save();
                ctx.shadowBlur = 6; ctx.shadowColor = '#334455';
                ctx.strokeStyle = '#223344'; ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(obstacle.x, ocy);
                ctx.quadraticCurveTo(ocx - 8, ocy - 10, ocx, ocy);
                ctx.quadraticCurveTo(ocx + 8, ocy - 10, obstacle.x + obstacle.width, ocy);
                ctx.stroke();
                ctx.fillStyle = '#334455';
                ctx.beginPath(); ctx.arc(ocx, ocy + 3, 4, 0, Math.PI * 2); ctx.fill();
                ctx.restore();

            } else if (obstacle.type === 'whirlwind') {
                // 旋风：旋转螺旋
                ctx.save();
                ctx.translate(ocx, ocy);
                ctx.rotate(obstacle.angle || 0);
                ctx.shadowBlur = 12; ctx.shadowColor = '#88ccff';
                for (let wi = 0; wi < 3; wi++) {
                    ctx.rotate((2 * Math.PI) / 3);
                    ctx.strokeStyle = `rgba(${100 + wi * 50},${180 + wi * 20},255,${0.7 - wi * 0.15})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, obstacle.width / 2 - wi * 5, 0, Math.PI * 1.5);
                    ctx.stroke();
                }
                ctx.restore();

            } else if (obstacle.type === 'heartGuard') {
                // 第6关爱心守卫：跳动的金色心形障碍
                ctx.save();
                const hgPulse = 1 + 0.12 * Math.sin(now * 0.006 + obstacle.x * 0.01);
                ctx.translate(ocx, ocy);
                ctx.scale(hgPulse, hgPulse);
                ctx.shadowBlur = 22; ctx.shadowColor = '#ffaa00';
                const hgGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, obstacle.width / 2);
                hgGrad.addColorStop(0, '#ffe066'); hgGrad.addColorStop(0.5, '#ff8800'); hgGrad.addColorStop(1, '#cc4400');
                ctx.fillStyle = hgGrad;
                const hgs = obstacle.width / 2 / 1.8;
                drawHeartShape(0, -hgs * 0.3, hgs);
                ctx.fill();
                // 金色光圈
                ctx.strokeStyle = 'rgba(255,220,0,0.5)'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(0, 0, obstacle.width / 2 + 6, 0, Math.PI * 2); ctx.stroke();
                ctx.restore();
            }
        });
        
        // ════════ 5. 道具（精致绘制） ════════
        ctx.shadowBlur = 0;
        level.items.forEach(item => {
            if (item.collected) return;
            if (item.x < screenLeft || item.x > screenRight) return;

            const bob = Math.sin(now * 0.003 + item.x * 0.01) * 4;
            const ix = item.x, iy = item.y + bob;
            ctx.save();

            if (item.type === 'heart') {
                ctx.shadowBlur = 16; ctx.shadowColor = '#ff2266';
                const pulse = 1 + 0.1 * Math.sin(now * 0.004);
                ctx.scale(pulse, pulse);
                const hx = ix / pulse, hy = iy / pulse;
                const hgrad = ctx.createRadialGradient(hx, hy, 1, hx, hy, 12);
                hgrad.addColorStop(0, '#ff88bb'); hgrad.addColorStop(1, '#cc0044');
                ctx.fillStyle = hgrad;
                drawHeartShape(hx, hy - 2, 7);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,200,220,0.6)';
                ctx.beginPath(); ctx.ellipse(hx - 3, hy - 5, 3, 2, -0.5, 0, Math.PI * 2); ctx.fill();

            } else if (item.type === 'mushroom') {
                ctx.shadowBlur = 10; ctx.shadowColor = '#ff6600';
                ctx.fillStyle = '#f0d0a0';
                ctx.beginPath(); ctx.roundRect(ix - 5, iy + 5, 10, 12, 2); ctx.fill();
                const mgrad = ctx.createRadialGradient(ix - 2, iy - 3, 1, ix, iy, 13);
                mgrad.addColorStop(0, '#ff7722'); mgrad.addColorStop(1, '#cc2200');
                ctx.fillStyle = mgrad;
                ctx.beginPath(); ctx.arc(ix, iy, 12, Math.PI, 0, false); ctx.closePath(); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.88)';
                [[ix - 4, iy - 3, 2.5], [ix + 3, iy - 5, 2], [ix, iy - 8, 1.8]].forEach(([wx, wy, wr]) => {
                    ctx.beginPath(); ctx.arc(wx, wy, wr, 0, Math.PI * 2); ctx.fill();
                });

            } else if (item.type === 'candy') {
                ctx.shadowBlur = 14; ctx.shadowColor = '#ffcc00';
                const cgrad = ctx.createRadialGradient(ix - 3, iy - 3, 1, ix, iy, 11);
                cgrad.addColorStop(0, '#ffe066'); cgrad.addColorStop(0.5, '#ff9900'); cgrad.addColorStop(1, '#cc6600');
                ctx.fillStyle = cgrad;
                ctx.beginPath(); ctx.arc(ix, iy, 11, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5;
                for (let cs = 0; cs < 3; cs++) {
                    ctx.beginPath();
                    ctx.arc(ix, iy, 3.5 + cs * 2.5, -Math.PI / 2 + now * 0.001, Math.PI / 2 + now * 0.001);
                    ctx.stroke();
                }
                ctx.strokeStyle = '#cc4400'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(ix - 10, iy - 5); ctx.lineTo(ix - 14, iy - 9); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(ix + 10, iy - 5); ctx.lineTo(ix + 14, iy - 9); ctx.stroke();

            } else if (item.type === 'star') {
                ctx.translate(ix, iy);
                ctx.rotate(now * 0.0022);
                ctx.shadowBlur = 20; ctx.shadowColor = '#ffe000';
                const sgrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 10);
                sgrad.addColorStop(0, '#fff7a0'); sgrad.addColorStop(1, '#ffd700');
                ctx.fillStyle = sgrad;
                ctx.beginPath();
                for (let sk = 0; sk < 5; sk++) {
                    const oa = (sk * 2 * Math.PI / 5) - Math.PI / 2;
                    const ia = oa + Math.PI / 5;
                    if (sk === 0) ctx.moveTo(Math.cos(oa) * 10, Math.sin(oa) * 10);
                    else ctx.lineTo(Math.cos(oa) * 10, Math.sin(oa) * 10);
                    ctx.lineTo(Math.cos(ia) * 4.5, Math.sin(ia) * 4.5);
                }
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,200,0.6)';
                ctx.beginPath(); ctx.arc(0, -2, 3, 0, Math.PI * 2); ctx.fill();

            } else if (item.type === 'starfish') {
                // 海星：橙色五角星形
                ctx.shadowBlur = 14; ctx.shadowColor = '#ff8800';
                ctx.translate(ix, iy);
                ctx.rotate(now * 0.001);
                const sfGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 11);
                sfGrad.addColorStop(0, '#ffcc44'); sfGrad.addColorStop(1, '#ff6600');
                ctx.fillStyle = sfGrad;
                ctx.beginPath();
                for (let sk = 0; sk < 5; sk++) {
                    const oa = (sk * 2 * Math.PI / 5) - Math.PI / 2;
                    const ia = oa + Math.PI / 5;
                    if (sk === 0) ctx.moveTo(Math.cos(oa) * 11, Math.sin(oa) * 11);
                    else ctx.lineTo(Math.cos(oa) * 11, Math.sin(oa) * 11);
                    ctx.lineTo(Math.cos(ia) * 5, Math.sin(ia) * 5);
                }
                ctx.closePath(); ctx.fill();

            } else if (item.type === 'pearl') {
                // 珍珠：白色渐变圆+彩虹光泽
                ctx.shadowBlur = 16; ctx.shadowColor = '#ccccff';
                const pGrad = ctx.createRadialGradient(ix - 3, iy - 4, 1, ix, iy, 10);
                pGrad.addColorStop(0, '#ffffff'); pGrad.addColorStop(0.5, '#dde8ff'); pGrad.addColorStop(1, '#aabbee');
                ctx.fillStyle = pGrad;
                ctx.beginPath(); ctx.arc(ix, iy, 10, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.beginPath(); ctx.ellipse(ix - 3, iy - 4, 3, 2, -0.5, 0, Math.PI * 2); ctx.fill();

            } else if (item.type === 'rainbow') {
                // 彩虹碎片：七彩弧
                ctx.shadowBlur = 12; ctx.shadowColor = '#aa88ff';
                const rColors = ['#ff4444','#ff8800','#ffee00','#44dd44','#4488ff','#8844ff','#ff44ff'];
                rColors.forEach((rc, ri) => {
                    ctx.strokeStyle = rc; ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.arc(ix, iy + 4, 5 + ri * 1.8, Math.PI, 0);
                    ctx.stroke();
                });

            } else if (item.type === 'cloudcandy') {
                // 云朵糖：粉色云形
                ctx.shadowBlur = 10; ctx.shadowColor = '#ffaad4';
                ctx.fillStyle = '#ffe8f4';
                ctx.beginPath();
                ctx.arc(ix, iy + 2, 7, 0, Math.PI * 2);
                ctx.arc(ix - 8, iy + 4, 5, 0, Math.PI * 2);
                ctx.arc(ix + 8, iy + 4, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff88cc';
                ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
                ctx.fillText('♥', ix, iy + 6);

            } else if (item.type === 'rose') {
                // 玫瑰：红色花朵
                ctx.shadowBlur = 18; ctx.shadowColor = '#cc0033';
                // 花茎
                ctx.strokeStyle = '#228B22'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(ix, iy + 8); ctx.lineTo(ix, iy + 18); ctx.stroke();
                // 花瓣（5片）
                const roseGrad = ctx.createRadialGradient(ix, iy, 1, ix, iy, 9);
                roseGrad.addColorStop(0, '#ff8899'); roseGrad.addColorStop(1, '#cc0033');
                ctx.fillStyle = roseGrad;
                for (let ri = 0; ri < 5; ri++) {
                    const ra = (ri / 5) * Math.PI * 2 + now * 0.001;
                    ctx.beginPath();
                    ctx.ellipse(ix + Math.cos(ra) * 5, iy + Math.sin(ra) * 5, 5, 3, ra, 0, Math.PI * 2);
                    ctx.fill();
                }
                // 花心
                ctx.fillStyle = '#ffeeaa';
                ctx.beginPath(); ctx.arc(ix, iy, 3, 0, Math.PI * 2); ctx.fill();
            }

            ctx.restore();
        });
        
        // 渲染粒子特效
        renderParticles();
        

        // 清除阴影效果
        ctx.shadowBlur = 0;

        // ════════ 6. 心爱的人（爱心光晕 + 浮动等待动画） ════════
        const girlBob = Math.sin(now * 0.002) * 3;
        const gx = level.girlX, gy = 408 + girlBob;

        // 爱心光晕（脉冲）
        const heartPulse = 0.35 + 0.28 * Math.abs(Math.sin(now * 0.002));
        ctx.save();
        ctx.globalAlpha = heartPulse;
        ctx.shadowBlur = 30; ctx.shadowColor = '#ff4488';
        ctx.fillStyle = 'rgba(255,100,160,0.18)';
        ctx.beginPath(); ctx.arc(gx, gy + 25, 33, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // 飘动小爱心
        for (let hi = 0; hi < 3; hi++) {
            const ha = now * 0.001 + hi * 2.1;
            const hx2 = gx + Math.sin(ha) * 22, hy2 = gy - 12 + Math.cos(ha * 0.7) * 12 - hi * 8;
            ctx.save();
            ctx.globalAlpha = 0.45 + 0.3 * Math.abs(Math.sin(ha));
            ctx.shadowBlur = 7; ctx.shadowColor = '#ff88cc';
            ctx.fillStyle = '#ff4488';
            drawHeartShape(hx2, hy2, 3);
            ctx.fill();
            ctx.restore();
        }

        // 头发
        ctx.fillStyle = '#2C1810';
        ctx.beginPath(); ctx.arc(gx, gy, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(gx - 6, gy, 12, 28);
        // 头纱
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.moveTo(gx - 15, gy - 3); ctx.lineTo(gx + 15, gy - 3);
        ctx.lineTo(gx + 22, gy + 35); ctx.lineTo(gx - 22, gy + 35);
        ctx.closePath(); ctx.fill();
        // 头部
        ctx.fillStyle = '#FDBCB4';
        ctx.beginPath(); ctx.arc(gx, gy + 12, 9, 0, Math.PI * 2); ctx.fill();
        // 眼睛
        ctx.fillStyle = '#2C1810';
        ctx.beginPath(); ctx.arc(gx - 3, gy + 10, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(gx + 3, gy + 10, 1.5, 0, Math.PI * 2); ctx.fill();
        // 微笑
        ctx.strokeStyle = '#c06050'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(gx, gy + 14, 2.5, 0.1, Math.PI - 0.1); ctx.stroke();
        // 婚纱
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(gx - 10, gy + 22); ctx.lineTo(gx + 10, gy + 22);
        ctx.lineTo(gx + 20, gy + 57); ctx.lineTo(gx - 20, gy + 57);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(gx - 8, gy + 27, 16, 2);
        ctx.fillRect(gx - 12, gy + 37, 24, 2);
        // 手臂
        ctx.fillStyle = '#FDBCB4';
        ctx.fillRect(gx - 16, gy + 28, 4, 15);
        ctx.fillRect(gx + 12, gy + 28, 4, 15);
        // 捧花
        ctx.shadowBlur = 8; ctx.shadowColor = '#ffaacc';
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(gx + 16, gy + 34, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFE4E1';
        ctx.beginPath(); ctx.arc(gx + 16, gy + 33, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#228B22'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(gx + 16, gy + 40); ctx.lineTo(gx + 16, gy + 50); ctx.stroke();
        ctx.shadowBlur = 0;

        // ════════ 7. 主角挑战者（行走动画 + 跳跃/下蹲 + 精致细节） ════════
        if (player.invulnerable > 0 && Math.floor(player.invulnerable / 5) % 2 === 0) {
            ctx.globalAlpha = 0.45;
        }

        const pw2 = player.width / 2;
        // 应用奔跑bob偏移
        const pyBase = player.y + playerBobOffset;
        const px = player.x + pw2;
        const walkCycle = Math.floor(now / 120) % 2;
        const isMoving = keys && (keys['ArrowLeft'] || keys['ArrowRight']);
        const isJumpingNow = player.isJumping;
        const isCrouchNow = isCrouching;

        // 渲染尘土粒子（在角色下方，不受squash影响）
        renderDustParticles();

        // 保存变换起点，应用Squash & Stretch
        ctx.save();
        ctx.translate(px, pyBase + player.height / 2);
        ctx.scale(playerStretch, playerSquash);
        ctx.translate(-px, -(pyBase + player.height / 2));
        const py = pyBase; // 以下用 py 代替 player.y

        // 腿部动画
        ctx.fillStyle = '#1a1a2e';
        if (isCrouchNow) {
            ctx.fillRect(player.x + 5, py + 28, 8, 8);
            ctx.fillRect(player.x + 17, py + 28, 8, 8);
        } else if (isJumpingNow) {
            ctx.fillRect(player.x + 4, py + 30, 9, 9);
            ctx.fillRect(player.x + 17, py + 30, 9, 9);
        } else if (isMoving) {
            if (walkCycle === 0) {
                ctx.fillRect(player.x + 7, py + 33, 8, 14);
                ctx.fillRect(player.x + 15, py + 30, 8, 10);
            } else {
                ctx.fillRect(player.x + 7, py + 30, 8, 10);
                ctx.fillRect(player.x + 15, py + 33, 8, 14);
            }
        } else {
            ctx.fillRect(player.x + 7, py + 33, 8, 12);
            ctx.fillRect(player.x + 15, py + 33, 8, 12);
        }

        // 上衣
        ctx.fillStyle = '#1a1a2e';
        if (isCrouchNow) {
            ctx.fillRect(player.x + 2, py + 10, 26, 20);
        } else {
            ctx.fillRect(player.x + 4, py + 15, 22, 18);
        }
        // 金色装饰条纹
        ctx.fillStyle = '#FFD700';
        if (!isCrouchNow) {
            ctx.fillRect(player.x + 4, py + 18, 22, 2);
            ctx.fillRect(player.x + 4, py + 28, 22, 2);
            ctx.fillRect(player.x + 14, py + 16, 2, 16);
        } else {
            ctx.fillRect(player.x + 2, py + 14, 26, 2);
        }

        // 手臂
        ctx.fillStyle = '#FDBCB4';
        if (isJumpingNow) {
            ctx.fillRect(player.x, py + 14, 4, 8);
            ctx.fillRect(player.x + 26, py + 14, 4, 8);
        } else if (isCrouchNow) {
            ctx.fillRect(player.x, py + 16, 4, 12);
            ctx.fillRect(player.x + 26, py + 16, 4, 12);
        } else {
            ctx.fillRect(player.x + 2, py + 20, 4, 10);
            ctx.fillRect(player.x + 24, py + 20, 4, 10);
        }

        // 帽子
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(px, py - 3, 12, Math.PI, 0, true);
        ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(px - 8, py - 5, 16, 3);
        ctx.fillStyle = '#ffe066';
        ctx.beginPath(); ctx.arc(px, py - 6, 2, 0, Math.PI * 2); ctx.fill();

        // 头部
        ctx.fillStyle = '#FDBCB4';
        ctx.beginPath(); ctx.arc(px, py + 8, 8, 0, Math.PI * 2); ctx.fill();

        // 精致眼睛
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(px - 3.5, py + 6, 2.5, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(px + 3.5, py + 6, 2.5, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2C1810';
        ctx.beginPath(); ctx.arc(px - 3, py + 6.5, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 4, py + 6.5, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath(); ctx.arc(px - 2.5, py + 5.8, 0.7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 4.5, py + 5.8, 0.7, 0, Math.PI * 2); ctx.fill();

        // 嘴
        ctx.strokeStyle = '#c06050'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(px, py + 11, 3, 0.1, Math.PI - 0.1); ctx.stroke();

        // ── 护盾（脉冲旋转光圈） ──
        if (player.hasShield) {
            const shieldPulse = 22 + 4 * Math.sin(now * 0.006);
            const shieldRot = now * 0.003;
            ctx.save();
            ctx.strokeStyle = `rgba(255,150,200,${0.5 + 0.3 * Math.sin(now * 0.005)})`;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 20; ctx.shadowColor = '#ff88cc';
            ctx.translate(px, py + player.height / 2);
            ctx.rotate(shieldRot);
            ctx.beginPath(); ctx.arc(0, 0, shieldPulse, 0, Math.PI * 1.5); ctx.stroke();
            ctx.rotate(-shieldRot * 2.5);
            ctx.strokeStyle = `rgba(255,200,230,${0.28 + 0.18 * Math.sin(now * 0.007)})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(0, 0, shieldPulse - 5, 0, Math.PI * 2); ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // 速度提升效果
        if (player.speedBoost > 0) {
            ctx.save();
            ctx.strokeStyle = `rgba(100,200,255,${0.4 + 0.3 * Math.sin(now * 0.008)})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 12; ctx.shadowColor = '#66ccff';
            ctx.beginPath(); ctx.arc(px, py + player.height / 2, 32, 0, Math.PI * 2); ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        ctx.globalAlpha = 1;
        // 恢复 squash & stretch 变换
        ctx.restore();
        
        // ── 收集特效（光圈扩散，在世界坐标中渲染）
        renderCollectEffects();
        
        ctx.restore();
    }
    
    // ── 受伤屏幕红色闪光（屏幕空间，在相机变换之外）
    if (hurtFlash > 0) {
        const flashAlpha = (hurtFlash / hurtFlashMax) * 0.45;
        ctx.save();
        ctx.fillStyle = `rgba(255, 30, 30, ${flashAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // 边缘晕染
        const edgeGrad = ctx.createRadialGradient(
            canvas.width/2, canvas.height/2, canvas.height * 0.2,
            canvas.width/2, canvas.height/2, canvas.height * 0.75
        );
        edgeGrad.addColorStop(0, 'rgba(255,0,0,0)');
        edgeGrad.addColorStop(1, `rgba(200,0,0,${flashAlpha * 1.5})`);
        ctx.fillStyle = edgeGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    
    // ===== 暂停遮罩 =====
    if (gameState === GameState.PAUSED) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 42px "Microsoft YaHei", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.fillText('游戏暂停', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '18px "Microsoft YaHei", Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('按 ESC 或点击 ▶ 继续', canvas.width / 2, canvas.height / 2 + 35);
        
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }
}

// 游戏循环
function gameLoop() {
    if (gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) {
        gameLoopId = null;
        return; // 游戏结束或胜利时停止循环
    }
    
    update();
    render();
    gameLoopId = requestAnimationFrame(gameLoop);
}

// 停止游戏循环
function stopGameLoop() {
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
}

// 游戏设置功能
function showSettings() {
    alert('游戏设置功能开发中...\n\n当前设置：\n- 音效：开启\n- 音乐：开启\n- 难度：普通');
}

// 成就系统功能
function showAchievements() {
    alert('成就系统功能开发中...\n\n当前成就：\n- 初次冒险：开始游戏\n- 收集者：收集5个星光碎片\n- 通关大师：完成所有关卡');
}

// 游戏重新开始函数
function restartGame() {
    console.log('重新开始游戏...');
    
    // 停止当前游戏循环
    stopGameLoop();
    stopBGM();
    bgmScheduled = false;
    
    // 重置游戏状态标志
    gameStarted = false;
    levelTransitioning = false;
    pendingLevelTransition = false;
    
    // 重置游戏状态
    gameState = GameState.START;
    currentLevel = 1;
    lives = 3;
    score = 0;
    starsCollected = 0;
    dialogQueue = [];
    currentDialog = null;
    
    // 重置相机
    camera = { x: 0, y: 0 };
    
    // 重置粒子系统
    particles = [];
    dustParticles = [];
    collectEffects = [];
    hurtFlash = 0;
    playerKnockback = 0;
    playerSquash = 1.0;
    playerStretch = 1.0;
    playerBobOffset = 0;
    wasJumpingLastFrame = false;
    
    // 重置屏幕抖动
    screenShake = 0;
    screenShakeDuration = 0;
    
    // 重置输入状态
    isCrouching = false;
    
    // 重置主角状态
    player.x = 100;
    player.y = 400;
    player.width = 30;
    player.height = 40;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isJumping = false;
    player.hasShield = false;
    player.speedBoost = 0;
    player.jumpBoost = 0;
    player.invulnerable = 0;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
    player.jumpCount = 0;
    
    // 重置暂停按钮图标
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.textContent = '⏸';
    
    // 重置所有关卡
    resetAllLevels();
    
    // 清除所有按键状态
    for (let key in keys) {
        keys[key] = false;
    }
    
    // 更新UI
    updateUI();
    updateProgressBar();
    
    // 从 localStorage 读取并更新主菜单统计
    loadMenuStats();
    
    // 隐藏游戏结束界面，显示开始界面
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    
    console.log('游戏已重置，可以重新开始');
}

// 重置所有关卡状态
function resetAllLevels() {
    // levels 是对象，使用 for...in 遍历
    for (let levelNum in levels) {
        const level = levels[levelNum];
        
        // 重置障碍物
        if (level.obstacles) {
            level.obstacles.forEach(obstacle => {
                // 保存初始位置（如果没有保存过）
                if (obstacle.initialX === undefined) {
                    obstacle.initialX = obstacle.x;
                    obstacle.initialY = obstacle.y;
                }
                // 重置位置
                obstacle.x = obstacle.initialX;
                obstacle.y = obstacle.initialY;
                obstacle.direction = obstacle.direction || 1;
            });
        }
        
        // 重置道具
        if (level.items) {
            level.items.forEach(item => {
                item.collected = false;
            });
        }
    }
    console.log('所有关卡已重置');
}

// 初始化
document.getElementById('dialogBox').style.display = 'none';
updateUI();
updateProgressBar();
loadMenuStats();

// ===== 从 localStorage 读取并更新主菜单统计 =====
function loadMenuStats() {
    try {
        const maxLevel = localStorage.getItem('maxLevel') || '1';
        const collectionRate = localStorage.getItem('collectionRate') || '0%';
        const bestScore = localStorage.getItem('bestScore');
        const maxLevelEl = document.getElementById('maxLevel');
        const collRateEl = document.getElementById('collectionRate');
        const bestTimeEl = document.getElementById('bestTime');
        if (maxLevelEl) maxLevelEl.textContent = maxLevel;
        if (collRateEl) collRateEl.textContent = collectionRate;
        if (bestTimeEl && bestScore) bestTimeEl.textContent = '最高: ' + bestScore + '分';
    } catch(e) {}
}

// ===== 背景音乐（Web Audio API 简单循环旋律） =====
let bgmNodes = [];
let bgmScheduled = false;

function startBGM() {
    if (!canPlaySound || bgmScheduled) return;
    bgmScheduled = true;
    scheduleBGM();
}

function stopBGM() {
    bgmScheduled = false;
    bgmNodes.forEach(n => { try { n.stop(); } catch(e) {} });
    bgmNodes = [];
}

function scheduleBGM() {
    if (!bgmScheduled || !canPlaySound) return;
    // 简单五声音阶旋律
    const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 783.99, 659.25, 587.33];
    const noteDuration = 0.35;
    let startTime = audioContext.currentTime + 0.05;
    
    notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, startTime + i * noteDuration);
        gain.gain.linearRampToValueAtTime(0.04, startTime + i * noteDuration + 0.02);
        gain.gain.linearRampToValueAtTime(0, startTime + i * noteDuration + noteDuration - 0.03);
        osc.start(startTime + i * noteDuration);
        osc.stop(startTime + i * noteDuration + noteDuration);
        bgmNodes.push(osc);
    });
    
    // 循环
    const totalDuration = notes.length * noteDuration * 1000;
    setTimeout(() => {
        bgmNodes = [];
        if (bgmScheduled) scheduleBGM();
    }, totalDuration + 100);
}

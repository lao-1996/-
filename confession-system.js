// ===== 角色选择与告白系统 =====

// 全局变量
let playerRole = null; // 'male' 或 'female'
let confessionMessage = null;

// 从localStorage加载角色设置
function loadPlayerRole() {
    try {
        const saved = localStorage.getItem('playerRole');
        if (saved) {
            playerRole = saved;
        }
    } catch(e) {
        console.warn('无法加载角色设置');
    }
}

// 保存角色设置
function savePlayerRole(role) {
    playerRole = role;
    try {
        localStorage.setItem('playerRole', role);
    } catch(e) {
        console.warn('无法保存角色设置');
    }
}

// 保存告白消息（男生使用）
function saveConfession(message) {
    if (playerRole !== 'male') {
        console.warn('只有男生才能保存告白');
        return false;
    }
    const confession = {
        message: message,
        timestamp: new Date().toISOString()
    };
    try {
        localStorage.setItem('confession', JSON.stringify(confession));
        confessionMessage = confession;
        return true;
    } catch(e) {
        console.warn('无法保存告白');
        return false;
    }
}

// 加载告白消息（女生使用）
function loadConfession() {
    if (playerRole !== 'female') {
        console.warn('只有女生才能查看告白');
        return null;
    }
    try {
        const saved = localStorage.getItem('confession');
        if (saved) {
            confessionMessage = JSON.parse(saved);
            return confessionMessage;
        }
    } catch(e) {
        console.warn('无法加载告白');
    }
    return null;
}

// 显示角色选择界面
function showRoleSelection() {
    const roleSelectionHTML = `
        <div id="roleSelectionOverlay" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0d0d2b 0%, #1a1150 20%, #2d1b69 40%, #1a2a5e 60%, #0f3460 80%, #1a1a2e 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: fadeIn 0.5s ease;
        ">
            <div style="
                text-align: center;
                color: white;
                animation: slideUp 0.6s ease;
            ">
                <h2 style="
                    font-size: 48px;
                    margin-bottom: 40px;
                    background: linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #FFD700 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
                ">选择你的角色</h2>

                <p style="
                    font-size: 20px;
                    margin-bottom: 50px;
                    color: rgba(255, 255, 255, 0.9);
                    max-width: 600px;
                    line-height: 1.6;
                ">
                    男生通关后可以写下告白，女生通关后可以查看告白内容
                </p>

                <div style="
                    display: flex;
                    gap: 40px;
                    justify-content: center;
                    margin-bottom: 50px;
                ">
                    <button onclick="selectRole('male')" style="
                        padding: 30px 50px;
                        font-size: 22px;
                        background: linear-gradient(135deg, rgba(100, 150, 255, 0.9), rgba(50, 100, 255, 0.9));
                        color: white;
                        border: 3px solid rgba(100, 150, 255, 0.6);
                        border-radius: 20px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 10px 30px rgba(100, 150, 255, 0.4);
                    ">
                        👨 我是男生
                    </button>
                    <button onclick="selectRole('female')" style="
                        padding: 30px 50px;
                        font-size: 22px;
                        background: linear-gradient(135deg, rgba(255, 150, 200, 0.9), rgba(255, 100, 150, 0.9));
                        color: white;
                        border: 3px solid rgba(255, 150, 200, 0.6);
                        border-radius: 20px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 10px 30px rgba(255, 150, 200, 0.4);
                    ">
                        👩 我是女生
                    </button>
                </div>
            </div>
        </div>

        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        </style>
    `;

    // 移除已存在的覆盖层
    const existingOverlay = document.getElementById('roleSelectionOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // 添加新的覆盖层
    document.body.insertAdjacentHTML('beforeend', roleSelectionHTML);
}

// 选择角色
function selectRole(role) {
    savePlayerRole(role);

    const overlay = document.getElementById('roleSelectionOverlay');
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => {
            overlay.remove();
            // 继续游戏
            if (typeof startGame === 'function') {
                startGame();
            }
        }, 500);
    }
}

// 显示告白输入界面（男生通关后）
function showConfessionInput() {
    const confessionInputHTML = `
        <div id="confessionInputOverlay" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            animation: fadeIn 0.5s ease;
        ">
            <div style="
                background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 140, 0, 0.15));
                border: 2px solid rgba(255, 215, 0, 0.4);
                border-radius: 20px;
                padding: 40px 50px;
                max-width: 600px;
                width: 90%;
                text-align: center;
                animation: slideUp 0.6s ease;
                backdrop-filter: blur(10px);
            ">
                <h2 style="
                    font-size: 36px;
                    margin-bottom: 20px;
                    color: #FFD700;
                    text-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
                ">💌 写下你的告白</h2>

                <p style="
                    font-size: 18px;
                    margin-bottom: 30px;
                    color: rgba(255, 255, 255, 0.9);
                ">
                    恭喜你成功通关！现在可以写下一段告白，让通关的女生看到你的心意～
                </p>

                <textarea id="confessionText" style="
                    width: 100%;
                    min-height: 200px;
                    padding: 20px;
                    font-size: 16px;
                    border: 2px solid rgba(255, 215, 0, 0.4);
                    border-radius: 10px;
                    background: rgba(0, 0, 0, 0.6);
                    color: white;
                    resize: vertical;
                    outline: none;
                    margin-bottom: 30px;
                " placeholder="在这里写下你的告白...&#10;&#10;例如：&#10;我穿越了六关的挑战，只为了告诉你：我喜欢你！"></textarea>

                <div style="
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                ">
                    <button onclick="submitConfession()" style="
                        padding: 15px 40px;
                        font-size: 20px;
                        background: linear-gradient(135deg, #FFD700, #FF8C00);
                        color: #1a1a2e;
                        border: none;
                        border-radius: 30px;
                        cursor: pointer;
                        font-weight: bold;
                        transition: all 0.3s ease;
                        box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);
                    ">
                        ✨ 保存告白
                    </button>
                    <button onclick="closeConfessionInput()" style="
                        padding: 15px 40px;
                        font-size: 20px;
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        border-radius: 30px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">
                        跳过
                    </button>
                </div>
            </div>
        </div>

        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        </style>
    `;

    document.body.insertAdjacentHTML('beforeend', confessionInputHTML);
}

// 提交告白
function submitConfession() {
    const textArea = document.getElementById('confessionText');
    if (!textArea) return;

    const message = textArea.value.trim();
    if (!message) {
        alert('请先写下你的告白');
        return;
    }

    if (saveConfession(message)) {
        closeConfessionInput();
        alert('告白保存成功！通关的女生可以看到了～');
    } else {
        alert('保存失败，请重试');
    }
}

// 关闭告白输入界面
function closeConfessionInput() {
    const overlay = document.getElementById('confessionInputOverlay');
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => {
            overlay.remove();
            // 显示游戏结束界面
            const gameOverScreen = document.getElementById('gameOverScreen');
            if (gameOverScreen) {
                gameOverScreen.style.display = 'flex';
            }
        }, 500);
    }
}

// 显示告白查看界面（女生通关后）
function showConfessionView() {
    const confession = loadConfession();

    let contentHTML;
    if (confession && confession.message) {
        const date = new Date(confession.timestamp);
        const dateStr = date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN');

        contentHTML = `
            <div style="
                padding: 30px;
                background: linear-gradient(135deg, rgba(255, 105, 180, 0.2), rgba(255, 20, 147, 0.2));
                border: 2px solid rgba(255, 105, 180, 0.4);
                border-radius: 15px;
                margin-bottom: 30px;
            ">
                <div style="
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 15px;
                ">${dateStr}</div>
                <div style="
                    font-size: 18px;
                    line-height: 1.8;
                    color: white;
                    white-space: pre-wrap;
                ">${confession.message}</div>
            </div>
            <p style="color: #FFD700; font-size: 18px;">💖 这就是男生的心意！</p>
        `;
    } else {
        contentHTML = `
            <div style="
                padding: 30px;
                background: rgba(255, 255, 255, 0.1);
                border: 2px dashed rgba(255, 255, 255, 0.3);
                border-radius: 15px;
                margin-bottom: 30px;
            ">
                <div style="font-size: 18px; color: rgba(255, 255, 255, 0.8);">
                    还没有男生写下告白哦～<br>
                    或者这是你的电脑第一次使用本游戏
                </div>
            </div>
        `;
    }

    const confessionViewHTML = `
        <div id="confessionViewOverlay" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            animation: fadeIn 0.5s ease;
            padding: 20px;
        ">
            <div style="
                background: linear-gradient(135deg, rgba(255, 105, 180, 0.15), rgba(147, 20, 255, 0.15));
                border: 2px solid rgba(255, 105, 180, 0.5);
                border-radius: 25px;
                padding: 40px 50px;
                max-width: 650px;
                width: 100%;
                text-align: center;
                animation: slideUp 0.6s ease;
                backdrop-filter: blur(10px);
            ">
                <h2 style="
                    font-size: 40px;
                    margin-bottom: 30px;
                    background: linear-gradient(135deg, #FF69B4, #DA70D6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-shadow: 0 0 20px rgba(255, 105, 180, 0.5);
                ">💌 查看告白</h2>

                <p style="
                    font-size: 18px;
                    margin-bottom: 30px;
                    color: rgba(255, 255, 255, 0.9);
                ">
                    恭喜你成功通关！快来看看男生为你写下的告白吧～
                </p>

                ${contentHTML}

                <button onclick="closeConfessionView()" style="
                    padding: 15px 50px;
                    font-size: 20px;
                    background: linear-gradient(135deg, #FF69B4, #DA70D6);
                    color: white;
                    border: none;
                    border-radius: 30px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s ease;
                    box-shadow: 0 5px 20px rgba(255, 105, 180, 0.4);
                    margin-top: 20px;
                ">
                    💝 关闭
                </button>
            </div>
        </div>

        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        </style>
    `;

    document.body.insertAdjacentHTML('beforeend', confessionViewHTML);
}

// 关闭告白查看界面
function closeConfessionView() {
    const overlay = document.getElementById('confessionViewOverlay');
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => {
            overlay.remove();
            // 显示游戏结束界面
            const gameOverScreen = document.getElementById('gameOverScreen');
            if (gameOverScreen) {
                gameOverScreen.style.display = 'flex';
            }
        }, 500);
    }
}

// 修改原有的startGame函数，添加角色选择
const originalStartGame = window.startGame;
window.startGame = function() {
    // 如果还没有选择角色，先显示角色选择界面
    if (!playerRole) {
        showRoleSelection();
        return;
    }

    // 否则正常开始游戏
    if (typeof originalStartGame === 'function') {
        originalStartGame();
    }
};

// 修改原有的victory函数，添加告白功能
const originalVictory = window.victory;
window.victory = function() {
    if (typeof originalVictory === 'function') {
        originalVictory();
    }

    // 6秒后显示告白界面
    setTimeout(() => {
        if (playerRole === 'male') {
            showConfessionInput();
        } else if (playerRole === 'female') {
            showConfessionView();
        }
    }, 6500); // 比原来的6000ms多500ms
};

// 页面加载时初始化
window.addEventListener('load', function() {
    loadPlayerRole();
});

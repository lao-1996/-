/**
 * 游戏速度修复模块
 * 解决每次重新开始游戏速度变快的问题
 */

// 全局游戏状态管理
const SpeedFix = {
    // 游戏速度基准
    baseSpeed: 1.0,
    
    // 检测是否有多重游戏循环
    checkGameLoops: function() {
        const loops = window._gameLoopCount || 0;
        if (loops > 1) {
            console.warn(`检测到 ${loops} 个游戏循环，可能导致速度异常`);
        }
        return loops;
    },
    
    // 重置所有游戏速度相关变量
    resetAllSpeedVariables: function() {
        console.log('重置所有速度变量...');
        
        // 重置CONFIG中的基础速度
        if (window.CONFIG) {
            window.CONFIG.MOVE_SPEED = 3;
            window.CONFIG.CROUCH_SPEED = 1.5;
            window.CONFIG.GRAVITY = 0.4;
            window.CONFIG.JUMP_FORCE = -10;
        }
        
        // 重置玩家速度相关属性
        if (window.player) {
            window.player.velocityY = 0;
            window.player.speedBoost = 0;
            window.player.jumpBoost = 0;
            
            // 确保没有残留的速度效果
            window.player._speedMultiplier = 1.0;
        }
        
        // 重置障碍物速度
        if (window.levels) {
            for (let level of window.levels) {
                for (let obstacle of level.obstacles) {
                    // 恢复原始速度
                    if (obstacle.originalSpeed !== undefined) {
                        obstacle.speed = obstacle.originalSpeed;
                    }
                }
            }
        }
        
        // 停止所有未完成的定时器
        this.stopAllTimers();
        
        console.log('速度变量重置完成');
    },
    
    // 停止所有可能影响速度的定时器
    stopAllTimers: function() {
        // 记录并清除所有可能影响游戏速度的定时器
        const speedTimers = [
            'speedBoostTimer',
            'gameLoopTimer',
            'speedMultiplierTimer'
        ];
        
        speedTimers.forEach(timerId => {
            if (window[timerId]) {
                clearTimeout(window[timerId]);
                clearInterval(window[timerId]);
                delete window[timerId];
                console.log(`已清除定时器: ${timerId}`);
            }
        });
    },
    
    // 修复游戏循环问题
    fixGameLoop: function() {
        // 确保只有一个游戏循环
        if (!window._gameLoopInitialized) {
            window._gameLoopInitialized = true;
            console.log('游戏循环已正确初始化');
        } else {
            console.warn('游戏循环已存在，避免重复初始化');
        }
        
        // 游戏循环计数器
        window._gameLoopCount = (window._gameLoopCount || 0) + 1;
        
        // 限制游戏循环数量
        if (window._gameLoopCount > 1) {
            console.error('检测到多个游戏循环，这可能导致速度异常');
        }
    },
    
    // 检查并修复速度问题
    checkAndFixSpeedIssues: function() {
        console.group('游戏速度问题检测');
        
        // 1. 检查游戏循环
        const loopCount = this.checkGameLoops();
        
        // 2. 检查CONFIG配置
        let configIssues = false;
        if (window.CONFIG) {
            if (window.CONFIG.MOVE_SPEED !== 3) {
                console.warn(`MOVE_SPEED异常: ${window.CONFIG.MOVE_SPEED} (应为3)`);
                configIssues = true;
            }
            if (window.CONFIG.GRAVITY !== 0.4) {
                console.warn(`GRAVITY异常: ${window.CONFIG.GRAVITY} (应为0.4)`);
                configIssues = true;
            }
        }
        
        // 3. 检查玩家状态
        if (window.player) {
            if (window.player.speedBoost > 0) {
                console.warn(`速度提升效果未重置: ${window.player.speedBoost}`);
                configIssues = true;
            }
            if (window.player._speedMultiplier && window.player._speedMultiplier !== 1.0) {
                console.warn(`速度乘数异常: ${window.player._speedMultiplier}`);
                configIssues = true;
            }
        }
        
        // 4. 检查定时器
        const activeTimers = Object.keys(window).filter(key => 
            key.includes('Timer') || key.includes('Interval')
        );
        if (activeTimers.length > 0) {
            console.warn(`检测到 ${activeTimers.length} 个可能影响速度的定时器:`, activeTimers);
        }
        
        if (loopCount > 1 || configIssues || activeTimers.length > 0) {
            console.log('检测到速度相关问题，正在修复...');
            this.resetAllSpeedVariables();
        } else {
            console.log('速度状态正常');
        }
        
        console.groupEnd();
        return !(loopCount > 1 || configIssues || activeTimers.length > 0);
    },
    
    // 初始化
    init: function() {
        console.log('游戏速度修复模块初始化...');
        
        // 保存原始速度值
        if (window.levels) {
            for (let level of window.levels) {
                for (let obstacle of level.obstacles) {
                    obstacle.originalSpeed = obstacle.speed;
                }
            }
        }
        
        // 重写restartGame函数，确保完全重置
        this.overrideRestartFunction();
        
        // 监控游戏速度
        this.monitorGameSpeed();
        
        console.log('游戏速度修复模块初始化完成');
    },
    
    // 重写restartGame函数
    overrideRestartFunction: function() {
        if (typeof window.restartGame === 'function') {
            const originalRestartGame = window.restartGame;
            window.restartGame = function() {
                console.log('修复版restartGame: 确保速度完全重置');
                
                // 执行原始重置
                originalRestartGame();
                
                // 额外重置速度相关状态
                SpeedFix.resetAllSpeedVariables();
                
                // 重新初始化音频（确保音频状态正常）
                if (window.initAudio && typeof window.initAudio === 'function') {
                    window.initAudio();
                }
                
                return true;
            };
            console.log('restartGame函数已增强');
        }
    },
    
    // 监控游戏速度
    monitorGameSpeed: function() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const monitorLoop = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                // 检测异常FPS
                if (fps > 65) {
                    console.warn(`FPS异常偏高: ${fps}，可能有多重游戏循环`);
                    SpeedFix.checkGameLoops();
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(monitorLoop);
        };
        
        requestAnimationFrame(monitorLoop);
        console.log('游戏速度监控已启动');
    },
    
    // 创建速度控制面板（仅调试用）
    createDebugPanel: function() {
        if (!document.getElementById('speedDebugPanel')) {
            const panel = document.createElement('div');
            panel.id = 'speedDebugPanel';
            panel.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                z-index: 10000;
                font-family: monospace;
                font-size: 12px;
            `;
            
            panel.innerHTML = `
                <div>游戏速度调试面板</div>
                <button onclick="SpeedFix.resetAllSpeedVariables()">重置速度</button>
                <button onclick="SpeedFix.checkAndFixSpeedIssues()">检查问题</button>
                <div id="speedInfo"></div>
            `;
            
            document.body.appendChild(panel);
            
            // 更新信息
            setInterval(() => {
                const infoDiv = document.getElementById('speedInfo');
                if (infoDiv && window.player && window.CONFIG) {
                    infoDiv.innerHTML = `
                        <div>移动速度: ${window.CONFIG.MOVE_SPEED}</div>
                        <div>速度提升: ${window.player.speedBoost}</div>
                        <div>循环计数: ${window._gameLoopCount || 1}</div>
                    `;
                }
            }, 1000);
            
            console.log('速度调试面板已创建');
        }
    }
};

// 初始化速度修复模块
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，初始化速度修复...');
    
    // 延迟初始化，确保所有游戏资源已加载
    setTimeout(() => {
        SpeedFix.init();
        
        // 可选：创建调试面板（开发时使用）
        // SpeedFix.createDebugPanel();
        
        // 初始化时检查速度状态
        SpeedFix.checkAndFixSpeedIssues();
    }, 1000);
});

// 导出到全局
window.SpeedFix = SpeedFix;

console.log('游戏速度修复模块加载完成');
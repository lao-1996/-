/**
 * 增强版游戏主模块
 * 整合现代化的渲染系统和游戏逻辑
 */

class EnhancedGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 游戏尺寸
        this.width = canvas.width = 800;
        this.height = canvas.height = 600;
        
        // 初始化渲染引擎
        this.initRenderSystems();
        
        // 游戏状态
        this.state = {
            currentLevel: 1,
            totalLevels: 3,
            playerHealth: 3,
            maxHealth: 3,
            score: 0,
            gameTime: 0,
            isPaused: false,
            isGameOver: false,
            isVictory: false
        };
        
        // 玩家状态
        this.player = {
            x: 100,
            y: 300,
            width: 30,
            height: 50,
            velocityX: 0,
            velocityY: 0,
            speed: 4,
            jumpForce: -12,
            isJumping: false,
            isCrouching: false,
            direction: 1, // 1=右, -1=左
            state: 'idle'
        };
        
        // 游戏对象
        this.obstacles = [];
        this.powerups = [];
        this.particles = [];
        this.effects = [];
        
        // 输入处理
        this.keys = {};
        this.setupInputHandling();
        
        // 游戏循环
        this.lastTime = 0;
        this.deltaTime = 0;
        this.animationFrameId = null;
        
        // 性能监控
        this.performance = {
            fps: 60,
            lastFpsUpdate: 0,
            frameCount: 0
        };
        
        // 加载第一关
        this.loadLevel(this.state.currentLevel);
    }
    
    /**
     * 初始化渲染系统
     */
    initRenderSystems() {
        // 创建渲染引擎
        this.renderEngine = new RenderEngine(this.canvas);
        this.renderEngine.initialize();
        
        // 创建角色渲染器
        this.characterRenderer = new CharacterRenderer(this.renderEngine);
        
        // 创建场景渲染器
        this.sceneRenderer = new SceneRenderer(this.renderEngine);
        
        // 创建UI渲染器
        this.uiRenderer = new UIRenderer(this.renderEngine);
        this.uiRenderer.initialize();
        
        // 设置UI回调
        this.uiRenderer.onPauseToggle = (paused) => {
            this.togglePause();
        };
    }
    
    /**
     * 设置输入处理
     */
    setupInputHandling() {
        // 键盘事件
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // 暂停键
            if (e.key === 'Escape' || e.key === 'p') {
                this.togglePause();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // 鼠标事件
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.uiRenderer.handleClick(x, y);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.uiRenderer.handleHover(x, y);
        });
    }
    
    /**
     * 加载关卡
     */
    loadLevel(level) {
        this.state.currentLevel = level;
        
        // 重置玩家位置
        this.player.x = 100;
        this.player.y = 300;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        
        // 清空游戏对象
        this.obstacles = [];
        this.powerups = [];
        this.particles = [];
        
        // 加载场景
        const levelId = `level${level}`;
        this.sceneRenderer.loadLevel(levelId);
        
        // 创建角色
        this.characterRenderer.createCharacter('player', 'lao', {
            x: this.player.x,
            y: this.player.y
        });
        
        // 生成关卡内容
        this.generateLevelContent(level);
        
        // 更新UI
        this.uiRenderer.updateState({
            level: level,
            progress: 0,
            score: this.state.score
        });
        
        console.log(`加载第${level}关: ${this.sceneRenderer.getLevelConfig(levelId)?.name}`);
    }
    
    /**
     * 生成关卡内容
     */
    generateLevelContent(level) {
        // 根据关卡生成障碍物和道具
        switch (level) {
            case 1:
                this.generateLevel1();
                break;
            case 2:
                this.generateLevel2();
                break;
            case 3:
                this.generateLevel3();
                break;
        }
    }
    
    /**
     * 生成第一关内容
     */
    generateLevel1() {
        // 简单障碍物
        for (let i = 0; i < 5; i++) {
            this.obstacles.push({
                x: 300 + i * 80,
                y: 400,
                width: 40,
                height: 40,
                type: 'normal',
                speed: 0
            });
        }
        
        // 道具
        this.powerups.push({
            x: 250,
            y: 350,
            width: 20,
            height: 20,
            type: 'heart',
            collected: false
        });
        
        this.powerups.push({
            x: 450,
            y: 350,
            width: 20,
            height: 20,
            type: 'mushroom',
            collected: false
        });
    }
    
    /**
     * 生成第二关内容
     */
    generateLevel2() {
        // 移动障碍物
        for (let i = 0; i < 6; i++) {
            this.obstacles.push({
                x: 200 + i * 100,
                y: 380,
                width: 50,
                height: 50,
                type: 'moving',
                speed: 2,
                direction: i % 2 === 0 ? 1 : -1,
                minX: 200 + i * 100 - 50,
                maxX: 200 + i * 100 + 50
            });
        }
        
        // 道具
        this.powerups.push({
            x: 300,
            y: 300,
            width: 20,
            height: 20,
            type: 'star',
            collected: false
        });
        
        this.powerups.push({
            x: 500,
            y: 300,
            width: 20,
            height: 20,
            type: 'candy',
            collected: false
        });
    }
    
    /**
     * 生成第三关内容
     */
    generateLevel3() {
        // 复杂障碍物
        for (let i = 0; i < 8; i++) {
            this.obstacles.push({
                x: 150 + i * 70,
                y: i % 2 === 0 ? 420 : 360,
                width: 40,
                height: 40,
                type: 'bouncing',
                speed: 3,
                direction: 1,
                bounceCount: 0
            });
        }
        
        // 最终奖励
        this.powerups.push({
            x: 700,
            y: 300,
            width: 30,
            height: 30,
            type: 'victory',
            collected: false
        });
    }
    
    /**
     * 开始游戏
     */
    start() {
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    /**
     * 游戏主循环
     */
    gameLoop = (currentTime = 0) => {
        // 计算时间增量
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 更新性能统计
        this.updatePerformanceStats(currentTime);
        
        // 如果不是暂停状态，更新游戏逻辑
        if (!this.state.isPaused && !this.state.isGameOver && !this.state.isVictory) {
            this.update(this.deltaTime);
        }
        
        // 渲染游戏
        this.render();
        
        // 继续循环
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    };
    
    /**
     * 更新性能统计
     */
    updatePerformanceStats(currentTime) {
        this.performance.frameCount++;
        
        if (currentTime - this.performance.lastFpsUpdate >= 1000) {
            this.performance.fps = this.performance.frameCount;
            this.performance.frameCount = 0;
            this.performance.lastFpsUpdate = currentTime;
            
            // 性能警告
            if (this.performance.fps < 50) {
                console.warn(`性能警告: FPS下降至${this.performance.fps}`);
            }
        }
    }
    
    /**
     * 更新游戏逻辑
     */
    update(deltaTime) {
        // 更新时间
        this.state.gameTime += deltaTime;
        
        // 处理输入
        this.handleInput();
        
        // 更新物理
        this.updatePhysics(deltaTime);
        
        // 更新游戏对象
        this.updateObstacles(deltaTime);
        this.updatePowerups(deltaTime);
        this.updateParticles(deltaTime);
        this.updateEffects(deltaTime);
        
        // 检测碰撞
        this.checkCollisions();
        
        // 更新角色状态
        this.updateCharacterState();
        
        // 更新UI状态
        this.updateUIState();
        
        // 更新动画
        this.uiRenderer.updateAnimations();
        
        // 更新场景
        this.sceneRenderer.update(deltaTime, this.player.x);
        
        // 检查游戏状态
        this.checkGameState();
    }
    
    /**
     * 处理输入
     */
    handleInput() {
        let moving = false;
        
        // 左右移动
        if (this.keys['arrowleft'] || this.keys['a']) {
            this.player.velocityX = -this.player.speed;
            this.player.direction = -1;
            moving = true;
        } else if (this.keys['arrowright'] || this.keys['d']) {
            this.player.velocityX = this.player.speed;
            this.player.direction = 1;
            moving = true;
        } else {
            this.player.velocityX = 0;
        }
        
        // 跳跃
        if ((this.keys['arrowup'] || this.keys['w'] || this.keys[' ']) && !this.player.isJumping) {
            this.player.velocityY = this.player.jumpForce;
            this.player.isJumping = true;
            
            // 触发跳跃特效
            this.characterRenderer.triggerCharacterEffect('player', 'jump', 1);
        }
        
        // 下蹲
        this.player.isCrouching = this.keys['arrowdown'] || this.keys['s'];
        
        // 更新角色状态
        if (this.player.isCrouching) {
            this.player.state = 'crouch';
        } else if (this.player.isJumping) {
            this.player.state = 'jump';
        } else if (moving) {
            this.player.state = 'run';
        } else {
            this.player.state = 'idle';
        }
    }
    
    /**
     * 更新物理
     */
    updatePhysics(deltaTime) {
        const dt = deltaTime / 16.67; // 标准化到60FPS
        
        // 应用重力
        if (this.player.y < 450) {
            this.player.velocityY += 0.5 * dt;
        }
        
        // 更新位置
        this.player.x += this.player.velocityX * dt;
        this.player.y += this.player.velocityY * dt;
        
        // 边界检查
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.width - this.player.width) this.player.x = this.width - this.player.width;
        
        // 地面检测
        if (this.player.y >= 450) {
            this.player.y = 450;
            this.player.velocityY = 0;
            this.player.isJumping = false;
            
            // 落地检测
            if (this.player.velocityY > 5) {
                this.characterRenderer.triggerCharacterEffect('player', 'land', 0.5);
            }
        }
        
        // 更新角色位置
        this.characterRenderer.setCharacterPosition('player', this.player.x, this.player.y);
        this.characterRenderer.setCharacterVelocity('player', this.player.velocityX, this.player.velocityY);
        
        // 更新角色状态
        this.characterRenderer.updateCharacter('player', deltaTime, {
            direction: this.player.direction,
            state: this.player.state
        });
    }
    
    /**
     * 更新障碍物
     */
    updateObstacles(deltaTime) {
        this.obstacles.forEach(obstacle => {
            // 根据类型更新
            switch (obstacle.type) {
                case 'moving':
                    obstacle.x += obstacle.speed * obstacle.direction;
                    
                    // 反转方向
                    if (obstacle.x <= obstacle.minX || obstacle.x >= obstacle.maxX) {
                        obstacle.direction *= -1;
                    }
                    break;
                    
                case 'bouncing':
                    obstacle.x += obstacle.speed * obstacle.direction;
                    
                    // 边界反弹
                    if (obstacle.x <= 100 || obstacle.x >= 700) {
                        obstacle.direction *= -1;
                        obstacle.bounceCount++;
                    }
                    break;
            }
        });
    }
    
    /**
     * 更新道具
     */
    updatePowerups(deltaTime) {
        // 道具简单动画
        this.powerups.forEach(powerup => {
            if (!powerup.collected) {
                // 漂浮动画
                powerup.y += Math.sin(Date.now() / 500) * 0.5;
            }
        });
    }
    
    /**
     * 更新粒子
     */
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // 更新位置
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // 应用重力
            particle.vy += particle.gravity || 0.1;
            
            // 更新生命周期
            particle.life--;
            
            // 移除死亡粒子
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * 更新特效
     */
    updateEffects(deltaTime) {
        // 更新屏幕抖动等特效
        if (this.effects.screenShake > 0) {
            this.effects.screenShake -= deltaTime;
        }
    }
    
    /**
     * 检测碰撞
     */
    checkCollisions() {
        // 检测障碍物碰撞
        this.obstacles.forEach(obstacle => {
            if (this.checkCollision(this.player, obstacle)) {
                this.handleObstacleCollision(obstacle);
            }
        });
        
        // 检测道具收集
        this.powerups.forEach(powerup => {
            if (!powerup.collected && this.checkCollision(this.player, powerup)) {
                this.handlePowerupCollection(powerup);
            }
        });
    }
    
    /**
     * 检测矩形碰撞
     */
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    /**
     * 处理障碍物碰撞
     */
    handleObstacleCollision(obstacle) {
        // 减少生命值
        this.state.playerHealth--;
        
        // 触发受伤特效
        this.characterRenderer.triggerCharacterEffect('player', 'hurt', 1);
        
        // 屏幕抖动
        this.effects.screenShake = 10;
        
        // 更新UI
        this.uiRenderer.updateState({
            health: this.state.playerHealth
        });
        
        // 受伤反弹
        this.player.velocityX = -this.player.direction * 8;
        this.player.velocityY = -5;
        
        // 检查游戏结束
        if (this.state.playerHealth <= 0) {
            this.gameOver();
        }
    }
    
    /**
     * 处理道具收集
     */
    handlePowerupCollection(powerup) {
        powerup.collected = true;
        
        // 根据道具类型应用效果
        switch (powerup.type) {
            case 'heart':
                this.state.playerHealth = Math.min(this.state.maxHealth, this.state.playerHealth + 1);
                this.state.score += 100;
                break;
                
            case 'mushroom':
                this.player.speed *= 1.5;
                this.state.score += 150;
                setTimeout(() => {
                    this.player.speed /= 1.5;
                }, 5000);
                break;
                
            case 'candy':
                this.player.jumpForce *= 1.3;
                this.state.score += 200;
                setTimeout(() => {
                    this.player.jumpForce /= 1.3;
                }, 3000);
                break;
                
            case 'star':
                // 短暂无敌
                this.state.score += 300;
                break;
                
            case 'victory':
                this.victory();
                return;
        }
        
        // 触发收集特效
        this.characterRenderer.triggerCharacterEffect('player', 'collect', 1);
        
        // 添加粒子效果
        this.createCollectionParticles(powerup);
        
        // 更新UI
        this.uiRenderer.updateState({
            health: this.state.playerHealth,
            score: this.state.score
        });
        
        // 添加UI动画
        this.uiRenderer.addAnimation('scorePopup', {
            x: powerup.x,
            y: powerup.y,
            value: powerup.type === 'victory' ? 1000 : 
                   powerup.type === 'star' ? 300 :
                   powerup.type === 'candy' ? 200 :
                   powerup.type === 'mushroom' ? 150 : 100
        });
    }
    
    /**
     * 创建收集粒子
     */
    createCollectionParticles(powerup) {
        const color = this.getPowerupColor(powerup.type);
        
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            
            this.particles.push({
                x: powerup.x + powerup.width / 2,
                y: powerup.y + powerup.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4,
                color: color,
                life: 30 + Math.random() * 30,
                gravity: 0.05
            });
        }
    }
    
    /**
     * 获取道具颜色
     */
    getPowerupColor(type) {
        switch (type) {
            case 'heart': return '#FF6B8B';
            case 'mushroom': return '#06D6A0';
            case 'candy': return '#FFD166';
            case 'star': return '#118AB2';
            case 'victory': return '#FFD700';
            default: return '#FFFFFF';
        }
    }
    
    /**
     * 更新角色状态
     */
    updateCharacterState() {
        // 更新角色特效
        const character = this.characterRenderer.characters.get('player');
        if (character) {
            character.effects.trail = Math.abs(this.player.velocityX) > 2;
            character.effects.sparkle = this.state.score > 1000;
        }
    }
    
    /**
     * 更新UI状态
     */
    updateUIState() {
        // 计算进度
        const progress = Math.min(100, (this.player.x / 700) * 100);
        
        // 更新UI
        this.uiRenderer.updateState({
            health: this.state.playerHealth,
            score: this.state.score,
            gameTime: this.state.gameTime,
            progress: progress
        });
    }
    
    /**
     * 检查游戏状态
     */
    checkGameState() {
        // 检查是否到达关卡终点
        if (this.player.x >= 750 && this.state.currentLevel < this.state.totalLevels) {
            this.completeLevel();
        }
    }
    
    /**
     * 完成当前关卡
     */
    completeLevel() {
        console.log(`完成第${this.state.currentLevel}关`);
        
        // 触发庆祝特效
        this.characterRenderer.triggerCharacterEffect('player', 'celebrate', 2);
        
        // 分数奖励
        const levelBonus = this.state.currentLevel * 500;
        this.state.score += levelBonus;
        
        // 显示过关动画
        this.uiRenderer.addAnimation('levelComplete', {
            level: this.state.currentLevel,
            bonus: levelBonus
        });
        
        // 加载下一关
        setTimeout(() => {
            this.state.currentLevel++;
            if (this.state.currentLevel <= this.state.totalLevels) {
                this.loadLevel(this.state.currentLevel);
            } else {
                this.victory();
            }
        }, 2000);
    }
    
    /**
     * 游戏胜利
     */
    victory() {
        console.log('游戏胜利！');
        this.state.isVictory = true;
        this.state.score += 5000; // 通关奖励
        
        // 最终庆祝
        this.characterRenderer.triggerCharacterEffect('player', 'celebrate', 3);
        
        // 显示胜利画面
        setTimeout(() => {
            alert(`恭喜通关！最终分数: ${this.state.score}`);
        }, 1000);
    }
    
    /**
     * 游戏结束
     */
    gameOver() {
        console.log('游戏结束');
        this.state.isGameOver = true;
        
        // 显示游戏结束画面
        setTimeout(() => {
            alert(`游戏结束！最终分数: ${this.state.score}`);
        }, 500);
    }
    
    /**
     * 切换暂停状态
     */
    togglePause() {
        this.state.isPaused = !this.state.isPaused;
        
        if (this.state.isPaused) {
            console.log('游戏暂停');
        } else {
            console.log('游戏继续');
        }
    }
    
    /**
     * 渲染游戏
     */
    render() {
        // 清空渲染层
        this.renderEngine.clearAllLayers();
        
        // 应用屏幕抖动
        if (this.effects.screenShake > 0) {
            const shake = this.effects.screenShake;
            this.renderEngine.ctx.translate(
                (Math.random() - 0.5) * shake,
                (Math.random() - 0.5) * shake
            );
        }
        
        // 渲染场景
        this.sceneRenderer.render();
        
        // 渲染障碍物
        this.renderObstacles();
        
        // 渲染道具
        this.renderPowerups();
        
        // 渲染粒子
        this.renderParticles();
        
        // 渲染角色
        this.characterRenderer.render();
        
        // 渲染UI
        this.uiRenderer.render();
        
        // 执行渲染
        this.renderEngine.render();
        
        // 恢复变换
        if (this.effects.screenShake > 0) {
            this.renderEngine.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }
    
    /**
     * 渲染障碍物
     */
    renderObstacles() {
        this.obstacles.forEach(obstacle => {
            const color = obstacle.type === 'normal' ? '#FF4444' :
                         obstacle.type === 'moving' ? '#FF6B8B' :
                         obstacle.type === 'bouncing' ? '#FFD166' : '#118AB2';
            
            this.renderEngine.addToLayer('environment', {
                type: 'rectangle',
                x: obstacle.x,
                y: obstacle.y,
                width: obstacle.width,
                height: obstacle.height,
                fillStyle: color,
                cornerRadius: 8,
                shadow: { color: 'rgba(0,0,0,0.3)', blur: 8, offsetX: 2, offsetY: 2 }
            });
        });
    }
    
    /**
     * 渲染道具
     */
    renderPowerups() {
        this.powerups.forEach(powerup => {
            if (powerup.collected) return;
            
            this.renderEngine.addToLayer('environment', {
                type: 'circle',
                x: powerup.x + powerup.width/2,
                y: powerup.y + powerup.height/2,
                radius: powerup.width/2,
                fillStyle: this.getPowerupColor(powerup.type),
                alpha: 0.8 + Math.sin(Date.now() / 200) * 0.2,
                shadow: { color: 'rgba(255,255,255,0.5)', blur: 10, offsetX: 0, offsetY: 0 }
            });
            
            // 道具图标
            let icon = '?';
            switch (powerup.type) {
                case 'heart': icon = '❤️'; break;
                case 'mushroom': icon = '🍄'; break;
                case 'candy': icon = '🍬'; break;
                case 'star': icon = '⭐'; break;
                case 'victory': icon = '🏆'; break;
            }
            
            this.renderEngine.addToLayer('environment', {
                type: 'text',
                x: powerup.x + powerup.width/2,
                y: powerup.y + powerup.height/2,
                text: icon,
                fontSize: 14,
                fontFamily: 'Arial',
                color: '#FFFFFF',
                align: 'center',
                baseline: 'middle'
            });
        });
    }
    
    /**
     * 渲染粒子
     */
    renderParticles() {
        this.particles.forEach(particle => {
            this.renderEngine.addToLayer('effects', {
                type: 'circle',
                x: particle.x,
                y: particle.y,
                radius: particle.size,
                fillStyle: particle.color,
                alpha: particle.life / 60,
                blendMode: 'lighter'
            });
        });
    }
    
    /**
     * 停止游戏
     */
    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    /**
     * 重置游戏
     */
    reset() {
        this.stop();
        
        // 重置状态
        this.state = {
            currentLevel: 1,
            totalLevels: 3,
            playerHealth: 3,
            maxHealth: 3,
            score: 0,
            gameTime: 0,
            isPaused: false,
            isGameOver: false,
            isVictory: false
        };
        
        // 重置玩家
        this.player = {
            x: 100,
            y: 300,
            width: 30,
            height: 50,
            velocityX: 0,
            velocityY: 0,
            speed: 4,
            jumpForce: -12,
            isJumping: false,
            isCrouching: false,
            direction: 1,
            state: 'idle'
        };
        
        // 清空对象
        this.obstacles = [];
        this.powerups = [];
        this.particles = [];
        this.effects = [];
        
        // 重新开始
        this.loadLevel(1);
        this.start();
    }
}

// 导出增强版游戏
window.EnhancedGame = EnhancedGame;
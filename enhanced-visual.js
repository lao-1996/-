/**
 * 增强视觉效果系统 - 提升游戏沉浸感和情感表达
 */

class EnhancedVisualEffects {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.effects = [];
        this.particleSystems = [];
        this.screenShake = 0;
        this.chromaticAberration = 0;
        this.bloomIntensity = 0;
        this.vignetteIntensity = 0.4;
        this.colorFilter = { r: 1, g: 1, b: 1, a: 1 };
        this.timeScale = 1.0;
        this.deltaTime = 0;
        this.lastTime = 0;
        
        // 屏幕抖动配置
        this.shakeConfig = {
            intensity: 5,
            frequency: 0.1,
            decay: 0.9
        };
        
        // 性能优化
        this.performance = {
            maxParticles: 500,
            quality: 1.0, // 0.5-1.0
            enabledEffects: true
        };
        
        // 粒子预设
        this.particlePresets = {
            collect: {
                count: 15,
                color: '#FFD700',
                size: { min: 2, max: 6 },
                speed: { min: 1, max: 3 },
                life: { min: 20, max: 40 },
                spread: 360,
                gravity: 0.05
            },
            damage: {
                count: 20,
                color: '#FF6B6B',
                size: { min: 3, max: 8 },
                speed: { min: 2, max: 5 },
                life: { min: 10, max: 30 },
                spread: 180,
                gravity: 0.1
            },
            powerup: {
                count: 25,
                color: '#6BCEFF',
                size: { min: 4, max: 10 },
                speed: { min: 0.5, max: 2 },
                life: { min: 30, max: 60 },
                spread: 360,
                gravity: -0.02,
                trail: true
            },
            victory: {
                count: 50,
                color: '#FFD700',
                size: { min: 3, max: 8 },
                speed: { min: 1, max: 4 },
                life: { min: 40, max: 80 },
                spread: 360,
                gravity: 0.02,
                glow: true
            },
            healing: {
                count: 10,
                color: '#6BFF6B',
                size: { min: 3, max: 6 },
                speed: { min: 0.5, max: 1.5 },
                life: { min: 30, max: 50 },
                spread: 90,
                gravity: -0.05,
                rising: true
            },
            magic: {
                count: 12,
                color: '#FF6BCE',
                size: { min: 4, max: 8 },
                speed: { min: 0.8, max: 2 },
                life: { min: 40, max: 60 },
                spread: 360,
                gravity: 0,
                rotation: true
            }
        };
        
        // 屏幕效果预设
        this.screenEffectPresets = {
            damage: {
                chromaticAberration: 3,
                screenShake: 10,
                colorFilter: { r: 1.2, g: 0.8, b: 0.8, a: 1 },
                duration: 300
            },
            powerup: {
                bloomIntensity: 0.3,
                colorFilter: { r: 1, g: 1, b: 1.2, a: 1 },
                duration: 500
            },
            victory: {
                bloomIntensity: 0.5,
                vignetteIntensity: 0.6,
                chromaticAberration: 2,
                colorFilter: { r: 1.1, g: 1.1, b: 1, a: 1 },
                duration: 1000
            },
            gameOver: {
                colorFilter: { r: 0.8, g: 0.8, b: 0.8, a: 0.9 },
                vignetteIntensity: 0.8,
                timeScale: 0.3,
                duration: 600
            },
            dreamy: {
                colorFilter: { r: 0.9, g: 1, b: 1.1, a: 0.9 },
                vignetteIntensity: 0.5,
                bloomIntensity: 0.2,
                duration: 800
            }
        };
        
        // 初始化
        this.init();
    }
    
    init() {
        // 创建离屏画布用于特效
        this.createOffscreenCanvas();
        
        // 设置动画循环
        this.animationFrame = requestAnimationFrame((timestamp) => this.update(timestamp));
        
        console.log('增强视觉效果系统初始化成功');
    }
    
    createOffscreenCanvas() {
        // 创建离屏画布用于特效处理
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        
        // 创建模糊画布用于辉光效果
        this.blurCanvas = document.createElement('canvas');
        this.blurCanvas.width = this.canvas.width / 2;
        this.blurCanvas.height = this.canvas.height / 2;
        this.blurCtx = this.blurCanvas.getContext('2d');
    }
    
    update(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        this.deltaTime = (timestamp - this.lastTime) * 0.06 * this.timeScale; // 转换为每帧时间，乘以时间缩放
        this.lastTime = timestamp;
        
        // 更新粒子系统
        this.updateParticleSystems();
        
        // 更新屏幕抖动
        this.updateScreenShake();
        
        // 更新屏幕效果
        this.updateScreenEffects();
        
        // 继续动画循环
        this.animationFrame = requestAnimationFrame((ts) => this.update(ts));
    }
    
    updateParticleSystems() {
        for (let i = this.particleSystems.length - 1; i >= 0; i--) {
            const system = this.particleSystems[i];
            
            // 更新粒子
            for (let j = system.particles.length - 1; j >= 0; j--) {
                const particle = system.particles[j];
                
                // 更新位置
                particle.x += particle.vx * this.deltaTime;
                particle.y += particle.vy * this.deltaTime;
                
                // 应用重力
                particle.vy += particle.gravity * this.deltaTime;
                
                // 更新旋转
                if (particle.rotationSpeed) {
                    particle.rotation += particle.rotationSpeed * this.deltaTime;
                }
                
                // 更新生命周期
                particle.life -= this.deltaTime;
                
                // 移除死亡的粒子
                if (particle.life <= 0) {
                    system.particles.splice(j, 1);
                }
            }
            
            // 移除空的粒子系统
            if (system.particles.length === 0) {
                this.particleSystems.splice(i, 1);
            }
        }
    }
    
    updateScreenShake() {
        if (this.screenShake > 0) {
            this.screenShake *= this.shakeConfig.decay;
            
            if (this.screenShake < 0.1) {
                this.screenShake = 0;
            }
        }
    }
    
    updateScreenEffects() {
        // 更新正在进行的屏幕效果
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            
            // 更新时间
            effect.time += this.deltaTime;
            
            // 计算进度（0-1）
            const progress = Math.min(effect.time / effect.duration, 1);
            
            // 应用插值
            this.applyEffectLerp(effect, progress);
            
            // 移除已完成的效果
            if (progress >= 1) {
                this.effects.splice(i, 1);
            }
        }
    }
    
    applyEffectLerp(effect, progress) {
        // 线性插值应用效果
        const start = effect.startValues;
        const end = effect.endValues;
        
        this.chromaticAberration = this.lerp(start.chromaticAberration || 0, end.chromaticAberration || 0, progress);
        this.bloomIntensity = this.lerp(start.bloomIntensity || 0, end.bloomIntensity || 0, progress);
        this.vignetteIntensity = this.lerp(start.vignetteIntensity || 0.4, end.vignetteIntensity || 0.4, progress);
        this.timeScale = this.lerp(start.timeScale || 1, end.timeScale || 1, progress);
        
        // 颜色滤镜插值
        if (start.colorFilter && end.colorFilter) {
            this.colorFilter.r = this.lerp(start.colorFilter.r, end.colorFilter.r, progress);
            this.colorFilter.g = this.lerp(start.colorFilter.g, end.colorFilter.g, progress);
            this.colorFilter.b = this.lerp(start.colorFilter.b, end.colorFilter.b, progress);
            this.colorFilter.a = this.lerp(start.colorFilter.a, end.colorFilter.a, progress);
        }
    }
    
    lerp(start, end, progress) {
        return start + (end - start) * progress;
    }
    
    // 粒子系统
    createParticles(x, y, presetName, options = {}) {
        if (!this.performance.enabledEffects) return null;
        
        const preset = this.particlePresets[presetName];
        if (!preset) {
            console.warn(`粒子预设"${presetName}"不存在`);
            return null;
        }
        
        // 检查粒子数量限制
        const totalParticles = this.particleSystems.reduce((sum, sys) => sum + sys.particles.length, 0);
        if (totalParticles >= this.performance.maxParticles) {
            return null;
        }
        
        const particles = [];
        const count = options.count || preset.count;
        const spread = options.spread || preset.spread;
        const startAngle = options.angle || -spread / 2;
        
        for (let i = 0; i < count; i++) {
            const angle = startAngle + (spread * i) / count + (Math.random() * spread / count);
            const speed = preset.speed.min + Math.random() * (preset.speed.max - preset.speed.min);
            const life = preset.life.min + Math.random() * (preset.life.max - preset.life.min);
            
            particles.push({
                x,
                y,
                vx: Math.cos(angle * Math.PI / 180) * speed,
                vy: Math.sin(angle * Math.PI / 180) * speed,
                size: preset.size.min + Math.random() * (preset.size.max - preset.size.min),
                color: options.color || preset.color,
                life,
                maxLife: life,
                gravity: preset.gravity || 0,
                rotation: 0,
                rotationSpeed: preset.rotation ? (Math.random() - 0.5) * 0.1 : 0,
                glow: preset.glow,
                trail: preset.trail
            });
        }
        
        const system = {
            particles,
            presetName,
            createdAt: Date.now()
        };
        
        this.particleSystems.push(system);
        return system;
    }
    
    // 屏幕效果
    applyScreenEffect(effectName, options = {}) {
        if (!this.performance.enabledEffects) return;
        
        const preset = this.screenEffectPresets[effectName];
        if (!preset) {
            console.warn(`屏幕效果预设"${effectName}"不存在`);
            return;
        }
        
        // 记录当前值作为起始值
        const startValues = {
            chromaticAberration: this.chromaticAberration,
            bloomIntensity: this.bloomIntensity,
            vignetteIntensity: this.vignetteIntensity,
            timeScale: this.timeScale,
            colorFilter: { ...this.colorFilter }
        };
        
        // 获取结束值
        const endValues = {
            chromaticAberration: options.chromaticAberration !== undefined ? options.chromaticAberration : (preset.chromaticAberration || 0),
            bloomIntensity: options.bloomIntensity !== undefined ? options.bloomIntensity : (preset.bloomIntensity || 0),
            vignetteIntensity: options.vignetteIntensity !== undefined ? options.vignetteIntensity : (preset.vignetteIntensity || 0.4),
            timeScale: options.timeScale !== undefined ? options.timeScale : (preset.timeScale || 1),
            colorFilter: options.colorFilter || { ...preset.colorFilter } || { r: 1, g: 1, b: 1, a: 1 }
        };
        
        // 添加效果
        this.effects.push({
            name: effectName,
            startValues,
            endValues,
            duration: options.duration || preset.duration || 300,
            time: 0
        });
    }
    
    // 屏幕抖动
    applyScreenShake(intensity = 10) {
        this.screenShake = Math.max(this.screenShake, intensity);
    }
    
    // 渲染前处理
    preRender(context) {
        if (!this.performance.enabledEffects) return context;
        
        // 保存原始状态
        context.save();
        
        // 应用屏幕抖动
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake * 2;
            const shakeY = (Math.random() - 0.5) * this.screenShake * 2;
            context.translate(shakeX, shakeY);
        }
        
        // 渲染到离屏画布
        this.offscreenCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.offscreenCtx.save();
        
        // 应用颜色滤镜
        this.offscreenCtx.filter = `brightness(${this.colorFilter.r}) saturate(${(this.colorFilter.g + this.colorFilter.b) / 2})`;
        
        return this.offscreenCtx;
    }
    
    // 渲染后处理
    postRender(originalCtx, offscreenCtx) {
        if (!this.performance.enabledEffects) return;
        
        // 恢复离屏画布状态
        offscreenCtx.restore();
        
        // 复制到模糊画布用于辉光
        this.blurCtx.clearRect(0, 0, this.blurCanvas.width, this.blurCanvas.height);
        this.blurCtx.drawImage(this.offscreenCanvas, 0, 0, this.blurCanvas.width, this.blurCanvas.height);
        
        // 应用模糊（辉光效果）
        this.applyBlur(this.blurCtx, this.bloomIntensity * 10);
        
        // 绘制辉光层
        originalCtx.globalCompositeOperation = 'lighter';
        originalCtx.globalAlpha = this.bloomIntensity;
        originalCtx.drawImage(this.blurCanvas, 0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制主画面
        originalCtx.globalCompositeOperation = 'source-over';
        originalCtx.globalAlpha = 1;
        originalCtx.drawImage(this.offscreenCanvas, 0, 0);
        
        // 应用暗角效果
        this.applyVignette(originalCtx);
        
        // 应用色差效果
        if (this.chromaticAberration > 0) {
            this.applyChromaticAberration(originalCtx);
        }
        
        // 绘制粒子
        this.renderParticles(originalCtx);
        
        // 恢复原始画布状态
        originalCtx.restore();
    }
    
    applyBlur(context, radius) {
        // 简单的高斯模糊近似
        if (radius <= 0) return;
        
        context.save();
        
        // 多次应用滤镜以增强效果
        const iterations = Math.ceil(radius / 4);
        for (let i = 0; i < iterations; i++) {
            context.filter = `blur(${Math.min(4, radius)}px)`;
            context.drawImage(this.blurCanvas, 0, 0);
        }
        
        context.restore();
    }
    
    applyVignette(context) {
        if (this.vignetteIntensity <= 0) return;
        
        const gradient = context.createRadialGradient(
            this.canvas.width / 2,
            this.canvas.height / 2,
            0,
            this.canvas.width / 2,
            this.canvas.height / 2,
            Math.max(this.canvas.width, this.canvas.height) / 2
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${this.vignetteIntensity})`);
        
        context.save();
        context.globalCompositeOperation = 'multiply';
        context.fillStyle = gradient;
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        context.restore();
    }
    
    applyChromaticAberration(context) {
        const aberration = this.chromaticAberration;
        
        // 红色通道
        context.save();
        context.globalCompositeOperation = 'screen';
        context.globalAlpha = 0.33;
        context.filter = 'sepia(1) saturate(0) brightness(0.5)';
        context.drawImage(this.canvas, aberration, 0, this.canvas.width, this.canvas.height);
        context.restore();
        
        // 绿色通道
        context.save();
        context.globalCompositeOperation = 'screen';
        context.globalAlpha = 0.33;
        context.filter = 'hue-rotate(120deg) saturate(0) brightness(0.5)';
        context.drawImage(this.canvas, -aberration * 0.5, 0, this.canvas.width, this.canvas.height);
        context.restore();
        
        // 蓝色通道
        context.save();
        context.globalCompositeOperation = 'screen';
        context.globalAlpha = 0.33;
        context.filter = 'hue-rotate(240deg) saturate(0) brightness(0.5)';
        context.drawImage(this.canvas, 0, aberration, this.canvas.width, this.canvas.height);
        context.restore();
    }
    
    renderParticles(context) {
        if (this.particleSystems.length === 0) return;
        
        context.save();
        
        for (const system of this.particleSystems) {
            for (const particle of system.particles) {
                // 计算透明度
                const alpha = particle.life / particle.maxLife;
                
                context.save();
                context.translate(particle.x, particle.y);
                
                if (particle.rotation) {
                    context.rotate(particle.rotation);
                }
                
                // 绘制粒子
                context.globalAlpha = alpha;
                context.fillStyle = particle.color;
                
                if (particle.glow) {
                    // 辉光效果
                    context.shadowColor = particle.color;
                    context.shadowBlur = 10;
                }
                
                // 绘制粒子形状
                context.beginPath();
                context.arc(0, 0, particle.size, 0, Math.PI * 2);
                context.fill();
                
                // 绘制拖尾
                if (particle.trail) {
                    context.beginPath();
                    context.moveTo(-particle.vx * 2, -particle.vy * 2);
                    context.lineTo(0, 0);
                    context.strokeStyle = particle.color;
                    context.lineWidth = particle.size * 0.5;
                    context.stroke();
                }
                
                context.restore();
            }
        }
        
        context.restore();
    }
    
    // 工具方法
    createTrail(x, y, color, length = 5) {
        this.createParticles(x, y, 'magic', {
            count: 3,
            color,
            spread: 60,
            angle: 180
        });
    }
    
    createImpact(x, y, type = 'damage') {
        this.createParticles(x, y, type);
        this.applyScreenShake(type === 'damage' ? 15 : 5);
    }
    
    createHealingEffect(x, y) {
        this.createParticles(x, y, 'healing');
        this.applyScreenEffect('powerup', { duration: 200 });
    }
    
    createVictoryEffect(x, y) {
        this.createParticles(x, y, 'victory', { count: 100 });
        this.applyScreenEffect('victory', { duration: 1500 });
        this.applyScreenShake(20);
    }
    
    // 性能控制
    setQuality(quality) {
        this.performance.quality = Math.max(0.1, Math.min(1, quality));
        this.performance.enabledEffects = quality > 0.2;
        this.performance.maxParticles = Math.floor(500 * quality);
        
        if (!this.performance.enabledEffects) {
            // 禁用时清除所有特效
            this.particleSystems = [];
            this.effects = [];
        }
    }
    
    // 清屏
    clear() {
        this.particleSystems = [];
        this.effects = [];
        this.screenShake = 0;
        this.chromaticAberration = 0;
        this.bloomIntensity = 0;
        this.vignetteIntensity = 0.4;
        this.colorFilter = { r: 1, g: 1, b: 1, a: 1 };
        this.timeScale = 1.0;
    }
    
    // 销毁
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        this.clear();
        console.log('增强视觉效果系统已销毁');
    }
}

// 导出视觉效果系统实例
let visualEffects = null;

// 初始化函数
function initVisualEffects(canvas) {
    if (visualEffects) {
        visualEffects.destroy();
    }
    
    visualEffects = new EnhancedVisualEffects(canvas);
    return visualEffects;
}

// 导出公共接口
window.VisualEffects = {
    init: (canvas) => initVisualEffects(canvas),
    getInstance: () => visualEffects,
    preRender: (ctx) => visualEffects ? visualEffects.preRender(ctx) : ctx,
    postRender: (originalCtx, offscreenCtx) => visualEffects && visualEffects.postRender(originalCtx, offscreenCtx),
    createParticles: (x, y, preset, options) => visualEffects ? visualEffects.createParticles(x, y, preset, options) : null,
    applyScreenEffect: (effectName, options) => visualEffects && visualEffects.applyScreenEffect(effectName, options),
    applyScreenShake: (intensity) => visualEffects && visualEffects.applyScreenShake(intensity),
    createTrail: (x, y, color, length) => visualEffects && visualEffects.createTrail(x, y, color, length),
    createImpact: (x, y, type) => visualEffects && visualEffects.createImpact(x, y, type),
    createHealingEffect: (x, y) => visualEffects && visualEffects.createHealingEffect(x, y),
    createVictoryEffect: (x, y) => visualEffects && visualEffects.createVictoryEffect(x, y),
    setQuality: (quality) => visualEffects && visualEffects.setQuality(quality),
    clear: () => visualEffects && visualEffects.clear()
};
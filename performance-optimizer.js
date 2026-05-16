/**
 * 性能优化器 - 确保游戏在各类设备上流畅运行
 */

class PerformanceOptimizer {
    constructor() {
        // 性能监控
        this.metrics = {
            fps: 0,
            frameTime: 0,
            drawCalls: 0,
            particleCount: 0,
            memoryUsage: 0,
            lastFrameTime: 0
        };
        
        // 性能等级
        this.performanceLevel = 'high'; // high, medium, low
        this.autoDetectPerformance();
        
        // 优化设置
        this.settings = {
            targetFPS: 60,
            maxParticleCount: 500,
            enableShadows: true,
            enableGlow: true,
            enableScreenShake: true,
            enableChromaticAberration: true,
            enableVignette: true,
            enableBloom: true,
            enableParticles: true,
            enableAdvancedEffects: true,
            renderScale: 1.0,
            interpolation: true,
            objectCulling: true,
            lazyLoading: true
        };
        
        // 根据性能等级调整设置
        this.applyPerformanceSettings();
        
        // 监控循环
        this.monitoring = false;
        this.monitorInterval = null;
        
        // 帧率控制
        this.frameControl = {
            lastFrame: 0,
            frameDelay: 1000 / 60,
            frameSkip: 0,
            maxFrameSkip: 5
        };
        
        // 内存管理
        this.memoryWatcher = null;
        this.objectPool = new Map();
        
        // 初始化
        this.init();
    }
    
    init() {
        // 启动性能监控
        this.startMonitoring();
        
        // 初始化对象池
        this.initObjectPools();
        
        // 设置性能事件监听
        this.setupEventListeners();
        
        console.log(`性能优化器初始化完成 - 性能等级: ${this.performanceLevel}`);
        console.log('优化设置:', this.settings);
    }
    
    // 自动检测设备性能
    autoDetectPerformance() {
        try {
            // 检测硬件信息
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    console.log('GPU渲染器:', renderer);
                    
                    // 根据GPU型号判断性能
                    if (renderer.includes('Mali') || renderer.includes('Adreno 3') || renderer.includes('Intel HD Graphics 3000')) {
                        this.performanceLevel = 'low';
                    } else if (renderer.includes('Adreno 5') || renderer.includes('Intel HD Graphics 5000')) {
                        this.performanceLevel = 'medium';
                    }
                }
            }
            
            // 检测内存
            const memory = performance.memory;
            if (memory) {
                const totalMemory = memory.jsHeapSizeLimit / (1024 * 1024); // MB
                console.log('可用内存:', totalMemory, 'MB');
                
                if (totalMemory < 256) {
                    this.performanceLevel = 'low';
                } else if (totalMemory < 512) {
                    this.performanceLevel = 'medium';
                }
            }
            
            // 检测CPU核心数
            const cores = navigator.hardwareConcurrency || 4;
            console.log('CPU核心数:', cores);
            
            if (cores <= 2) {
                this.performanceLevel = 'low';
            } else if (cores <= 4) {
                this.performanceLevel = 'medium';
            }
            
            // 检测设备类型
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth > 768;
            
            if (isMobile && !isTablet) {
                this.performanceLevel = 'low';
            }
            
        } catch (error) {
            console.warn('性能检测失败，使用默认设置:', error);
        }
    }
    
    // 根据性能等级应用设置
    applyPerformanceSettings() {
        switch (this.performanceLevel) {
            case 'low':
                this.settings = {
                    ...this.settings,
                    maxParticleCount: 100,
                    enableShadows: false,
                    enableGlow: false,
                    enableScreenShake: false,
                    enableChromaticAberration: false,
                    enableVignette: false,
                    enableBloom: false,
                    enableParticles: false,
                    enableAdvancedEffects: false,
                    renderScale: 0.75,
                    interpolation: false,
                    objectCulling: true,
                    lazyLoading: true,
                    targetFPS: 30
                };
                break;
                
            case 'medium':
                this.settings = {
                    ...this.settings,
                    maxParticleCount: 250,
                    enableShadows: true,
                    enableGlow: false,
                    enableScreenShake: true,
                    enableChromaticAberration: false,
                    enableVignette: true,
                    enableBloom: false,
                    enableParticles: true,
                    enableAdvancedEffects: false,
                    renderScale: 1.0,
                    interpolation: true,
                    objectCulling: true,
                    lazyLoading: true,
                    targetFPS: 45
                };
                break;
                
            case 'high':
            default:
                // 使用默认设置
                break;
        }
        
        // 应用设置到子系统
        this.applySettingsToSubsystems();
    }
    
    applySettingsToSubsystems() {
        // 应用到视觉效果系统
        if (window.VisualEffects) {
            const quality = this.performanceLevel === 'low' ? 0.3 : 
                           this.performanceLevel === 'medium' ? 0.7 : 1.0;
            window.VisualEffects.setQuality(quality);
        }
        
        // 应用到游戏逻辑
        this.updateGameSettings();
    }
    
    updateGameSettings() {
        // 更新帧率控制
        this.frameControl.frameDelay = 1000 / this.settings.targetFPS;
        this.frameControl.maxFrameSkip = Math.max(1, 60 / this.settings.targetFPS);
    }
    
    // 性能监控
    startMonitoring() {
        if (this.monitoring) return;
        
        this.monitoring = true;
        this.metrics.lastFrameTime = performance.now();
        
        // 使用 requestAnimationFrame 监控帧率
        this.monitorLoop();
        
        // 使用 setInterval 监控内存（如果有API）
        if (performance.memory) {
            this.memoryWatcher = setInterval(() => {
                this.checkMemoryUsage();
            }, 5000);
        }
        
        console.log('性能监控已启动');
    }
    
    stopMonitoring() {
        this.monitoring = false;
        
        if (this.memoryWatcher) {
            clearInterval(this.memoryWatcher);
            this.memoryWatcher = null;
        }
        
        console.log('性能监控已停止');
    }
    
    monitorLoop() {
        if (!this.monitoring) return;
        
        const now = performance.now();
        const deltaTime = now - this.metrics.lastFrameTime;
        
        // 计算FPS
        this.metrics.fps = Math.round(1000 / deltaTime);
        this.metrics.frameTime = deltaTime;
        
        // 更新粒子数量（从视觉系统获取）
        if (window.VisualEffects && window.VisualEffects.getInstance()) {
            const visualEffects = window.VisualEffects.getInstance();
            this.metrics.particleCount = visualEffects.particleSystems.reduce(
                (sum, sys) => sum + sys.particles.length, 0
            );
        }
        
        // 更新内存使用
        if (performance.memory) {
            this.metrics.memoryUsage = performance.memory.usedJSHeapSize / (1024 * 1024);
        }
        
        // 检查性能下降
        if (this.metrics.fps < this.settings.targetFPS * 0.8) {
            this.handlePerformanceDrop();
        }
        
        this.metrics.lastFrameTime = now;
        
        // 继续监控
        requestAnimationFrame(() => this.monitorLoop());
    }
    
    checkMemoryUsage() {
        if (!performance.memory) return;
        
        const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
        const usagePercent = (usedJSHeapSize / jsHeapSizeLimit) * 100;
        
        if (usagePercent > 80) {
            console.warn('内存使用过高:', usagePercent.toFixed(2) + '%');
            this.triggerGarbageCollection();
        }
    }
    
    handlePerformanceDrop() {
        console.warn('性能下降，FPS:', this.metrics.fps);
        
        // 动态调整质量
        if (this.metrics.fps < 20 && this.settings.enableAdvancedEffects) {
            console.log('禁用高级特效以提高性能');
            this.settings.enableAdvancedEffects = false;
            this.applySettingsToSubsystems();
        }
        
        if (this.metrics.fps < 15 && this.settings.enableParticles) {
            console.log('禁用粒子效果以提高性能');
            this.settings.enableParticles = false;
            if (window.VisualEffects) {
                window.VisualEffects.clear();
            }
        }
    }
    
    // 对象池管理
    initObjectPools() {
        // 粒子对象池
        this.objectPool.set('particle', {
            pool: [],
            maxSize: 1000,
            create: () => ({
                x: 0, y: 0, vx: 0, vy: 0,
                size: 0, life: 0, maxLife: 0,
                color: '#ffffff', gravity: 0
            }),
            reset: (obj) => {
                obj.x = 0; obj.y = 0; obj.vx = 0; obj.vy = 0;
                obj.size = 0; obj.life = 0; obj.maxLife = 0;
                obj.color = '#ffffff'; obj.gravity = 0;
            }
        });
        
        // 游戏对象池（可以扩展）
        this.objectPool.set('gameObject', {
            pool: [],
            maxSize: 100,
            create: () => ({
                x: 0, y: 0, width: 0, height: 0,
                type: '', active: false
            }),
            reset: (obj) => {
                obj.x = 0; obj.y = 0; obj.width = 0; obj.height = 0;
                obj.type = ''; obj.active = false;
            }
        });
    }
    
    getFromPool(type) {
        const poolConfig = this.objectPool.get(type);
        if (!poolConfig) return null;
        
        if (poolConfig.pool.length > 0) {
            return poolConfig.pool.pop();
        }
        
        return poolConfig.create();
    }
    
    returnToPool(type, obj) {
        const poolConfig = this.objectPool.get(type);
        if (!poolConfig) return;
        
        if (poolConfig.pool.length < poolConfig.maxSize) {
            poolConfig.reset(obj);
            poolConfig.pool.push(obj);
        }
    }
    
    // 帧率控制
    shouldSkipFrame() {
        const now = performance.now();
        const shouldSkip = now - this.frameControl.lastFrame < this.frameControl.frameDelay;
        
        if (!shouldSkip) {
            this.frameControl.lastFrame = now;
            this.frameControl.frameSkip = 0;
        } else {
            this.frameControl.frameSkip++;
        }
        
        return shouldSkip && this.frameControl.frameSkip <= this.frameControl.maxFrameSkip;
    }
    
    // 对象剔除（只渲染可见对象）
    isObjectVisible(obj, camera, canvas) {
        if (!this.settings.objectCulling) return true;
        
        const margin = 100; // 额外边距
        
        return obj.x + obj.width > camera.x - margin &&
               obj.x < camera.x + canvas.width + margin &&
               obj.y + obj.height > camera.y - margin &&
               obj.y < camera.y + canvas.height + margin;
    }
    
    // 延迟加载
    loadResource(url, type) {
        if (!this.settings.lazyLoading) {
            return Promise.resolve(url);
        }
        
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(url);
            img.src = url;
        });
    }
    
    // 垃圾回收提示
    triggerGarbageCollection() {
        // 清理对象池
        this.objectPool.forEach((config, type) => {
            if (config.pool.length > config.maxSize * 0.5) {
                config.pool.length = Math.floor(config.maxSize * 0.5);
            }
        });
        
        // 提示浏览器进行垃圾回收（如果支持）
        if (window.gc) {
            window.gc();
        }
        
        console.log('触发垃圾回收');
    }
    
    // 画布优化
    optimizeCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        
        // 禁用图像平滑（提高性能）
        if (this.performanceLevel === 'low') {
            ctx.imageSmoothingEnabled = false;
        }
        
        // 设置渲染缩放
        if (this.settings.renderScale !== 1.0) {
            canvas.width = canvas.width * this.settings.renderScale;
            canvas.height = canvas.height * this.settings.renderScale;
            ctx.scale(this.settings.renderScale, this.settings.renderScale);
        }
        
        return ctx;
    }
    
    // 批量渲染优化
    batchRender(objects, renderFunction) {
        if (!this.settings.interpolation) {
            objects.forEach(renderFunction);
            return;
        }
        
        // 按材质/颜色分组渲染（减少状态切换）
        const batches = new Map();
        
        objects.forEach(obj => {
            const key = obj.color || obj.type || 'default';
            if (!batches.has(key)) {
                batches.set(key, []);
            }
            batches.get(key).push(obj);
        });
        
        batches.forEach((batch) => {
            // 批量渲染相同类型的对象
            renderFunction(batch);
        });
    }
    
    // 事件监听器
    setupEventListeners() {
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopMonitoring();
            } else {
                this.startMonitoring();
            }
        });
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // 监听内存警告（某些移动设备）
        if ('memorypressure' in window) {
            window.addEventListener('memorypressure', () => {
                console.warn('内存压力警告');
                this.handleMemoryPressure();
            });
        }
    }
    
    handleResize() {
        // 重新评估性能
        setTimeout(() => {
            this.autoDetectPerformance();
            this.applyPerformanceSettings();
        }, 100);
    }
    
    handleMemoryPressure() {
        // 紧急降低质量
        this.performanceLevel = 'low';
        this.applyPerformanceSettings();
        
        // 清理所有非必要资源
        if (window.VisualEffects) {
            window.VisualEffects.clear();
        }
        
        this.triggerGarbageCollection();
    }
    
    // 设置性能等级
    setPerformanceLevel(level) {
        if (['low', 'medium', 'high'].includes(level)) {
            this.performanceLevel = level;
            this.applyPerformanceSettings();
            console.log(`性能等级已设置为: ${level}`);
        }
    }
    
    // 获取性能数据
    getPerformanceMetrics() {
        return {
            ...this.metrics,
            performanceLevel: this.performanceLevel,
            settings: this.settings
        };
    }
    
    // 创建性能监视器UI
    createPerformanceMonitor() {
        const monitor = document.createElement('div');
        monitor.id = 'performance-monitor';
        monitor.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            display: none;
        `;
        
        document.body.appendChild(monitor);
        
        // 更新显示
        setInterval(() => {
            if (monitor.style.display !== 'none') {
                const metrics = this.getPerformanceMetrics();
                monitor.innerHTML = `
                    FPS: ${metrics.fps}<br>
                    Frame Time: ${metrics.frameTime.toFixed(2)}ms<br>
                    Particles: ${metrics.particleCount}<br>
                    Memory: ${metrics.memoryUsage ? metrics.memoryUsage.toFixed(2) + 'MB' : 'N/A'}<br>
                    Level: ${metrics.performanceLevel.toUpperCase()}
                `;
            }
        }, 100);
        
        // 切换显示（按 F3）
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F3') {
                monitor.style.display = monitor.style.display === 'none' ? 'block' : 'none';
            }
        });
        
        return monitor;
    }
    
    // 清理
    destroy() {
        this.stopMonitoring();
        
        if (this.memoryWatcher) {
            clearInterval(this.memoryWatcher);
        }
        
        // 清理对象池
        this.objectPool.clear();
        
        console.log('性能优化器已清理');
    }
}

// 导出性能优化器实例
const performanceOptimizer = new PerformanceOptimizer();

// 导出公共接口
window.PerformanceOptimizer = {
    // 设置
    setPerformanceLevel: (level) => performanceOptimizer.setPerformanceLevel(level),
    getPerformanceMetrics: () => performanceOptimizer.getPerformanceMetrics(),
    
    // 对象池
    getFromPool: (type) => performanceOptimizer.getFromPool(type),
    returnToPool: (type, obj) => performanceOptimizer.returnToPool(type, obj),
    
    // 渲染优化
    shouldSkipFrame: () => performanceOptimizer.shouldSkipFrame(),
    isObjectVisible: (obj, camera, canvas) => performanceOptimizer.isObjectVisible(obj, camera, canvas),
    optimizeCanvas: (canvas) => performanceOptimizer.optimizeCanvas(canvas),
    batchRender: (objects, renderFunction) => performanceOptimizer.batchRender(objects, renderFunction),
    
    // 性能监视器
    createPerformanceMonitor: () => performanceOptimizer.createPerformanceMonitor(),
    
    // 清理
    destroy: () => performanceOptimizer.destroy()
};

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    performanceOptimizer.destroy();
});
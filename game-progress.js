/**
 * 游戏进度系统 - 管理存档、成就和游戏统计
 */

class GameProgressSystem {
    constructor() {
        this.storageKey = 'game_adventure_progress';
        this.currentProgress = this.loadProgress();
        this.achievements = this.initializeAchievements();
        this.stats = this.currentProgress.stats || this.initializeStats();
        
        // 成就解锁回调
        this.achievementCallbacks = [];
        
        // 自动保存定时器
        this.autoSaveInterval = null;
        
        // 初始化
        this.init();
    }
    
    init() {
        // 开始自动保存
        this.startAutoSave();
        
        console.log('游戏进度系统初始化成功');
        console.log('当前进度:', this.currentProgress);
    }
    
    // 初始化默认进度
    getDefaultProgress() {
        return {
            version: '1.0.0',
            lastPlayed: new Date().toISOString(),
            
            // 游戏进度
            progress: {
                maxLevelReached: 1,
                currentLevel: 1,
                unlockedLevels: [1],
                starsCollected: [], // [{level: 1, starId: 0}, ...]
                totalStars: 0
            },
            
            // 玩家数据
            player: {
                lives: 3,
                score: 0,
                highScore: 0,
                playTime: 0, // 总游戏时间（秒）
                deaths: 0,
                jumps: 0,
                itemsCollected: 0
            },
            
            // 游戏设置
            settings: {
                masterVolume: 0.7,
                bgmVolume: 0.5,
                sfxVolume: 0.8,
                quality: 1.0,
                difficulty: 'normal', // easy, normal, hard
                language: 'zh-CN'
            },
            
            // 统计数据
            stats: this.initializeStats(),
            
            // 成就
            achievements: {},
            
            // 时间记录
            timestamps: {
                firstPlay: new Date().toISOString(),
                lastSave: new Date().toISOString(),
                levelTimes: {} // {level: {bestTime: 0, attempts: 0}}
            }
        };
    }
    
    initializeStats() {
        return {
            totalGamesPlayed: 0,
            totalLevelsCompleted: 0,
            totalStarsCollected: 0,
            totalPlayTime: 0,
            totalDeaths: 0,
            totalJumps: 0,
            totalItemsCollected: 0,
            perfectRuns: 0, // 无伤通关
            speedRuns: 0,   // 快速通关
            
            // 最佳记录
            bestTimes: {}, // 每关最快通关时间
            fewestDeaths: {}, // 每关最少死亡次数
            
            // 游戏偏好
            favoriteLevel: 1,
            mostPlayedLevel: 1,
            levelPlayCounts: {1: 0, 2: 0, 3: 0}
        };
    }
    
    initializeAchievements() {
        return {
            // 进度类
            'first_steps': {
                id: 'first_steps',
                name: '初次启程',
                description: '完成第一关',
                icon: '🎮',
                category: 'progress',
                requirement: 1,
                current: 0,
                unlocked: false,
                points: 10
            },
            'level_master': {
                id: 'level_master',
                name: '关卡大师',
                description: '通关所有关卡',
                icon: '🏆',
                category: 'progress',
                requirement: 3,
                current: 0,
                unlocked: false,
                points: 50
            },
            
            // 收集类
            'star_collector_1': {
                id: 'star_collector_1',
                name: '星光收集者',
                description: '收集5个星光碎片',
                icon: '⭐',
                category: 'collection',
                requirement: 5,
                current: 0,
                unlocked: false,
                points: 20
            },
            'star_collector_2': {
                id: 'star_collector_2',
                name: '星光大师',
                description: '收集全部星光碎片',
                icon: '✨',
                category: 'collection',
                requirement: 15, // 3关 * 5星
                current: 0,
                unlocked: false,
                points: 100
            },
            
            // 技巧类
            'no_damage': {
                id: 'no_damage',
                name: '无伤通关',
                description: '在不受伤的情况下完成一关',
                icon: '🛡️',
                category: 'skill',
                requirement: 1,
                current: 0,
                unlocked: false,
                points: 30
            },
            'speed_runner': {
                id: 'speed_runner',
                name: '极速通关',
                description: '在60秒内完成任意关卡',
                icon: '⚡',
                category: 'skill',
                requirement: 60, // 秒数
                current: Number.MAX_VALUE,
                unlocked: false,
                points: 40,
                type: 'less_than'
            },
            'jump_master': {
                id: 'jump_master',
                name: '跳跃大师',
                description: '累计跳跃100次',
                icon: '🦘',
                category: 'skill',
                requirement: 100,
                current: 0,
                unlocked: false,
                points: 25
            },
            
            // 毅力类
            'persistent': {
                id: 'persistent',
                name: '坚持不懈',
                description: '死亡累计50次',
                icon: '💀',
                category: 'endurance',
                requirement: 50,
                current: 0,
                unlocked: false,
                points: 15
            },
            
            // 探索类
            'secret_finder': {
                id: 'secret_finder',
                name: '秘密探索者',
                description: '找到所有隐藏要素',
                icon: '🔍',
                category: 'exploration',
                requirement: 1,
                current: 0,
                unlocked: false,
                points: 80
            }
        };
    }
    
    // 加载进度
    loadProgress() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const progress = JSON.parse(saved);
                
                // 版本检查和迁移
                if (progress.version !== '1.0.0') {
                    return this.migrateProgress(progress);
                }
                
                return progress;
            }
        } catch (error) {
            console.error('加载进度失败:', error);
        }
        
        return this.getDefaultProgress();
    }
    
    // 迁移旧版本进度
    migrateProgress(oldProgress) {
        console.log('迁移旧版本进度:', oldProgress.version);
        
        const newProgress = this.getDefaultProgress();
        
        // 保留旧数据
        if (oldProgress.progress) {
            newProgress.progress = { ...newProgress.progress, ...oldProgress.progress };
        }
        if (oldProgress.player) {
            newProgress.player = { ...newProgress.player, ...oldProgress.player };
        }
        if (oldProgress.settings) {
            newProgress.settings = { ...newProgress.settings, ...oldProgress.settings };
        }
        if (oldProgress.stats) {
            newProgress.stats = { ...newProgress.stats, ...oldProgress.stats };
        }
        if (oldProgress.achievements) {
            newProgress.achievements = { ...oldProgress.achievements, ...oldProgress.achievements };
        }
        
        return newProgress;
    }
    
    // 保存进度
    saveProgress() {
        try {
            // 更新最后保存时间
            this.currentProgress.timestamps.lastSave = new Date().toISOString();
            this.currentProgress.lastPlayed = new Date().toISOString();
            
            localStorage.setItem(this.storageKey, JSON.stringify(this.currentProgress));
            console.log('游戏进度已保存');
            
            return true;
        } catch (error) {
            console.error('保存进度失败:', error);
            return false;
        }
    }
    
    // 自动保存
    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        // 每30秒自动保存一次
        this.autoSaveInterval = setInterval(() => {
            this.saveProgress();
        }, 30000);
        
        console.log('自动保存已启动');
    }
    
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('自动保存已停止');
        }
    }
    
    // 关卡进度
    completeLevel(level, data = {}) {
        const levelKey = `level_${level}`;
        const now = Date.now();
        
        // 更新最大关卡
        this.currentProgress.progress.maxLevelReached = Math.max(
            this.currentProgress.progress.maxLevelReached,
            level
        );
        
        // 解锁下一关
        if (level < 3) {
            this.currentProgress.progress.unlockedLevels = [...new Set([
                ...this.currentProgress.progress.unlockedLevels,
                level + 1
            ])];
        }
        
        // 更新关卡时间记录
        if (!this.currentProgress.timestamps.levelTimes[levelKey]) {
            this.currentProgress.timestamps.levelTimes[levelKey] = {
                bestTime: Number.MAX_VALUE,
                attempts: 0,
                firstClear: now
            };
        }
        
        const levelTime = this.currentProgress.timestamps.levelTimes[levelKey];
        levelTime.attempts++;
        levelTime.lastClear = now;
        
        // 计算通关时间
        if (data.startTime) {
            const completionTime = (now - data.startTime) / 1000;
            
            // 更新最佳时间
            if (completionTime < levelTime.bestTime) {
                levelTime.bestTime = completionTime;
                this.currentProgress.stats.bestTimes[level] = completionTime;
                
                // 检查极速通关成就
                if (completionTime <= 60) {
                    this.checkAchievement('speed_runner', completionTime);
                    this.currentProgress.stats.speedRuns++;
                }
            }
        }
        
        // 更新统计数据
        this.currentProgress.stats.totalLevelsCompleted++;
        this.currentProgress.stats.levelPlayCounts[level] = 
            (this.currentProgress.stats.levelPlayCounts[level] || 0) + 1;
        
        // 检查完美通关
        if (data.noDamage) {
            this.currentProgress.stats.perfectRuns++;
            this.checkAchievement('no_damage', 1);
        }
        
        // 检查成就
        this.checkAchievement('first_steps', level);
        this.checkAchievement('level_master', this.currentProgress.stats.totalLevelsCompleted);
        
        console.log(`关卡 ${level} 完成`, data);
        
        // 保存
        this.saveProgress();
    }
    
    // 收集星光碎片
    collectStar(level, starId) {
        const starKey = `${level}_${starId}`;
        
        // 检查是否已收集
        const alreadyCollected = this.currentProgress.progress.starsCollected.some(
            star => star.level === level && star.starId === starId
        );
        
        if (!alreadyCollected) {
            this.currentProgress.progress.starsCollected.push({
                level,
                starId,
                collectedAt: new Date().toISOString()
            });
            
            this.currentProgress.progress.totalStars++;
            this.currentProgress.player.itemsCollected++;
            this.currentProgress.stats.totalStarsCollected++;
            
            // 检查成就
            this.checkAchievement('star_collector_1', this.currentProgress.progress.totalStars);
            this.checkAchievement('star_collector_2', this.currentProgress.progress.totalStars);
            
            console.log(`收集星光碎片: 关卡${level}, 编号${starId}`);
            
            // 保存
            this.saveProgress();
            
            return true;
        }
        
        return false;
    }
    
    // 更新玩家数据
    updatePlayerStats(stats) {
        Object.assign(this.currentProgress.player, stats);
        
        // 更新统计数据
        if (stats.deaths !== undefined) {
            this.currentProgress.stats.totalDeaths = stats.deaths;
            this.checkAchievement('persistent', stats.deaths);
        }
        
        if (stats.jumps !== undefined) {
            this.currentProgress.stats.totalJumps = stats.jumps;
            this.checkAchievement('jump_master', stats.jumps);
        }
        
        if (stats.score !== undefined) {
            this.currentProgress.player.highScore = Math.max(
                this.currentProgress.player.highScore,
                stats.score
            );
        }
        
        // 实时保存关键数据
        if (stats.deaths !== undefined || stats.jumps !== undefined) {
            this.saveProgress();
        }
    }
    
    // 成就系统
    checkAchievement(achievementId, value) {
        const achievement = this.achievements[achievementId];
        if (!achievement || achievement.unlocked) return false;
        
        const oldValue = achievement.current;
        
        // 根据类型检查
        if (achievement.type === 'less_than') {
            // 越小越好（如时间）
            achievement.current = Math.min(achievement.current, value);
            if (achievement.current <= achievement.requirement && oldValue > achievement.requirement) {
                return this.unlockAchievement(achievementId);
            }
        } else {
            // 越大越好（默认）
            achievement.current = Math.max(achievement.current, value);
            if (achievement.current >= achievement.requirement && oldValue < achievement.requirement) {
                return this.unlockAchievement(achievementId);
            }
        }
        
        return false;
    }
    
    unlockAchievement(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement || achievement.unlocked) return false;
        
        achievement.unlocked = true;
        achievement.unlockedAt = new Date().toISOString();
        
        // 保存到进度
        this.currentProgress.achievements[achievementId] = {
            unlocked: true,
            unlockedAt: achievement.unlockedAt
        };
        
        // 触发回调
        this.achievementCallbacks.forEach(callback => {
            callback(achievement);
        });
        
        console.log(`成就解锁: ${achievement.name} (${achievementId})`);
        
        // 保存
        this.saveProgress();
        
        return true;
    }
    
    // 获取成就列表
    getAchievements(category = null) {
        if (category) {
            return Object.values(this.achievements).filter(
                achievement => achievement.category === category
            );
        }
        
        return Object.values(this.achievements);
    }
    
    getUnlockedAchievements() {
        return Object.values(this.achievements).filter(
            achievement => achievement.unlocked
        );
    }
    
    getLockedAchievements() {
        return Object.values(this.achievements).filter(
            achievement => !achievement.unlocked
        );
    }
    
    // 成就点数
    getTotalPoints() {
        return Object.values(this.achievements).reduce((sum, achievement) => {
            return sum + (achievement.unlocked ? achievement.points : 0);
        }, 0);
    }
    
    getMaxPoints() {
        return Object.values(this.achievements).reduce((sum, achievement) => {
            return sum + achievement.points;
        }, 0);
    }
    
    // 注册成就回调
    onAchievementUnlock(callback) {
        this.achievementCallbacks.push(callback);
    }
    
    // 游戏设置
    updateSettings(settings) {
        Object.assign(this.currentProgress.settings, settings);
        this.saveProgress();
        
        // 应用音频设置
        if (window.AudioSystem) {
            if (settings.masterVolume !== undefined) {
                window.AudioSystem.setMasterVolume(settings.masterVolume);
            }
            if (settings.bgmVolume !== undefined) {
                window.AudioSystem.setBGMVolume(settings.bgmVolume);
            }
            if (settings.sfxVolume !== undefined) {
                window.AudioSystem.setSFXVolume(settings.sfxVolume);
            }
        }
        
        // 应用画质设置
        if (settings.quality !== undefined && window.VisualEffects) {
            window.VisualEffects.setQuality(settings.quality);
        }
    }
    
    // 获取当前进度数据
    getCurrentProgress() {
        return this.currentProgress;
    }
    
    // 重置进度
    resetProgress() {
        if (confirm('确定要重置所有游戏进度吗？此操作不可恢复。')) {
            this.currentProgress = this.getDefaultProgress();
            this.saveProgress();
            
            // 重新初始化成就
            this.achievements = this.initializeAchievements();
            
            console.log('游戏进度已重置');
            return true;
        }
        
        return false;
    }
    
    // 导出进度（备份）
    exportProgress() {
        return JSON.stringify(this.currentProgress, null, 2);
    }
    
    // 导入进度（恢复）
    importProgress(jsonData) {
        try {
            const progress = JSON.parse(jsonData);
            
            // 验证数据完整性
            if (!progress.version || !progress.progress || !progress.player) {
                throw new Error('无效的进度数据');
            }
            
            this.currentProgress = progress;
            this.saveProgress();
            
            console.log('游戏进度已导入');
            return true;
        } catch (error) {
            console.error('导入进度失败:', error);
            return false;
        }
    }
    
    // 获取统计摘要
    getStatsSummary() {
        const stats = this.currentProgress.stats;
        const player = this.currentProgress.player;
        
        return {
            totalGames: stats.totalGamesPlayed,
            totalLevels: stats.totalLevelsCompleted,
            totalStars: stats.totalStarsCollected,
            totalTime: this.formatTime(stats.totalPlayTime),
            highScore: player.highScore,
            achievements: this.getUnlockedAchievements().length,
            totalAchievements: Object.keys(this.achievements).length,
            points: this.getTotalPoints(),
            maxPoints: this.getMaxPoints()
        };
    }
    
    // 格式化时间
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}小时${minutes}分钟`;
        } else if (minutes > 0) {
            return `${minutes}分钟${secs}秒`;
        } else {
            return `${secs}秒`;
        }
    }
    
    // 清理（页面卸载时调用）
    destroy() {
        this.stopAutoSave();
        this.saveProgress();
        console.log('游戏进度系统已清理');
    }
}

// 导出进度系统实例
const gameProgress = new GameProgressSystem();

// 页面卸载时自动保存
window.addEventListener('beforeunload', () => {
    gameProgress.destroy();
});

// 导出公共接口
window.GameProgress = {
    // 进度管理
    completeLevel: (level, data) => gameProgress.completeLevel(level, data),
    collectStar: (level, starId) => gameProgress.collectStar(level, starId),
    updatePlayerStats: (stats) => gameProgress.updatePlayerStats(stats),
    getCurrentProgress: () => gameProgress.getCurrentProgress(),
    
    // 设置管理
    updateSettings: (settings) => gameProgress.updateSettings(settings),
    
    // 成就系统
    getAchievements: (category) => gameProgress.getAchievements(category),
    getUnlockedAchievements: () => gameProgress.getUnlockedAchievements(),
    getLockedAchievements: () => gameProgress.getLockedAchievements(),
    onAchievementUnlock: (callback) => gameProgress.onAchievementUnlock(callback),
    getTotalPoints: () => gameProgress.getTotalPoints(),
    getMaxPoints: () => gameProgress.getMaxPoints(),
    
    // 统计数据
    getStatsSummary: () => gameProgress.getStatsSummary(),
    
    // 导入/导出
    exportProgress: () => gameProgress.exportProgress(),
    importProgress: (jsonData) => gameProgress.importProgress(jsonData),
    resetProgress: () => gameProgress.resetProgress(),
    
    // 工具函数
    save: () => gameProgress.saveProgress(),
    load: () => gameProgress.loadProgress()
};
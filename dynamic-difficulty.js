/**
 * 动态难度系统 - Dynamic Difficulty System
 * 根据玩家表现实时调整游戏难度
 * 提供平滑的难度过渡和智能的挑战调整
 */

class DynamicDifficultySystem {
  constructor(config = {}) {
    // 系统配置
    this.config = {
      minDifficulty: 0,    // 最低难度
      maxDifficulty: 5,    // 最高难度
      initialDifficulty: 2, // 初始难度（中等）
      adjustmentInterval: 30, // 调整间隔（秒）
      maxAdjustmentStep: 1,  // 单次最大调整幅度
      smoothingFactor: 0.3,   // 平滑过渡系数
      ...config
    };
    
    // 当前状态
    this.currentDifficulty = this.config.initialDifficulty;
    this.targetDifficulty = this.config.initialDifficulty;
    this.difficultyTransition = 0; // 0-1 过渡进度
    this.lastAdjustmentTime = 0;
    
    // 玩家表现数据
    this.performanceMetrics = {
      // 生存时间相关
      survivalTime: 0,
      maxSurvivalTime: 0,
      survivalRate: 0,
      
      // 收集效率
      itemsCollected: 0,
      itemsAvailable: 0,
      collectionRate: 0,
      
      // 回避能力
      enemyEncounters: 0,
      successfulDodges: 0,
      dodgeRate: 0,
      
      // 连击表现
      comboCount: 0,
      maxCombo: 0,
      comboEfficiency: 0,
      
      // 道具使用
      itemsUsed: 0,
      itemsEffective: 0,
      itemEfficiency: 0,
      
      // 综合评分
      overallScore: 0
    };
    
    // 难度参数映射
    this.difficultyParams = {
      0: { // 新手友好
        name: 'Very Easy',
        enemySpeed: 0.7,
        enemyCount: 0.6,
        itemSpawnRate: 1.5,
        platformSpacing: 0.8,
        gameSpeed: 0.9,
        enemyAILevel: 0.5
      },
      1: { // 简单
        name: 'Easy',
        enemySpeed: 0.85,
        enemyCount: 0.75,
        itemSpawnRate: 1.2,
        platformSpacing: 0.9,
        gameSpeed: 0.95,
        enemyAILevel: 0.7
      },
      2: { // 中等（默认）
        name: 'Normal',
        enemySpeed: 1.0,
        enemyCount: 1.0,
        itemSpawnRate: 1.0,
        platformSpacing: 1.0,
        gameSpeed: 1.0,
        enemyAILevel: 1.0
      },
      3: { // 困难
        name: 'Hard',
        enemySpeed: 1.2,
        enemyCount: 1.3,
        itemSpawnRate: 0.8,
        platformSpacing: 1.1,
        gameSpeed: 1.1,
        enemyAILevel: 1.3
      },
      4: { // 专家
        name: 'Expert',
        enemySpeed: 1.4,
        enemyCount: 1.6,
        itemSpawnRate: 0.6,
        platformSpacing: 1.2,
        gameSpeed: 1.2,
        enemyAILevel: 1.6
      },
      5: { // 大师
        name: 'Master',
        enemySpeed: 1.6,
        enemyCount: 2.0,
        itemSpawnRate: 0.4,
        platformSpacing: 1.3,
        gameSpeed: 1.2,
        enemyAILevel: 2.0
      }
    };
    
    // 权重配置
    this.performanceWeights = {
      survivalTime: 0.25,     // 25%
      collectionRate: 0.25,   // 25%
      dodgeRate: 0.20,        // 20%
      comboEfficiency: 0.15,  // 15%
      itemEfficiency: 0.15    // 15%
    };
    
    // 调整历史
    this.adjustmentHistory = [];
    this.maxHistorySize = 20;
    
    // 事件监听器
    this.eventListeners = new Map();
  }
  
  /**
   * 更新系统状态
   * @param {number} deltaTime - 时间增量（秒）
   * @param {Object} gameState - 当前游戏状态
   */
  update(deltaTime, gameState) {
    // 更新生存时间
    this.performanceMetrics.survivalTime += deltaTime;
    if (this.performanceMetrics.survivalTime > this.performanceMetrics.maxSurvivalTime) {
      this.performanceMetrics.maxSurvivalTime = this.performanceMetrics.survivalTime;
    }
    
    // 更新难度过渡
    if (this.currentDifficulty !== this.targetDifficulty) {
      this.difficultyTransition += deltaTime * this.config.smoothingFactor;
      if (this.difficultyTransition >= 1) {
        this.difficultyTransition = 1;
        this.currentDifficulty = this.targetDifficulty;
        this.triggerEvent('difficultyChanged', {
          from: this.currentDifficulty,
          to: this.targetDifficulty,
          instant: false
        });
      }
    }
    
    // 定期检查是否需要调整难度
    this.lastAdjustmentTime += deltaTime;
    if (this.lastAdjustmentTime >= this.config.adjustmentInterval) {
      this.evaluateAndAdjust();
      this.lastAdjustmentTime = 0;
    }
  }
  
  /**
   * 记录玩家行为
   * @param {string} action - 行为类型
   * @param {Object} data - 相关数据
   */
  recordAction(action, data = {}) {
    switch (action) {
      case 'item_collected':
        this.performanceMetrics.itemsCollected++;
        this.updateCollectionRate();
        break;
        
      case 'item_spawned':
        this.performanceMetrics.itemsAvailable++;
        this.updateCollectionRate();
        break;
        
      case 'enemy_encounter':
        this.performanceMetrics.enemyEncounters++;
        break;
        
      case 'successful_dodge':
        this.performanceMetrics.successfulDodges++;
        this.updateDodgeRate();
        break;
        
      case 'combo_start':
        this.performanceMetrics.comboCount = 1;
        break;
        
      case 'combo_increment':
        this.performanceMetrics.comboCount++;
        if (this.performanceMetrics.comboCount > this.performanceMetrics.maxCombo) {
          this.performanceMetrics.maxCombo = this.performanceMetrics.comboCount;
        }
        this.updateComboEfficiency();
        break;
        
      case 'combo_end':
        this.updateComboEfficiency();
        this.performanceMetrics.comboCount = 0;
        break;
        
      case 'item_used':
        this.performanceMetrics.itemsUsed++;
        if (data.effective) {
          this.performanceMetrics.itemsEffective++;
        }
        this.updateItemEfficiency();
        break;
    }
  }
  
  /**
   * 更新收集效率
   */
  updateCollectionRate() {
    if (this.performanceMetrics.itemsAvailable > 0) {
      this.performanceMetrics.collectionRate = 
        this.performanceMetrics.itemsCollected / this.performanceMetrics.itemsAvailable;
    }
  }
  
  /**
   * 更新回避率
   */
  updateDodgeRate() {
    if (this.performanceMetrics.enemyEncounters > 0) {
      this.performanceMetrics.dodgeRate = 
        this.performanceMetrics.successfulDodges / this.performanceMetrics.enemyEncounters;
    }
  }
  
  /**
   * 更新连击效率
   */
  updateComboEfficiency() {
    // 连击效率 = 当前连击数 / 最大可能连击数（基于时间）
    const maxPossibleCombo = Math.floor(this.performanceMetrics.survivalTime / 5) + 1;
    this.performanceMetrics.comboEfficiency = 
      Math.min(this.performanceMetrics.comboCount / maxPossibleCombo, 1);
  }
  
  /**
   * 更新道具使用效率
   */
  updateItemEfficiency() {
    if (this.performanceMetrics.itemsUsed > 0) {
      this.performanceMetrics.itemEfficiency = 
        this.performanceMetrics.itemsEffective / this.performanceMetrics.itemsUsed;
    }
  }
  
  /**
   * 计算综合表现分数
   * @returns {number} 0-1 之间的分数
   */
  calculatePerformanceScore() {
    // 归一化各项指标（0-1）
    const normalizedSurvival = Math.min(this.performanceMetrics.survivalTime / 300, 1); // 5分钟满分
    const normalizedCollection = this.performanceMetrics.collectionRate;
    const normalizedDodge = this.performanceMetrics.dodgeRate;
    const normalizedCombo = this.performanceMetrics.comboEfficiency;
    const normalizedItem = this.performanceMetrics.itemEfficiency;
    
    // 加权计算总分
    const score = 
      normalizedSurvival * this.performanceWeights.survivalTime +
      normalizedCollection * this.performanceWeights.collectionRate +
      normalizedDodge * this.performanceWeights.dodgeRate +
      normalizedCombo * this.performanceWeights.comboEfficiency +
      normalizedItem * this.performanceWeights.itemEfficiency;
    
    this.performanceMetrics.overallScore = score;
    return score;
  }
  
  /**
   * 评估并调整难度
   */
  evaluateAndAdjust() {
    const score = this.calculatePerformanceScore();
    
    // 根据表现分数建议难度调整
    let suggestedAdjustment = 0;
    
    if (score > 0.8) {
      // 表现优秀：提高难度
      suggestedAdjustment = 1;
    } else if (score > 0.6) {
      // 表现良好：略微提高难度
      suggestedAdjustment = 0.5;
    } else if (score < 0.3) {
      // 表现较差：降低难度
      suggestedAdjustment = -1;
    } else if (score < 0.5) {
      // 表现一般：略微降低难度
      suggestedAdjustment = -0.5;
    }
    // 0.5-0.6之间：保持当前难度
    
    // 应用调整
    this.applyAdjustment(suggestedAdjustment);
    
    // 记录历史
    this.recordAdjustment({
      timestamp: Date.now(),
      score,
      suggestedAdjustment,
      currentDifficulty: this.currentDifficulty,
      targetDifficulty: this.targetDifficulty,
      metrics: { ...this.performanceMetrics }
    });
    
    // 触发事件
    this.triggerEvent('difficultyEvaluation', {
      score,
      suggestedAdjustment,
      currentDifficulty: this.currentDifficulty,
      targetDifficulty: this.targetDifficulty
    });
  }
  
  /**
   * 应用难度调整
   * @param {number} adjustment - 调整值
   */
  applyAdjustment(adjustment) {
    // 限制单次调整幅度
    adjustment = Math.max(-this.config.maxAdjustmentStep, 
                         Math.min(this.config.maxAdjustmentStep, adjustment));
    
    // 计算目标难度
    let newTarget = this.targetDifficulty + adjustment;
    newTarget = Math.max(this.config.minDifficulty, 
                        Math.min(this.config.maxDifficulty, newTarget));
    
    // 如果目标难度有变化，启动过渡
    if (newTarget !== this.targetDifficulty) {
      const oldTarget = this.targetDifficulty;
      this.targetDifficulty = newTarget;
      this.difficultyTransition = 0;
      
      this.triggerEvent('difficultyAdjustmentStarted', {
        from: oldTarget,
        to: newTarget,
        adjustment
      });
    }
  }
  
  /**
   * 记录调整历史
   * @param {Object} entry - 历史记录条目
   */
  recordAdjustment(entry) {
    this.adjustmentHistory.push(entry);
    
    // 限制历史记录大小
    if (this.adjustmentHistory.length > this.maxHistorySize) {
      this.adjustmentHistory.shift();
    }
  }
  
  /**
   * 获取当前难度参数（考虑过渡）
   * @returns {Object} 难度参数对象
   */
  getCurrentDifficultyParams() {
    const fromParams = this.difficultyParams[Math.floor(this.currentDifficulty)];
    const toParams = this.difficultyParams[Math.floor(this.targetDifficulty)];
    
    // 如果难度级别相同或过渡已完成
    if (this.currentDifficulty === this.targetDifficulty || 
        Math.floor(this.currentDifficulty) === Math.floor(this.targetDifficulty)) {
      return { ...fromParams };
    }
    
    // 计算过渡中的参数
    const result = {};
    const t = this.difficultyTransition;
    
    // 对每个参数进行插值
    for (const key in fromParams) {
      if (typeof fromParams[key] === 'number') {
        result[key] = fromParams[key] * (1 - t) + toParams[key] * t;
      } else {
        result[key] = t < 0.5 ? fromParams[key] : toParams[key];
      }
    }
    
    return result;
  }
  
  /**
   * 获取插值的当前难度等级
   * @returns {number} 过渡中的难度等级
   */
  getInterpolatedDifficulty() {
    return this.currentDifficulty * (1 - this.difficultyTransition) + 
           this.targetDifficulty * this.difficultyTransition;
  }
  
  /**
   * 手动设置难度
   * @param {number} level - 难度等级
   */
  setDifficulty(level) {
    level = Math.max(this.config.minDifficulty, 
                     Math.min(this.config.maxDifficulty, level));
    
    const oldLevel = this.currentDifficulty;
    this.currentDifficulty = level;
    this.targetDifficulty = level;
    this.difficultyTransition = 1;
    
    this.triggerEvent('difficultyChanged', {
      from: oldLevel,
      to: level,
      instant: true,
      manual: true
    });
  }
  
  /**
   * 获取系统状态摘要
   * @returns {Object} 状态对象
   */
  getStatus() {
    return {
      currentDifficulty: this.currentDifficulty,
      targetDifficulty: this.targetDifficulty,
      difficultyTransition: this.difficultyTransition,
      interpolatedDifficulty: this.getInterpolatedDifficulty(),
      performanceScore: this.performanceMetrics.overallScore,
      currentParams: this.getCurrentDifficultyParams(),
      adjustmentHistory: [...this.adjustmentHistory]
    };
  }
  
  /**
   * 重置系统
   */
  reset() {
    this.currentDifficulty = this.config.initialDifficulty;
    this.targetDifficulty = this.config.initialDifficulty;
    this.difficultyTransition = 1;
    this.lastAdjustmentTime = 0;
    
    // 重置性能指标
    for (const key in this.performanceMetrics) {
      if (typeof this.performanceMetrics[key] === 'number') {
        this.performanceMetrics[key] = 0;
      }
    }
    
    this.performanceMetrics.maxSurvivalTime = 0;
    this.performanceMetrics.maxCombo = 0;
    
    this.adjustmentHistory = [];
    
    this.triggerEvent('systemReset');
  }
  
  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }
  
  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {Object} data - 事件数据
   */
  triggerEvent(event, data = {}) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      }
    }
  }
  
  /**
   * 导出系统数据（用于保存）
   * @returns {Object} 可序列化的系统数据
   */
  exportData() {
    return {
      config: this.config,
      currentDifficulty: this.currentDifficulty,
      targetDifficulty: this.targetDifficulty,
      difficultyTransition: this.difficultyTransition,
      performanceMetrics: this.performanceMetrics,
      adjustmentHistory: this.adjustmentHistory
    };
  }
  
  /**
   * 导入系统数据（用于加载）
   * @param {Object} data - 系统数据
   */
  importData(data) {
    if (data.config) this.config = { ...this.config, ...data.config };
    if (data.currentDifficulty !== undefined) this.currentDifficulty = data.currentDifficulty;
    if (data.targetDifficulty !== undefined) this.targetDifficulty = data.targetDifficulty;
    if (data.difficultyTransition !== undefined) this.difficultyTransition = data.difficultyTransition;
    if (data.performanceMetrics) this.performanceMetrics = { ...this.performanceMetrics, ...data.performanceMetrics };
    if (data.adjustmentHistory) this.adjustmentHistory = data.adjustmentHistory;
  }
}

// 导出工厂函数，便于创建实例
export function createDynamicDifficultySystem(config = {}) {
  return new DynamicDifficultySystem(config);
}

// 导出默认配置
export const defaultConfig = {
  minDifficulty: 0,
  maxDifficulty: 5,
  initialDifficulty: 2,
  adjustmentInterval: 30,
  maxAdjustmentStep: 1,
  smoothingFactor: 0.3
};

// 导出工具函数
export const DifficultyUtils = {
  /**
   * 获取难度等级描述
   * @param {number} level - 难度等级
   * @returns {string} 描述文本
   */
  getDifficultyDescription(level) {
    const descriptions = [
      '新手友好 - 轻松体验游戏乐趣',
      '简单 - 适合休闲玩家',
      '中等 - 平衡的挑战体验',
      '困难 - 考验你的技巧',
      '专家 - 真正的挑战开始',
      '大师 - 极限玩家专属'
    ];
    return descriptions[Math.min(Math.max(Math.floor(level), 0), 5)] || descriptions[2];
  },
  
  /**
   * 格式化难度参数显示
   * @param {Object} params - 难度参数
   * @returns {Object} 格式化后的参数
   */
  formatParamsForDisplay(params) {
    return {
      敌人速度: `${Math.round(params.enemySpeed * 100)}%`,
      敌人数量: `${Math.round(params.enemyCount * 100)}%`,
      道具生成率: `${Math.round(params.itemSpawnRate * 100)}%`,
      平台间距: `${Math.round(params.platformSpacing * 100)}%`,
      游戏速度: `${Math.round(params.gameSpeed * 100)}%`,
      AI强度: `${Math.round(params.enemyAILevel * 100)}%`
    };
  },
  
  /**
   * 根据玩家类型推荐初始难度
   * @param {string} playerType - 玩家类型（'casual', 'experienced', 'hardcore'）
   * @returns {number} 推荐的初始难度
   */
  recommendInitialDifficulty(playerType) {
    switch (playerType) {
      case 'casual': return 1;
      case 'experienced': return 2;
      case 'hardcore': return 3;
      default: return 2;
    }
  }
};

export default DynamicDifficultySystem;
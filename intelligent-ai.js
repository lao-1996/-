/**
 * 智能AI系统 - Intelligent AI System
 * 实现具有学习能力和协同作战的敌人AI
 */

// AI基础状态机
class AIStateMachine {
  constructor(states = {}) {
    this.states = states;
    this.currentState = null;
    this.stateHistory = [];
    this.stateEnterTime = 0;
    this.stateDuration = 0;
  }
  
  setState(stateName, data = {}) {
    const oldState = this.currentState;
    const state = this.states[stateName];
    
    if (!state) {
      console.warn(`AIStateMachine: State '${stateName}' not found`);
      return;
    }
    
    // 退出旧状态
    if (oldState && oldState.onExit) {
      oldState.onExit(this, data);
    }
    
    // 进入新状态
    this.currentState = state;
    this.stateEnterTime = Date.now();
    this.stateHistory.push({
      name: stateName,
      time: this.stateEnterTime,
      data: { ...data }
    });
    
    if (state.onEnter) {
      state.onEnter(this, data);
    }
    
    // 保持历史记录大小
    if (this.stateHistory.length > 50) {
      this.stateHistory.shift();
    }
  }
  
  update(deltaTime, context) {
    this.stateDuration += deltaTime;
    
    if (this.currentState) {
      if (this.currentState.onUpdate) {
        this.currentState.onUpdate(this, deltaTime, context);
      }
      
      // 检查状态转换条件
      if (this.currentState.transitions) {
        for (const transition of this.currentState.transitions) {
          if (transition.condition && transition.condition(this, deltaTime, context)) {
            this.setState(transition.target, { ...context, transition });
            break;
          }
        }
      }
    }
  }
  
  getCurrentStateName() {
    return this.currentState ? this.currentState.name : 'none';
  }
  
  getStateDuration() {
    return this.stateDuration;
  }
}

// 玩家行为分析器
class PlayerBehaviorAnalyzer {
  constructor() {
    this.behaviorMemory = new Map();
    this.actionHistory = [];
    this.patterns = new Map();
    this.analysisWindow = 30; // 分析窗口（秒）
    
    // 玩家类型分类
    this.playerArchetypes = {
      aggressive: { score: 0, weight: 1.0 },
      defensive: { score: 0, weight: 1.0 },
      strategic: { score: 0, weight: 1.0 },
      reactive: { score: 0, weight: 1.0 }
    };
  }
  
  recordAction(action, position, time, context = {}) {
    const record = {
      action,
      position: { ...position },
      time,
      context: { ...context },
      timestamp: Date.now()
    };
    
    this.actionHistory.push(record);
    
    // 保持历史记录大小
    if (this.actionHistory.length > 1000) {
      this.actionHistory.shift();
    }
    
    // 更新行为统计
    if (!this.behaviorMemory.has(action)) {
      this.behaviorMemory.set(action, {
        count: 0,
        positions: [],
        times: [],
        contexts: []
      });
    }
    
    const actionData = this.behaviorMemory.get(action);
    actionData.count++;
    actionData.positions.push(position);
    actionData.times.push(time);
    actionData.contexts.push(context);
  }
  
  analyzePatterns() {
    // 分析移动模式
    const movePatterns = this.detectMovementPatterns();
    const attackPatterns = this.detectAttackPatterns();
    const defensePatterns = this.detectDefensePatterns();
    
    // 更新玩家类型评分
    this.updatePlayerArchetypes();
    
    return {
      movement: movePatterns,
      attack: attackPatterns,
      defense: defensePatterns,
      archetype: this.getPlayerArchetype(),
      predictability: this.calculatePredictability()
    };
  }
  
  detectMovementPatterns() {
    const patterns = [];
    const positions = this.actionHistory
      .filter(r => r.action === 'move')
      .map(r => r.position);
    
    if (positions.length < 10) return patterns;
    
    // 检测循环移动
    for (let i = 0; i < positions.length - 4; i++) {
      const segment = positions.slice(i, i + 4);
      if (this.isRepeatingPattern(segment, positions, i + 4)) {
        patterns.push({
          type: 'circular_movement',
          pattern: segment,
          confidence: 0.8
        });
      }
    }
    
    // 检测偏好位置
    const positionClusters = this.clusterPositions(positions);
    for (const cluster of positionClusters) {
      if (cluster.count > positions.length * 0.2) {
        patterns.push({
          type: 'preferred_position',
          position: cluster.center,
          confidence: cluster.density
        });
      }
    }
    
    return patterns;
  }
  
  detectAttackPatterns() {
    const attacks = this.actionHistory
      .filter(r => r.action.startsWith('attack_'))
      .map(r => ({ action: r.action, time: r.time }));
    
    if (attacks.length < 5) return [];
    
    const patterns = [];
    
    // 检测攻击节奏
    const intervals = [];
    for (let i = 1; i < attacks.length; i++) {
      intervals.push(attacks[i].time - attacks[i - 1].time);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
    
    if (variance < 0.5) {
      patterns.push({
        type: 'rhythmic_attack',
        interval: avgInterval,
        confidence: 1 - variance
      });
    }
    
    return patterns;
  }
  
  detectDefensePatterns() {
    const defenses = this.actionHistory
      .filter(r => r.action.startsWith('dodge_') || r.action.startsWith('block_'))
      .map(r => ({ action: r.action, context: r.context }));
    
    if (defenses.length < 3) return [];
    
    const patterns = [];
    const directionStats = { left: 0, right: 0, up: 0, down: 0 };
    
    for (const defense of defenses) {
      if (defense.action.includes('left')) directionStats.left++;
      if (defense.action.includes('right')) directionStats.right++;
      if (defense.action.includes('up')) directionStats.up++;
      if (defense.action.includes('down')) directionStats.down++;
    }
    
    const total = defenses.length;
    for (const [direction, count] of Object.entries(directionStats)) {
      if (count / total > 0.4) {
        patterns.push({
          type: 'direction_bias',
          direction,
          bias: count / total,
          confidence: Math.min(count / 10, 1)
        });
      }
    }
    
    return patterns;
  }
  
  updatePlayerArchetypes() {
    // 根据行为模式更新玩家类型评分
    const actions = this.actionHistory.slice(-100);
    
    // 攻击性评分
    const aggressiveActions = actions.filter(a => 
      a.action.startsWith('attack_') || 
      a.context.aggressive === true
    ).length;
    this.playerArchetypes.aggressive.score = aggressiveActions / 100;
    
    // 防御性评分
    const defensiveActions = actions.filter(a => 
      a.action.startsWith('dodge_') || 
      a.action.startsWith('block_') ||
      a.context.defensive === true
    ).length;
    this.playerArchetypes.defensive.score = defensiveActions / 100;
    
    // 策略性评分
    const strategicActions = actions.filter(a => 
      a.action.includes('combo') ||
      a.context.strategic === true ||
      (a.action === 'item_use' && a.context.effective === true)
    ).length;
    this.playerArchetypes.strategic.score = strategicActions / 100;
    
    // 反应性评分
    const reactionTimes = actions
      .filter(a => a.context.reactionTime)
      .map(a => a.context.reactionTime);
    
    if (reactionTimes.length > 0) {
      const avgReaction = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
      this.playerArchetypes.reactive.score = Math.max(0, 1 - avgReaction / 1000);
    }
  }
  
  getPlayerArchetype() {
    let maxScore = -1;
    let dominantArchetype = 'balanced';
    
    for (const [type, data] of Object.entries(this.playerArchetypes)) {
      const weightedScore = data.score * data.weight;
      if (weightedScore > maxScore) {
        maxScore = weightedScore;
        dominantArchetype = type;
      }
    }
    
    return {
      type: dominantArchetype,
      confidence: maxScore,
      scores: { ...this.playerArchetypes }
    };
  }
  
  calculatePredictability() {
    // 计算玩家的可预测性（0-1）
    const recentActions = this.actionHistory.slice(-50);
    if (recentActions.length < 10) return 0.5;
    
    let predictability = 0;
    
    // 基于行为重复率
    const actionCounts = new Map();
    for (const action of recentActions) {
      actionCounts.set(action.action, (actionCounts.get(action.action) || 0) + 1);
    }
    
    const maxCount = Math.max(...actionCounts.values());
    const repetitionRate = maxCount / recentActions.length;
    
    // 基于模式检测
    const patterns = this.analyzePatterns();
    const patternConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / Math.max(patterns.length, 1);
    
    // 综合可预测性
    predictability = (repetitionRate * 0.6) + (patternConfidence * 0.4);
    
    return Math.min(Math.max(predictability, 0), 1);
  }
  
  predictNextAction(timeWindow = 5) {
    const patterns = this.analyzePatterns();
    const archetype = this.getPlayerArchetype();
    const recentActions = this.actionHistory.slice(-10);
    
    const predictions = [];
    
    // 基于模式预测
    for (const pattern of patterns.movement) {
      if (pattern.type === 'circular_movement' && pattern.confidence > 0.7) {
        const nextPos = this.predictNextPosition(pattern.pattern);
        predictions.push({
          type: 'position',
          action: 'move',
          position: nextPos,
          confidence: pattern.confidence * 0.8,
          source: 'movement_pattern'
        });
      }
    }
    
    // 基于玩家类型预测
    if (archetype.type === 'aggressive' && archetype.confidence > 0.6) {
      predictions.push({
        type: 'behavior',
        action: 'attack',
        direction: this.predictAttackDirection(),
        confidence: archetype.confidence * 0.7,
        source: 'player_archetype'
      });
    }
    
    // 基于最近动作预测
    if (recentActions.length >= 3) {
      const lastActions = recentActions.slice(-3).map(a => a.action);
      const nextAction = this.predictFromSequence(lastActions);
      if (nextAction) {
        predictions.push({
          type: 'action',
          action: nextAction,
          confidence: 0.6,
          source: 'action_sequence'
        });
      }
    }
    
    return predictions;
  }
  
  predictNextPosition(pattern) {
    // 简单的线性外推
    if (pattern.length < 2) return pattern[0];
    
    const last = pattern[pattern.length - 1];
    const secondLast = pattern[pattern.length - 2];
    
    const dx = last.x - secondLast.x;
    const dy = last.y - secondLast.y;
    
    return {
      x: last.x + dx,
      y: last.y + dy
    };
  }
  
  predictAttackDirection() {
    const attacks = this.actionHistory
      .filter(r => r.action.startsWith('attack_'))
      .slice(-5);
    
    if (attacks.length === 0) return 'forward';
    
    const directions = attacks.map(a => {
      if (a.action.includes('left')) return 'left';
      if (a.action.includes('right')) return 'right';
      if (a.action.includes('up')) return 'up';
      if (a.action.includes('down')) return 'down';
      return 'forward';
    });
    
    // 统计最常见的方向
    const counts = {};
    for (const dir of directions) {
      counts[dir] = (counts[dir] || 0) + 1;
    }
    
    let maxCount = 0;
    let mostCommon = 'forward';
    for (const [dir, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = dir;
      }
    }
    
    return mostCommon;
  }
  
  predictFromSequence(sequence) {
    // 简单的马尔可夫链预测
    const transitions = new Map();
    
    for (let i = 0; i < this.actionHistory.length - 1; i++) {
      const current = this.actionHistory[i].action;
      const next = this.actionHistory[i + 1].action;
      
      if (!transitions.has(current)) {
        transitions.set(current, new Map());
      }
      
      const nextMap = transitions.get(current);
      nextMap.set(next, (nextMap.get(next) || 0) + 1);
    }
    
    const lastAction = sequence[sequence.length - 1];
    if (transitions.has(lastAction)) {
      const nextMap = transitions.get(lastAction);
      let maxCount = 0;
      let predicted = null;
      
      for (const [action, count] of nextMap.entries()) {
        if (count > maxCount) {
          maxCount = count;
          predicted = action;
        }
      }
      
      return predicted;
    }
    
    return null;
  }
  
  isRepeatingPattern(segment, fullArray, startIndex) {
    if (startIndex + segment.length > fullArray.length) return false;
    
    for (let i = 0; i < segment.length; i++) {
      const a = segment[i];
      const b = fullArray[startIndex + i];
      
      if (Math.abs(a.x - b.x) > 10 || Math.abs(a.y - b.y) > 10) {
        return false;
      }
    }
    
    return true;
  }
  
  clusterPositions(positions, radius = 20) {
    if (positions.length === 0) return [];
    
    const clusters = [];
    
    for (const pos of positions) {
      let assigned = false;
      
      for (const cluster of clusters) {
        const dx = cluster.center.x - pos.x;
        const dy = cluster.center.y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < radius) {
          cluster.positions.push(pos);
          cluster.count++;
          cluster.center.x = (cluster.center.x * (cluster.count - 1) + pos.x) / cluster.count;
          cluster.center.y = (cluster.center.y * (cluster.count - 1) + pos.y) / cluster.count;
          assigned = true;
          break;
        }
      }
      
      if (!assigned) {
        clusters.push({
          center: { x: pos.x, y: pos.y },
          positions: [pos],
          count: 1,
          density: 1
        });
      }
    }
    
    // 计算密度
    for (const cluster of clusters) {
      cluster.density = cluster.count / positions.length;
    }
    
    return clusters;
  }
}

// 敌人AI基类
class EnemyAI {
  constructor(type, config = {}) {
    this.type = type;
    this.config = {
      baseSpeed: 100,
      detectionRange: 300,
      attackRange: 50,
      decisionInterval: 0.5,
      learningRate: 0.1,
      ...config
    };
    
    this.stateMachine = new AIStateMachine(this.createStates());
    this.behaviorAnalyzer = new PlayerBehaviorAnalyzer();
    this.decisionTimer = 0;
    this.targetPosition = null;
    this.currentStrategy = 'neutral';
    this.performanceMetrics = {
      successfulAttacks: 0,
      failedAttacks: 0,
      damageDealt: 0,
      timeAlive: 0
    };
    
    // AI个性参数
    this.personality = {
      aggression: 0.5,
      caution: 0.5,
      adaptability: 0.5,
      persistence: 0.5
    };
    
    this.initializePersonality();
  }
  
  initializePersonality() {
    switch (this.type) {
      case 'chaser':
        this.personality = { aggression: 0.8, caution: 0.2, adaptability: 0.6, persistence: 0.9 };
        break;
      case 'ambusher':
        this.personality = { aggression: 0.7, caution: 0.5, adaptability: 0.4, persistence: 0.7 };
        break;
      case 'supporter':
        this.personality = { aggression: 0.3, caution: 0.8, adaptability: 0.7, persistence: 0.5 };
        break;
      case 'tactician':
        this.personality = { aggression: 0.6, caution: 0.6, adaptability: 0.9, persistence: 0.8 };
        break;
    }
  }
  
  createStates() {
    return {
      idle: {
        name: 'idle',
        onEnter: (machine, data) => {
          // 空闲状态进入
        },
        onUpdate: (machine, deltaTime, context) => {
          // 检查是否发现玩家
          if (this.detectPlayer(context.playerPosition)) {
            machine.setState('chase', context);
          }
        },
        transitions: [
          {
            condition: (machine, deltaTime, context) => 
              this.detectPlayer(context.playerPosition),
            target: 'chase'
          }
        ]
      },
      
      chase: {
        name: 'chase',
        onEnter: (machine, data) => {
          // 开始追逐
          this.targetPosition = data.playerPosition;
        },
        onUpdate: (machine, deltaTime, context) => {
          // 更新目标位置
          this.targetPosition = context.playerPosition;
          
          // 检查是否进入攻击范围
          if (this.inAttackRange(context.playerPosition)) {
            machine.setState('attack', context);
          }
          
          // 检查是否失去目标
          if (!this.detectPlayer(context.playerPosition)) {
            machine.setState('search', context);
          }
        },
        transitions: [
          {
            condition: (machine, deltaTime, context) => 
              this.inAttackRange(context.playerPosition),
            target: 'attack'
          },
          {
            condition: (machine, deltaTime, context) => 
              !this.detectPlayer(context.playerPosition),
            target: 'search'
          }
        ]
      },
      
      attack: {
        name: 'attack',
        onEnter: (machine, data) => {
          // 准备攻击
        },
        onUpdate: (machine, deltaTime, context) => {
          // 执行攻击逻辑
          const attackSuccessful = this.executeAttack(context);
          
          if (attackSuccessful) {
            this.performanceMetrics.successfulAttacks++;
          } else {
            this.performanceMetrics.failedAttacks++;
          }
          
          // 攻击后状态转换
          if (!this.inAttackRange(context.playerPosition)) {
            machine.setState('chase', context);
          }
        },
        transitions: [
          {
            condition: (machine, deltaTime, context) => 
              !this.inAttackRange(context.playerPosition),
            target: 'chase'
          }
        ]
      },
      
      search: {
        name: 'search',
        onEnter: (machine, data) => {
          // 开始搜索玩家
          this.startSearchPattern();
        },
        onUpdate: (machine, deltaTime, context) => {
          // 执行搜索模式
          this.updateSearchPattern(deltaTime);
          
          // 检查是否发现玩家
          if (this.detectPlayer(context.playerPosition)) {
            machine.setState('chase', context);
          }
        },
        transitions: [
          {
            condition: (machine, deltaTime, context) => 
              this.detectPlayer(context.playerPosition),
            target: 'chase'
          }
        ]
      },
      
      evade: {
        name: 'evade',
        onEnter: (machine, data) => {
          // 开始躲避
        },
        onUpdate: (machine, deltaTime, context) => {
          // 执行躲避逻辑
          this.executeEvasion(deltaTime, context);
        },
        transitions: [
          {
            condition: (machine, deltaTime, context) => 
              !this.isInDanger(context),
            target: 'idle'
          }
        ]
      }
    };
  }
  
  update(deltaTime, context) {
    // 更新状态机
    this.stateMachine.update(deltaTime, context);
    
    // 记录玩家行为
    if (context.playerAction) {
      this.behaviorAnalyzer.recordAction(
        context.playerAction,
        context.playerPosition,
        context.gameTime,
        context
      );
    }
    
    // 定期决策
    this.decisionTimer += deltaTime;
    if (this.decisionTimer >= this.config.decisionInterval) {
      this.makeStrategicDecision(context);
      this.decisionTimer = 0;
    }
    
    // 更新性能指标
    this.performanceMetrics.timeAlive += deltaTime;
  }
  
  detectPlayer(playerPosition) {
    if (!playerPosition) return false;
    
    // 简化检测逻辑，实际游戏中需要根据具体实现调整
    return true;
  }
  
  inAttackRange(playerPosition) {
    if (!playerPosition || !this.position) return false;
    
    const dx = playerPosition.x - this.position.x;
    const dy = playerPosition.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= this.config.attackRange;
  }
  
  executeAttack(context) {
    // 基础攻击逻辑
    // 实际游戏中需要根据具体实现调整
    
    // 基于玩家行为预测提高命中率
    const predictions = this.behaviorAnalyzer.predictNextAction();
    let attackSuccessChance = 0.5;
    
    for (const prediction of predictions) {
      if (prediction.confidence > 0.7) {
        attackSuccessChance += 0.2;
      }
    }
    
    // 个性影响
    attackSuccessChance *= this.personality.aggression;
    
    // 随机决定是否命中
    return Math.random() < attackSuccessChance;
  }
  
  makeStrategicDecision(context) {
    // 分析玩家行为
    const analysis = this.behaviorAnalyzer.analyzePatterns();
    const predictability = this.behaviorAnalyzer.calculatePredictability();
    
    // 调整策略
    if (predictability > 0.7) {
      // 玩家可预测性高，采用针对性策略
      this.currentStrategy = 'exploit';
      this.exploitPlayerPatterns(analysis);
    } else if (analysis.archetype.confidence > 0.6) {
      // 根据玩家类型调整策略
      this.adjustToPlayerArchetype(analysis.archetype.type);
    } else {
      // 默认策略
      this.currentStrategy = 'balanced';
    }
    
    // 学习调整
    this.learnFromExperience(context);
  }
  
  exploitPlayerPatterns(analysis) {
    // 利用检测到的玩家模式
    for (const pattern of analysis.movement) {
      if (pattern.type === 'preferred_position' && pattern.confidence > 0.7) {
        // 在玩家偏好位置设置陷阱或伏击
        this.setAmbushPosition(pattern.position);
      }
    }
    
    for (const pattern of analysis.defense) {
      if (pattern.type === 'direction_bias' && pattern.confidence > 0.6) {
        // 针对玩家的防御偏向来攻击
        this.attackDirection = this.getOppositeDirection(pattern.direction);
      }
    }
  }
  
  adjustToPlayerArchetype(archetype) {
    switch (archetype) {
      case 'aggressive':
        // 对抗攻击型玩家：保持距离，反击
        this.config.attackRange *= 0.8;
        this.config.detectionRange *= 1.2;
        break;
      case 'defensive':
        // 对抗防御型玩家：施加压力，破防
        this.config.attackRange *= 1.2;
        this.config.decisionInterval *= 0.8;
        break;
      case 'strategic':
        // 对抗策略型玩家：随机化行为，打破节奏
        this.config.decisionInterval *= (0.8 + Math.random() * 0.4);
        break;
      case 'reactive':
        // 对抗反应型玩家：快速攻击，不给反应时间
        this.config.decisionInterval *= 0.6;
        break;
    }
  }
  
  learnFromExperience(context) {
    // 简单的强化学习
    const successRate = this.performanceMetrics.successfulAttacks / 
                       Math.max(this.performanceMetrics.successfulAttacks + 
                               this.performanceMetrics.failedAttacks, 1);
    
    // 根据成功率调整个性参数
    if (successRate > 0.7) {
      // 成功率高，保持或加强当前策略
      this.personality.aggression = Math.min(this.personality.aggression + this.config.learningRate * 0.1, 1);
    } else if (successRate < 0.3) {
      // 成功率低，调整策略
      this.personality.aggression = Math.max(this.personality.aggression - this.config.learningRate * 0.2, 0);
      this.personality.adaptability = Math.min(this.personality.adaptability + this.config.learningRate * 0.3, 1);
    }
  }
  
  getOppositeDirection(dir) {
    const opposites = {
      'left': 'right',
      'right': 'left',
      'up': 'down',
      'down': 'up'
    };
    return opposites[dir] || dir;
  }
  
  setAmbushPosition(position) {
    // 设置伏击位置
    this.ambushPosition = position;
  }
  
  startSearchPattern() {
    // 开始搜索模式
    this.searchPattern = 'spiral';
    this.searchProgress = 0;
  }
  
  updateSearchPattern(deltaTime) {
    // 更新搜索模式
    this.searchProgress += deltaTime;
  }
  
  executeEvasion(deltaTime, context) {
    // 执行躲避逻辑
  }
  
  isInDanger(context) {
    // 检查是否处于危险中
    return false;
  }
  
  getState() {
    return {
      type: this.type,
      currentState: this.stateMachine.getCurrentStateName(),
      strategy: this.currentStrategy,
      personality: { ...this.personality },
      performance: { ...this.performanceMetrics },
      playerAnalysis: this.behaviorAnalyzer.getPlayerArchetype()
    };
  }
}

// 协同作战系统
class CooperativeAI {
  constructor(enemies = []) {
    this.enemies = enemies;
    this.coordinationLevel = 0; // 0-1，协同程度
    this.communicationRange = 500;
    this.tactics = new Map();
    
    // 预定义战术
    this.defineTactics();
  }
  
  defineTactics() {
    // 包围战术
    this.tactics.set('surround', {
      name: '包围战术',
      description: '从多个方向包围玩家',
      minEnemies: 3,
      execute: (enemies, playerPos) => {
        // 计算包围位置
        const positions = this.calculateSurroundPositions(playerPos, enemies.length);
        
        // 分配位置给每个敌人
        enemies.forEach((enemy, index) => {
          enemy.targetPosition = positions[index];
          enemy.stateMachine.setState('chase', { playerPosition: positions[index] });
        });
      }
    });
    
    // 交叉火力
    this.tactics.set('crossfire', {
      name: '交叉火力',
      description: '远程和近战敌人配合攻击',
      minEnemies: 2,
      execute: (enemies, playerPos) => {
        // 区分远程和近战敌人
        const ranged = enemies.filter(e => e.type === 'ambusher' || e.type === 'tactician');
        const melee = enemies.filter(e => e.type === 'chaser');
        
        // 设置位置
        melee.forEach(enemy => {
          enemy.targetPosition = playerPos;
          enemy.stateMachine.setState('chase', { playerPosition: playerPos });
        });
        
        ranged.forEach(enemy => {
          // 远程敌人保持距离
          const angle = Math.random() * Math.PI * 2;
          const distance = 200 + Math.random() * 100;
          const position = {
            x: playerPos.x + Math.cos(angle) * distance,
            y: playerPos.y + Math.sin(angle) * distance
          };
          
          enemy.targetPosition = position;
          enemy.stateMachine.setState('attack', { playerPosition: playerPos });
        });
      }
    });
    
    // 诱饵战术
    this.tactics.set('bait', {
      name: '诱饵战术',
      description: '一个敌人吸引注意力，其他敌人突袭',
      minEnemies: 2,
      execute: (enemies, playerPos) => {
        // 选择诱饵（通常是防御型或速度型）
        const bait = enemies.find(e => e.type === 'supporter') || enemies[0];
        const attackers = enemies.filter(e => e !== bait);
        
        // 诱饵吸引注意力
        bait.stateMachine.setState('chase', { playerPosition: playerPos });
        bait.config.baseSpeed *= 0.7; // 降低速度，让玩家更容易追上
        
        // 攻击者从侧面或背后攻击
        attackers.forEach((enemy, index) => {
          const angle = Math.PI + (index / attackers.length) * Math.PI * 2;
          const distance = 100;
          const position = {
            x: playerPos.x + Math.cos(angle) * distance,
            y: playerPos.y + Math.sin(angle) * distance
          };
          
          enemy.targetPosition = position;
          enemy.stateMachine.setState('attack', { playerPosition: playerPos });
        });
      }
    });
    
    // 车轮战术
    this.tactics.set('rotation', {
      name: '车轮战术',
      description: '轮流攻击，不给玩家喘息机会',
      minEnemies: 3,
      execute: (enemies, playerPos) => {
        // 分配攻击顺序
        const attackOrder = [...enemies].sort(() => Math.random() - 0.5);
        
        // 设置攻击时机
        attackOrder.forEach((enemy, index) => {
          enemy.attackDelay = index * 1.5; // 1.5秒间隔
          enemy.stateMachine.setState('chase', { playerPosition: playerPos });
        });
      }
    });
  }
  
  update(deltaTime, playerPos) {
    // 检查是否可以应用战术
    if (this.enemies.length >= 2) {
      this.coordinateEnemies(playerPos);
    }
    
    // 更新协同程度
    this.updateCoordinationLevel();
  }
  
  coordinateEnemies(playerPos) {
    // 根据敌人数量和类型选择最佳战术
    const availableTactics = [];
    
    for (const [name, tactic] of this.tactics.entries()) {
      if (this.enemies.length >= tactic.minEnemies) {
        // 检查战术适用性
        const suitability = this.evaluateTacticSuitability(name, playerPos);
        if (suitability > 0.5) {
          availableTactics.push({ name, tactic, suitability });
        }
      }
    }
    
    // 选择最适合的战术
    if (availableTactics.length > 0) {
      availableTactics.sort((a, b) => b.suitability - a.suitability);
      const bestTactic = availableTactics[0];
      
      // 执行战术
      bestTactic.tactic.execute(this.enemies, playerPos);
      
      // 更新协同程度
      this.coordinationLevel = Math.min(this.coordinationLevel + 0.1, 1);
    }
  }
  
  evaluateTacticSuitability(tacticName, playerPos) {
    const tactic = this.tactics.get(tacticName);
    if (!tactic) return 0;
    
    let suitability = 0.5;
    
    // 根据敌人类型评估
    switch (tacticName) {
      case 'surround':
        // 包围战术适合多种类型敌人
        suitability = 0.7;
        break;
      case 'crossfire':
        // 交叉火力需要远程和近战组合
        const hasRanged = this.enemies.some(e => e.type === 'ambusher' || e.type === 'tactician');
        const hasMelee = this.enemies.some(e => e.type === 'chaser');
        suitability = (hasRanged && hasMelee) ? 0.8 : 0.3;
        break;
      case 'bait':
        // 诱饵战术需要有合适的诱饵
        const hasBait = this.enemies.some(e => e.type === 'supporter' || e.type === 'chaser');
        suitability = hasBait ? 0.7 : 0.4;
        break;
      case 'rotation':
        // 车轮战术需要足够数量的敌人
        suitability = this.enemies.length >= 4 ? 0.9 : 0.6;
        break;
    }
    
    // 根据玩家位置调整
    const playerInOpenArea = this.isInOpenArea(playerPos);
    if (tacticName === 'surround' && !playerInOpenArea) {
      suitability *= 0.5; // 在狭窄区域包围效果差
    }
    
    return Math.min(Math.max(suitability, 0), 1);
  }
  
  isInOpenArea(position) {
    // 简化判断，实际游戏中需要地形信息
    return true;
  }
  
  calculateSurroundPositions(center, count, radius = 150) {
    const positions = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      positions.push({
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius
      });
    }
    
    return positions;
  }
  
  updateCoordinationLevel() {
    // 根据敌人状态更新协同程度
    let coordination = 0;
    
    // 检查敌人是否在执行战术
    const executingTactic = this.enemies.some(e => 
      e.currentStrategy === 'exploit' || 
      e.stateMachine.getCurrentStateName() === 'attack'
    );
    
    if (executingTactic) {
      coordination = 0.7;
    }
    
    // 检查敌人之间的配合
    const enemyDistances = [];
    for (let i = 0; i < this.enemies.length; i++) {
      for (let j = i + 1; j < this.enemies.length; j++) {
        if (this.enemies[i].position && this.enemies[j].position) {
          const dx = this.enemies[i].position.x - this.enemies[j].position.x;
          const dy = this.enemies[i].position.y - this.enemies[j].position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < this.communicationRange) {
            enemyDistances.push(distance);
          }
        }
      }
    }
    
    if (enemyDistances.length > 0) {
      const avgDistance = enemyDistances.reduce((a, b) => a + b, 0) / enemyDistances.length;
      const distanceScore = 1 - (avgDistance / this.communicationRange);
      coordination = Math.max(coordination, distanceScore * 0.8);
    }
    
    this.coordinationLevel = coordination;
  }
  
  addEnemy(enemy) {
    if (!this.enemies.includes(enemy)) {
      this.enemies.push(enemy);
    }
  }
  
  removeEnemy(enemy) {
    const index = this.enemies.indexOf(enemy);
    if (index > -1) {
      this.enemies.splice(index, 1);
    }
  }
  
  getStatus() {
    return {
      enemyCount: this.enemies.length,
      coordinationLevel: this.coordinationLevel,
      activeTactics: Array.from(this.tactics.entries())
        .filter(([name, tactic]) => 
          this.enemies.some(e => e.currentStrategy?.includes(name))
        )
        .map(([name, tactic]) => ({ name: tactic.name, description: tactic.description })),
      enemyTypes: this.enemies.map(e => e.type)
    };
  }
}

// AI管理系统
class AIManager {
  constructor() {
    this.enemies = new Map(); // id -> EnemyAI
    this.cooperativeAI = new CooperativeAI();
    this.globalPlayerAnalyzer = new PlayerBehaviorAnalyzer();
    this.difficultyFactor = 1.0;
    this.aiIntelligence = 1.0;
    
    // 性能监控
    this.performanceStats = {
      totalEnemies: 0,
      activeEnemies: 0,
      averageIntelligence: 0,
      tacticalEffectiveness: 0
    };
  }
  
  createEnemy(type, config = {}) {
    const id = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const enemy = new EnemyAI(type, {
      ...config,
      baseSpeed: (config.baseSpeed || 100) * this.difficultyFactor,
      detectionRange: (config.detectionRange || 300) * this.difficultyFactor,
      attackRange: (config.attackRange || 50) * this.difficultyFactor
    });
    
    // 应用AI智能度调整
    enemy.config.learningRate *= this.aiIntelligence;
    enemy.personality.adaptability = Math.min(enemy.personality.adaptability * this.aiIntelligence, 1);
    
    this.enemies.set(id, enemy);
    this.cooperativeAI.addEnemy(enemy);
    
    this.updatePerformanceStats();
    
    return { id, enemy };
  }
  
  update(deltaTime, gameState) {
    const playerPos = gameState.player?.position;
    const playerAction = gameState.player?.lastAction;
    
    // 更新全局玩家分析
    if (playerAction && playerPos) {
      this.globalPlayerAnalyzer.recordAction(
        playerAction,
        playerPos,
        gameState.time,
        gameState
      );
    }
    
    // 更新每个敌人
    let activeCount = 0;
    let totalIntelligence = 0;
    
    for (const [id, enemy] of this.enemies) {
      const context = {
        playerPosition: playerPos,
        playerAction: playerAction,
        gameTime: gameState.time,
        gameState: gameState
      };
      
      enemy.update(deltaTime, context);
      
      // 检查敌人是否存活
      if (gameState.enemies?.[id]?.alive !== false) {
        activeCount++;
        totalIntelligence += enemy.personality.adaptability;
      }
    }
    
    // 更新协同AI
    if (playerPos) {
      const activeEnemies = Array.from(this.enemies.values())
        .filter((_, index) => gameState.enemies?.[`enemy_${index}`]?.alive !== false);
      
      this.cooperativeAI.enemies = activeEnemies;
      this.cooperativeAI.update(deltaTime, playerPos);
    }
    
    // 更新性能统计
    this.performanceStats.activeEnemies = activeCount;
    this.performanceStats.totalEnemies = this.enemies.size;
    this.performanceStats.averageIntelligence = activeCount > 0 ? totalIntelligence / activeCount : 0;
    this.performanceStats.tacticalEffectiveness = this.cooperativeAI.coordinationLevel;
  }
  
  removeEnemy(id) {
    const enemy = this.enemies.get(id);
    if (enemy) {
      this.cooperativeAI.removeEnemy(enemy);
      this.enemies.delete(id);
      this.updatePerformanceStats();
    }
  }
  
  updatePerformanceStats() {
    // 更新性能统计
    this.performanceStats.totalEnemies = this.enemies.size;
  }
  
  setDifficultyFactor(factor) {
    this.difficultyFactor = Math.max(0.5, Math.min(factor, 2.0));
    
    // 更新所有敌人的基础属性
    for (const enemy of this.enemies.values()) {
      enemy.config.baseSpeed = (enemy.config.baseSpeed / this.difficultyFactor) * factor;
      enemy.config.detectionRange = (enemy.config.detectionRange / this.difficultyFactor) * factor;
      enemy.config.attackRange = (enemy.config.attackRange / this.difficultyFactor) * factor;
    }
    
    this.difficultyFactor = factor;
  }
  
  setAIIntelligence(level) {
    this.aiIntelligence = Math.max(0.5, Math.min(level, 2.0));
    
    // 更新所有敌人的学习能力
    for (const enemy of this.enemies.values()) {
      enemy.config.learningRate = (enemy.config.learningRate / this.aiIntelligence) * level;
      enemy.personality.adaptability = Math.min(enemy.personality.adaptability * level, 1);
    }
  }
  
  getGlobalPlayerAnalysis() {
    return {
      archetype: this.globalPlayerAnalyzer.getPlayerArchetype(),
      predictability: this.globalPlayerAnalyzer.calculatePredictability(),
      patterns: this.globalPlayerAnalyzer.analyzePatterns(),
      predictions: this.globalPlayerAnalyzer.predictNextAction()
    };
  }
  
  getEnemyStatus(id) {
    const enemy = this.enemies.get(id);
    return enemy ? enemy.getState() : null;
  }
  
  getAllEnemyStatus() {
    const status = {};
    for (const [id, enemy] of this.enemies) {
      status[id] = enemy.getState();
    }
    return status;
  }
  
  getCooperativeStatus() {
    return this.cooperativeAI.getStatus();
  }
  
  getPerformanceStats() {
    return { ...this.performanceStats };
  }
  
  reset() {
    this.enemies.clear();
    this.cooperativeAI = new CooperativeAI();
    this.globalPlayerAnalyzer = new PlayerBehaviorAnalyzer();
    this.performanceStats = {
      totalEnemies: 0,
      activeEnemies: 0,
      averageIntelligence: 0,
      tacticalEffectiveness: 0
    };
  }
  
  exportData() {
    const data = {
      difficultyFactor: this.difficultyFactor,
      aiIntelligence: this.aiIntelligence,
      performanceStats: this.performanceStats,
      playerAnalysis: this.getGlobalPlayerAnalysis()
    };
    
    // 导出关键敌人的数据
    const enemyData = {};
    for (const [id, enemy] of this.enemies) {
      enemyData[id] = {
        type: enemy.type,
        personality: enemy.personality,
        performance: enemy.performanceMetrics
      };
    }
    
    data.enemies = enemyData;
    
    return data;
  }
  
  importData(data) {
    if (data.difficultyFactor) this.difficultyFactor = data.difficultyFactor;
    if (data.aiIntelligence) this.aiIntelligence = data.aiIntelligence;
    if (data.performanceStats) this.performanceStats = data.performanceStats;
    
    // 注意：不能直接导入敌人状态，因为需要在游戏中重新创建
  }
}

// 导出
export {
  AIStateMachine,
  PlayerBehaviorAnalyzer,
  EnemyAI,
  CooperativeAI,
  AIManager
};

export default AIManager;
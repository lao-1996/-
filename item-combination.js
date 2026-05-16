/**
 * 道具组合系统 - Item Combination System
 * 实现多种道具类型、组合效果和策略使用系统
 */

// 道具类型定义
const ItemType = {
  // 基础道具
  SPEED: 'speed',
  JUMP: 'jump',
  SHIELD: 'shield',
  MAGNET: 'magnet',
  TIME: 'time',
  ATTACK: 'attack',
  
  // 特殊道具
  RANDOM: 'random',
  COMBO: 'combo',
  CHAIN: 'chain',
  ULTIMATE: 'ultimate',
  
  // 组合道具
  SUPER_JUMP: 'super_jump',
  GRAVITY_SHIELD: 'gravity_shield',
  TIME_STOP_ATTACK: 'time_stop_attack',
  TORNADO_DASH: 'tornado_dash',
  ELECTRIC_FIELD: 'electric_field',
  PHASE_SHIFT: 'phase_shift'
};

// 道具效果定义
const ItemEffects = {
  // 基础效果
  [ItemType.SPEED]: {
    name: '速度提升',
    description: '提高移动速度',
    duration: 5,
    multiplier: 1.5,
    visual: 'speedLines',
    sound: 'speed_up',
    particles: {
      type: 'trail',
      color: '#FF6B8B',
      count: 10
    }
  },
  
  [ItemType.JUMP]: {
    name: '跳跃增强',
    description: '提高跳跃高度',
    duration: 8,
    multiplier: 1.8,
    visual: 'jumpBoost',
    sound: 'jump_boost',
    particles: {
      type: 'burst',
      color: '#FFD166',
      count: 15
    }
  },
  
  [ItemType.SHIELD]: {
    name: '能量护盾',
    description: '吸收一次伤害',
    duration: 10,
    health: 1,
    visual: 'shieldBubble',
    sound: 'shield_activate',
    particles: {
      type: 'orbital',
      color: '#06D6A0',
      count: 8
    }
  },
  
  [ItemType.MAGNET]: {
    name: '引力磁铁',
    description: '自动吸引附近道具',
    duration: 12,
    radius: 200,
    visual: 'magnetField',
    sound: 'magnet_active',
    particles: {
      type: 'spiral',
      color: '#118AB2',
      count: 20
    }
  },
  
  [ItemType.TIME]: {
    name: '时间减缓',
    description: '减慢周围敌人速度',
    duration: 6,
    slowdown: 0.5,
    visual: 'timeSlow',
    sound: 'time_slow',
    particles: {
      type: 'wave',
      color: '#8338EC',
      count: 30
    }
  },
  
  [ItemType.ATTACK]: {
    name: '攻击强化',
    description: '提高攻击力',
    duration: 7,
    damage: 2,
    visual: 'attackBoost',
    sound: 'attack_power',
    particles: {
      type: 'sharp',
      color: '#EF476F',
      count: 12
    }
  },
  
  // 组合效果
  [ItemType.SUPER_JUMP]: {
    name: '超级跳跃',
    description: '速度+跳跃组合：极大提高跳跃能力',
    duration: 6,
    multiplier: 2.5,
    visual: 'superJumpEffect',
    sound: 'super_jump',
    particles: {
      type: 'doubleBurst',
      colors: ['#FF6B8B', '#FFD166'],
      count: 25
    },
    combo: [ItemType.SPEED, ItemType.JUMP]
  },
  
  [ItemType.GRAVITY_SHIELD]: {
    name: '引力护盾',
    description: '护盾+磁铁组合：吸引并偏转攻击',
    duration: 12,
    radius: 300,
    health: 2,
    visual: 'gravityField',
    sound: 'gravity_shield',
    particles: {
      type: 'vortex',
      colors: ['#06D6A0', '#118AB2'],
      count: 40
    },
    combo: [ItemType.SHIELD, ItemType.MAGNET]
  },
  
  [ItemType.TIME_STOP_ATTACK]: {
    name: '时间停止攻击',
    description: '时间+攻击组合：停止时间并造成巨大伤害',
    duration: 3,
    damage: 4,
    slowdown: 0.1,
    visual: 'timeFreeze',
    sound: 'time_stop',
    particles: {
      type: 'frozen',
      colors: ['#8338EC', '#EF476F'],
      count: 50
    },
    combo: [ItemType.TIME, ItemType.ATTACK]
  },
  
  [ItemType.TORNADO_DASH]: {
    name: '旋风冲刺',
    description: '速度+跳跃+攻击组合：旋风般移动并攻击',
    duration: 4,
    damage: 3,
    multiplier: 2.0,
    visual: 'tornadoEffect',
    sound: 'tornado_dash',
    particles: {
      type: 'tornado',
      colors: ['#FF6B8B', '#FFD166', '#EF476F'],
      count: 60
    },
    combo: [ItemType.SPEED, ItemType.JUMP, ItemType.ATTACK]
  },
  
  [ItemType.ELECTRIC_FIELD]: {
    name: '电磁领域',
    description: '磁铁+攻击组合：创造伤害性电磁场',
    duration: 8,
    damage: 1.5,
    radius: 250,
    visual: 'electricField',
    sound: 'electric_field',
    particles: {
      type: 'lightning',
      colors: ['#118AB2', '#EF476F'],
      count: 35
    },
    combo: [ItemType.MAGNET, ItemType.ATTACK]
  },
  
  [ItemType.PHASE_SHIFT]: {
    name: '相位转移',
    description: '时间+护盾组合：短暂无敌并穿越障碍',
    duration: 2,
    invincible: true,
    visual: 'phaseShift',
    sound: 'phase_shift',
    particles: {
      type: 'ghost',
      colors: ['#8338EC', '#06D6A0'],
      count: 45
    },
    combo: [ItemType.TIME, ItemType.SHIELD]
  }
};

// 道具类
class GameItem {
  constructor(type, position, id = null) {
    this.id = id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.position = { ...position };
    this.collected = false;
    this.collectionTime = 0;
    this.effect = ItemEffects[type] || null;
    this.visualState = {
      rotation: 0,
      scale: 1,
      pulse: 0,
      glow: 0
    };
    this.rarity = this.calculateRarity();
  }
  
  calculateRarity() {
    const rarities = {
      [ItemType.SPEED]: 'common',
      [ItemType.JUMP]: 'common',
      [ItemType.SHIELD]: 'uncommon',
      [ItemType.MAGNET]: 'uncommon',
      [ItemType.TIME]: 'rare',
      [ItemType.ATTACK]: 'rare',
      [ItemType.RANDOM]: 'special',
      [ItemType.COMBO]: 'special',
      [ItemType.CHAIN]: 'epic',
      [ItemType.ULTIMATE]: 'legendary'
    };
    
    return rarities[this.type] || 'common';
  }
  
  update(deltaTime) {
    // 更新视觉效果
    this.visualState.rotation += deltaTime * 100;
    this.visualState.pulse = Math.sin(Date.now() * 0.002) * 0.2 + 0.8;
    this.visualState.glow = Math.sin(Date.now() * 0.001) * 0.3 + 0.7;
    
    // 限制旋转角度
    if (this.visualState.rotation >= 360) {
      this.visualState.rotation -= 360;
    }
  }
  
  collect(player) {
    this.collected = true;
    this.collectionTime = Date.now();
    
    // 触发收集效果
    if (this.effect?.sound) {
      // 播放音效
    }
    
    return {
      success: true,
      itemType: this.type,
      effect: this.effect,
      rarity: this.rarity
    };
  }
  
  getVisualData() {
    const colors = {
      common: '#4ECDC4',
      uncommon: '#45B7D1',
      rare: '#96CEB4',
      special: '#FFEAA7',
      epic: '#FF6B6B',
      legendary: '#FFD166'
    };
    
    return {
      type: this.type,
      rarity: this.rarity,
      color: colors[this.rarity] || '#FFFFFF',
      visualState: { ...this.visualState },
      effect: this.effect ? {
        name: this.effect.name,
        visual: this.effect.visual
      } : null
    };
  }
}

// 道具组合器
class ItemCombiner {
  constructor() {
    this.combinationRules = this.createCombinationRules();
    this.combinationHistory = [];
    this.successRate = 0.8; // 组合成功率
  }
  
  createCombinationRules() {
    return {
      // 双道具组合
      [`${ItemType.SPEED}+${ItemType.JUMP}`]: {
        result: ItemType.SUPER_JUMP,
        name: '速度+跳跃',
        description: '组合成超级跳跃',
        visual: 'combo_success_speed_jump'
      },
      [`${ItemType.JUMP}+${ItemType.SPEED}`]: {
        result: ItemType.SUPER_JUMP,
        name: '跳跃+速度',
        description: '组合成超级跳跃',
        visual: 'combo_success_jump_speed'
      },
      
      [`${ItemType.SHIELD}+${ItemType.MAGNET}`]: {
        result: ItemType.GRAVITY_SHIELD,
        name: '护盾+磁铁',
        description: '组合成引力护盾',
        visual: 'combo_success_shield_magnet'
      },
      [`${ItemType.MAGNET}+${ItemType.SHIELD}`]: {
        result: ItemType.GRAVITY_SHIELD,
        name: '磁铁+护盾',
        description: '组合成引力护盾',
        visual: 'combo_success_magnet_shield'
      },
      
      [`${ItemType.TIME}+${ItemType.ATTACK}`]: {
        result: ItemType.TIME_STOP_ATTACK,
        name: '时间+攻击',
        description: '组合成时间停止攻击',
        visual: 'combo_success_time_attack'
      },
      [`${ItemType.ATTACK}+${ItemType.TIME}`]: {
        result: ItemType.TIME_STOP_ATTACK,
        name: '攻击+时间',
        description: '组合成时间停止攻击',
        visual: 'combo_success_attack_time'
      },
      
      [`${ItemType.MAGNET}+${ItemType.ATTACK}`]: {
        result: ItemType.ELECTRIC_FIELD,
        name: '磁铁+攻击',
        description: '组合成电磁领域',
        visual: 'combo_success_magnet_attack'
      },
      [`${ItemType.ATTACK}+${ItemType.MAGNET}`]: {
        result: ItemType.ELECTRIC_FIELD,
        name: '攻击+磁铁',
        description: '组合成电磁领域',
        visual: 'combo_success_attack_magnet'
      },
      
      [`${ItemType.TIME}+${ItemType.SHIELD}`]: {
        result: ItemType.PHASE_SHIFT,
        name: '时间+护盾',
        description: '组合成相位转移',
        visual: 'combo_success_time_shield'
      },
      [`${ItemType.SHIELD}+${ItemType.TIME}`]: {
        result: ItemType.PHASE_SHIFT,
        name: '护盾+时间',
        description: '组合成相位转移',
        visual: 'combo_success_shield_time'
      },
      
      // 三道具组合
      [`${ItemType.SPEED}+${ItemType.JUMP}+${ItemType.ATTACK}`]: {
        result: ItemType.TORNADO_DASH,
        name: '速度+跳跃+攻击',
        description: '组合成旋风冲刺',
        visual: 'combo_success_triple_tornado'
      },
      
      // 其他组合顺序
      [`${ItemType.SPEED}+${ItemType.ATTACK}+${ItemType.JUMP}`]: {
        result: ItemType.TORNADO_DASH,
        name: '速度+攻击+跳跃',
        description: '组合成旋风冲刺',
        visual: 'combo_success_triple_tornado'
      },
      [`${ItemType.JUMP}+${ItemType.SPEED}+${ItemType.ATTACK}`]: {
        result: ItemType.TORNADO_DASH,
        name: '跳跃+速度+攻击',
        description: '组合成旋风冲刺',
        visual: 'combo_success_triple_tornado'
      },
      [`${ItemType.JUMP}+${ItemType.ATTACK}+${ItemType.SPEED}`]: {
        result: ItemType.TORNADO_DASH,
        name: '跳跃+攻击+速度',
        description: '组合成旋风冲刺',
        visual: 'combo_success_triple_tornado'
      },
      [`${ItemType.ATTACK}+${ItemType.SPEED}+${ItemType.JUMP}`]: {
        result: ItemType.TORNADO_DASH,
        name: '攻击+速度+跳跃',
        description: '组合成旋风冲刺',
        visual: 'combo_success_triple_tornado'
      },
      [`${ItemType.ATTACK}+${ItemType.JUMP}+${ItemType.SPEED}`]: {
        result: ItemType.TORNADO_DASH,
        name: '攻击+跳跃+速度',
        description: '组合成旋风冲刺',
        visual: 'combo_success_triple_tornado'
      },
      
      // 特殊组合
      [`${ItemType.COMBO}+${ItemType.COMBO}`]: {
        result: ItemType.ULTIMATE,
        name: '组合+组合',
        description: '双重组合形成终极道具',
        visual: 'combo_success_ultimate',
        special: true
      },
      
      [`${ItemType.CHAIN}+${ItemType.CHAIN}+${ItemType.CHAIN}`]: {
        result: ItemType.ULTIMATE,
        name: '连锁三重奏',
        description: '三个连锁道具形成终极连锁',
        visual: 'combo_success_chain_ultimate',
        special: true
      }
    };
  }
  
  canCombine(items) {
    if (items.length < 2) return false;
    
    // 检查是否都是可组合的道具类型
    const validTypes = Object.values(ItemType).filter(type => 
      type !== ItemType.RANDOM && 
      type !== ItemType.ULTIMATE
    );
    
    for (const item of items) {
      if (!validTypes.includes(item.type)) {
        return false;
      }
    }
    
    return true;
  }
  
  combine(items) {
    if (!this.canCombine(items)) {
      return {
        success: false,
        message: '无法组合这些道具',
        items: items.map(i => i.type)
      };
    }
    
    // 生成组合键
    const combinationKey = items.map(item => item.type).sort().join('+');
    
    // 查找组合规则
    let rule = this.combinationRules[combinationKey];
    
    // 如果没有精确匹配，尝试其他顺序
    if (!rule) {
      // 尝试所有排列
      const permutations = this.getPermutations(items.map(item => item.type));
      for (const perm of permutations) {
        const permKey = perm.join('+');
        if (this.combinationRules[permKey]) {
          rule = this.combinationRules[permKey];
          break;
        }
      }
    }
    
    if (!rule) {
      return {
        success: false,
        message: '没有找到对应的组合规则',
        combinationKey
      };
    }
    
    // 检查组合成功率
    const success = Math.random() <= this.successRate;
    
    if (!success) {
      // 组合失败
      this.recordCombination(combinationKey, false);
      
      return {
        success: false,
        message: '组合失败！',
        combinationKey,
        visual: 'combo_fail'
      };
    }
    
    // 组合成功
    this.recordCombination(combinationKey, true);
    
    // 创建组合道具
    const resultItem = new GameItem(rule.result, items[0].position);
    
    return {
      success: true,
      result: rule.result,
      item: resultItem,
      rule,
      visual: rule.visual,
      message: `组合成功！获得：${rule.name}`
    };
  }
  
  getPermutations(arr) {
    const result = [];
    
    function permute(current, remaining) {
      if (remaining.length === 0) {
        result.push([...current]);
        return;
      }
      
      for (let i = 0; i < remaining.length; i++) {
        current.push(remaining[i]);
        permute(current, [...remaining.slice(0, i), ...remaining.slice(i + 1)]);
        current.pop();
      }
    }
    
    permute([], arr);
    return result;
  }
  
  recordCombination(combinationKey, success) {
    this.combinationHistory.push({
      timestamp: Date.now(),
      combination: combinationKey,
      success,
      successRate: this.successRate
    });
    
    // 限制历史记录大小
    if (this.combinationHistory.length > 100) {
      this.combinationHistory.shift();
    }
    
    // 根据历史调整成功率
    this.adjustSuccessRate();
  }
  
  adjustSuccessRate() {
    if (this.combinationHistory.length < 10) return;
    
    const recent = this.combinationHistory.slice(-10);
    const successCount = recent.filter(r => r.success).length;
    const currentRate = successCount / 10;
    
    // 平滑调整成功率
    const targetRate = 0.8;
    const adjustment = (targetRate - currentRate) * 0.1;
    this.successRate = Math.max(0.3, Math.min(this.successRate + adjustment, 0.95));
  }
  
  getCombinationSuggestions(inventory) {
    const suggestions = [];
    const itemTypes = inventory.map(item => item.type);
    
    // 检查所有可能的双道具组合
    for (let i = 0; i < itemTypes.length; i++) {
      for (let j = i + 1; j < itemTypes.length; j++) {
        const combo = [itemTypes[i], itemTypes[j]].sort().join('+');
        if (this.combinationRules[combo]) {
          suggestions.push({
            items: [itemTypes[i], itemTypes[j]],
            result: this.combinationRules[combo].result,
            name: this.combinationRules[combo].name,
            description: this.combinationRules[combo].description,
            priority: 1
          });
        }
      }
    }
    
    // 检查三道具组合
    if (itemTypes.length >= 3) {
      for (let i = 0; i < itemTypes.length; i++) {
        for (let j = i + 1; j < itemTypes.length; j++) {
          for (let k = j + 1; k < itemTypes.length; k++) {
            const combo = [itemTypes[i], itemTypes[j], itemTypes[k]].sort().join('+');
            if (this.combinationRules[combo]) {
              suggestions.push({
                items: [itemTypes[i], itemTypes[j], itemTypes[k]],
                result: this.combinationRules[combo].result,
                name: this.combinationRules[combo].name,
                description: this.combinationRules[combo].description,
                priority: 2 // 三道具组合优先级更高
              });
            }
          }
        }
      }
    }
    
    // 按优先级排序
    suggestions.sort((a, b) => b.priority - a.priority);
    
    return suggestions;
  }
  
  getStatistics() {
    const total = this.combinationHistory.length;
    const successful = this.combinationHistory.filter(r => r.success).length;
    const successRate = total > 0 ? successful / total : 0;
    
    // 最常用的组合
    const comboCounts = {};
    for (const record of this.combinationHistory) {
      if (record.success) {
        comboCounts[record.combination] = (comboCounts[record.combination] || 0) + 1;
      }
    }
    
    let mostCommon = null;
    let maxCount = 0;
    for (const [combo, count] of Object.entries(comboCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = combo;
      }
    }
    
    return {
      totalCombinations: total,
      successfulCombinations: successful,
      successRate: successRate * 100,
      currentSuccessRate: this.successRate * 100,
      mostCommonCombination: mostCommon,
      mostCommonCount: maxCount
    };
  }
}

// 道具库存管理系统
class ItemInventory {
  constructor(maxSize = 6) {
    this.items = [];
    this.maxSize = maxSize;
    this.activeEffects = new Map(); // type -> effect data
    this.combiner = new ItemCombiner();
    this.useHistory = [];
  }
  
  addItem(item) {
    if (this.items.length >= this.maxSize) {
      return {
        success: false,
        message: '道具栏已满',
        item
      };
    }
    
    this.items.push(item);
    
    return {
      success: true,
      message: `获得道具：${item.effect?.name || item.type}`,
      item,
      inventorySize: this.items.length
    };
  }
  
  removeItem(itemId) {
    const index = this.items.findIndex(item => item.id === itemId);
    if (index === -1) return false;
    
    this.items.splice(index, 1);
    return true;
  }
  
  useItem(itemId, context = {}) {
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return {
        success: false,
        message: '道具不存在'
      };
    }
    
    const item = this.items[itemIndex];
    
    // 特殊道具处理
    if (item.type === ItemType.RANDOM) {
      return this.useRandomItem(context);
    }
    
    if (item.type === ItemType.COMBO) {
      return this.useComboItem(context);
    }
    
    // 普通道具使用
    const effect = item.effect;
    if (!effect) {
      return {
        success: false,
        message: '道具效果无效'
      };
    }
    
    // 激活效果
    this.activateEffect(item.type, effect, context);
    
    // 移除道具
    this.items.splice(itemIndex, 1);
    
    // 记录使用历史
    this.recordUse(item.type, true);
    
    return {
      success: true,
      message: `使用道具：${effect.name}`,
      effect: { ...effect },
      remainingItems: this.items.length
    };
  }
  
  useRandomItem(context) {
    // 随机选择一个基础道具类型
    const basicTypes = [
      ItemType.SPEED, ItemType.JUMP, ItemType.SHIELD,
      ItemType.MAGNET, ItemType.TIME, ItemType.ATTACK
    ];
    
    const randomType = basicTypes[Math.floor(Math.random() * basicTypes.length)];
    const effect = ItemEffects[randomType];
    
    // 激活效果
    this.activateEffect(randomType, effect, context);
    
    // 记录使用历史
    this.recordUse(ItemType.RANDOM, true);
    
    return {
      success: true,
      message: `随机道具：${effect.name}`,
      effect: { ...effect },
      randomType
    };
  }
  
  useComboItem(context) {
    // 检查是否有可组合的道具
    const suggestions = this.combiner.getCombinationSuggestions(this.items);
    if (suggestions.length === 0) {
      return {
        success: false,
        message: '没有可组合的道具',
        suggestions: []
      };
    }
    
    // 使用最佳建议
    const bestSuggestion = suggestions[0];
    
    // 找出对应的道具
    const comboItems = [];
    for (const type of bestSuggestion.items) {
      const index = this.items.findIndex(item => item.type === type);
      if (index > -1) {
        comboItems.push(this.items[index]);
      }
    }
    
    if (comboItems.length !== bestSuggestion.items.length) {
      return {
        success: false,
        message: '道具组合失败',
        suggestion: bestSuggestion
      };
    }
    
    // 执行组合
    const result = this.combiner.combine(comboItems);
    
    if (result.success) {
      // 移除使用的道具
      for (const item of comboItems) {
        this.removeItem(item.id);
      }
      
      // 添加组合结果
      if (result.item) {
        this.addItem(result.item);
      }
      
      // 记录使用历史
      this.recordUse(ItemType.COMBO, true);
      
      return {
        success: true,
        message: result.message,
        suggestion: bestSuggestion,
        result: result.result,
        visual: result.visual
      };
    }
    
    return {
      success: false,
      message: '组合道具使用失败',
      result
    };
  }
  
  combineItems(itemIds) {
    const items = [];
    for (const id of itemIds) {
      const item = this.items.find(item => item.id === id);
      if (item) {
        items.push(item);
      }
    }
    
    if (items.length < 2) {
      return {
        success: false,
        message: '至少需要两个道具进行组合'
      };
    }
    
    const result = this.combiner.combine(items);
    
    if (result.success) {
      // 移除原始道具
      for (const item of items) {
        this.removeItem(item.id);
      }
      
      // 添加组合结果
      if (result.item) {
        this.addItem(result.item);
      }
      
      return result;
    }
    
    return result;
  }
  
  activateEffect(type, effect, context) {
    const effectData = {
      type,
      ...effect,
      startTime: Date.now(),
      endTime: Date.now() + effect.duration * 1000,
      context: { ...context }
    };
    
    this.activeEffects.set(type, effectData);
    
    // 触发效果激活事件
    if (effect.sound) {
      // 播放音效
    }
  }
  
  updateEffects(deltaTime, gameState) {
    const now = Date.now();
    const expired = [];
    
    for (const [type, effect] of this.activeEffects.entries()) {
      if (now >= effect.endTime) {
        expired.push(type);
      } else {
        // 更新持续效果
        this.updateActiveEffect(type, effect, deltaTime, gameState);
      }
    }
    
    // 移除过期效果
    for (const type of expired) {
      this.activeEffects.delete(type);
      
      // 触发效果结束事件
      const effect = ItemEffects[type];
      if (effect?.sound) {
        // 播放结束音效
      }
    }
  }
  
  updateActiveEffect(type, effect, deltaTime, gameState) {
    // 根据效果类型更新游戏状态
    switch (type) {
      case ItemType.SPEED:
      case ItemType.SUPER_JUMP:
      case ItemType.TORNADO_DASH:
        // 更新玩家速度
        if (gameState.player) {
          gameState.player.speedMultiplier = effect.multiplier;
        }
        break;
        
      case ItemType.JUMP:
        // 更新跳跃能力
        if (gameState.player) {
          gameState.player.jumpMultiplier = effect.multiplier;
        }
        break;
        
      case ItemType.TIME:
      case ItemType.TIME_STOP_ATTACK:
        // 更新时间减缓效果
        if (gameState.enemies) {
          for (const enemy of Object.values(gameState.enemies)) {
            enemy.speedMultiplier = effect.slowdown;
          }
        }
        break;
        
      case ItemType.MAGNET:
      case ItemType.GRAVITY_SHIELD:
      case ItemType.ELECTRIC_FIELD:
        // 更新磁力效果
        // 实际游戏中需要根据具体实现调整
        break;
    }
  }
  
  recordUse(itemType, success) {
    this.useHistory.push({
      timestamp: Date.now(),
      itemType,
      success,
      inventorySize: this.items.length
    });
    
    // 限制历史记录大小
    if (this.useHistory.length > 100) {
      this.useHistory.shift();
    }
  }
  
  getActiveEffects() {
    return Array.from(this.activeEffects.values()).map(effect => ({
      type: effect.type,
      name: effect.name,
      remaining: Math.max(0, effect.endTime - Date.now()) / 1000,
      visual: effect.visual
    }));
  }
  
  getCombinationSuggestions() {
    return this.combiner.getCombinationSuggestions(this.items);
  }
  
  getStatistics() {
    const comboStats = this.combiner.getStatistics();
    
    const useCounts = {};
    for (const record of this.useHistory) {
      if (record.success) {
        useCounts[record.itemType] = (useCounts[record.itemType] || 0) + 1;
      }
    }
    
    let mostUsed = null;
    let maxUse = 0;
    for (const [type, count] of Object.entries(useCounts)) {
      if (count > maxUse) {
        maxUse = count;
        mostUsed = type;
      }
    }
    
    return {
      inventorySize: this.items.length,
      maxSize: this.maxSize,
      activeEffects: this.activeEffects.size,
      totalUses: this.useHistory.length,
      mostUsedItem: mostUsed,
      mostUsedCount: maxUse,
      combinationStats: comboStats
    };
  }
  
  getInventoryData() {
    return this.items.map(item => ({
      id: item.id,
      type: item.type,
      name: item.effect?.name || item.type,
      rarity: item.rarity,
      visual: item.getVisualData()
    }));
  }
  
  clear() {
    this.items = [];
    this.activeEffects.clear();
  }
}

// 道具生成系统
class ItemGenerator {
  constructor(difficultyFactor = 1.0) {
    this.difficultyFactor = difficultyFactor;
    this.spawnRules = this.createSpawnRules();
    this.spawnHistory = [];
    this.lastSpawnTime = 0;
    
    // 生成参数
    this.baseSpawnRate = 0.3; // 基础生成率
    this.minSpawnInterval = 5; // 最小生成间隔（秒）
    this.maxSpawnInterval = 15; // 最大生成间隔（秒）
    
    // 智能生成参数
    this.playerItemPreference = new Map();
    this.recentlySpawned = new Set();
  }
  
  createSpawnRules() {
    return {
      // 基础道具权重
      [ItemType.SPEED]: { weight: 20, difficulty: 0.1 },
      [ItemType.JUMP]: { weight: 20, difficulty: 0.1 },
      [ItemType.SHIELD]: { weight: 15, difficulty: 0.3 },
      [ItemType.MAGNET]: { weight: 15, difficulty: 0.3 },
      [ItemType.TIME]: { weight: 10, difficulty: 0.6 },
      [ItemType.ATTACK]: { weight: 10, difficulty: 0.6 },
      
      // 特殊道具权重
      [ItemType.RANDOM]: { weight: 5, difficulty: 0.4 },
      [ItemType.COMBO]: { weight: 3, difficulty: 0.7 },
      [ItemType.CHAIN]: { weight: 1, difficulty: 0.9 },
      [ItemType.ULTIMATE]: { weight: 0.5, difficulty: 1.0 }
    };
  }
  
  shouldSpawnItem(currentTime, gameState) {
    const timeSinceLastSpawn = currentTime - this.lastSpawnTime;
    const minInterval = this.minSpawnInterval / this.difficultyFactor;
    const maxInterval = this.maxSpawnInterval / this.difficultyFactor;
    
    // 基础随机检查
    const baseChance = timeSinceLastSpawn / maxInterval;
    const randomCheck = Math.random();
    
    return baseChance > randomCheck && timeSinceLastSpawn >= minInterval;
  }
  
  generateItem(position, gameState) {
    // 智能选择道具类型
    const itemType = this.selectSmartItemType(gameState);
    
    // 创建道具
    const item = new GameItem(itemType, position);
    
    // 记录生成历史
    this.recordSpawn(itemType, position, gameState);
    
    // 更新最后生成时间
    this.lastSpawnTime = Date.now();
    
    return {
      success: true,
      item,
      type: itemType,
      rarity: item.rarity,
      position: { ...position }
    };
  }
  
  selectSmartItemType(gameState) {
    const playerState = gameState.player;
    const inventory = gameState.inventory || [];
    
    // 计算权重
    let totalWeight = 0;
    const weightedTypes = [];
    
    for (const [type, rule] of Object.entries(this.spawnRules)) {
      let weight = rule.weight;
      
      // 难度调整
      weight *= (1 + (this.difficultyFactor - 1) * rule.difficulty);
      
      // 玩家偏好调整
      if (this.playerItemPreference.has(type)) {
        const preference = this.playerItemPreference.get(type);
        weight *= (1 + preference * 0.5);
      }
      
      // 避免重复生成
      if (this.recentlySpawned.has(type)) {
        weight *= 0.3;
      }
      
      // 库存考虑
      const inventoryCount = inventory.filter(item => item.type === type).length;
      if (inventoryCount > 0) {
        // 如果玩家已经有这个道具，稍微降低生成概率
        weight *= Math.max(0.7, 1 - inventoryCount * 0.2);
      }
      
      // 游戏状态考虑
      if (playerState) {
        if (playerState.health < 0.3 && type === ItemType.SHIELD) {
          weight *= 2.0; // 低生命值时提高护盾生成率
        }
        
        if (playerState.speed < 100 && type === ItemType.SPEED) {
          weight *= 1.5; // 速度低时提高速度道具生成率
        }
        
        if (gameState.enemyCount > 5 && type === ItemType.ATTACK) {
          weight *= 1.8; // 敌人多时提高攻击道具生成率
        }
      }
      
      weightedTypes.push({ type, weight });
      totalWeight += weight;
    }
    
    // 随机选择
    let random = Math.random() * totalWeight;
    for (const { type, weight } of weightedTypes) {
      random -= weight;
      if (random <= 0) {
        // 记录已生成类型
        this.recentlySpawned.add(type);
        
        // 清理记录（保持最近5个）
        if (this.recentlySpawned.size > 5) {
          const oldest = Array.from(this.recentlySpawned)[0];
          this.recentlySpawned.delete(oldest);
        }
        
        return type;
      }
    }
    
    // 默认返回常见道具
    return ItemType.SPEED;
  }
  
  recordSpawn(itemType, position, gameState) {
    this.spawnHistory.push({
      timestamp: Date.now(),
      itemType,
      position: { ...position },
      gameState: {
        playerHealth: gameState.player?.health,
        inventorySize: gameState.inventory?.length || 0,
        enemyCount: gameState.enemyCount || 0
      }
    });
    
    // 限制历史记录大小
    if (this.spawnHistory.length > 50) {
      this.spawnHistory.shift();
    }
  }
  
  updatePlayerPreference(itemType, usedSuccessfully) {
    const currentPreference = this.playerItemPreference.get(itemType) || 0;
    const change = usedSuccessfully ? 0.1 : -0.05;
    
    this.playerItemPreference.set(
      itemType,
      Math.max(-0.5, Math.min(currentPreference + change, 0.5))
    );
  }
  
  setDifficultyFactor(factor) {
    this.difficultyFactor = Math.max(0.5, Math.min(factor, 2.0));
  }
  
  getSpawnStatistics() {
    const typeCounts = {};
    for (const record of this.spawnHistory) {
      typeCounts[record.itemType] = (typeCounts[record.itemType] || 0) + 1;
    }
    
    let mostCommon = null;
    let maxCount = 0;
    for (const [type, count] of Object.entries(typeCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = type;
      }
    }
    
    return {
      totalSpawns: this.spawnHistory.length,
      mostSpawnedType: mostCommon,
      mostSpawnedCount: maxCount,
      difficultyFactor: this.difficultyFactor,
      playerPreferences: Object.fromEntries(this.playerItemPreference)
    };
  }
}

// 道具策略系统
class ItemStrategySystem {
  constructor() {
    this.strategyModes = {
      aggressive: {
        name: '进攻型',
        priority: ['ATTACK', 'SPEED', 'TIME', 'JUMP', 'SHIELD', 'MAGNET'],
        comboFocus: ['TIME_STOP_ATTACK', 'TORNADO_DASH', 'ELECTRIC_FIELD']
      },
      defensive: {
        name: '防御型',
        priority: ['SHIELD', 'MAGNET', 'TIME', 'JUMP', 'SPEED', 'ATTACK'],
        comboFocus: ['GRAVITY_SHIELD', 'PHASE_SHIFT', 'SUPER_JUMP']
      },
      balanced: {
        name: '平衡型',
        priority: ['SHIELD', 'SPEED', 'JUMP', 'ATTACK', 'MAGNET', 'TIME'],
        comboFocus: ['SUPER_JUMP', 'GRAVITY_SHIELD', 'ELECTRIC_FIELD']
      },
      strategic: {
        name: '策略型',
        priority: ['TIME', 'COMBO', 'RANDOM', 'ATTACK', 'SHIELD', 'SPEED'],
        comboFocus: ['TIME_STOP_ATTACK', 'PHASE_SHIFT', 'TORNADO_DASH']
      }
    };
    
    this.currentStrategy = 'balanced';
    this.situationAnalysis = {};
    this.recommendationHistory = [];
  }
  
  analyzeSituation(gameState) {
    const analysis = {
      playerHealth: gameState.player?.health || 1,
      enemyCount: gameState.enemyCount || 0,
      enemyAggression: gameState.enemyAggression || 0,
      inventory: gameState.inventory?.length || 0,
      activeEffects: gameState.activeEffects?.length || 0,
      difficulty: gameState.difficulty || 1
    };
    
    // 评估紧急程度
    let urgency = 0;
    
    if (analysis.playerHealth < 0.3) urgency += 0.4;
    if (analysis.enemyCount > 5) urgency += 0.3;
    if (analysis.enemyAggression > 0.7) urgency += 0.2;
    if (analysis.activeEffects === 0) urgency += 0.1;
    
    analysis.urgency = Math.min(urgency, 1);
    
    // 推荐策略
    if (analysis.urgency > 0.6) {
      analysis.recommendedStrategy = analysis.playerHealth < 0.3 ? 'defensive' : 'aggressive';
    } else if (analysis.enemyCount > 8) {
      analysis.recommendedStrategy = 'strategic';
    } else {
      analysis.recommendedStrategy = 'balanced';
    }
    
    this.situationAnalysis = analysis;
    return analysis;
  }
  
  getItemRecommendations(inventory, gameState) {
    const analysis = this.analyzeSituation(gameState);
    const strategy = this.strategyModes[analysis.recommendedStrategy];
    
    const recommendations = [];
    
    // 检查库存中的道具
    for (const item of inventory) {
      const priority = strategy.priority.indexOf(item.type.toUpperCase());
      if (priority !== -1) {
        recommendations.push({
          itemId: item.id,
          itemType: item.type,
          priority: priority + 1, // 越低优先级越高
          reason: this.getRecommendationReason(item.type, analysis),
          action: 'use',
          confidence: this.calculateConfidence(item.type, analysis)
        });
      }
    }
    
    // 检查组合建议
    if (inventory.length >= 2) {
      // 这里可以添加组合推荐逻辑
    }
    
    // 按优先级排序
    recommendations.sort((a, b) => a.priority - b.priority);
    
    // 记录推荐历史
    if (recommendations.length > 0) {
      this.recordRecommendation(recommendations[0], analysis);
    }
    
    return {
      strategy: strategy.name,
      analysis,
      recommendations,
      topRecommendation: recommendations[0] || null
    };
  }
  
  getRecommendationReason(itemType, analysis) {
    const reasons = {
      [ItemType.SHIELD]: `生命值较低（${Math.round(analysis.playerHealth * 100)}%）`,
      [ItemType.ATTACK]: `敌人数量多（${analysis.enemyCount}个）`,
      [ItemType.SPEED]: `需要快速移动避开敌人`,
      [ItemType.JUMP]: `需要跨越障碍`,
      [ItemType.TIME]: `敌人攻击密集，需要减缓时间`,
      [ItemType.MAGNET]: `需要收集远处道具`,
      [ItemType.COMBO]: `有多个可组合的道具`,
      [ItemType.RANDOM]: `需要随机应变`
    };
    
    return reasons[itemType] || '适合当前情况';
  }
  
  calculateConfidence(itemType, analysis) {
    let confidence = 0.5;
    
    switch (itemType) {
      case ItemType.SHIELD:
        confidence = 1 - analysis.playerHealth; // 生命值越低，护盾推荐置信度越高
        break;
      case ItemType.ATTACK:
        confidence = Math.min(analysis.enemyCount / 10, 1);
        break;
      case ItemType.SPEED:
        confidence = analysis.enemyAggression;
        break;
      case ItemType.TIME:
        confidence = Math.min(analysis.enemyCount * 0.1, 1);
        break;
    }
    
    return Math.min(Math.max(confidence, 0.1), 0.95);
  }
  
  recordRecommendation(recommendation, analysis) {
    this.recommendationHistory.push({
      timestamp: Date.now(),
      recommendation: {
        itemType: recommendation.itemType,
        action: recommendation.action,
        reason: recommendation.reason
      },
      analysis: {
        playerHealth: analysis.playerHealth,
        enemyCount: analysis.enemyCount,
        urgency: analysis.urgency
      },
      followed: false // 是否被玩家采纳
    });
    
    // 限制历史记录大小
    if (this.recommendationHistory.length > 50) {
      this.recommendationHistory.shift();
    }
  }
  
  markRecommendationFollowed(timestamp, success) {
    const record = this.recommendationHistory.find(r => r.timestamp === timestamp);
    if (record) {
      record.followed = true;
      record.success = success;
    }
  }
  
  getStrategyStatistics() {
    const total = this.recommendationHistory.length;
    const followed = this.recommendationHistory.filter(r => r.followed).length;
    const successful = this.recommendationHistory.filter(r => r.followed && r.success).length;
    
    const strategyCounts = {};
    for (const record of this.recommendationHistory) {
      if (record.followed) {
        const strategy = record.analysis.urgency > 0.6 ? '紧急' : '常规';
        strategyCounts[strategy] = (strategyCounts[strategy] || 0) + 1;
      }
    }
    
    return {
      totalRecommendations: total,
      followedRecommendations: followed,
      followRate: total > 0 ? followed / total : 0,
      successRate: followed > 0 ? successful / followed : 0,
      strategyDistribution: strategyCounts,
      currentStrategy: this.currentStrategy
    };
  }
  
  setStrategy(strategy) {
    if (this.strategyModes[strategy]) {
      this.currentStrategy = strategy;
      return true;
    }
    return false;
  }
}

// 主道具系统
class ItemSystem {
  constructor(config = {}) {
    this.config = {
      maxInventorySize: 6,
      baseSpawnRate: 0.3,
      difficultyFactor: 1.0,
      ...config
    };
    
    this.inventory = new ItemInventory(this.config.maxInventorySize);
    this.generator = new ItemGenerator(this.config.difficultyFactor);
    this.strategy = new ItemStrategySystem();
    this.activeItems = new Map(); // 场景中的道具
    this.systemStats = {
      totalItemsCollected: 0,
      totalCombinations: 0,
      totalUses: 0,
      gameplayTime: 0
    };
  }
  
  update(deltaTime, gameState) {
    // 更新系统时间
    this.systemStats.gameplayTime += deltaTime;
    
    // 更新场景中的道具
    this.updateActiveItems(deltaTime, gameState);
    
    // 更新库存效果
    this.inventory.updateEffects(deltaTime, gameState);
    
    // 检查是否应该生成新道具
    if (this.shouldGenerateItem(gameState)) {
      const position = this.calculateSpawnPosition(gameState);
      if (position) {
        const result = this.generator.generateItem(position, gameState);
        if (result.success) {
          this.activeItems.set(result.item.id, result.item);
        }
      }
    }
  }
  
  updateActiveItems(deltaTime, gameState) {
    const toRemove = [];
    
    for (const [id, item] of this.activeItems.entries()) {
      item.update(deltaTime);
      
      // 检查是否被收集
      if (this.checkCollection(item, gameState.player)) {
        const collectionResult = this.collectItem(id, gameState);
        if (collectionResult.success) {
          toRemove.push(id);
        }
      }
    }
    
    // 移除已收集的道具
    for (const id of toRemove) {
      this.activeItems.delete(id);
    }
  }
  
  checkCollection(item, player) {
    if (!player || !player.position || item.collected) return false;
    
    const dx = item.position.x - player.position.x;
    const dy = item.position.y - player.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 检查玩家是否在收集范围内
    return distance <= 50; // 收集半径
  }
  
  collectItem(itemId, gameState) {
    const item = this.activeItems.get(itemId);
    if (!item) {
      return {
        success: false,
        message: '道具不存在'
      };
    }
    
    const collectionResult = item.collect(gameState.player);
    if (!collectionResult.success) {
      return collectionResult;
    }
    
    // 添加到库存
    const inventoryResult = this.inventory.addItem(item);
    
    if (inventoryResult.success) {
      // 更新统计数据
      this.systemStats.totalItemsCollected++;
      
      // 更新生成器偏好
      this.generator.updatePlayerPreference(item.type, true);
      
      return {
        success: true,
        message: `收集到：${item.effect?.name || item.type}`,
        item: item.getVisualData(),
        inventory: inventoryResult
      };
    }
    
    return inventoryResult;
  }
  
  shouldGenerateItem(gameState) {
    // 基于时间和游戏状态决定是否生成道具
    const currentTime = Date.now() / 1000; // 转换为秒
    
    // 基础生成检查
    if (!this.generator.shouldSpawnItem(currentTime, gameState)) {
      return false;
    }
    
    // 检查场景中道具数量
    const activeItemCount = this.activeItems.size;
    const maxActiveItems = 3 + Math.floor(gameState.difficulty || 1);
    
    if (activeItemCount >= maxActiveItems) {
      return false;
    }
    
    // 根据玩家状态调整
    const player = gameState.player;
    if (player) {
      // 如果玩家刚刚收集过道具，稍微延迟生成
      const timeSinceLastCollection = currentTime - (player.lastCollectionTime || 0);
      if (timeSinceLastCollection < 3) {
        return false;
      }
      
      // 如果玩家生命值很低，提高生成率
      if (player.health < 0.3) {
        return Math.random() < 0.7;
      }
    }
    
    return true;
  }
  
  calculateSpawnPosition(gameState) {
    // 简化版：在玩家附近的安全位置生成
    const player = gameState.player;
    if (!player || !player.position) return null;
    
    // 生成在玩家视线范围内但不容易到达的位置
    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 200;
    
    return {
      x: player.position.x + Math.cos(angle) * distance,
      y: player.position.y + Math.sin(angle) * distance
    };
  }
  
  useItem(itemId, context = {}) {
    return this.inventory.useItem(itemId, context);
  }
  
  combineItems(itemIds) {
    const result = this.inventory.combineItems(itemIds);
    
    if (result.success) {
      this.systemStats.totalCombinations++;
    }
    
    return result;
  }
  
  getItemRecommendations(gameState) {
    const inventoryData = this.inventory.getInventoryData();
    return this.strategy.getItemRecommendations(inventoryData, gameState);
  }
  
  getSystemStatus() {
    const inventoryStats = this.inventory.getStatistics();
    const spawnStats = this.generator.getSpawnStatistics();
    const strategyStats = this.strategy.getStrategyStatistics();
    const combinationStats = this.inventory.combiner.getStatistics();
    
    return {
      system: { ...this.systemStats },
      inventory: inventoryStats,
      generation: spawnStats,
      strategy: strategyStats,
      combination: combinationStats,
      activeItems: this.activeItems.size,
      config: { ...this.config }
    };
  }
  
  getActiveItemsData() {
    const data = [];
    for (const [id, item] of this.activeItems.entries()) {
      data.push({
        id,
        ...item.getVisualData(),
        position: { ...item.position }
      });
    }
    return data;
  }
  
  getInventoryData() {
    return this.inventory.getInventoryData();
  }
  
  getActiveEffects() {
    return this.inventory.getActiveEffects();
  }
  
  getCombinationSuggestions() {
    return this.inventory.getCombinationSuggestions();
  }
  
  setDifficultyFactor(factor) {
    this.config.difficultyFactor = Math.max(0.5, Math.min(factor, 2.0));
    this.generator.setDifficultyFactor(this.config.difficultyFactor);
  }
  
  reset() {
    this.inventory.clear();
    this.activeItems.clear();
    this.generator = new ItemGenerator(this.config.difficultyFactor);
    this.strategy = new ItemStrategySystem();
    this.systemStats = {
      totalItemsCollected: 0,
      totalCombinations: 0,
      totalUses: 0,
      gameplayTime: 0
    };
  }
}

// 导出所有类和常量
export {
  ItemType,
  ItemEffects,
  GameItem,
  ItemCombiner,
  ItemInventory,
  ItemGenerator,
  ItemStrategySystem,
  ItemSystem
};

export default ItemSystem;
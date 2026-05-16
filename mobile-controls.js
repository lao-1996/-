/**
 * 现代化移动端控制优化系统 v2.0
 * 提供流畅的触摸操作反馈和丰富的手势支持
 */

class MobileControls {
  constructor(options = {}) {
    this.options = {
      containerId: 'gameContainer',
      enableSwipe: true,
      enablePinch: false,
      enableShake: false,
      enableGyro: false,
      vibration: true,
      hapticFeedback: true,
      visualFeedback: true,
      deadZone: 15,
      sensitivity: 1.0,
      invertX: false,
      invertY: false,
      showControls: true,
      controlSize: 'medium',
      controlOpacity: 0.8,
      ...options
    };
    
    this.state = {
      isPressed: false,
      isDragging: false,
      isJumping: false,
      isAttacking: false,
      lastTouchX: 0,
      lastTouchY: 0,
      startX: 0,
      startY: 0,
      velocityX: 0,
      velocityY: 0,
      swipeDirection: null,
      swipeDistance: 0,
      pinchDistance: 0,
      pinchScale: 1,
      isVibrating: false,
      gyroEnabled: false,
      shakeThreshold: 1.5,
      lastShakeTime: 0,
      controlsVisible: true
    };
    
    this.elements = {};
    this.touchPoints = new Map();
    this.touchHistory = [];
    this.gestureBuffer = [];
    this.vibrationPatterns = {
      tap: [50],
      longPress: [100, 50, 100],
      swipe: [100],
      jump: [30, 20, 30],
      attack: [50, 25, 50],
      damage: [200, 100, 200],
      death: [500],
      success: [100, 100, 100],
      error: [300]
    };
    
    this.init();
  }
  
  init() {
    this.createControls();
    this.setupEventListeners();
    this.setupHapticFeedback();
    this.setupGestureRecognition();
    
    // 检测设备类型和屏幕尺寸
    this.detectDevice();
  }
  
  createControls() {
    if (!this.options.showControls) return;
    
    const container = document.getElementById(this.options.containerId) || document.body;
    
    // 创建移动控制容器
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'mobile-controls';
    controlsContainer.id = 'mobile-controls-modern';
    
    // 创建方向控制（虚拟摇杆）
    const directionalControl = this.createDirectionalControl();
    controlsContainer.appendChild(directionalControl);
    
    // 创建动作按钮组
    const actionControls = this.createActionControls();
    controlsContainer.appendChild(actionControls);
    
    // 创建手势提示
    const gestureHint = this.createGestureHint();
    controlsContainer.appendChild(gestureHint);
    
    container.appendChild(controlsContainer);
    this.elements.container = controlsContainer;
    
    // 更新控制样式
    this.updateControlsStyle();
  }
  
  createDirectionalControl() {
    const controlGroup = document.createElement('div');
    controlGroup.className = 'control-group';
    
    const directional = document.createElement('div');
    directional.className = 'control-directional glass';
    
    // 方向键布局
    const directions = [
      { key: 'up', icon: '↑', pos: 'center-top' },
      { key: 'left', icon: '←', pos: 'left-center' },
      { key: 'center', icon: '○', pos: 'center-center' },
      { key: 'right', icon: '→', pos: 'right-center' },
      { key: 'down', icon: '↓', pos: 'center-bottom' }
    ];
    
    directions.forEach(dir => {
      const btn = document.createElement('button');
      btn.className = `dir-btn dir-${dir.key}`;
      btn.setAttribute('data-direction', dir.key);
      btn.innerHTML = dir.icon;
      btn.style.gridArea = dir.pos.replace('-', ' ');
      
      // 添加触摸反馈
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handleDirectionTouchStart(dir.key);
        
        // 触觉反馈
        if (this.options.hapticFeedback) {
          this.vibrate('tap');
        }
        
        // 视觉反馈
        if (this.options.visualFeedback) {
          btn.classList.add('active');
          this.showTouchEffect(e);
        }
      });
      
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.handleDirectionTouchEnd(dir.key);
        
        if (this.options.visualFeedback) {
          btn.classList.remove('active');
        }
      });
      
      directional.appendChild(btn);
      this.elements[`dir-${dir.key}`] = btn;
    });
    
    // 创建摇杆区域
    const joystickArea = document.createElement('div');
    joystickArea.className = 'joystick-area';
    joystickArea.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 215, 0, 0.3);
      z-index: -1;
      display: none;
    `;
    directional.appendChild(joystickArea);
    this.elements.joystickArea = joystickArea;
    
    // 创建摇杆指示器
    const joystickIndicator = document.createElement('div');
    joystickIndicator.className = 'joystick-indicator';
    joystickIndicator.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FFD700, #FF8C00);
      border: 2px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
      opacity: 0;
      transition: opacity 0.2s, transform 0.1s;
      z-index: 2;
    `;
    directional.appendChild(joystickIndicator);
    this.elements.joystickIndicator = joystickIndicator;
    
    // 添加摇杆触摸区域
    directional.addEventListener('touchstart', (e) => {
      this.handleJoystickStart(e);
    });
    
    directional.addEventListener('touchmove', (e) => {
      this.handleJoystickMove(e);
    });
    
    directional.addEventListener('touchend', (e) => {
      this.handleJoystickEnd(e);
    });
    
    controlGroup.appendChild(directional);
    return controlGroup;
  }
  
  createActionControls() {
    const controlGroup = document.createElement('div');
    controlGroup.className = 'control-group';
    
    // 动作按钮
    const actions = [
      { id: 'jump', icon: '⬆️', label: '跳跃', color: '#8A2BE2' },
      { id: 'attack', icon: '⚔️', label: '攻击', color: '#FF4444' },
      { id: 'special', icon: '✨', label: '技能', color: '#00BFFF' },
      { id: 'interact', icon: '🔄', label: '交互', color: '#32CD32' }
    ];
    
    // 创建一个按钮网格
    const actionGrid = document.createElement('div');
    actionGrid.className = 'action-grid';
    actionGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 12px;
    `;
    
    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.className = `control-btn action-btn btn-${action.id}`;
      btn.setAttribute('data-action', action.id);
      btn.setAttribute('aria-label', action.label);
      btn.innerHTML = action.icon;
      
      // 自定义样式
      btn.style.cssText = `
        width: 70px;
        height: 70px;
        background: radial-gradient(circle at 35% 35%, ${action.color}40, rgba(10, 5, 40, 0.8));
        border-color: ${action.color}80;
        font-size: 24px;
      `;
      
      // 触摸事件处理
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handleActionTouchStart(action.id, e);
        
        if (this.options.hapticFeedback) {
          this.vibrate(action.id === 'jump' ? 'jump' : 'tap');
        }
        
        if (this.options.visualFeedback) {
          this.animateButtonPress(btn, action.color);
          this.showTouchEffect(e);
        }
      });
      
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.handleActionTouchEnd(action.id, e);
        
        if (this.options.visualFeedback) {
          btn.classList.remove('active');
        }
      });
      
      // 长按检测
      let longPressTimer;
      btn.addEventListener('touchstart', () => {
        longPressTimer = setTimeout(() => {
          this.handleLongPress(action.id);
          if (this.options.hapticFeedback) {
            this.vibrate('longPress');
          }
        }, 500);
      });
      
      btn.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
      });
      
      // 双击检测
      let lastTapTime = 0;
      btn.addEventListener('touchend', () => {
        const currentTime = Date.now();
        if (currentTime - lastTapTime < 300) {
          this.handleDoubleTap(action.id);
          if (this.options.hapticFeedback) {
            this.vibrate('tap');
          }
        }
        lastTapTime = currentTime;
      });
      
      actionGrid.appendChild(btn);
      this.elements[`btn-${action.id}`] = btn;
    });
    
    controlGroup.appendChild(actionGrid);
    return controlGroup;
  }
  
  createGestureHint() {
    const hint = document.createElement('div');
    hint.className = 'gesture-hint';
    hint.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: rgba(255, 255, 255, 0.5);
      font-size: 14px;
      text-align: center;
      pointer-events: none;
      z-index: -1;
      display: none;
    `;
    hint.innerHTML = `
      <div>↕️ 上下滑动：跳跃/下蹲</div>
      <div>↔️ 左右滑动：移动</div>
      <div>⭕️ 双击：特殊动作</div>
      <div>📱 摇动：紧急闪避</div>
    `;
    
    return hint;
  }
  
  setupEventListeners() {
    const container = this.elements.container || document.body;
    
    // 触摸事件
    container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    container.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
    
    // 手势事件
    if (this.options.enableSwipe) {
      container.addEventListener('touchstart', this.setupSwipeDetection.bind(this));
    }
    
    if (this.options.enablePinch) {
      container.addEventListener('touchstart', this.setupPinchDetection.bind(this));
    }
    
    // 设备方向（陀螺仪）
    if (this.options.enableGyro) {
      this.setupGyroscope();
    }
    
    // 设备摇动检测
    if (this.options.enableShake) {
      this.setupShakeDetection();
    }
    
    // 窗口大小变化
    window.addEventListener('resize', this.updateControlsStyle.bind(this));
    
    // 游戏事件监听
    window.addEventListener('game:damage-taken', () => {
      if (this.options.hapticFeedback) {
        this.vibrate('damage');
      }
    });
    
    window.addEventListener('game:jump', () => {
      if (this.options.hapticFeedback) {
        this.vibrate('jump');
      }
    });
    
    window.addEventListener('game:attack', () => {
      if (this.options.hapticFeedback) {
        this.vibrate('attack');
      }
    });
  }
  
  setupHapticFeedback() {
    if ('vibrate' in navigator && this.options.vibration) {
      this.hapticSupported = true;
    } else {
      this.hapticSupported = false;
    }
  }
  
  setupGestureRecognition() {
    // 手势识别器
    this.gestureRecognizer = {
      swipeThreshold: 50,
      swipeTimeout: 300,
      doubleTapThreshold: 300,
      longPressThreshold: 500,
      pinchThreshold: 10
    };
  }
  
  detectDevice() {
    const ua = navigator.userAgent;
    this.device = {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
      isIOS: /iPhone|iPad|iPod/i.test(ua),
      isAndroid: /Android/i.test(ua),
      isTablet: /iPad|Tablet/i.test(ua),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight
    };
    
    // 根据设备调整参数
    if (this.device.isTablet) {
      this.options.controlSize = 'large';
      this.options.sensitivity = 0.8;
    } else if (this.device.isIOS) {
      this.options.sensitivity = 1.2;
    }
  }
  
  updateControlsStyle() {
    if (!this.elements.container) return;
    
    const container = this.elements.container;
    const screenWidth = window.innerWidth;
    
    // 根据屏幕大小调整控制布局
    if (screenWidth < 768) {
      container.style.flexDirection = 'column';
      container.style.alignItems = 'center';
      container.style.gap = '20px';
    } else {
      container.style.flexDirection = 'row';
      container.style.justifyContent = 'space-between';
      container.style.alignItems = 'flex-end';
    }
    
    // 根据控制大小设置样式
    let buttonSize, fontSize;
    switch (this.options.controlSize) {
      case 'small':
        buttonSize = '60px';
        fontSize = '20px';
        break;
      case 'large':
        buttonSize = '80px';
        fontSize = '28px';
        break;
      case 'medium':
      default:
        buttonSize = '70px';
        fontSize = '24px';
    }
    
    // 更新按钮样式
    const actionButtons = container.querySelectorAll('.action-btn');
    actionButtons.forEach(btn => {
      btn.style.width = buttonSize;
      btn.style.height = buttonSize;
      btn.style.fontSize = fontSize;
    });
    
    // 更新方向键样式
    const dirButtons = container.querySelectorAll('.dir-btn');
    dirButtons.forEach(btn => {
      btn.style.width = `calc(${buttonSize} * 0.7)`;
      btn.style.height = `calc(${buttonSize} * 0.7)`;
    });
    
    // 更新透明度
    container.style.opacity = this.options.controlOpacity.toString();
  }
  
  // 事件处理函数
  handleTouchStart(e) {
    e.preventDefault();
    
    const touches = e.touches;
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const identifier = touch.identifier;
      
      this.touchPoints.set(identifier, {
        id: identifier,
        x: touch.clientX,
        y: touch.clientY,
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        isActive: true
      });
      
      // 添加到历史记录
      this.touchHistory.push({
        id: identifier,
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        type: 'start'
      });
    }
    
    this.state.isPressed = true;
    this.dispatchEvent('controlstart', { touches: Array.from(this.touchPoints.values()) });
  }
  
  handleTouchMove(e) {
    e.preventDefault();
    
    const touches = e.touches;
    let anyMovement = false;
    
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const identifier = touch.identifier;
      
      if (this.touchPoints.has(identifier)) {
        const point = this.touchPoints.get(identifier);
        const deltaX = touch.clientX - point.x;
        const deltaY = touch.clientY - point.y;
        
        // 检查是否超过死区
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance > this.options.deadZone) {
          this.state.isDragging = true;
          anyMovement = true;
          
          // 更新速度
          this.state.velocityX = deltaX * this.options.sensitivity * (this.options.invertX ? -1 : 1);
          this.state.velocityY = deltaY * this.options.sensitivity * (this.options.invertY ? -1 : 1);
          
          // 更新位置
          point.x = touch.clientX;
          point.y = touch.clientY;
          
          // 添加到历史记录
          this.touchHistory.push({
            id: identifier,
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
            type: 'move',
            deltaX,
            deltaY,
            velocityX: this.state.velocityX,
            velocityY: this.state.velocityY
          });
        }
      }
    }
    
    if (anyMovement) {
      this.dispatchEvent('controlmove', {
        velocityX: this.state.velocityX,
        velocityY: this.state.velocityY,
        isDragging: this.state.isDragging
      });
    }
  }
  
  handleTouchEnd(e) {
    e.preventDefault();
    
    const changedTouches = e.changedTouches;
    for (let i = 0; i < changedTouches.length; i++) {
      const touch = changedTouches[i];
      const identifier = touch.identifier;
      
      if (this.touchPoints.has(identifier)) {
        const point = this.touchPoints.get(identifier);
        const endTime = Date.now();
        const duration = endTime - point.startTime;
        
        // 添加到历史记录
        this.touchHistory.push({
          id: identifier,
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
          type: 'end',
          duration
        });
        
        // 移除触摸点
        this.touchPoints.delete(identifier);
        
        // 检测手势
        this.detectGesture(point, touch, duration);
      }
    }
    
    // 检查是否还有触摸点
    if (this.touchPoints.size === 0) {
      this.state.isPressed = false;
      this.state.isDragging = false;
      this.state.velocityX = 0;
      this.state.velocityY = 0;
    }
    
    this.dispatchEvent('controlend', { 
      remainingTouches: this.touchPoints.size,
      wasDragging: this.state.isDragging
    });
  }
  
  handleTouchCancel(e) {
    e.preventDefault();
    this.handleTouchEnd(e);
  }
  
  // 方向控制处理
  handleDirectionTouchStart(direction) {
    this.state.isPressed = true;
    
    this.dispatchEvent('directionstart', { direction });
    
    // 根据方向发送游戏事件
    switch (direction) {
      case 'up':
        window.dispatchEvent(new CustomEvent('game:move-up', { detail: { pressed: true } }));
        break;
      case 'down':
        window.dispatchEvent(new CustomEvent('game:move-down', { detail: { pressed: true } }));
        break;
      case 'left':
        window.dispatchEvent(new CustomEvent('game:move-left', { detail: { pressed: true } }));
        break;
      case 'right':
        window.dispatchEvent(new CustomEvent('game:move-right', { detail: { pressed: true } }));
        break;
    }
  }
  
  handleDirectionTouchEnd(direction) {
    this.state.isPressed = false;
    
    this.dispatchEvent('directionend', { direction });
    
    // 根据方向发送游戏事件
    switch (direction) {
      case 'up':
        window.dispatchEvent(new CustomEvent('game:move-up', { detail: { pressed: false } }));
        break;
      case 'down':
        window.dispatchEvent(new CustomEvent('game:move-down', { detail: { pressed: false } }));
        break;
      case 'left':
        window.dispatchEvent(new CustomEvent('game:move-left', { detail: { pressed: false } }));
        break;
      case 'right':
        window.dispatchEvent(new CustomEvent('game:move-right', { detail: { pressed: false } }));
        break;
    }
  }
  
  // 摇杆处理
  handleJoystickStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    
    this.state.startX = touch.clientX;
    this.state.startY = touch.clientY;
    this.state.lastTouchX = touch.clientX;
    this.state.lastTouchY = touch.clientY;
    
    // 显示摇杆区域和指示器
    this.elements.joystickArea.style.display = 'block';
    this.elements.joystickIndicator.style.opacity = '1';
    
    this.dispatchEvent('joystickstart', { 
      x: this.state.startX, 
      y: this.state.startY 
    });
  }
  
  handleJoystickMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    
    const deltaX = touch.clientX - this.state.startX;
    const deltaY = touch.clientY - this.state.startY;
    
    // 限制在摇杆区域内
    const maxRadius = 75; // 摇杆区域半径
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX);
    
    let limitedX = deltaX;
    let limitedY = deltaY;
    
    if (distance > maxRadius) {
      limitedX = Math.cos(angle) * maxRadius;
      limitedY = Math.sin(angle) * maxRadius;
    }
    
    // 更新摇杆指示器位置
    this.elements.joystickIndicator.style.transform = 
      `translate(calc(-50% + ${limitedX}px), calc(-50% + ${limitedY}px))`;
    
    // 计算标准化向量
    const normalizedX = limitedX / maxRadius;
    const normalizedY = limitedY / maxRadius;
    
    // 更新速度
    this.state.velocityX = normalizedX * this.options.sensitivity * (this.options.invertX ? -1 : 1);
    this.state.velocityY = normalizedY * this.options.sensitivity * (this.options.invertY ? -1 : 1);
    
    // 发送游戏事件
    window.dispatchEvent(new CustomEvent('game:joystick-move', {
      detail: {
        x: this.state.velocityX,
        y: this.state.velocityY,
        magnitude: Math.sqrt(this.state.velocityX * this.state.velocityX + this.state.velocityY * this.state.velocityY)
      }
    }));
    
    this.dispatchEvent('joystickmove', {
      x: this.state.velocityX,
      y: this.state.velocityY,
      normalizedX,
      normalizedY
    });
  }
  
  handleJoystickEnd(e) {
    e.preventDefault();
    
    // 隐藏摇杆区域和指示器
    this.elements.joystickArea.style.display = 'none';
    this.elements.joystickIndicator.style.opacity = '0';
    this.elements.joystickIndicator.style.transform = 'translate(-50%, -50%)';
    
    // 重置速度
    this.state.velocityX = 0;
    this.state.velocityY = 0;
    
    // 发送游戏事件
    window.dispatchEvent(new CustomEvent('game:joystick-move', {
      detail: { x: 0, y: 0, magnitude: 0 }
    }));
    
    this.dispatchEvent('joystickend', {});
  }
  
  // 动作按钮处理
  handleActionTouchStart(action, e) {
    this.state.isPressed = true;
    
    switch (action) {
      case 'jump':
        this.state.isJumping = true;
        window.dispatchEvent(new CustomEvent('game:jump', { detail: { pressed: true } }));
        break;
      case 'attack':
        this.state.isAttacking = true;
        window.dispatchEvent(new CustomEvent('game:attack', { detail: { pressed: true } }));
        break;
      case 'special':
        window.dispatchEvent(new CustomEvent('game:special', { detail: { pressed: true } }));
        break;
      case 'interact':
        window.dispatchEvent(new CustomEvent('game:interact', { detail: { pressed: true } }));
        break;
    }
    
    this.dispatchEvent('actionstart', { action });
  }
  
  handleActionTouchEnd(action, e) {
    this.state.isPressed = false;
    
    switch (action) {
      case 'jump':
        this.state.isJumping = false;
        window.dispatchEvent(new CustomEvent('game:jump', { detail: { pressed: false } }));
        break;
      case 'attack':
        this.state.isAttacking = false;
        window.dispatchEvent(new CustomEvent('game:attack', { detail: { pressed: false } }));
        break;
    }
    
    this.dispatchEvent('actionend', { action });
  }
  
  handleLongPress(action) {
    this.dispatchEvent('longpress', { action });
    window.dispatchEvent(new CustomEvent(`game:${action}-long`, { detail: { duration: 500 } }));
  }
  
  handleDoubleTap(action) {
    this.dispatchEvent('doubletap', { action });
    window.dispatchEvent(new CustomEvent(`game:${action}-double`, {}));
  }
  
  // 手势检测
  setupSwipeDetection(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.swipeStart = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    }
  }
  
  setupPinchDetection(e) {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      this.pinchStart = {
        distance: this.getDistance(touch1.clientX, touch1.clientY, touch2.clientX, touch2.clientY),
        time: Date.now()
      };
    }
  }
  
  detectGesture(startPoint, endTouch, duration) {
    const endX = endTouch.clientX;
    const endY = endTouch.clientY;
    const deltaX = endX - startPoint.startX;
    const deltaY = endY - startPoint.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // 检测滑动
    if (distance > this.gestureRecognizer.swipeThreshold && 
        duration < this.gestureRecognizer.swipeTimeout) {
      
      let direction = '';
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }
      
      this.state.swipeDirection = direction;
      this.state.swipeDistance = distance;
      
      this.dispatchEvent('swipe', {
        direction,
        distance,
        duration,
        deltaX,
        deltaY
      });
      
      // 发送游戏事件
      window.dispatchEvent(new CustomEvent(`game:swipe-${direction}`, {
        detail: { distance, duration }
      }));
    }
    
    // 检测轻击
    if (distance < this.options.deadZone && duration < 300) {
      this.dispatchEvent('tap', {
        x: endX,
        y: endY,
        duration
      });
    }
  }
  
  // 陀螺仪支持
  setupGyroscope() {
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS需要权限
      DeviceOrientationEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            this.enableGyroscope();
          }
        })
        .catch(console.error);
    } else {
      this.enableGyroscope();
    }
  }
  
  enableGyroscope() {
    window.addEventListener('deviceorientation', (e) => {
      if (!this.state.gyroEnabled) return;
      
      const gamma = e.gamma; // 左右倾斜 (-90 to 90)
      const beta = e.beta;   // 前后倾斜 (-180 to 180)
      
      // 过滤微小移动
      if (Math.abs(gamma) > 2 || Math.abs(beta) > 2) {
        const normalizedGamma = Math.max(-1, Math.min(1, gamma / 45));
        const normalizedBeta = Math.max(-1, Math.min(1, beta / 45));
        
        this.dispatchEvent('gyroscope', {
          gamma: normalizedGamma,
          beta: normalizedBeta,
          raw: { gamma, beta }
        });
        
        // 发送游戏事件
        window.dispatchEvent(new CustomEvent('game:gyroscope', {
          detail: {
            tiltX: normalizedGamma,
            tiltY: normalizedBeta
          }
        }));
      }
    });
    
    this.state.gyroEnabled = true;
  }
  
  // 摇动检测
  setupShakeDetection() {
    let lastAcceleration = { x: 0, y: 0, z: 0 };
    
    window.addEventListener('devicemotion', (e) => {
      if (!this.options.enableShake) return;
      
      const acceleration = e.accelerationIncludingGravity;
      if (!acceleration) return;
      
      const deltaX = Math.abs(acceleration.x - lastAcceleration.x);
      const deltaY = Math.abs(acceleration.y - lastAcceleration.y);
      const deltaZ = Math.abs(acceleration.z - lastAcceleration.z);
      
      const shake = deltaX + deltaY + deltaZ;
      
      if (shake > this.state.shakeThreshold) {
        const now = Date.now();
        if (now - this.state.lastShakeTime > 1000) { // 防抖
          this.state.lastShakeTime = now;
          
          this.dispatchEvent('shake', { intensity: shake });
          
          // 发送游戏事件
          window.dispatchEvent(new CustomEvent('game:shake', {
            detail: { intensity: shake }
          }));
          
          // 触觉反馈
          if (this.options.hapticFeedback) {
            this.vibrate('damage');
          }
        }
      }
      
      lastAcceleration = {
        x: acceleration.x,
        y: acceleration.y,
        z: acceleration.z
      };
    });
  }
  
  // 触觉反馈
  vibrate(patternName) {
    if (!this.hapticSupported || this.state.isVibrating || !this.options.vibration) {
      return;
    }
    
    const pattern = this.vibrationPatterns[patternName] || [100];
    
    try {
      this.state.isVibrating = true;
      navigator.vibrate(pattern);
      
      // 重置振动状态
      setTimeout(() => {
        this.state.isVibrating = false;
      }, pattern.reduce((a, b) => a + b, 0));
    } catch (e) {
      console.warn('Vibration not supported:', e);
    }
  }
  
  // 视觉反馈
  animateButtonPress(button, color) {
    button.classList.add('active');
    
    // 创建波纹效果
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: ${color}40;
      animation: ripple 0.6s ease-out;
    `;
    
    button.appendChild(ripple);
    
    // 移除波纹效果
    setTimeout(() => {
      ripple.remove();
      button.classList.remove('active');
    }, 600);
  }
  
  showTouchEffect(e) {
    const touch = e.touches[0];
    
    // 创建触摸点效果
    const touchPoint = document.createElement('div');
    touchPoint.className = 'touch-point';
    touchPoint.style.cssText = `
      position: fixed;
      left: ${touch.clientX - 25}px;
      top: ${touch.clientY - 25}px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%);
      pointer-events: none;
      z-index: 1000;
      animation: touchPulse 0.5s ease-out forwards;
    `;
    
    document.body.appendChild(touchPoint);
    
    // 移除触摸点效果
    setTimeout(() => {
      touchPoint.remove();
    }, 500);
  }
  
  // 工具方法
  getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
  
  dispatchEvent(name, detail) {
    const event = new CustomEvent(`control:${name}`, { detail });
    document.dispatchEvent(event);
  }
  
  // 公开API
  showControls() {
    if (this.elements.container) {
      this.elements.container.style.display = 'flex';
      this.state.controlsVisible = true;
    }
  }
  
  hideControls() {
    if (this.elements.container) {
      this.elements.container.style.display = 'none';
      this.state.controlsVisible = false;
    }
  }
  
  toggleControls() {
    if (this.state.controlsVisible) {
      this.hideControls();
    } else {
      this.showControls();
    }
  }
  
  setSensitivity(value) {
    this.options.sensitivity = Math.max(0.1, Math.min(3.0, value));
  }
  
  setOpacity(opacity) {
    this.options.controlOpacity = Math.max(0.1, Math.min(1.0, opacity));
    if (this.elements.container) {
      this.elements.container.style.opacity = opacity.toString();
    }
  }
  
  enableVibration(enabled) {
    this.options.vibration = enabled;
  }
  
  enableHapticFeedback(enabled) {
    this.options.hapticFeedback = enabled;
  }
  
  enableVisualFeedback(enabled) {
    this.options.visualFeedback = enabled;
  }
  
  getState() {
    return { ...this.state, device: this.device };
  }
  
  getOptions() {
    return { ...this.options };
  }
  
  destroy() {
    // 移除所有事件监听器
    const container = this.elements.container || document.body;
    
    container.removeEventListener('touchstart', this.handleTouchStart);
    container.removeEventListener('touchmove', this.handleTouchMove);
    container.removeEventListener('touchend', this.handleTouchEnd);
    container.removeEventListener('touchcancel', this.handleTouchCancel);
    
    window.removeEventListener('resize', this.updateControlsStyle);
    window.removeEventListener('deviceorientation', this.enableGyroscope);
    window.removeEventListener('devicemotion', this.setupShakeDetection);
    
    // 移除DOM元素
    if (this.elements.container) {
      this.elements.container.remove();
    }
    
    // 清理触摸点
    this.touchPoints.clear();
    this.touchHistory = [];
    this.gestureBuffer = [];
  }
}

// 添加CSS动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
  }
  
  @keyframes touchPulse {
    0% { transform: scale(0.5); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
  }
  
  .action-btn.active {
    transform: scale(0.9);
    box-shadow: 0 0 30px currentColor !important;
  }
  
  .dir-btn.active {
    background: rgba(255, 215, 0, 0.3) !important;
    border-color: #FFD700 !important;
  }
`;

document.head.appendChild(style);

// 导出控制系统
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileControls;
} else {
  window.MobileControls = MobileControls;
}

// 自动初始化（可选）
document.addEventListener('DOMContentLoaded', () => {
  if (window.autoInitMobileControls !== false) {
    window.gameControls = new MobileControls();
  }
});
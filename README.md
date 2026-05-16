# 奔赴心意的冒险 - 网页版

恋爱告白主题的平台跳跃游戏。

## 游戏特色

- 平台跳跃玩法
- 恋爱告白主题剧情
- 响应式设计，支持移动端

## 如何游玩

直接用浏览器打开 `index.html` 即可开始游戏。

或使用本地服务器：

```bash
# Python
python -m http.server 8000

# Node.js
node tools/server.js
```

然后访问 http://localhost:8000

## 项目结构

```
├── index.html              # 游戏入口
├── game.js                 # 游戏核心逻辑
├── game.html               # 桌面版游戏页面
├── game_mobile.html        # 移动端游戏页面
├── mobile-controls.js      # 移动端控制器
├── confession-system.js    # 告白系统
├── enhanced-visual.js      # 视觉增强
├── enhanced-audio.js       # 音频增强
├── tools/                  # 开发工具
└── docs/                   # 设计文档
```

## 技术栈

- HTML5 Canvas
- 原生 JavaScript
- 响应式 CSS

## 许可证

MIT License
import sys
sys.stdout.reconfigure(encoding='utf-8')
with open(r'C:\Users\劳润杰\WorkBuddy\20260314143049\game_mobile_standalone.html', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

# 检查修复是否到位
checks = [
    ('webkitRequestFullscreen', 'webkit全屏兼容'),
    ('webkitExitFullscreen', 'webkit退出全屏兼容'),
    ('webkitfullscreenchange', 'webkit全屏事件监听'),
    ('pointer-events:auto', '按钮pointer-events修复'),
    ('touch-action:manipulation', '移动端触摸修复'),
    ('tryFS', '旧的自动触摸全屏（应该不存在）'),
]
print('=== 全屏修复验证 ===')
for keyword, desc in checks:
    found = keyword in content
    status = 'FOUND' if found else 'NOT FOUND'
    if keyword == 'tryFS':
        status = 'REMOVED (OK)' if not found else 'STILL EXISTS (BUG!)'
    print(f'  {desc}: {status}')
print(f'\n总行数: {len(lines)}')
print('验证完成!')

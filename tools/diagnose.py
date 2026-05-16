import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\劳润杰\WorkBuddy\20260314143049\game_mobile_standalone.html', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

print('=== 全屏按钮修复验证 ===')
# 检查按钮是否在gameContainer直属位置
idx = content.find('<div id="gameContainer">')
btn_idx = content.find('id="fullscreenBtn"')
ui_idx  = content.find('id="ui"')
print(f'  #gameContainer 位置: char {idx}')
print(f'  fullscreenBtn  位置: char {btn_idx}')
print(f'  #ui            位置: char {ui_idx}')
if btn_idx < ui_idx:
    print('  [OK] 全屏按钮在#ui之前（不受pointer-events:none影响）')
else:
    print('  [WARN] 全屏按钮在#ui内部，可能仍受pointer-events影响')

print('\n=== BGM动感化验证 ===')
checks = [
    ('BGM_BPM  = 145', 'BPM=145动感节奏'),
    ('bgmKick', '踢鼓(kick)函数'),
    ('bgmSnare', '军鼓(snare)函数'),
    ('bgmHihat', '踩镲(hihat)函数'),
    ('BGM_BPM  = 88', '旧BPM=88（应已移除）'),
]
for kw, desc in checks:
    found = kw in content
    if kw == 'BGM_BPM  = 88':
        print(f'  {desc}: {"REMOVED (OK)" if not found else "STILL EXISTS (BUG!)"}')
    else:
        print(f'  {desc}: {"FOUND OK" if found else "MISSING!"}')

print(f'\n总行数: {len(lines)}')

import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\劳润杰\WorkBuddy\20260314143049\game_mobile_standalone.html', encoding='utf-8') as f:
    lines = f.readlines()

# 找playBGM函数
print('=== playBGM / stopBGM ===')
for i, line in enumerate(lines):
    l = line.lower()
    if any(k in l for k in ['playbgm', 'stopbgm', 'startbgm', 'playmusic', 'stopmusic', 'bgminterval', 'bgm_']):
        print(f'{i+1}: {line.rstrip()}')

print('\n=== 全屏函数完整代码 5415-5450 ===')
for i in range(5414, 5450):
    print(f'{i+1}: {lines[i].rstrip()}')

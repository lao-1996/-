import sys
sys.stdout.reconfigure(encoding='utf-8')
keywords = ['fullscreen', 'full-screen', 'full_screen', 'webkitfullscreen', 'mozfullscreen', 'exitfullscreen', 'requestfullscreen']
with open(r'C:\Users\劳润杰\WorkBuddy\20260314143049\game_mobile_standalone.html', encoding='utf-8') as f:
    lines = f.readlines()
print(f'Total lines: {len(lines)}')
for i, line in enumerate(lines):
    l = line.lower()
    if any(k in l for k in keywords):
        print(f'{i+1}: {line.rstrip()}')
print('Search done.')

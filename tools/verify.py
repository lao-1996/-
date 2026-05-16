f = open(r'C:\Users\劳润杰\WorkBuddy\20260314143049\game_mobile_standalone.html', encoding='utf-8').read()
checks = ['GameProgressSystem','DynamicDifficultySystem','MobileControls','ItemType','achievementPop','initModules','game-progress.js']
for k in checks:
    print(k, '->', 'FOUND' if k in f else 'MISSING')
print('Total lines:', f.count('\n'))
print('File size KB:', len(f)//1024)

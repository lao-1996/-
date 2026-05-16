/**
 * 增强音频系统 - 提升游戏沉浸感和情感表达
 */

class EnhancedAudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.bgmGain = null;
        this.sfxGain = null;
        this.voiceGain = null;
        this.isInitialized = false;
        this.currentBGM = null;
        this.bgmSources = [];
        
        // 音频库
        this.sfxLibrary = {
            jump: { type: 'sfx', params: { frequency: 400, duration: 0.1, type: 'sine' } },
            land: { type: 'sfx', params: { frequency: 200, duration: 0.15, type: 'sine' } },
            collect: { type: 'sfx', params: { frequency: 800, duration: 0.2, type: 'square' } },
            damage: { type: 'sfx', params: { frequency: 150, duration: 0.3, type: 'sawtooth' } },
            powerup: { type: 'sfx', params: { frequency: 600, duration: 0.5, type: 'triangle', slide: 800 } },
            shield: { type: 'sfx', params: { frequency: 500, duration: 0.4, type: 'sine', vibrato: 20 } },
            levelUp: { type: 'sfx', params: { frequency: 523.25, duration: 0.3, type: 'square' } },
            victory: { type: 'sfx', params: { frequency: 1046.5, duration: 1.0, type: 'sine', slide: -200 } },
            gameOver: { type: 'sfx', params: { frequency: 220, duration: 0.8, type: 'sawtooth' } },
            click: { type: 'sfx', params: { frequency: 1000, duration: 0.05, type: 'sine' } }
        };
        
        // BGM音轨
        this.bgmTracks = {
            menu: {
                frequencies: [262, 294, 330, 349, 392, 440, 494, 523],
                tempo: 120,
                pattern: [0, 2, 4, 5, 4, 2, 0, 7, 5, 4, 2, 3, 2, 0],
                harmony: [0, 4, 7]
            },
            level1: {
                frequencies: [330, 392, 440, 523, 587, 659, 698, 784],
                tempo: 140,
                pattern: [0, 3, 5, 7, 5, 3, 0, 6, 5, 3, 2, 3, 2, 0],
                harmony: [2, 5, 9]
            },
            level2: {
                frequencies: [349, 440, 523, 587, 698, 784, 880, 1047],
                tempo: 160,
                pattern: [0, 2, 4, 6, 7, 6, 4, 2, 0, 7, 5, 3, 1, 0],
                harmony: [1, 4, 8]
            },
            level3: {
                frequencies: [392, 494, 587, 659, 784, 988, 1175, 1319],
                tempo: 180,
                pattern: [0, 3, 6, 7, 6, 3, 0, 7, 5, 3, 1, 2, 1, 0],
                harmony: [0, 3, 7, 10]
            },
            victory: {
                frequencies: [523, 659, 784, 880, 1047, 1175, 1319, 1568],
                tempo: 200,
                pattern: [0, 2, 4, 6, 7, 6, 4, 2, 0, 1, 2, 3, 4, 5, 6, 7],
                harmony: [0, 4, 7, 11]
            }
        };
        
        // 音频参数
        this.params = {
            masterVolume: 0.7,
            bgmVolume: 0.5,
            sfxVolume: 0.8,
            voiceVolume: 1.0,
            lowpassFrequency: 800,
            reverbMix: 0.3,
            delayTime: 0.2,
            delayFeedback: 0.5
        };
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建主增益节点
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.params.masterVolume;
            
            // 创建效果器链
            this.createEffectsChain();
            
            // 创建BGM和SFX增益节点
            this.bgmGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            this.voiceGain = this.audioContext.createGain();
            
            this.bgmGain.connect(this.lowpass);
            this.sfxGain.connect(this.lowpass);
            this.voiceGain.connect(this.lowpass);
            
            this.bgmGain.gain.value = this.params.bgmVolume;
            this.sfxGain.gain.value = this.params.sfxVolume;
            this.voiceGain.gain.value = this.params.voiceVolume;
            
            this.isInitialized = true;
            console.log('增强音频系统初始化成功');
            
            // 预加载音频
            await this.preloadSounds();
            
        } catch (error) {
            console.error('音频系统初始化失败:', error);
            this.isInitialized = false;
        }
    }
    
    createEffectsChain() {
        // 低通滤波器（温暖感）
        this.lowpass = this.audioContext.createBiquadFilter();
        this.lowpass.type = 'lowpass';
        this.lowpass.frequency.value = this.params.lowpassFrequency;
        this.lowpass.connect(this.masterGain);
        
        // 混响效果
        this.reverb = this.audioContext.createConvolver();
        this.createReverbBuffer();
        
        // 混响混合增益
        this.reverbDryGain = this.audioContext.createGain();
        this.reverbWetGain = this.audioContext.createGain();
        this.reverbDryGain.gain.value = 1 - this.params.reverbMix;
        this.reverbWetGain.gain.value = this.params.reverbMix;
        
        this.reverbDryGain.connect(this.lowpass);
        this.reverbWetGain.connect(this.reverb);
        this.reverb.connect(this.lowpass);
        
        // 延迟效果
        this.delay = this.audioContext.createDelay();
        this.delay.delayTime.value = this.params.delayTime;
        
        this.delayGain = this.audioContext.createGain();
        this.delayGain.gain.value = this.params.delayFeedback;
        
        this.delay.connect(this.delayGain);
        this.delayGain.connect(this.delay);
        this.delay.connect(this.lowpass);
    }
    
    createReverbBuffer() {
        // 创建自定义混响脉冲响应
        const length = this.audioContext.sampleRate * 2; // 2秒
        const buffer = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        const leftChannel = buffer.getChannelData(0);
        const rightChannel = buffer.getChannelData(1);
        
        for (let i = 0; i < length; i++) {
            const decay = Math.exp(-i / (this.audioContext.sampleRate * 1.5)); // 1.5秒衰减
            leftChannel[i] = (Math.random() * 2 - 1) * decay;
            rightChannel[i] = (Math.random() * 2 - 1) * decay * 0.8; // 右声道稍弱，增加立体感
        }
        
        this.reverb.buffer = buffer;
    }
    
    async preloadSounds() {
        // 这里可以添加音频文件的预加载
        console.log('音频预加载完成');
    }
    
    // 生成音效
    playSFX(name, options = {}) {
        if (!this.isInitialized) return;
        
        const sound = this.sfxLibrary[name];
        if (!sound) {
            console.warn(`音效"${name}"不存在`);
            return;
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // 连接到SFX增益节点
        gainNode.connect(this.sfxGain);
        
        // 设置振荡器类型
        oscillator.type = sound.params.type;
        
        // 设置频率
        let frequency = sound.params.frequency;
        if (options.pitchVariation) {
            frequency *= 0.9 + Math.random() * 0.2;
        }
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        // 滑音效果
        if (sound.params.slide) {
            oscillator.frequency.exponentialRampToValueAtTime(
                frequency + sound.params.slide,
                this.audioContext.currentTime + sound.params.duration
            );
        }
        
        // 颤音效果
        if (sound.params.vibrato) {
            const vibratoDepth = sound.params.vibrato;
            const vibratoRate = 5; // 5Hz
            oscillator.frequency.setValueAtTime(
                frequency,
                this.audioContext.currentTime
            );
            oscillator.frequency.setValueAtTime(
                frequency + vibratoDepth * Math.sin(2 * Math.PI * vibratoRate * this.audioContext.currentTime),
                this.audioContext.currentTime + sound.params.duration
            );
        }
        
        // 包络控制
        const now = this.audioContext.currentTime;
        const attackTime = sound.params.duration * 0.1;
        const releaseTime = sound.params.duration * 0.2;
        
        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.exponentialRampToValueAtTime(1, now + attackTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + sound.params.duration - releaseTime);
        
        // 播放
        oscillator.connect(gainNode);
        oscillator.start(now);
        oscillator.stop(now + sound.params.duration);
        
        // 清理
        oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
        };
    }
    
    // 播放BGM
    playBGM(trackName) {
        if (!this.isInitialized || this.currentBGM === trackName) return;
        
        this.stopBGM();
        this.currentBGM = trackName;
        
        const track = this.bgmTracks[trackName];
        if (!track) return;
        
        const playNote = (noteIndex, harmonyIndices = []) => {
            const now = this.audioContext.currentTime;
            
            // 主音
            const mainFreq = track.frequencies[noteIndex % track.frequencies.length];
            this.playBGMNote(mainFreq, 0.3, now);
            
            // 和声
            harmonyIndices.forEach(harmonyIndex => {
                const harmonyFreq = track.frequencies[(noteIndex + harmonyIndex) % track.frequencies.length];
                this.playBGMNote(harmonyFreq * 0.5, 0.15, now);
            });
            
            // 贝斯音
            const bassFreq = track.frequencies[noteIndex % track.frequencies.length] * 0.25;
            this.playBGMNote(bassFreq, 0.2, now);
        };
        
        // 播放音轨
        let noteIndex = 0;
        this.bgmInterval = setInterval(() => {
            const patternIndex = noteIndex % track.pattern.length;
            const harmonyIndices = track.harmony;
            
            playNote(track.pattern[patternIndex], harmonyIndices);
            
            noteIndex++;
        }, 60000 / track.tempo);
    }
    
    playBGMNote(frequency, duration, startTime) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        gainNode.connect(this.bgmGain);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, startTime);
        
        // 温和的包络
        const now = startTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        oscillator.connect(gainNode);
        oscillator.start(now);
        oscillator.stop(now + duration);
        
        // 存储引用以便清理
        this.bgmSources.push({ oscillator, gainNode });
        
        oscillator.onended = () => {
            const index = this.bgmSources.findIndex(source => source.oscillator === oscillator);
            if (index > -1) {
                this.bgmSources.splice(index, 1);
            }
            oscillator.disconnect();
            gainNode.disconnect();
        };
    }
    
    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
        
        this.currentBGM = null;
        
        // 停止所有BGM源
        this.bgmSources.forEach(source => {
            try {
                source.oscillator.stop();
                source.oscillator.disconnect();
                source.gainNode.disconnect();
            } catch (e) {
                // 忽略已停止的源
            }
        });
        
        this.bgmSources = [];
    }
    
    // 设置音量
    setMasterVolume(volume) {
        this.params.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.params.masterVolume, this.audioContext.currentTime);
        }
    }
    
    setBGMVolume(volume) {
        this.params.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.bgmGain) {
            this.bgmGain.gain.setValueAtTime(this.params.bgmVolume, this.audioContext.currentTime);
        }
    }
    
    setSFXVolume(volume) {
        this.params.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.setValueAtTime(this.params.sfxVolume, this.audioContext.currentTime);
        }
    }
    
    // 音频效果
    applyLowpass(frequency) {
        if (this.lowpass) {
            this.params.lowpassFrequency = Math.max(100, Math.min(20000, frequency));
            this.lowpass.frequency.setValueAtTime(this.params.lowpassFrequency, this.audioContext.currentTime);
        }
    }
    
    applyReverb(mix) {
        if (this.reverbDryGain && this.reverbWetGain) {
            this.params.reverbMix = Math.max(0, Math.min(1, mix));
            this.reverbDryGain.gain.setValueAtTime(1 - this.params.reverbMix, this.audioContext.currentTime);
            this.reverbWetGain.gain.setValueAtTime(this.params.reverbMix, this.audioContext.currentTime);
        }
    }
    
    // 环境音效
    playAmbient() {
        if (!this.isInitialized) return;
        
        // 播放鸟鸣、风声等环境音
        this.ambientInterval = setInterval(() => {
            const now = this.audioContext.currentTime;
            const frequency = 800 + Math.random() * 400;
            const duration = 0.1 + Math.random() * 0.2;
            
            this.playBGMNote(frequency, duration, now);
        }, 3000 + Math.random() * 2000);
    }
    
    stopAmbient() {
        if (this.ambientInterval) {
            clearInterval(this.ambientInterval);
            this.ambientInterval = null;
        }
    }
    
    // 动态音频效果（如受伤时降低音质）
    applyDynamicEffect(effectType, intensity = 1.0) {
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        
        switch (effectType) {
            case 'damage':
                // 受伤时：低频增强，高频减弱
                this.lowpass.frequency.setValueAtTime(400 * intensity, now);
                this.lowpass.frequency.exponentialRampToValueAtTime(
                    this.params.lowpassFrequency,
                    now + 1.0
                );
                break;
                
            case 'powerup':
                // 获得道具时：明亮音色
                this.lowpass.frequency.setValueAtTime(2000, now);
                this.lowpass.frequency.exponentialRampToValueAtTime(
                    this.params.lowpassFrequency,
                    now + 2.0
                );
                break;
                
            case 'slowdown':
                // 减速效果：降低节奏
                if (this.bgmGain) {
                    this.bgmGain.gain.setValueAtTime(0.3, now);
                    this.bgmGain.gain.exponentialRampToValueAtTime(
                        this.params.bgmVolume,
                        now + 2.0
                    );
                }
                break;
        }
    }
}

// 导出音频系统实例
const audioSystem = new EnhancedAudioSystem();

// 游戏事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 初始化音频系统
    audioSystem.initialize().then(() => {
        console.log('音频系统就绪');
    });
    
    // 用户交互时恢复音频上下文（部分浏览器需要）
    document.addEventListener('click', () => {
        if (audioSystem.audioContext && audioSystem.audioContext.state === 'suspended') {
            audioSystem.audioContext.resume();
        }
    }, { once: true });
});

// 导出公共接口
window.AudioSystem = {
    playSFX: (name, options) => audioSystem.playSFX(name, options),
    playBGM: (trackName) => audioSystem.playBGM(trackName),
    stopBGM: () => audioSystem.stopBGM(),
    setMasterVolume: (volume) => audioSystem.setMasterVolume(volume),
    setBGMVolume: (volume) => audioSystem.setBGMVolume(volume),
    setSFXVolume: (volume) => audioSystem.setSFXVolume(volume),
    applyDynamicEffect: (effectType, intensity) => audioSystem.applyDynamicEffect(effectType, intensity),
    playAmbient: () => audioSystem.playAmbient(),
    stopAmbient: () => audioSystem.stopAmbient()
};
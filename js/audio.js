/**
 * Classroom Wheel of Names - Audio Engine
 * Uses Web Audio API for zero-latency, offline-capable synthesized sounds
 * Uses Web Speech API for Thai/English text-to-speech winner announcements
 */

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.voiceEnabled = true;
        this.volume = 0.8;
        this.lastTickTime = 0;
        this.synth = window.speechSynthesis;
    }

    initContext() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Realistic mechanical ticker click sound
     * @param {number} speedFactor - 0 to 1, pitch and filter adjust with speed
     */
    playTick(speedFactor = 1) {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // Limit tick frequency to avoid audio clipping
        if (now - this.lastTickTime < 0.035) return;
        this.lastTickTime = now;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // Dynamic pitch based on spin speed
        const baseFreq = 500 + Math.min(speedFactor, 1) * 300;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

        // Filter for crisp click
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.Q.setValueAtTime(3, now);

        const currentVol = this.volume * 0.45;
        gain.gain.setValueAtTime(currentVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.045);
    }

    /**
     * Uplifting celebratory fanfare chime (C major / G major arpeggio)
     */
    playFanfare() {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // Notes: C5, E5, G5, C6 (Pastel joyful fanfare chords)
        const notes = [
            { freq: 523.25, time: 0.00, dur: 0.25 }, // C5
            { freq: 659.25, time: 0.12, dur: 0.25 }, // E5
            { freq: 783.99, time: 0.24, dur: 0.30 }, // G5
            { freq: 1046.50, time: 0.38, dur: 0.70 }, // C6 (High hold)
            { freq: 1318.51, time: 0.44, dur: 0.65 }  // E6 (Harmonic sparkle)
        ];

        notes.forEach(({ freq, time, dur }) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + time);

            const vol = this.volume * 0.35;
            gain.gain.setValueAtTime(0.001, now + time);
            gain.gain.linearRampToValueAtTime(vol, now + time + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + time);
            osc.stop(now + time + dur + 0.05);
        });
    }

    /**
     * Gentle chime when a name is removed or action occurs
     */
    playPop() {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

        gain.gain.setValueAtTime(this.volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.13);
    }

    /**
     * Speaks the winner's name in Thai or English using Web Speech API
     * @param {string} text - The winner's name
     */
    speakWinner(text) {
        if (!this.voiceEnabled || !this.synth) return;
        try {
            this.synth.cancel(); // Stop any pending speech

            const cleanText = text.trim();
            if (!cleanText) return;

            // Formulate a natural Thai announcement: "ผู้โชคดีคือ ... [ชื่อ]" หรืออ่านชื่อ
            const utterance = new SpeechSynthesisUtterance(`ผู้โชคดีคือ ${cleanText}`);
            utterance.rate = 0.95;
            utterance.pitch = 1.1;
            utterance.volume = this.volume;

            // Find Thai voice if available
            const voices = this.synth.getVoices();
            const thaiVoice = voices.find(v => v.lang.includes('th') || v.lang.includes('TH'));
            if (thaiVoice) {
                utterance.voice = thaiVoice;
                utterance.lang = 'th-TH';
            } else {
                utterance.lang = 'th-TH';
            }

            this.synth.speak(utterance);
        } catch (e) {
            console.warn('Speech synthesis error:', e);
        }
    }
}

window.audioEngine = new AudioEngine();

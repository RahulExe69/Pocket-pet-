// Web Audio API synthesized sound effects - instant, offline, zero-latency!

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playPop() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playCoin() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [987.77, 1318.51].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.22);
      });
    } catch {
      // ignore
    }
  }

  playEat() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // 3 quick munching sounds
      [0, 0.09, 0.18].forEach((offset) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + offset;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.06);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.07);
      });
    } catch {
      // ignore
    }
  }

  playSqueak() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // ignore
    }
  }

  playPurr() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, now);
      osc.frequency.linearRampToValueAtTime(75, now + 0.2);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // ignore
    }
  }

  playDrink() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Gentle bubbling water slurps
      [0, 0.12, 0.24].forEach((offset, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + offset;

        osc.type = 'sine';
        const startFreq = 420 + idx * 80;
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 1.6, t + 0.08);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.1);
      });
    } catch {
      // ignore
    }
  }

  playClean() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.1);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // ignore
    }
  }

  playLevelUp() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.38);
      });
    } catch {
      // ignore
    }
  }

  playCelebration() {
    this.playLevelUp();
  }

  playFanfare() {
    this.playLevelUp();
  }

  playJump() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.14);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // ignore
    }
  }

  playClick() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore
    }
  }

  private activeDanceNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private activeSingNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

  stopDanceMusic() {
    try {
      this.activeDanceNodes.forEach(({ osc, gain }) => {
        try {
          gain.gain.cancelScheduledValues(0);
          gain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      });
      this.activeDanceNodes = [];
    } catch {
      // ignore
    }
  }

  stopSingSong() {
    try {
      this.activeSingNodes.forEach(({ osc, gain }) => {
        try {
          gain.gain.cancelScheduledValues(0);
          gain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      });
      this.activeSingNodes = [];
    } catch {
      // ignore
    }
  }

  stopAllMusic() {
    this.stopDanceMusic();
    this.stopSingSong();
  }

  playDanceMusic() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      this.stopDanceMusic();
      const now = this.ctx.currentTime;

      // 4-second upbeat bouncy disco beat (132 BPM, 1 beat = 0.45s)
      const beatDur = 0.45;
      const totalBeats = 9;

      // 1. Synth Bassline (bouncy square/triangle groove)
      const bassNotes = [130.81, 164.81, 196.00, 220.00, 174.61, 196.00, 130.81, 196.00, 261.63]; // C3, E3, G3, A3, F3, G3, C3, G3, C4
      bassNotes.forEach((freq, idx) => {
        if (!this.ctx || idx >= totalBeats) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * beatDur;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + beatDur * 0.85);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + beatDur * 0.9);
        this.activeDanceNodes.push({ osc, gain });
      });

      // 2. Chime Lead Arpeggios (bright, bubbly melody)
      const leadNotes = [
        { note: 523.25, time: 0 },
        { note: 659.25, time: 0.22 },
        { note: 783.99, time: 0.45 },
        { note: 880.0, time: 0.67 },
        { note: 1046.5, time: 0.9 },
        { note: 880.0, time: 1.12 },
        { note: 783.99, time: 1.35 },
        { note: 659.25, time: 1.57 },
        { note: 587.33, time: 1.8 },
        { note: 659.25, time: 2.02 },
        { note: 783.99, time: 2.25 },
        { note: 1046.5, time: 2.47 },
        { note: 1174.66, time: 2.7 },
        { note: 1046.5, time: 2.92 },
        { note: 880.0, time: 3.15 },
        { note: 1046.5, time: 3.37 },
        { note: 1318.51, time: 3.6 },
      ];

      leadNotes.forEach(({ note, time }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + time;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, t);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.26);
        this.activeDanceNodes.push({ osc, gain });
      });

      // 3. Cute Claps / Snares on off-beats
      for (let i = 0; i < 8; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + (i * beatDur + beatDur * 0.5);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.09);
        this.activeDanceNodes.push({ osc, gain });
      }
    } catch {
      // ignore
    }
  }

  playSingSong() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      this.stopSingSong();
      const now = this.ctx.currentTime;

      // Cute singing song melody with soft vibrato (sine/warm flute tone)
      const vocalMelody = [
        { freq: 523.25, dur: 0.38, delay: 0.0 },   // C5 "La"
        { freq: 587.33, dur: 0.35, delay: 0.42 },  // D5 "La"
        { freq: 659.25, dur: 0.45, delay: 0.82 },  // E5 "La~"
        { freq: 783.99, dur: 0.55, delay: 1.35 },  // G5 "Laa~"
        { freq: 880.00, dur: 0.38, delay: 1.95 },  // A5 "♪"
        { freq: 783.99, dur: 0.35, delay: 2.38 },  // G5 "♪"
        { freq: 659.25, dur: 0.42, delay: 2.78 },  // E5 "Loo~"
        { freq: 783.99, dur: 0.45, delay: 3.25 },  // G5 "La~"
        { freq: 1046.50, dur: 0.75, delay: 3.75 }, // C6 "YAY! ♪"
      ];

      vocalMelody.forEach(({ freq, dur, delay }) => {
        if (!this.ctx) return;
        const t = now + delay;

        // Main vocal oscillator
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        // Cute pitch glide into the note (slight portamento)
        osc.frequency.setValueAtTime(freq * 0.96, t);
        osc.frequency.exponentialRampToValueAtTime(freq, t + 0.06);

        // Vocal swell envelope
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.06);
        gain.gain.setValueAtTime(0.25, t + dur - 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        // Gentle vibrato LFO
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(5.5, t); // 5.5 Hz vibrato
        lfoGain.gain.setValueAtTime(freq * 0.025, t); // Subtle ±2.5% depth
        lfo.connect(osc.frequency);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        lfo.start(t + 0.08);
        lfo.stop(t + dur);
        osc.start(t);
        osc.stop(t + dur);

        this.activeSingNodes.push({ osc, gain });
      });
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundEngine();

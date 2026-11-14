type Tone = {
  stop: () => void;
};

export class GameAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  musicBus: GainNode | null = null;
  sfxBus: GainNode | null = null;
  muted = false;
  masterGain = 0.85;
  private ambientFanGain: GainNode | null = null;
  private ambientDroneGain: GainNode | null = null;
  private fan: Tone | null = null;
  private drone: Tone | null = null;
  private box: { timer: number; tempo: number; step: number; playing: boolean } | null =
    null;
  private staticNode: Tone | null = null;
  private screamNode: Tone | null = null;
  private screamGain: GainNode | null = null;
  private phoneUtter: SpeechSynthesisUtterance | null = null;
  private voicesReady = false;
  private ambientTimer: number | null = null;
  private powerOutHum: Tone | null = null;
  private powerOutTick: number | null = null;
  private threatLevel = 0;
  private lastAmbientEvent = 0;

  unlock() {
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.55;
      this.sfxBus.gain.value = 0.9;
      this.master.gain.value = this.muted ? 0 : this.masterGain;
      this.musicBus.connect(this.master);
      this.sfxBus.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();

    if (typeof window !== "undefined" && window.speechSynthesis && !this.voicesReady) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        this.voicesReady = true;
      } else {
        window.speechSynthesis.addEventListener(
          "voiceschanged",
          () => {
            this.voicesReady = true;
          },
          { once: true },
        );
        window.speechSynthesis.getVoices();
      }
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : this.masterGain, this.ctx.currentTime, 0.03);
    }
    if (m) this.stopPhone();
  }

  setMasterVolume(value: number) {
    this.masterGain = Math.min(1, Math.max(0, value));
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : this.masterGain, this.ctx.currentTime, 0.03);
    }
  }

  startAmbient() {
    this.unlock();
    const ctx = this.ctx;
    const sfx = this.sfxBus;
    if (!ctx || !sfx) return;
    this.stopAmbient();

    const noise = noiseSource(ctx, 2);
    const fanFilter = ctx.createBiquadFilter();
    fanFilter.type = "lowpass";
    fanFilter.frequency.value = 280;
    const fanGain = ctx.createGain();
    fanGain.gain.value = 0.07;
    this.ambientFanGain = fanGain;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.35;
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain);
    lfoGain.connect(fanGain.gain);
    noise.connect(fanFilter);
    fanFilter.connect(fanGain);
    fanGain.connect(sfx);
    noise.start();
    lfo.start();
    this.fan = {
      stop: () => {
        try {
          noise.stop();
          lfo.stop();
        } catch {
          /* already stopped */
        }
        noise.disconnect();
        lfo.disconnect();
        fanGain.disconnect();
      },
    };

    const droneOsc = ctx.createOscillator();
    droneOsc.type = "sine";
    droneOsc.frequency.value = 46;
    const d2 = ctx.createOscillator();
    d2.type = "triangle";
    d2.frequency.value = 69.5;
    const dg = ctx.createGain();
    dg.gain.value = 0.035;
    this.ambientDroneGain = dg;
    droneOsc.connect(dg);
    d2.connect(dg);
    dg.connect(sfx);
    droneOsc.start();
    d2.start();
    this.drone = {
      stop: () => {
        try {
          droneOsc.stop();
          d2.stop();
        } catch {
          /* */
        }
        droneOsc.disconnect();
        d2.disconnect();
        dg.disconnect();
      },
    };

    this.scheduleAmbientEvent();
  }

  stopAmbient() {
    if (this.ambientTimer != null) {
      window.clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
    this.fan?.stop();
    this.drone?.stop();
    this.fan = null;
    this.drone = null;
    this.ambientFanGain = null;
    this.ambientDroneGain = null;
  }

  setThreatLevel(level: number) {
    if (!this.ctx) return;
    const threat = Math.min(1, Math.max(0, level));
    const wasCritical = this.threatLevel >= 0.85;
    this.threatLevel = threat;
    this.ambientFanGain?.gain.setTargetAtTime(0.07 + threat * 0.14, this.ctx.currentTime, 0.5);
    this.ambientDroneGain?.gain.setTargetAtTime(0.035 + threat * 0.1, this.ctx.currentTime, 0.7);
    if (threat >= 0.85 && !wasCritical && this.sfxBus && !this.muted) {
      this.playHeartbeat();
    }
  }

  private playHeartbeat() {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    for (const [delay, freq, vol] of [
      [0, 42, 0.055],
      [0.22, 38, 0.04],
    ] as const) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      const t = now + delay;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.035);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
      o.connect(g);
      g.connect(this.sfxBus);
      o.start(t);
      o.stop(t + 0.28);
    }
  }

  private scheduleAmbientEvent() {
    if (this.ambientTimer != null) {
      window.clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
    const base = this.threatLevel >= 0.7 ? 4.5 : this.threatLevel >= 0.4 ? 7 : 11;
    const wait = (base + Math.random() * base * 0.9) * 1000;
    this.ambientTimer = window.setTimeout(() => {
      this.ambientTimer = null;
      if (!this.ctx || this.muted || !this.fan) return;
      this.playRandomAmbientCue();
      this.scheduleAmbientEvent();
    }, wait);
  }

  private playRandomAmbientCue() {
    if (!this.ctx || !this.sfxBus) return;
    const roll = Math.random();
    if (this.threatLevel >= 0.6) {
      if (roll < 0.28) this.distantFootsteps();
      else if (roll < 0.48) this.metalScrape();
      else if (roll < 0.68) this.lowCreak();
      else if (roll < 0.85) this.pipeKnock();
      else this.whisperHiss();
    } else {
      if (roll < 0.3) this.lowCreak();
      else if (roll < 0.5) this.distantFootsteps();
      else if (roll < 0.7) this.metalScrape();
      else if (roll < 0.85) this.pipeKnock();
      else this.whisperHiss();
    }
  }

  private distantFootsteps() {
    if (!this.ctx || !this.sfxBus) return;
    const steps = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < steps; i++) {
      const t = this.ctx.currentTime + i * (0.32 + Math.random() * 0.12);
      const src = noiseSource(this.ctx, 0.1);
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 90 + Math.random() * 50;
      const g = this.ctx.createGain();
      const vol = 0.035 + Math.random() * 0.025;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      src.connect(f);
      f.connect(g);
      g.connect(this.sfxBus);
      src.start(t);
      src.stop(t + 0.16);
    }
  }

  private metalScrape() {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    const src = noiseSource(this.ctx, 0.7);
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(600, now);
    bp.frequency.exponentialRampToValueAtTime(180, now + 0.55);
    bp.Q.value = 2.2;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.06, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.sfxBus);
    src.start(now);
    src.stop(now + 0.7);
  }

  private lowCreak() {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(55 + Math.random() * 25, now);
    o.frequency.exponentialRampToValueAtTime(40, now + 0.9);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.045, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start(now);
    o.stop(now + 1.05);
  }

  private pipeKnock() {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    const knocks = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < knocks; i++) {
      const t = now + i * 0.18;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "triangle";
      o.frequency.value = 120 + Math.random() * 40;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(g);
      g.connect(this.sfxBus);
      o.start(t);
      o.stop(t + 0.22);
    }
  }

  private whisperHiss() {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    const src = noiseSource(this.ctx, 1.2);
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1400 + Math.random() * 600;
    bp.Q.value = 0.9;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.028, now + 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.sfxBus);
    src.start(now);
    src.stop(now + 1.15);
  }

  lureKitchen() {
    this.playMetalHit(520);
  }

  lureStorage() {
    this.playMetalHit(280);
  }

  generatorRestart() {
    this.unlock();
    this.stopPowerOutAmbient();
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    const sfx = this.sfxBus;

    [90, 135, 190, 260].forEach((frequency, i) => {
      const oscillator = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const start = now + i * 0.14;
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.85, start + 0.2);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.1, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.36);
      oscillator.connect(gain);
      gain.connect(sfx);
      oscillator.start(start);
      oscillator.stop(start + 0.38);
    });

    const hum = this.ctx.createOscillator();
    const hg = this.ctx.createGain();
    hum.type = "sine";
    hum.frequency.setValueAtTime(55, now + 0.5);
    hum.frequency.exponentialRampToValueAtTime(120, now + 1.1);
    hg.gain.setValueAtTime(0.0001, now + 0.5);
    hg.gain.exponentialRampToValueAtTime(0.07, now + 0.65);
    hg.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    hum.connect(hg);
    hg.connect(sfx);
    hum.start(now + 0.5);
    hum.stop(now + 1.45);
  }

  private playMetalHit(frequency: number) {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    [1, 1.48, 2.1].forEach((ratio, i) => {
      const oscillator = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const start = now + i * 0.11;
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency * ratio, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.16 / (i + 1), start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.38);
      oscillator.connect(gain);
      gain.connect(this.sfxBus!);
      oscillator.start(start);
      oscillator.stop(start + 0.4);
    });
  }

  setMusicBox(active: boolean, level: number, onPrizeCam: boolean) {
    this.unlock();
    if (!active || level <= 0.02) {
      this.stopMusicBox();
      return;
    }
    if (!this.box) {
      this.box = { timer: 0, tempo: 0.28, step: 0, playing: true };
      this.tickBox();
    }
    this.box.tempo = 0.18 + 0.22 * Math.max(0.15, level);
    const vol = (onPrizeCam ? 0.28 : 0.09) * Math.min(1, level * 1.4);
    if (this.musicBus && this.ctx) {
      this.musicBus.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    }
  }

  private tickBox = () => {
    if (!this.box || !this.ctx || !this.musicBus) return;
    const melody = [784, 659, 784, 880, 784, 659, 587, 523, 587, 659, 523, 494];
    const f = melody[this.box.step % melody.length] ?? 523;
    pluck(this.ctx, this.musicBus, f, 0.18, 0.12);
    this.box.step += 1;
    const delay = this.box.tempo * 1000;
    this.box.timer = window.setTimeout(this.tickBox, delay);
  };

  stopMusicBox() {
    if (this.box?.timer) window.clearTimeout(this.box.timer);
    this.box = null;
  }

  camStatic(on: boolean) {
    this.unlock();
    const ctx = this.ctx;
    const sfx = this.sfxBus;
    if (!ctx || !sfx) return;
    this.staticNode?.stop();
    this.staticNode = null;
    if (!on) return;
    const src = noiseSource(ctx, 1);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800;
    bp.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.value = 0.045;
    src.connect(bp);
    bp.connect(g);
    g.connect(sfx);
    src.start();
    this.staticNode = {
      stop: () => {
        try {
          src.stop();
        } catch {
          /* */
        }
        src.disconnect();
        g.disconnect();
      },
    };
  }

  burstStatic() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const src = noiseSource(this.ctx, 0.35);
    const g = this.ctx.createGain();
    g.gain.value = 0.16;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
    src.connect(g);
    g.connect(this.sfxBus);
    src.start();
    src.stop(this.ctx.currentTime + 0.3);
  }

  click() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "square";
    o.frequency.value = 1400;
    g.gain.value = 0.07;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start();
    o.stop(this.ctx.currentTime + 0.06);
  }

  maskOn() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const src = noiseSource(this.ctx, 0.25);
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 900;
    const g = this.ctx.createGain();
    g.gain.value = 0.14;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start();
    src.stop(this.ctx.currentTime + 0.24);
  }

  tablet() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(220, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.18);
    g.gain.value = 0.08;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start();
    o.stop(this.ctx.currentTime + 0.22);
  }

  footsteps() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    for (let i = 0; i < 3; i++) {
      const t = this.ctx.currentTime + i * 0.22;
      const src = noiseSource(this.ctx, 0.08);
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 180 + Math.random() * 80;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      src.connect(f);
      f.connect(g);
      g.connect(this.sfxBus);
      src.start(t);
      src.stop(t + 0.12);
    }
  }

  vent() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const src = noiseSource(this.ctx, 0.5);
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 700;
    const g = this.ctx.createGain();
    g.gain.value = 0.09;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start();
    src.stop(this.ctx.currentTime + 0.52);
  }

  giggle() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    [420, 520, 390, 560].forEach((freq, i) => {
      const o = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      o.type = "triangle";
      o.frequency.value = freq;
      const t = now + i * 0.09;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.1, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.connect(g);
      g.connect(this.sfxBus!);
      o.start(t);
      o.stop(t + 0.14);
    });
  }

  puppetWarn() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 1.6);
    g.gain.value = 0.16;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.7);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start();
    o.stop(this.ctx.currentTime + 1.72);
  }

  scream() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    const noise = noiseSource(this.ctx, 1.4);
    const nf = this.ctx.createBiquadFilter();
    nf.type = "bandpass";
    nf.frequency.setValueAtTime(1200, now);
    nf.frequency.exponentialRampToValueAtTime(400, now + 1.1);
    const ng = this.ctx.createGain();
    ng.gain.value = 0.35;
    ng.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(this.sfxBus);
    noise.start(now);
    noise.stop(now + 1.35);

    const saw = this.ctx.createOscillator();
    saw.type = "sawtooth";
    saw.frequency.setValueAtTime(720, now);
    saw.frequency.exponentialRampToValueAtTime(90, now + 0.9);
    const sg = this.ctx.createGain();
    sg.gain.value = 0.18;
    sg.gain.exponentialRampToValueAtTime(0.001, now + 1);
    saw.connect(sg);
    sg.connect(this.sfxBus);
    saw.start(now);
    saw.stop(now + 1.05);
  }

  sixAm() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => {
      const t = this.ctx!.currentTime + i * 0.22;
      const o = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      o.connect(g);
      g.connect(this.sfxBus!);
      o.start(t);
      o.stop(t + 0.52);
    });
  }

  door() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const src = noiseSource(this.ctx, 0.2);
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 400;
    const g = this.ctx.createGain();
    g.gain.value = 0.14;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start();
    src.stop(this.ctx.currentTime + 0.2);
  }

  grate() {
    this.door();
  }

  strobe() {
    this.burstStatic();
  }

  phone() {
    this.unlock();
  }

  stopPhone() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.phoneUtter = null;
  }

  speak(_lines: string[]) {
    /* phone lines handled by engine if needed */
  }

  powerDown() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    const sfx = this.sfxBus;

    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(220, now);
    o.frequency.exponentialRampToValueAtTime(28, now + 1.55);
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.7);
    o.connect(g);
    g.connect(sfx);
    o.start(now);
    o.stop(now + 1.72);

    const noise = noiseSource(this.ctx, 0.55);
    const nf = this.ctx.createBiquadFilter();
    nf.type = "lowpass";
    nf.frequency.setValueAtTime(2400, now);
    nf.frequency.exponentialRampToValueAtTime(180, now + 0.45);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.22, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(sfx);
    noise.start(now);
    noise.stop(now + 0.58);

    [0.08, 0.22, 0.38].forEach((t, i) => {
      const click = this.ctx!.createOscillator();
      const cg = this.ctx!.createGain();
      click.type = "square";
      click.frequency.value = 80 + i * 40;
      const start = now + t;
      cg.gain.setValueAtTime(0.0001, start);
      cg.gain.exponentialRampToValueAtTime(0.12, start + 0.004);
      cg.gain.exponentialRampToValueAtTime(0.001, start + 0.05);
      click.connect(cg);
      cg.connect(sfx);
      click.start(start);
      click.stop(start + 0.06);
    });

    this.startPowerOutAmbient();
  }

  startPowerOutAmbient() {
    this.unlock();
    this.stopPowerOutAmbient();
    if (!this.ctx || !this.sfxBus) return;
    const ctx = this.ctx;
    const sfx = this.sfxBus;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 42;
    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.value = 63;
    const g = ctx.createGain();
    g.gain.value = 0.045;
    osc.connect(g);
    osc2.connect(g);
    g.connect(sfx);
    osc.start();
    osc2.start();
    this.powerOutHum = {
      stop: () => {
        try {
          osc.stop();
          osc2.stop();
        } catch {
          /* */
        }
        osc.disconnect();
        osc2.disconnect();
        g.disconnect();
      },
    };

    const scheduleCreep = () => {
      if (!this.powerOutHum || !this.ctx || !this.sfxBus) return;
      const t = this.ctx.currentTime;
      const noise = noiseSource(this.ctx, 0.25);
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 350 + Math.random() * 900;
      f.Q.value = 4;
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(0.06 + Math.random() * 0.05, t + 0.02);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      noise.connect(f);
      f.connect(ng);
      ng.connect(this.sfxBus);
      noise.start(t);
      noise.stop(t + 0.3);
      this.powerOutTick = window.setTimeout(scheduleCreep, 1800 + Math.random() * 3200);
    };
    this.powerOutTick = window.setTimeout(scheduleCreep, 900);
  }

  stopPowerOutAmbient() {
    if (this.powerOutTick != null) {
      window.clearTimeout(this.powerOutTick);
      this.powerOutTick = null;
    }
    this.powerOutHum?.stop();
    this.powerOutHum = null;
  }

  generatorCrank(progress01: number) {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    const p = Math.min(1, Math.max(0, progress01));
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(55 + p * 40, now);
    o.frequency.linearRampToValueAtTime(70 + p * 55, now + 0.12);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.04 + p * 0.05, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start(now);
    o.stop(now + 0.15);

    if (p > 0.55) {
      const n = noiseSource(this.ctx, 0.12);
      const ng = this.ctx.createGain();
      ng.gain.value = 0.03 * p;
      n.connect(ng);
      ng.connect(this.sfxBus);
      n.start(now);
      n.stop(now + 0.12);
    }
  }

  setScreamLoop(level: number) {
    this.unlock();
    const ctx = this.ctx;
    const sfx = this.sfxBus;
    if (!ctx || !sfx) return;
    if (level <= 0.02) {
      this.screamNode?.stop();
      this.screamNode = null;
      this.screamGain = null;
      return;
    }
    if (!this.screamNode) {
      const src = noiseSource(ctx, 2);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 900;
      bp.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.value = 0.001;
      src.connect(bp);
      bp.connect(g);
      g.connect(sfx);
      src.start();
      this.screamGain = g;
      this.screamNode = {
        stop: () => {
          try {
            src.stop();
          } catch {
            /* */
          }
          src.disconnect();
          g.disconnect();
        },
      };
    }
    const vol = 0.02 + level * 0.16;
    this.screamGain?.gain.setTargetAtTime(vol, ctx.currentTime, 0.08);
  }

  dispose() {
    this.stopPhone();
    this.stopAmbient();
    this.stopPowerOutAmbient();
    this.stopMusicBox();
    this.staticNode?.stop();
    this.screamNode?.stop();
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
  }
}

function noiseSource(ctx: AudioContext, seconds: number) {
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * seconds)), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  return src;
}

function pluck(ctx: AudioContext, dest: AudioNode, freq: number, dur: number, vol: number) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "triangle";
  o.frequency.value = freq;
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(dest);
  o.start(t);
  o.stop(t + dur + 0.02);
}

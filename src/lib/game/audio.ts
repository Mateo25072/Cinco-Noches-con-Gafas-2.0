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
  }

  stopAmbient() {
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
    this.ambientFanGain?.gain.setTargetAtTime(0.07 + threat * 0.08, this.ctx.currentTime, 0.6);
    this.ambientDroneGain?.gain.setTargetAtTime(0.035 + threat * 0.055, this.ctx.currentTime, 0.8);
  }

  lureKitchen() {
    this.playMetalHit(520);
  }

  lureStorage() {
    this.playMetalHit(280);
  }

  generatorRestart() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    [90, 135, 190].forEach((frequency, i) => {
      const oscillator = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const start = now + i * 0.16;
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.8, start + 0.18);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.09, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
      oscillator.connect(gain);
      gain.connect(this.sfxBus!);
      oscillator.start(start);
      oscillator.stop(start + 0.34);
    });
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

  speak(lines: string[], onLine: (i: number) => void, onEnd: () => void) {
    this.stopPhone();
    if (typeof window === "undefined" || !window.speechSynthesis) {
      onEnd();
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    const es =
      voices.find((v) => v.lang.toLowerCase().startsWith("es")) ??
      voices.find((v) => v.lang.toLowerCase().startsWith("en")) ??
      null;
    let i = 0;
    const next = () => {
      if (i >= lines.length) {
        this.phoneUtter = null;
        onEnd();
        return;
      }
      onLine(i);
      const u = new SpeechSynthesisUtterance(lines[i]);
      u.rate = 0.88;
      u.pitch = 0.72;
      u.volume = this.muted ? 0 : 0.95;
      if (es) u.voice = es;
      u.lang = es?.lang ?? "es-ES";
      u.onend = () => {
        i += 1;
        window.setTimeout(next, 280);
      };
      u.onerror = () => {
        i += 1;
        next();
      };
      this.phoneUtter = u;
      window.speechSynthesis.speak(u);
    };
    next();
  }

  stopPhone() {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* */
    }
    this.phoneUtter = null;
  }

  door() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const src = noiseSource(this.ctx, 0.18);
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 220;
    const g = this.ctx.createGain();
    g.gain.value = 0.28;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start();
    src.stop(this.ctx.currentTime + 0.2);
  }

  grate() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(180, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.16);
    g.gain.value = 0.09;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start();
    o.stop(this.ctx.currentTime + 0.2);
  }

  smoke() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const src = noiseSource(this.ctx, 0.8);
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 400;
    const g = this.ctx.createGain();
    g.gain.value = 0.16;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start();
    src.stop(this.ctx.currentTime + 0.82);
  }

  blind() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(1400, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.4);
    g.gain.value = 0.14;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start();
    o.stop(this.ctx.currentTime + 0.46);
  }

  powerDown() {
    this.unlock();
    if (!this.ctx || !this.sfxBus) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(180, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 1.4);
    g.gain.value = 0.18;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start();
    o.stop(this.ctx.currentTime + 1.52);
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
    this.stopMusicBox();
    this.setScreamLoop(0);
    this.staticNode?.stop();
    void this.ctx?.close();
    this.ctx = null;
  }
}

function noiseSource(ctx: AudioContext, seconds: number): AudioBufferSourceNode {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = seconds > 0.8;
  src.playbackRate.value = 0.95 + Math.random() * 0.1;
  return src;
}

function pluck(ctx: AudioContext, dest: AudioNode, freq: number, dur: number, vol: number) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  const now = ctx.currentTime;
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  o.connect(g);
  g.connect(dest);
  o.start(now);
  o.stop(now + dur + 0.02);
}

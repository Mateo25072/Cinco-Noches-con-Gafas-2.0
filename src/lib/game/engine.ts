import { aiForNight, PHONE } from "./config.ts";
import { loadSave, writeSave } from "./save.ts";
import type {
  AiLevels,
  CamId,
  ChaparroLoc,
  EngineSnap,
  FacheroLoc,
  GafasLoc,
  MuecasLoc,
  Phase,
  ThreatId,
  TortoloLoc,
} from "./types.ts";
import type { GameAudio } from "./audio.ts";

const GAFAS_PATH: GafasLoc[] = ["stage", "party", "kitchen", "ventL", "mouth"];
const MUECAS_PATH: MuecasLoc[] = ["games", "storage", "cove", "ventR", "mouth"];
const FACHERO_PATH: FacheroLoc[] = ["parts", "games", "hall", "office"];
const TORTOLO_ROOMS: TortoloLoc[] = [
  "parts",
  "prize",
  "party",
  "cove",
  "games",
  "hall",
  "kitchen",
  "storage",
];

function pickTortolo(except?: TortoloLoc): TortoloLoc {
  const pool = TORTOLO_ROOMS.filter((r) => r !== except);
  return pool[Math.floor(Math.random() * pool.length)] ?? "prize";
}

export class FnafEngine {
  phase: Phase = "menu";
  night = 1;
  hour = 0;
  hourAcc = 0;
  hourLen = 50;
  look = 0;
  flashlight = false;
  cameras = false;
  camId: CamId = "stage";
  doorL = false;
  doorR = false;
  grate = false;
  battery = 1;
  drain = 0;
  flicker = 0;
  panic = 0;
  powerOut = false;
  gafas: GafasLoc = "stage";
  muecas: MuecasLoc = "games";
  chaparro: ChaparroLoc = "away";
  fachero: FacheroLoc = "parts";
  chapFlashes = 0;
  tortolo: TortoloLoc = "prize";
  tortoloFlashes = 0;
  fachLook = 0;
  tortoloRage = 0;
  tortoloCalm = 0;
  ventTimer = 0;
  muecasTimer = 0;
  fachWatch = 0;
  blinded = 0;
  jumpscare: ThreatId | null = null;
  phoneOn = false;
  phoneLine = 0;
  staticAmt = 0;
  trauma = 0;
  ai: AiLevels = aiForNight(1);
  beaten = 0;
  night6 = false;
  custom20 = false;
  flashOnGafas = 0;
  hallTimer = 0;
  leftTimer = 0;
  rightTimer = 0;
  moveAcc = 0;
  chapMoveAcc = 0;
  jumpscareAcc = 0;
  sixAcc = 0;
  introAcc = 0;
  gafasBlindLock = false;
  powerOutAcc = 0;
  flashHeld = false;
  flashDelay = 0;
  flickerIn = 6;
  interfIn = 2;
  gafasIn = 4;
  muecasIn = 6;
  chapIn = 7;
  fachIn = 5;
  tortoloIn = 8;
  muecasPace = 1;
  generatorResetProgress = 0;
  generatorResetUsed = false;
  lureCooldown = 0;
  private generatorResetHeld = false;
  private lastAmbientThreat = -1;

  private listeners = new Set<() => void>();
  private audio: GameAudio;
  private cached: EngineSnap;

  constructor(audio: GameAudio) {
    this.audio = audio;
    const s = loadSave();
    this.beaten = s.beaten;
    this.night6 = s.night6;
    this.custom20 = s.custom20;
    this.cached = this.snap();
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getSnapshot = (): EngineSnap => this.cached;

  emit() {
    this.cached = this.snap();
    this.listeners.forEach((l) => l());
  }

  snap(): EngineSnap {
    const persisted = loadSave();
    return {
      phase: this.phase,
      night: this.night,
      hour: this.hour,
      hourAcc: this.hourAcc,
      hourLen: this.hourLen,
      look: this.look,
      flashlight: this.flashlight,
      cameras: this.cameras,
      camId: this.camId,
      doorL: this.doorL,
      doorR: this.doorR,
      grate: this.grate,
      battery: this.battery,
      drain: this.drain,
      flicker: this.flicker,
      panic: this.panic,
      powerOut: this.powerOut,
      gafas: this.gafas,
      muecas: this.muecas,
      chaparro: this.chaparro,
      fachero: this.fachero,
      chapFlashes: this.chapFlashes,
      tortolo: this.tortolo,
      tortoloFlashes: this.tortoloFlashes,
      fachLook: this.fachLook,
      blinded: this.blinded,
      jumpscare: this.jumpscare,
      phoneOn: this.phoneOn,
      phoneLine: this.phoneLine,
      staticAmt: this.staticAmt,
      trauma: this.trauma,
      ai: { ...this.ai },
      canContinue: persisted.night > 1 || this.beaten > 0,
      beaten: this.beaten,
      night6Unlocked: this.night6 || this.beaten >= 5,
      customUnlocked: this.beaten >= 5,
      custom20: this.custom20,
      generatorResetProgress: this.generatorResetProgress,
      generatorResetUsed: this.generatorResetUsed,
      lureCooldown: this.lureCooldown,
    };
  }

  startNight(night: number, custom?: AiLevels) {
    if (night >= 1) writeSave({ night: Math.min(6, night) });
    this.audio.unlock();
    this.night = night;
    this.ai = custom ?? aiForNight(night);
    this.hour = 0;
    this.hourAcc = 0;
    this.look = 0;
    this.flashlight = false;
    this.cameras = false;
    this.camId = "stage";
    this.doorL = false;
    this.doorR = false;
    this.grate = false;
    this.battery = 1;
    this.drain = 0;
    this.flicker = 0;
    this.panic = 0;
    this.powerOut = false;
    this.hourLen = 50;
    this.gafas = "stage";
    this.muecas = "games";
    this.chaparro = "away";
    this.fachero = "parts";
    this.chapFlashes = 0;
    this.tortolo = this.ai.tortolo > 0 ? pickTortolo() : "calm";
    this.tortoloFlashes = 0;
    this.fachLook = 0;
    this.tortoloRage = 0;
    this.tortoloCalm = 0;
    this.ventTimer = 0;
    this.muecasTimer = 0;
    this.fachWatch = 0;
    this.blinded = 0;
    this.jumpscare = null;
    this.flashOnGafas = 0;
    this.hallTimer = 0;
    this.leftTimer = 0;
    this.rightTimer = 0;
    this.moveAcc = 0;
    this.chapMoveAcc = 0;
    this.jumpscareAcc = 0;
    this.sixAcc = 0;
    this.introAcc = 0;
    this.gafasBlindLock = false;
    this.powerOutAcc = 0;
    this.generatorResetProgress = 0;
    this.generatorResetUsed = false;
    this.generatorResetHeld = false;
    this.lureCooldown = 0;
    this.lastAmbientThreat = -1;
    this.flashHeld = false;
    this.flashDelay = 0;
    this.flickerIn = 4 + Math.random() * 5;
    this.interfIn = 1.2 + Math.random() * 1.6;
    this.muecasPace = 0.7 + Math.random() * 0.6;
    this.armMove("gafas");
    this.armMove("muecas");
    this.armMove("chap");
    this.armMove("fach");
    this.armMove("tortolo");
    this.staticAmt = 0.4;
    this.trauma = 0;
    this.phoneOn = false;
    this.phoneLine = 0;
    this.audio.startAmbient();
    this.audio.camStatic(false);
    this.audio.setScreamLoop(0);
    this.phase = "intro";
    this.emit();
  }

  beginPlay() {
    this.phase = "playing";
    const lines = PHONE[this.night] ?? PHONE[1];
    this.phoneOn = true;
    this.phoneLine = 0;
    this.audio.speak(
      lines,
      (i) => {
        this.phoneLine = i;
        this.emit();
      },
      () => {
        this.phoneOn = false;
        this.emit();
      },
    );
    this.emit();
  }

  skipPhone() {
    this.audio.stopPhone();
    this.phoneOn = false;
    this.emit();
  }

  goMenu() {
    this.audio.stopPhone();
    this.audio.camStatic(false);
    this.audio.stopMusicBox();
    this.audio.setScreamLoop(0);
    this.phase = "menu";
    this.jumpscare = null;
    this.cameras = false;
    this.emit();
  }

  openCustom() {
    this.phase = "custom";
    this.ai = { gafas: 5, muecas: 5, chaparro: 5, fachero: 5, tortolo: 5 };
    this.emit();
  }

  setCustomAi(id: keyof AiLevels, v: number) {
    this.ai = { ...this.ai, [id]: Math.min(20, Math.max(0, Math.round(v))) };
    this.emit();
  }

  setLook(x: number) {
    this.look = Math.min(1, Math.max(-1, x));
  }

  setFlashlight(on: boolean) {
    if (this.phase !== "playing" || this.powerOut) return;
    if (on && (this.cameras || this.battery <= 0)) return;
    if (on === this.flashHeld) return;
    this.flashHeld = on;
    this.flashDelay = on ? 0.09 + Math.random() * 0.06 : 0.05;
    if (on) this.audio.click();
    this.emit();
  }

  toggleDoor(side: "L" | "R") {
    if (this.phase !== "playing" || this.powerOut || this.cameras) return;
    if (this.battery <= 0) return;
    if (side === "L") {
      this.doorL = !this.doorL;
      if (this.doorL) this.audio.door();
    } else {
      this.doorR = !this.doorR;
      if (this.doorR) this.audio.door();
    }
    this.emit();
  }

  toggleGrate() {
    if (this.phase !== "playing" || this.powerOut || this.cameras) return;
    if (this.battery <= 0) return;
    this.grate = !this.grate;
    this.audio.grate();
    this.emit();
  }

  setCameras(on: boolean) {
    if (this.phase !== "playing" || this.powerOut) return;
    if (on && this.battery <= 0) return;
    if (on === this.cameras) return;
    this.cameras = on;
    this.flashlight = false;
    this.flashHeld = false;
    this.flashDelay = 0;
    this.audio.tablet();
    this.audio.camStatic(on);
    this.staticAmt = on ? 0.55 : 0.15;
    this.emit();
  }

  setGeneratorReset(held: boolean) {
    if (!this.powerOut || this.generatorResetUsed) return;
    this.generatorResetHeld = held;
    if (!held) this.generatorResetProgress = 0;
    this.emit();
  }

  soundLure() {
    if (
      this.phase !== "playing" ||
      !this.cameras ||
      this.powerOut ||
      this.lureCooldown > 0 ||
      this.battery <= 0.08
    ) {
      return;
    }
    if (this.camId === "kitchen") {
      this.audio.lureKitchen();
      const index = GAFAS_PATH.indexOf(this.gafas);
      if (index > 0 && index < GAFAS_PATH.length - 1) {
        this.gafas = GAFAS_PATH[index - 1] ?? this.gafas;
      }
    } else if (this.camId === "storage") {
      this.audio.lureStorage();
      const index = MUECAS_PATH.indexOf(this.muecas);
      if (index > 0 && index < MUECAS_PATH.length - 1) {
        this.muecas = MUECAS_PATH[index - 1] ?? this.muecas;
      }
    } else {
      return;
    }
    this.battery = Math.max(0, this.battery - 0.08);
    this.lureCooldown = 18;
    this.emit();
  }

  setCam(id: CamId) {
    if (!this.cameras) return;
    if (id !== this.camId) {
      this.audio.burstStatic();
      this.staticAmt = 0.85;
    }
    this.camId = id;
    this.emit();
  }

  /** Light burst on the open camera. Three hits on Tórtolo calm him. */
  strobeCam() {
    if (this.phase !== "playing" || !this.cameras || this.powerOut || this.battery <= 0) return;
    this.battery = Math.max(0, this.battery - 0.008);
    this.staticAmt = 0.9;
    this.audio.burstStatic();
    this.audio.click();
    if (this.tortolo !== "calm" && this.camId === this.tortolo) {
      this.tortoloFlashes += 1;
      if (this.tortoloFlashes >= 3) {
        this.tortolo = "calm";
        this.tortoloFlashes = 0;
        this.tortoloRage = 0;
        this.tortoloCalm = 26;
        this.audio.footsteps();
      }
    }
    this.emit();
  }

  update(dt: number) {
    const cap = Math.min(dt, 0.1);
    this.staticAmt = Math.max(0, this.staticAmt - cap * 1.8);
    this.trauma = Math.max(0, this.trauma - cap * 1.4);
    this.blinded = Math.max(0, this.blinded - cap);
    this.lureCooldown = Math.max(0, this.lureCooldown - cap);

    if (this.phase === "intro") {
      this.introAcc += cap;
      if (this.introAcc > 2.4) this.beginPlay();
      return;
    }

    if (this.phase === "jumpscare") {
      this.jumpscareAcc += cap;
      this.trauma = 1;
      if (this.jumpscareAcc > 8) this.finishJumpscare();
      return;
    }

    if (this.phase === "sixam") {
      this.sixAcc += cap;
      return;
    }

    if (this.phase !== "playing") return;

    this.hourAcc += cap;
    if (this.hourAcc >= this.hourLen) {
      this.hourAcc = 0;
      this.hour += 1;
      if (this.hour >= 6) {
        this.win();
        return;
      }
      this.emit();
    }

    this.drainPower(cap);
    this.tickAtmosphere(cap);
    this.tickFlashDelay(cap);
    this.tickAmbientThreat();
    if (this.powerOut) {
      if (this.generatorResetHeld && !this.generatorResetUsed) {
        this.generatorResetProgress = Math.min(3, this.generatorResetProgress + cap);
        if (this.generatorResetProgress >= 3) {
          this.battery = 0.28;
          this.powerOut = false;
          this.powerOutAcc = 0;
          this.generatorResetUsed = true;
          this.generatorResetHeld = false;
          this.generatorResetProgress = 0;
          this.audio.generatorRestart();
          this.emit();
        }
      }
      if (!this.powerOut) return;
      this.powerOutAcc += cap;
      if (this.powerOutAcc > 7.5) this.kill("gafas");
      return;
    }

    this.panic = Math.max(0, this.panic - cap * 0.035);
    if (this.panic >= 1) {
      this.kill("panic");
      return;
    }

    this.tickChaparro(cap);
    this.gafasIn -= cap;
    this.muecasIn -= cap;
    this.chapIn -= cap;
    this.fachIn -= cap;
    this.tortoloIn -= cap;
    if (this.gafasIn <= 0) {
      this.tryMoveGafas();
      this.armMove("gafas");
    }
    if (this.muecasIn <= 0) {
      this.tryMoveMuecas();
      this.armMove("muecas");
    }
    if (this.chapIn <= 0) {
      this.tryMoveChaparro();
      this.armMove("chap");
    }
    if (this.fachIn <= 0) {
      this.tryMoveFachero();
      this.armMove("fach");
    }
    if (this.tortoloIn <= 0) {
      this.tryMoveTortolo();
      this.armMove("tortolo");
    }

    this.tickGafas(cap);
    this.tickMuecas(cap);
    this.tickFachero(cap);
    this.tickTortolo(cap);
  }

  private tickAmbientThreat() {
    const proximity = Math.max(
      this.gafas === "mouth" ? 1 : this.gafas === "ventL" || this.gafas === "kitchen" ? 0.72 : 0,
      this.muecas === "mouth" ? 1 : this.muecas === "ventR" || this.muecas === "cove" ? 0.68 : 0,
      this.chaparro === "hall" ? 0.76 : 0,
      this.fachero === "office" ? 0.9 : this.fachero === "hall" ? 0.62 : 0,
    );
    if (Math.abs(proximity - this.lastAmbientThreat) > 0.04) {
      this.lastAmbientThreat = proximity;
      this.audio.setThreatLevel(proximity);
    }
  }

  private drainPower(dt: number) {
    if (this.powerOut) {
      this.drain = 0;
      return;
    }
    const parts: number[] = [];
    if (this.doorL) parts.push(0.0042);
    if (this.doorR) parts.push(0.0042);
    if (this.grate) parts.push(0.0032);
    if (this.flashlight) parts.push(0.0028);
    if (this.cameras) parts.push(0.0018);
    const n = parts.length;
    const sum = parts.reduce((a, b) => a + b, 0);
    const stack = n <= 1 ? 1 : 1 + 0.15 * (n - 1);
    const hourMul = 1 + this.hour * 0.025;
    const perSec = sum * stack * hourMul;
    this.drain = perSec;
    this.battery = Math.max(0, this.battery - perSec * dt);
    if (this.battery <= 0) {
      this.powerOut = true;
      this.doorL = false;
      this.doorR = false;
      this.grate = false;
      this.flashlight = false;
      this.flashHeld = false;
      this.cameras = false;
      this.audio.camStatic(false);
      this.audio.powerDown();
      this.emit();
    }
  }

  /** Later hours and higher nights shorten the wait and raise the roll. */
  private pressure() {
    const nightBoost = this.night <= 0 ? 1 : 1 + Math.max(0, this.night - 1) * 0.05;
    return (1 + this.hour * 0.16) * nightBoost;
  }

  private effectiveAi(base: number) {
    return Math.min(20, base * (0.82 + this.hour * 0.14));
  }

  private armMove(kind: "gafas" | "muecas" | "chap" | "fach" | "tortolo") {
    const base =
      kind === "chap" ? 11 : kind === "muecas" ? 8.2 : kind === "fach" ? 7.4 : kind === "tortolo" ? 9 : 6.4;
    const jitter = 0.55 + Math.random() * 0.9;
    const wait = (base / this.pressure()) * jitter;
    if (kind === "gafas") this.gafasIn = wait;
    else if (kind === "muecas") this.muecasIn = wait;
    else if (kind === "chap") this.chapIn = wait;
    else if (kind === "fach") this.fachIn = wait;
    else this.tortoloIn = wait;
  }

  private tickFlashDelay(dt: number) {
    if (this.flashDelay <= 0) return;
    this.flashDelay -= dt;
    if (this.flashDelay > 0) return;
    const next = this.flashHeld && !this.powerOut && !this.cameras && this.battery > 0;
    if (next === this.flashlight) return;
    const rose = next && !this.flashlight;
    this.flashlight = next;
    if (rose) this.onHallBlink();
  }

  private onHallBlink() {
    if (this.chaparro !== "hall" || this.cameras) return;
    if (Math.abs(this.look) > 0.48) return;
    this.chapFlashes += 1;
    this.emit();
    if (this.chapFlashes >= 3) {
      this.chaparro = "away";
      this.chapFlashes = 0;
      this.hallTimer = 0;
      this.audio.footsteps();
      this.emit();
    }
  }

  private tickAtmosphere(dt: number) {
    if (this.flicker > 0) {
      this.flicker = Math.max(0, this.flicker - dt * 7);
    } else {
      this.flickerIn -= dt;
      if (this.flickerIn <= 0) {
        this.flicker = 0.62 + Math.random() * 0.38;
        this.flickerIn = Math.max(2.2, 6.5 + Math.random() * 8 - this.hour * 0.65);
        this.audio.click();
      }
    }
    if (!this.cameras) return;
    this.staticAmt = Math.max(this.staticAmt, 0.32);
    this.interfIn -= dt;
    if (this.interfIn <= 0) {
      this.staticAmt = Math.min(1, 0.62 + Math.random() * 0.38);
      this.audio.burstStatic();
      this.interfIn = Math.max(0.9, 2.1 + Math.random() * 3.4 - this.hour * 0.16);
    }
  }

  private roll(ai: number) {
    if (ai <= 0) return false;
    return Math.random() * 20 < ai;
  }

  private tryMoveGafas() {
    if (this.ai.gafas <= 0 || this.gafas === "mouth") return;
    if (!this.roll(this.effectiveAi(this.ai.gafas))) return;
    const i = GAFAS_PATH.indexOf(this.gafas);
    const next = GAFAS_PATH[Math.min(GAFAS_PATH.length - 1, i + 1)];
    if (!next || next === this.gafas) return;
    this.gafas = next;
    if (next === "mouth") this.ventTimer = 0;
    this.audio.footsteps();
    this.emit();
  }

  private tryMoveMuecas() {
    if (this.ai.muecas <= 0 || this.muecas === "mouth") return;
    if (!this.roll(this.effectiveAi(this.ai.muecas))) return;
    const i = MUECAS_PATH.indexOf(this.muecas);
    const next = MUECAS_PATH[Math.min(MUECAS_PATH.length - 1, i + 1)];
    if (!next || next === this.muecas) return;
    this.muecas = next;
    if (next === "mouth") {
      this.muecasTimer = 0;
      this.audio.setScreamLoop(0.7);
    }
    this.emit();
  }

  private tryMoveChaparro() {
    if (this.ai.chaparro <= 0 || this.chaparro === "hall") return;
    if (!this.roll(this.effectiveAi(this.ai.chaparro))) return;
    this.chaparro = "hall";
    this.chapFlashes = 0;
    this.hallTimer = 0;
    this.audio.footsteps();
    this.emit();
  }

  private tryMoveFachero() {
    if (this.ai.fachero <= 0 || this.fachero === "office") return;
    if (!this.roll(this.effectiveAi(this.ai.fachero))) return;
    const i = FACHERO_PATH.indexOf(this.fachero);
    const next = FACHERO_PATH[Math.min(FACHERO_PATH.length - 1, i + 1)];
    if (!next || next === this.fachero) return;
    this.fachero = next;
    if (next === "office") {
      this.fachLook = 0;
      this.fachWatch = 0;
    }
    this.emit();
  }

  private tryMoveTortolo() {
    if (this.ai.tortolo <= 0 || this.tortolo === "calm") return;
    if (!this.roll(this.effectiveAi(this.ai.tortolo) * 0.65)) return;
    this.tortolo = pickTortolo(this.tortolo);
    this.tortoloFlashes = 0;
    this.emit();
  }

  private tickGafas(dt: number) {
    if (this.gafas !== "mouth") return;
    const sealed = this.doorL || this.grate;
    if (sealed) {
      this.ventTimer += dt;
      if (this.ventTimer > 3.1) {
        this.gafas = Math.random() < 0.5 ? "ventL" : "party";
        this.ventTimer = 0;
        this.audio.vent();
        this.emit();
      }
      return;
    }
    this.ventTimer += dt;
    const patience = this.night <= 2 ? 5.2 : this.night <= 4 ? 4.2 : 3.4;
    if (this.ventTimer > patience) this.kill("gafas");
  }

  private tickMuecas(dt: number) {
    if (this.ai.muecas <= 0) {
      this.audio.setScreamLoop(0);
      return;
    }
    if (this.muecas !== "mouth") {
      if (this.muecas === "ventR") this.audio.setScreamLoop(0.35);
      else this.audio.setScreamLoop(0);
      return;
    }
    this.audio.setScreamLoop(1);
    if (this.doorR) {
      this.muecasTimer += dt;
      if (this.muecasTimer > 2.6) {
        this.muecas = Math.random() < 0.5 ? "ventR" : "cove";
        this.muecasTimer = 0;
        this.audio.setScreamLoop(0);
        this.audio.vent();
        this.emit();
      }
      return;
    }
    this.muecasTimer += dt;
    const patience = this.night <= 2 ? 4.4 : 3.2;
    if (this.muecasTimer > patience) this.kill("muecas");
  }

  private tickChaparro(dt: number) {
    if (this.chaparro !== "hall") return;
    if (this.chapFlashes >= 3) return;
    this.hallTimer += dt;
    const patience = this.night <= 2 ? 9 : this.night <= 4 ? 7 : 5.6;
    if (this.hallTimer > patience) this.kill("chaparro");
  }

  private tickFachero(dt: number) {
    if (this.fachero !== "office") return;
    const looking = !this.cameras && Math.abs(this.look) < 0.55;
    if (looking) {
      this.fachLook = 0;
      this.fachWatch += dt;
      if (this.fachWatch > 4) {
        this.fachero = "hall";
        this.fachWatch = 0;
        this.fachLook = 0;
        this.audio.footsteps();
        this.emit();
      }
      return;
    }
    this.fachWatch = 0;
    this.fachLook += dt;
    if (this.fachLook > 5) this.kill("fachero");
  }

  private tickTortolo(dt: number) {
    if (this.ai.tortolo <= 0) return;
    if (this.tortolo === "calm") {
      this.tortoloCalm -= dt;
      if (this.tortoloCalm <= 0) {
        this.tortolo = pickTortolo();
        this.tortoloFlashes = 0;
        this.tortoloRage = 0;
        this.emit();
      }
      return;
    }
    const rageMax = Math.max(28, (this.night <= 1 ? 78 : 62) - this.ai.tortolo * 1.1);
    this.tortoloRage += dt * (1 + this.hour * 0.08);
    if (this.tortoloRage >= rageMax) this.kill("tortolo");
  }

  /** Sonido sintético de respaldo si el video del susto no carga. */
  fallbackScream() {
    this.audio.scream();
  }

  get sound() {
    return this.audio;
  }

  finishJumpscare() {
    if (this.phase !== "jumpscare") return;
    this.phase = "gameover";
    this.audio.camStatic(false);
    this.audio.setScreamLoop(0);
    this.emit();
  }

  private kill(who: ThreatId) {
    if (this.phase !== "playing") return;
    this.jumpscare = who;
    this.phase = "jumpscare";
    this.jumpscareAcc = 0;
    this.cameras = false;
    this.flashlight = false;
    this.trauma = 1;
    this.audio.stopPhone();
    this.audio.stopMusicBox();
    this.audio.setScreamLoop(0);
    this.audio.camStatic(false);
    this.emit();
  }

  private win() {
    this.phase = "sixam";
    this.sixAcc = 0;
    this.cameras = false;
    this.flashlight = false;
    this.doorL = false;
    this.doorR = false;
    this.grate = false;
    this.audio.stopPhone();
    this.audio.stopMusicBox();
    this.audio.setScreamLoop(0);
    this.audio.camStatic(false);
    this.audio.sixAm();
    const isCustom = this.night === 0;
    if (!isCustom) {
      const beaten = Math.max(this.beaten, this.night);
      const nextNight = Math.min(6, this.night + 1);
      const night6 = this.night6 || this.night >= 5;
      writeSave({ night: nextNight, beaten, night6 });
      this.beaten = beaten;
      this.night6 = night6;
    } else {
      const maxed = Object.values(this.ai).every((v) => v >= 20);
      if (maxed) {
        writeSave({ custom20: true });
        this.custom20 = true;
      }
    }
    this.emit();
  }

  continueNight() {
    const s = loadSave();
    this.startNight(Math.min(6, Math.max(1, s.night)));
  }
}

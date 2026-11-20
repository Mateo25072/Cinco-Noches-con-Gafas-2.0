import { aiForNight, PHONE } from "./config.ts";
import { clearSave, loadSave, writeSave } from "./save.ts";
import type {
  AiLevels,
  CamId,
  EngineSnap,
  FacheroLoc,
  GafasLoc,
  MuecasLoc,
  Phase,
  ThreatId,
} from "./types.ts";
import type { GameAudio } from "./audio.ts";

const GAFAS_PATH: GafasLoc[] = ["stage", "party", "kitchen", "ventL", "mouth"];
const MUECAS_PATH: MuecasLoc[] = ["games", "storage", "cove", "ventR", "mouth"];
const FACHERO_PATH: FacheroLoc[] = ["parts", "games", "hall", "office"];
const TORTOLO_CAMS: CamId[] = ["stage", "games", "prize", "cove", "parts", "party", "kitchen", "storage"];

const DEATH_TIPS: Record<string, string> = {
  gafas: "Gafas: cierra la puerta izquierda o la rejilla cuando lo veas en la boca del conducto.",
  muecas: "Muecas: cierra la puerta derecha cuando esté en la boca del conducto.",
  chaparro: "Chaparro: tres destellos de linterna mirando al pasillo central.",
  fachero: "Fachero en la oficina: míralo unos 3.5 s para echarlo. En apagón no puedes verlo: reinicia el generador antes de que entre.",
  tortolo: "Tórtolo: tres destellos en su cámara. Si no lo miras, cambia de sitio.",
  panic: "El pánico llegó al límite. Baja la tablet y cierra conductos a tiempo.",
};

function pickTortolo(exclude?: CamId): CamId {
  const pool = TORTOLO_CAMS.filter((c) => c !== exclude);
  return pool[Math.floor(Math.random() * pool.length)] ?? "stage";
}

export class FnafEngine {
  sound: GameAudio;
  private listeners = new Set<() => void>();
  private snap: EngineSnap;

  phase: Phase = "menu";
  night = 1;
  hour = 0;
  hourAcc = 0;
  introAcc = 0;
  battery = 1;
  drain = 0;
  look = 0;
  doorL = false;
  doorR = false;
  grate = false;
  cameras = false;
  camId: CamId = "stage";
  flashlight = false;
  flashHeld = false;
  powerOut = false;
  generatorResetHeld = false;
  generatorResetProgress = 0;
  generatorResetUsed = false;
  phoneOn = false;
  phoneLine = 0;
  phoneAcc = 0;
  staticAmt = 0;
  flicker = 0;
  panic = 0;
  blinded = 0;
  breathFog = 0;
  officePhotoCreepy = false;
  lureCooldown = 0;
  jumpscare: ThreatId | null = null;
  deathTip: string | null = null;
  ai: AiLevels = aiForNight(1);
  beaten = 0;
  night6Unlocked = false;
  customUnlocked = false;
  custom20 = false;
  canContinue = false;

  gafas: GafasLoc = "stage";
  muecas: MuecasLoc = "games";
  chaparro: "away" | "hall" = "away";
  fachero: FacheroLoc = "parts";
  tortolo: CamId | "calm" = "calm";
  tortoloFlashes = 0;
  tortoloRage = 0;
  tortoloCalm = 0;
  tortoloUnseen = 0;
  chapFlashes = 0;
  hallTimer = 0;
  ventTimer = 0;
  muecasTimer = 0;
  fachLook = 0;
  fachWatch = 0;
  gafasIn = 4;
  muecasIn = 4;
  chapIn = 6;
  fachIn = 5;
  tortoloIn = 7;
  camWatchAcc = 0;
  powerOutAcc = 0;
  staggerLock = 0;
  flashPulse = 0;

  constructor(audio: GameAudio) {
    this.sound = audio;
    const save = loadSave();
    if (save) {
      this.beaten = save.beaten;
      this.night6Unlocked = save.night6Unlocked;
      this.customUnlocked = save.customUnlocked;
      this.custom20 = save.custom20;
      this.canContinue = save.canContinue;
      this.night = save.night;
    }
    this.snap = this.buildSnap();
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = () => this.snap;
  emit() {
    this.snap = this.buildSnap();
    for (const fn of this.listeners) fn();
  }

  private buildSnap(): EngineSnap {
    return {
      phase: this.phase,
      night: this.night,
      hour: this.hour,
      battery: this.battery,
      drain: this.drain,
      look: this.look,
      doorL: this.doorL,
      doorR: this.doorR,
      grate: this.grate,
      cameras: this.cameras,
      camId: this.camId,
      flashlight: this.flashlight,
      powerOut: this.powerOut,
      generatorResetProgress: this.generatorResetProgress,
      generatorResetUsed: this.generatorResetUsed,
      phoneOn: this.phoneOn,
      phoneLine: this.phoneLine,
      staticAmt: this.staticAmt,
      flicker: this.flicker,
      panic: this.panic,
      blinded: this.blinded,
      breathFog: this.breathFog,
      officePhotoCreepy: this.officePhotoCreepy,
      lureCooldown: this.lureCooldown,
      jumpscare: this.jumpscare,
      deathTip: this.deathTip,
      ai: { ...this.ai },
      gafas: this.gafas,
      muecas: this.muecas,
      chaparro: this.chaparro,
      fachero: this.fachero,
      tortolo: this.tortolo,
      tortoloFlashes: this.tortoloFlashes,
      beaten: this.beaten,
      night6Unlocked: this.night6Unlocked,
      customUnlocked: this.customUnlocked,
      custom20: this.custom20,
      canContinue: this.canContinue,
    };
  }

  /** Clave barata para no redibujar si solo cambió un decimal. */
  hudStamp(): string {
    const q = (n: number, step: number) => Math.round(n / step);
    return [
      this.phase,
      this.night,
      this.hour,
      q(this.battery, 0.01),
      q(this.panic, 0.05),
      q(this.drain, 0.005),
      this.doorL ? 1 : 0,
      this.doorR ? 1 : 0,
      this.grate ? 1 : 0,
      this.cameras ? 1 : 0,
      this.camId,
      this.flashlight ? 1 : 0,
      this.powerOut ? 1 : 0,
      q(this.generatorResetProgress, 0.15),
      this.generatorResetUsed ? 1 : 0,
      this.phoneOn ? 1 : 0,
      this.phoneLine,
      q(this.staticAmt, 0.1),
      q(this.flicker, 0.1),
      q(this.breathFog, 0.1),
      q(this.blinded, 0.1),
      q(this.lureCooldown, 0.5),
      this.officePhotoCreepy ? 1 : 0,
      this.gafas,
      this.muecas,
      this.chaparro,
      this.fachero,
      this.tortolo,
      this.tortoloFlashes,
      this.chapFlashes,
      this.jumpscare ?? "",
      this.deathTip ?? "",
    ].join("|");
  }

  goMenu() {
    this.phase = "menu";
    this.jumpscare = null;
    this.deathTip = null;
    this.sound.stopAmbient();
    this.sound.stopPowerOutAmbient();
    this.emit();
  }

  openCustom() {
    this.phase = "custom";
    this.emit();
  }

  setCustomAi(k: keyof AiLevels, v: number) {
    this.ai[k] = Math.max(0, Math.min(20, Math.round(v)));
    this.emit();
  }

  continueNight() {
    if (this.canContinue && this.night >= 1) this.startNight(this.night);
    else if (this.beaten >= 1) this.startNight(Math.min(6, this.beaten + 1));
  }

  startNight(night: number, custom?: AiLevels) {
    this.night = night;
    this.ai = custom ?? aiForNight(night);
    this.phase = "intro";
    this.introAcc = 0;
    this.hour = 0;
    this.hourAcc = 0;
    this.battery = 1;
    this.drain = 0;
    this.look = 0;
    this.doorL = false;
    this.doorR = false;
    this.grate = false;
    this.cameras = false;
    this.camId = "stage";
    this.flashlight = false;
    this.flashHeld = false;
    this.powerOut = false;
    this.generatorResetHeld = false;
    this.generatorResetProgress = 0;
    this.generatorResetUsed = false;
    this.phoneOn = false;
    this.phoneLine = 0;
    this.phoneAcc = 0;
    this.sound.stopPhone();
    this.staticAmt = 0;
    this.flicker = 0;
    this.panic = 0;
    this.blinded = 0;
    this.breathFog = 0;
    this.officePhotoCreepy = false;
    this.lureCooldown = 0;
    this.jumpscare = null;
    this.deathTip = null;
    this.gafas = "stage";
    this.muecas = "games";
    this.chaparro = "away";
    this.fachero = "parts";
    this.tortolo = "calm";
    this.tortoloFlashes = 0;
    this.tortoloRage = 0;
    this.tortoloCalm = 8;
    this.tortoloUnseen = 0;
    this.chapFlashes = 0;
    this.hallTimer = 0;
    this.ventTimer = 0;
    this.muecasTimer = 0;
    this.fachLook = 0;
    this.fachWatch = 0;
    this.gafasIn = 3.5;
    this.muecasIn = 4;
    this.chapIn = 6;
    this.fachIn = 5;
    this.tortoloIn = 7;
    this.camWatchAcc = 0;
    this.powerOutAcc = 0;
    this.staggerLock = 0;
    this.sound.stopAmbient();
    this.sound.stopPowerOutAmbient();
    this.emit();
  }

  private beginPlay() {
    this.phase = "playing";
    const lines = PHONE[this.night] ?? [];
    this.phoneOn = lines.length > 0 && this.night >= 1 && this.night <= 6;
    this.phoneLine = 0;
    this.phoneAcc = 0;
    if (this.phoneOn) {
      this.sound.phone();
      this.sound.speak([lines[0]!]);
    }
    this.sound.startAmbient();
    this.emit();
  }

  finishJumpscare() {
    this.phase = "gameover";
    this.sound.stopAmbient();
    this.sound.stopPowerOutAmbient();
    this.emit();
  }

  fallbackScream() {
    this.sound.scream();
  }

  setLook(v: number) {
    this.look = Math.max(-1, Math.min(1, v));
  }

  setCameras(on: boolean) {
    if (this.phase !== "playing" || this.powerOut) return;
    if (on && this.battery <= 0) return;
    this.cameras = on;
    if (!on) this.camWatchAcc = 0;
    this.emit();
  }

  setCam(id: CamId) {
    if (!this.cameras) return;
    this.camId = id;
    this.emit();
  }

  toggleDoor(side: "L" | "R") {
    if (this.phase !== "playing" || this.powerOut || this.cameras) return;
    if (this.battery <= 0) return;
    if (side === "L") this.doorL = !this.doorL;
    else this.doorR = !this.doorR;
    this.sound.door();
    this.emit();
  }

  toggleGrate() {
    if (this.phase !== "playing" || this.powerOut || this.cameras) return;
    if (this.battery <= 0) return;
    this.grate = !this.grate;
    this.sound.door();
    this.emit();
  }

  setFlashlight(on: boolean) {
    if (this.phase !== "playing" || this.powerOut) return;
    if (on && this.battery <= 0) return;
    this.flashHeld = on;
    this.flashlight = on;
    this.emit();
  }

  setGeneratorReset(on: boolean) {
    this.generatorResetHeld = on;
  }

  skipPhone() {
    this.phoneOn = false;
    this.phoneAcc = 0;
    this.sound.stopPhone();
    this.emit();
  }

  soundLure() {
    if (
      this.phase !== "playing" ||
      this.powerOut ||
      this.lureCooldown > 0 ||
      this.battery <= 0.08
    )
      return;
    if (this.camId !== "kitchen" && this.camId !== "storage") return;
    this.battery = Math.max(0, this.battery - 0.08);
    this.lureCooldown = 12;
    if (this.camId === "kitchen" && this.gafas !== "mouth") {
      const i = GAFAS_PATH.indexOf(this.gafas);
      if (i > 0) this.gafas = GAFAS_PATH[i - 1]!;
    }
    if (this.camId === "storage" && this.muecas !== "mouth") {
      const i = MUECAS_PATH.indexOf(this.muecas);
      if (i > 0) this.muecas = MUECAS_PATH[i - 1]!;
    }
    this.sound.footsteps();
    this.emit();
  }

  strobeCam() {
    if (this.phase !== "playing" || !this.cameras || this.powerOut || this.battery <= 0) return;
    this.battery = Math.max(0, this.battery - 0.008);
    this.blinded = 0.35;
    if (this.tortolo !== "calm" && this.camId === this.tortolo) {
      this.tortoloFlashes += 1;
      this.tortoloRage = Math.max(0, this.tortoloRage - 8);
      if (this.tortoloFlashes >= 3) {
        this.tortolo = "calm";
        this.tortoloCalm = 26;
        this.tortoloFlashes = 0;
        this.tortoloUnseen = 0;
      }
    }
    this.sound.strobe();
    this.emit();
  }

  update(dt: number) {
    if (this.phase === "intro") {
      this.introAcc += dt;
      if (this.introAcc > 2.4) this.beginPlay();
      return;
    }
    if (this.phase !== "playing") return;

    const cap = Math.min(0.05, dt);
    this.lureCooldown = Math.max(0, this.lureCooldown - cap);
    this.blinded = Math.max(0, this.blinded - cap);
    this.flicker = Math.max(0, this.flicker - cap * 1.2);
    this.staticAmt = Math.max(0, this.staticAmt - cap * 0.15);

    if (this.powerOut) {
      if (this.generatorResetHeld && !this.generatorResetUsed) {
        const prev = this.generatorResetProgress;
        this.generatorResetProgress = Math.min(3, this.generatorResetProgress + cap);
        if (Math.floor(this.generatorResetProgress * 3) > Math.floor(prev * 3)) {
          this.sound.generatorCrank(this.generatorResetProgress / 3);
        }
        if (this.generatorResetProgress >= 3) {
          this.battery = 0.38;
          this.powerOut = false;
          this.powerOutAcc = 0;
          this.generatorResetUsed = true;
          this.generatorResetHeld = false;
          this.generatorResetProgress = 0;
          if (this.fachero === "office") {
            this.fachero = "hall";
            this.fachLook = 0;
            this.fachWatch = 0;
          }
          this.sound.generatorRestart();
          this.sound.startAmbient();
          this.emit();
        }
      }
      if (!this.powerOut) return;

      this.fachIn -= cap * 3.2;
      if (this.fachIn <= 0) {
        this.tryMoveFachero();
        this.armMove("fach");
      }
      this.tickFachero(cap);

      this.powerOutAcc += cap;
      if (this.phoneOn) this.skipPhone();
      this.tickHour(cap);
      if (this.powerOutAcc > 11) {
        this.kill(this.fachero === "office" || this.fachero === "hall" ? "fachero" : "gafas");
      }
      return;
    }

    if (this.cameras) this.camWatchAcc += cap;
    else this.camWatchAcc = Math.max(0, this.camWatchAcc - cap * 0.6);
    this.staggerLock = Math.max(0, this.staggerLock - cap);

    const urgent = this.urgentCount();
    if (urgent >= 3) this.panic = Math.min(1, this.panic + cap * 0.03);
    else this.panic = Math.max(0, this.panic - cap * 0.035);
    if (this.panic >= 1) {
      this.kill("panic");
      return;
    }

    this.tickTeamSupport(cap);
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
    this.tickBattery(cap);
    this.tickPhone(cap);
    this.tickHour(cap);
    this.tickAtmosphere(cap);
  }

  private tickPhone(dt: number) {
    if (!this.phoneOn || this.powerOut) return;
    const lines = PHONE[this.night] ?? [];
    if (lines.length === 0) {
      this.phoneOn = false;
      return;
    }
    this.phoneAcc += dt;
    const line = lines[this.phoneLine] ?? "";
    const wait = Math.min(12, 2.8 + line.length * 0.04);
    if (this.phoneAcc < wait) return;
    this.phoneAcc = 0;
    this.phoneLine += 1;
    if (this.phoneLine >= lines.length) {
      this.phoneOn = false;
      this.sound.stopPhone();
      return;
    }
    this.sound.speak([lines[this.phoneLine]!]);
  }

  private tickBattery(dt: number) {
    // Consumo por segundo (1 = 100 %). Una noche dura 300 s: en reposo se gasta ~18 %,
    // y dejar todo encendido la agota en menos de la mitad de la noche.
    let perSec = 0.0006;
    if (this.doorL) perSec += 0.0022;
    if (this.doorR) perSec += 0.0022;
    if (this.grate) perSec += 0.0018;
    if (this.cameras) perSec += 0.0025;
    if (this.flashlight) perSec += 0.003;
    this.drain = perSec;
    this.battery = Math.max(0, this.battery - perSec * dt);
    if (this.battery <= 0) {
      this.powerOut = true;
      this.powerOutAcc = 0;
      this.cameras = false;
      this.flashlight = false;
      this.flashHeld = false;
      this.doorL = false;
      this.doorR = false;
      this.grate = false;
      this.sound.stopAmbient();
      this.sound.powerDown();
      this.emit();
    }
  }

  private tickHour(dt: number) {
    this.hourAcc += dt;
    const HOUR_LEN = 50;
    if (this.hourAcc >= HOUR_LEN) {
      this.hourAcc = 0;
      this.hour += 1;
      if (this.hour >= 6) {
        this.phase = "sixam";
        this.sound.stopAmbient();
        this.sound.stopPowerOutAmbient();
        this.sound.sixAm();
        this.persistWin();
        this.emit();
      }
    }
  }

  private tickAtmosphere(dt: number) {
    this.breathFog = Math.max(0, this.breathFog - dt * 0.08);
    if (this.fachero === "office") this.breathFog = Math.max(this.breathFog, 0.4);
    if (Math.random() < dt * 0.02) this.officePhotoCreepy = !this.officePhotoCreepy;
  }

  private pressure() {
    const nightBoost = this.night <= 0 ? 1 : 1 + Math.max(0, this.night - 1) * 0.05;
    return (1 + this.hour * 0.16) * nightBoost;
  }

  private effectiveAi(base: number, kind?: "gafas" | "muecas" | "chap" | "fach" | "tortolo") {
    let mult = 0.82 + this.hour * 0.14;
    if (kind) mult *= this.teamAiMult(kind);
    return Math.min(20, base * mult);
  }

  private teamAiMult(kind: "gafas" | "muecas" | "chap" | "fach" | "tortolo"): number {
    let m = 1;
    if (kind === "muecas" && (this.gafas === "mouth" || this.gafas === "ventL")) m *= 1.35;
    if (kind === "gafas" && (this.muecas === "mouth" || this.muecas === "ventR")) m *= 1.35;
    if ((kind === "fach" || kind === "chap") && this.cameras && this.camWatchAcc > 4) m *= 1.22;
    if (kind === "fach" && this.tortolo !== "calm") m *= 1.12;
    if (kind === "chap" && this.tortolo !== "calm") m *= 1.1;
    if ((kind === "gafas" || kind === "muecas") && this.fachero === "office") m *= 1.18;
    if (kind === "tortolo" && this.chaparro === "hall") m *= 1.08;
    return m;
  }

  private teamIntervalMult(kind: "gafas" | "muecas" | "chap" | "fach" | "tortolo"): number {
    let m = 1;
    if (kind === "muecas" && (this.gafas === "mouth" || this.gafas === "ventL")) m *= 0.82;
    if (kind === "gafas" && (this.muecas === "mouth" || this.muecas === "ventR")) m *= 0.82;
    if ((kind === "fach" || kind === "chap") && this.cameras) m *= 0.88;
    if ((kind === "gafas" || kind === "muecas") && this.fachero === "office") m *= 0.88;
    return m;
  }

  private armMove(kind: "gafas" | "muecas" | "chap" | "fach" | "tortolo") {
    const base =
      kind === "gafas" ? 4.2 : kind === "muecas" ? 4.4 : kind === "chap" ? 6.5 : kind === "fach" ? 5.2 : 7.2;
    const jitter = 0.75 + Math.random() * 0.5;
    const wait = (base / this.pressure()) * jitter * this.teamIntervalMult(kind);
    if (kind === "gafas") this.gafasIn = wait;
    else if (kind === "muecas") this.muecasIn = wait;
    else if (kind === "chap") this.chapIn = wait;
    else if (kind === "fach") this.fachIn = wait;
    else this.tortoloIn = wait;
  }

  private tickTeamSupport(_dt: number) {
    if (this.staggerLock > 0) return;
    if (this.urgentCount() >= 2) return;
    if (this.cameras && this.camWatchAcc > 5 && this.fachero !== "office" && this.fachIn > 2.5) {
      this.fachIn = Math.max(1.5, this.fachIn * 0.92);
    }
  }

  private tickChaparroFlash() {
    if (this.chaparro !== "hall") return;
    if (!this.flashlight || Math.abs(this.look) >= 0.5) return;
    this.flashPulse += 0.016;
    if (this.flashPulse > 0.35) {
      this.flashPulse = 0;
      this.chapFlashes += 1;
      if (this.chapFlashes >= 3) {
        this.chaparro = "away";
        this.chapFlashes = 0;
        this.hallTimer = 0;
        this.sound.footsteps();
        this.emit();
      }
    }
  }

  private roll(ai: number) {
    return Math.random() * 20 < ai;
  }

  private urgentCount(): number {
    let n = 0;
    if (this.gafas === "mouth") n += 1;
    if (this.muecas === "mouth") n += 1;
    if (this.chaparro === "hall") n += 1;
    if (this.fachero === "office") n += 1;
    return n;
  }

  private canEnterUrgent(kind: string) {
    if (this.staggerLock > 0) return false;
    const urgent = this.urgentCount();
    if (urgent >= 2) return false;
    if (this.night <= 4) {
      if (kind === "gafasMouth" && this.muecas === "mouth") return false;
      if (kind === "muecasMouth" && this.gafas === "mouth") return false;
    }
    if (this.night <= 2) {
      if (kind === "chapHall" && this.fachero === "office") return false;
      if (kind === "fachOffice" && this.chaparro === "hall") return false;
    }
    if (urgent >= 1 && (kind === "chapHall" || kind === "fachOffice")) {
      if (this.gafas === "mouth" || this.muecas === "mouth") return false;
    }
    return true;
  }

  private markUrgentEnter() {
    this.staggerLock = this.night <= 2 ? 4.5 : this.night <= 4 ? 3.2 : 2.2;
  }

  private tryMoveGafas() {
    if (this.ai.gafas <= 0 || this.gafas === "mouth") return;
    if (!this.roll(this.effectiveAi(this.ai.gafas, "gafas"))) return;
    const i = GAFAS_PATH.indexOf(this.gafas);
    const next = GAFAS_PATH[Math.min(GAFAS_PATH.length - 1, i + 1)];
    if (!next || next === this.gafas) return;
    if (next === "mouth" && !this.canEnterUrgent("gafasMouth")) return;
    this.gafas = next;
    if (next === "mouth") {
      this.ventTimer = 0;
      this.markUrgentEnter();
      this.sound.vent();
    }
    this.emit();
  }

  private tryMoveMuecas() {
    if (this.ai.muecas <= 0 || this.muecas === "mouth") return;
    if (!this.roll(this.effectiveAi(this.ai.muecas, "muecas"))) return;
    const i = MUECAS_PATH.indexOf(this.muecas);
    const next = MUECAS_PATH[Math.min(MUECAS_PATH.length - 1, i + 1)];
    if (!next || next === this.muecas) return;
    if (next === "mouth" && !this.canEnterUrgent("muecasMouth")) return;
    this.muecas = next;
    if (next === "mouth") {
      this.muecasTimer = 0;
      this.markUrgentEnter();
      this.sound.vent();
    }
    this.emit();
  }

  private tryMoveChaparro() {
    if (this.ai.chaparro <= 0 || this.chaparro === "hall") return;
    if (!this.roll(this.effectiveAi(this.ai.chaparro, "chap"))) return;
    if (!this.canEnterUrgent("chapHall")) return;
    this.chaparro = "hall";
    this.hallTimer = 0;
    this.chapFlashes = 0;
    this.markUrgentEnter();
    this.sound.footsteps();
    this.emit();
  }

  private tryMoveFachero() {
    if (this.ai.fachero <= 0 || this.fachero === "office") return;
    const ai = this.powerOut
      ? Math.min(20, Math.max(16, this.effectiveAi(this.ai.fachero, "fach") * 1.8))
      : this.effectiveAi(this.ai.fachero, "fach");
    if (!this.roll(ai)) return;
    const i = FACHERO_PATH.indexOf(this.fachero);
    const step = this.powerOut && Math.random() < 0.55 ? 2 : 1;
    const next = FACHERO_PATH[Math.min(FACHERO_PATH.length - 1, i + step)];
    if (!next || next === this.fachero) return;
    if (next === "office" && !this.powerOut && !this.canEnterUrgent("fachOffice")) {
      if (this.fachero !== "hall") {
        this.fachero = "hall";
        this.emit();
      }
      return;
    }
    this.fachero = next;
    if (next === "office") {
      this.fachLook = 0;
      this.fachWatch = 0;
      if (!this.powerOut) this.markUrgentEnter();
      this.sound.footsteps();
    } else if (this.powerOut) {
      this.sound.footsteps();
    }
    this.emit();
  }

  private tryMoveTortolo() {
    if (this.ai.tortolo <= 0) return;
    if (!this.roll(this.effectiveAi(this.ai.tortolo, "tortolo") * 0.85)) return;
    if (this.tortolo === "calm") return;
  }

  private tickGafas(dt: number) {
    if (this.gafas !== "mouth") return;
    const sealed = this.doorL || this.grate;
    if (sealed) {
      this.ventTimer += dt;
      if (this.ventTimer > 3.1) {
        this.gafas = Math.random() < 0.5 ? "ventL" : "party";
        this.ventTimer = 0;
        this.emit();
      }
      return;
    }
    this.ventTimer += dt;
    let patience = this.night <= 2 ? 5.8 : this.night <= 4 ? 4.6 : 3.6;
    if (this.muecas === "mouth") patience *= 0.72;
    if (this.fachero === "office") patience *= 0.88;
    if (this.ventTimer > patience) this.kill("gafas");
  }

  private tickMuecas(dt: number) {
    if (this.muecas !== "mouth") return;
    if (this.doorR) {
      this.muecasTimer += dt;
      if (this.muecasTimer > 3.1) {
        this.muecas = Math.random() < 0.5 ? "ventR" : "cove";
        this.muecasTimer = 0;
        this.emit();
      }
      return;
    }
    this.muecasTimer += dt;
    let patience = this.night <= 2 ? 5.0 : this.night <= 4 ? 3.8 : 3.3;
    if (this.gafas === "mouth") patience *= 0.72;
    if (this.fachero === "office") patience *= 0.88;
    if (this.muecasTimer > patience) this.kill("muecas");
  }

  private tickChaparro(dt: number) {
    if (this.chaparro !== "hall") return;
    if (this.chapFlashes >= 3) return;
    this.hallTimer += dt;
    if (this.flashlight && Math.abs(this.look) < 0.5) this.tickChaparroFlash();
    let patience = this.night <= 2 ? 10 : this.night <= 4 ? 7.5 : 6.0;
    if (this.cameras) patience *= 0.82;
    if (this.fachero === "office") patience *= 0.9;
    if (this.hallTimer > patience) this.kill("chaparro");
  }

  private tickFachero(dt: number) {
    if (this.fachero !== "office") return;
    if (this.powerOut) {
      this.fachWatch = 0;
      this.fachLook += dt;
      if (this.fachLook > 2.4) this.kill("fachero");
      return;
    }
    const looking = !this.cameras && Math.abs(this.look) < 0.55;
    if (looking) {
      this.fachLook = 0;
      this.fachWatch += dt;
      if (this.fachWatch > 3.5) {
        this.fachero = "hall";
        this.fachWatch = 0;
        this.fachLook = 0;
        this.sound.footsteps();
        this.emit();
      }
      return;
    }
    this.fachWatch = 0;
    this.fachLook += dt;
    let limit = 6.5;
    if (this.gafas === "mouth" || this.muecas === "mouth") limit = 5.2;
    if (this.tortolo !== "calm") limit = Math.min(limit, 5.6);
    if (this.fachLook > limit) this.kill("fachero");
  }

  private tickTortolo(dt: number) {
    if (this.ai.tortolo <= 0) return;
    if (this.tortolo === "calm") {
      this.tortoloCalm -= dt;
      if (this.tortoloCalm <= 0) {
        this.tortolo = pickTortolo();
        this.tortoloFlashes = 0;
        this.tortoloRage = 0;
        this.tortoloUnseen = 0;
        this.emit();
      }
      return;
    }
    const watching = this.cameras && this.camId === this.tortolo;
    if (watching) this.tortoloUnseen = 0;
    else {
      this.tortoloUnseen += dt;
      const sneakLimit =
        this.night <= 1 ? 16 : this.night <= 2 ? 13 : this.night <= 3 ? 11 : this.night <= 4 ? 9 : 7.5;
      if (this.tortoloUnseen >= sneakLimit) {
        const prev = this.tortolo;
        this.tortolo = pickTortolo(prev === "calm" ? undefined : prev);
        this.tortoloFlashes = 0;
        this.tortoloUnseen = 0;
        this.tortoloRage = Math.max(0, this.tortoloRage - 4);
        this.sound.burstStatic();
        this.sound.vent();
        this.emit();
      }
    }
    const baseRage = this.night <= 1 ? 95 : this.night <= 2 ? 82 : this.night <= 3 ? 70 : 62;
    const rageMax = Math.max(32, baseRage - this.ai.tortolo * 1.0);
    this.tortoloRage += dt * (0.85 + this.hour * 0.07);
    if (this.tortoloRage >= rageMax) this.kill("tortolo");
  }

  private kill(who: ThreatId) {
    if (this.phase !== "playing") return;
    this.jumpscare = who;
    this.phase = "jumpscare";
    this.deathTip = DEATH_TIPS[who] ?? null;
    this.sound.stopAmbient();
    this.sound.stopPowerOutAmbient();
    this.canContinue = true;
    writeSave({
      beaten: this.beaten,
      night6: this.night6Unlocked,
      night6Unlocked: this.night6Unlocked,
      customUnlocked: this.customUnlocked,
      custom20: this.custom20,
      canContinue: true,
      night: this.night,
    });
    this.emit();
  }

  private persistWin() {
    const night = this.night;
    if (night >= 1 && night <= 5) this.beaten = Math.max(this.beaten, night);
    if (night >= 5) this.night6Unlocked = true;
    if (night >= 6) this.customUnlocked = true;
    if (
      night === 0 &&
      this.ai.gafas >= 20 &&
      this.ai.muecas >= 20 &&
      this.ai.chaparro >= 20 &&
      this.ai.fachero >= 20 &&
      this.ai.tortolo >= 20
    ) {
      this.custom20 = true;
    }
    this.canContinue = night >= 1 && night < 6;
    writeSave({
      beaten: this.beaten,
      night6: this.night6Unlocked,
      night6Unlocked: this.night6Unlocked,
      customUnlocked: this.customUnlocked,
      custom20: this.custom20,
      canContinue: this.canContinue,
      night: this.canContinue ? night + 1 : night,
    });
  }

  resetProgress() {
    clearSave();
    this.beaten = 0;
    this.night = 1;
    this.night6Unlocked = false;
    this.customUnlocked = false;
    this.custom20 = false;
    this.canContinue = false;
    this.phase = "menu";
    this.jumpscare = null;
    this.deathTip = null;
    this.emit();
  }
}

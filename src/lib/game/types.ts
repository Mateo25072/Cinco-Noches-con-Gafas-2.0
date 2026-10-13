export type Phase =
  | "menu"
  | "custom"
  | "newspaper"
  | "intro"
  | "playing"
  | "jumpscare"
  | "gameover"
  | "sixam";

export type CamId =
  | "stage"
  | "games"
  | "prize"
  | "cove"
  | "hall"
  | "parts"
  | "party"
  | "ventL"
  | "ventR"
  | "kitchen"
  | "storage";

export type ThreatId = "gafas" | "muecas" | "chaparro" | "fachero" | "tortolo" | "panic";

export type GafasLoc = "stage" | "party" | "kitchen" | "ventL" | "mouth";
export type MuecasLoc = "games" | "storage" | "cove" | "ventR" | "mouth";
export type ChaparroLoc = "away" | "hall";
export type FacheroLoc = "parts" | "games" | "hall" | "office";
export type TortoloLoc =
  | "parts"
  | "prize"
  | "party"
  | "cove"
  | "games"
  | "hall"
  | "kitchen"
  | "storage"
  | "calm";

export type AiLevels = {
  gafas: number;
  muecas: number;
  chaparro: number;
  fachero: number;
  tortolo: number;
};

export type SaveData = {
  version: 2;
  night: number;
  beaten: number;
  night6: boolean;
  custom20: boolean;
};

export type EngineSnap = {
  phase: Phase;
  night: number;
  hour: number;
  hourAcc: number;
  hourLen: number;
  look: number;
  flashlight: boolean;
  cameras: boolean;
  camId: CamId;
  doorL: boolean;
  doorR: boolean;
  grate: boolean;
  battery: number;
  drain: number;
  flicker: number;
  panic: number;
  powerOut: boolean;
  gafas: GafasLoc;
  muecas: MuecasLoc;
  chaparro: ChaparroLoc;
  fachero: FacheroLoc;
  chapFlashes: number;
  tortolo: TortoloLoc;
  tortoloFlashes: number;
  fachLook: number;
  blinded: number;
  jumpscare: ThreatId | null;
  phoneOn: boolean;
  phoneLine: number;
  staticAmt: number;
  trauma: number;
  ai: AiLevels;
  canContinue: boolean;
  beaten: number;
  night6Unlocked: boolean;
  customUnlocked: boolean;
  custom20: boolean;
  generatorResetProgress: number;
  generatorResetUsed: boolean;
  lureCooldown: number;
};

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ASSETS, NEWSPAPER } from "@/lib/game/config";
import { GameAudio } from "@/lib/game/audio";
import { FnafEngine } from "@/lib/game/engine";
import { PlayScreen } from "./PlayScreen";

export function GameApp() {
  const audio = useMemo(() => new GameAudio(), []);
  const engine = useMemo(() => new FnafEngine(audio), [audio]);
  const snap = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
  const [paper, setPaper] = useState(false);
  const [muted, setMuted] = useState(false);
  const [help, setHelp] = useState(false);
  const [settings, setSettings] = useState(false);
  const [volume, setVolume] = useState<number>(() => readPreference<number>("cncg-volume", 0.85));
  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    readPreference<boolean>("cncg-reduced-motion", false),
  );

  useEffect(() => {
    audio.setMasterVolume(volume);
  }, [audio, volume]);

  useEffect(() => {
    const srcs = [
      ASSETS.officeCenter,
      ASSETS.officeLeft,
      ASSETS.officeRight,
      ASSETS.menu,
      ...Object.values(ASSETS.cams),
      ASSETS.gafas,
      ASSETS.mueca,
      ASSETS.chaparro,
      ASSETS.fachero,
      ASSETS.tortolo,
      ASSETS.gafasJpg,
      ASSETS.muecaJpg,
      ASSETS.chaparroJpg,
      ASSETS.facheroJpg,
      ASSETS.tortoloJpg,
    ];
    srcs.forEach((src) => {
      const im = new Image();
      im.src = src;
    });
    [ASSETS.gafasJump, ASSETS.muecaJump, ASSETS.chaparroJump, ASSETS.facheroJump, ASSETS.tortoloJump].forEach((src) => {
      const v = document.createElement("video");
      v.preload = "auto";
      v.muted = true;
      v.playsInline = true;
      v.src = src;
    });
    const vis = () => {
      if (document.visibilityState === "visible") audio.unlock();
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      document.removeEventListener("visibilitychange", vis);
      audio.dispose();
    };
  }, [audio]);

  const unlock = () => audio.unlock();

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audio.setMuted(next);
  };
  const updateVolume = (value: number) => {
    setVolume(value);
    audio.setMasterVolume(value);
    storePreference("cncg-volume", value);
  };
  const updateReducedMotion = (value: boolean) => {
    setReducedMotion(value);
    storePreference("cncg-reduced-motion", value);
  };

  if (paper) {
    return (
      <button
        type="button"
        className="paper"
        onClick={() => {
          setPaper(false);
          unlock();
          engine.startNight(1);
        }}
      >
        <p className="paper-kicker">{NEWSPAPER.kicker}</p>
        <h1>{NEWSPAPER.headline}</h1>
        <p className="paper-body">{NEWSPAPER.body}</p>
        <span className="paper-cta">Haz clic para firmar el contrato</span>
      </button>
    );
  }

  const playing =
    snap.phase === "playing" ||
    snap.phase === "intro" ||
    snap.phase === "jumpscare" ||
    snap.phase === "gameover" ||
    snap.phase === "sixam";

  if (playing) {
    return (
      <div className={`app-root ${reducedMotion ? "reduce-motion" : ""}`} onPointerDown={unlock}>
        <PlayScreen engine={engine} snap={snap} />
      </div>
    );
  }

  if (snap.phase === "custom") {
    return (
      <div className={`menu ${reducedMotion ? "reduce-motion" : ""}`} onPointerDown={unlock}>
        <img src={ASSETS.menu} alt="" className="menu-bg" />
        <div className="menu-shade" />
        <div className="menu-panel">
          <p className="menu-kicker">Custom Night</p>
          <h1 className="menu-title">Ajusta la IA</h1>
          <p className="menu-sub">0 quieto · 20 agresivo. 20 en los cinco desbloquea una estrella.</p>
          <AiSlider
            label="Gafas — conducto izquierdo"
            value={snap.ai.gafas}
            onChange={(v) => engine.setCustomAi("gafas", v)}
          />
          <AiSlider
            label="Muecas — conducto derecho"
            value={snap.ai.muecas}
            onChange={(v) => engine.setCustomAi("muecas", v)}
          />
          <AiSlider
            label="Almirante Chaparro — 3 parpadeos"
            value={snap.ai.chaparro}
            onChange={(v) => engine.setCustomAi("chaparro", v)}
          />
          <AiSlider
            label="El Fachero — míralo  o te mata"
            value={snap.ai.fachero}
            onChange={(v) => engine.setCustomAi("fachero", v)}
          />
          <AiSlider
            label="General Tórtolo — 3 destellos"
            value={snap.ai.tortolo}
            onChange={(v) => engine.setCustomAi("tortolo", v)}
          />
          <div className="menu-row">
            <button type="button" className="menu-btn" onClick={() => engine.startNight(0, snap.ai)}>
              Empezar a las 12 AM
            </button>
            <button type="button" className="menu-btn ghost" onClick={() => engine.goMenu()}>
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`menu ${reducedMotion ? "reduce-motion" : ""}`} onPointerDown={unlock}>
      <img src={ASSETS.menu} alt="" className="menu-bg" />
      <div className="menu-shade" />
      <div className="menu-panel">
        <p className="menu-kicker">Pizzería de Gafas · Turno de noche</p>
        <h1 className="menu-title">
          Cinco Noches
          <span>con Gafas</span>
        </h1>
        <p className="menu-sub">
          Dos zonas nuevas, señuelos de audio y un generador de emergencia. Sobrevive hasta las 6 AM.
        </p>
        <Stars beaten={snap.beaten} night6={snap.night6Unlocked && snap.beaten >= 5} custom={snap.custom20} />
        <div className="menu-stack">
          <button type="button" className="menu-btn" onClick={() => setPaper(true)}>
            Nueva noche
          </button>
          <button
            type="button"
            className="menu-btn ghost"
            disabled={!snap.canContinue && snap.beaten < 1}
            onClick={() => engine.continueNight()}
          >
            Continuar
          </button>
          {snap.night6Unlocked ? (
            <button type="button" className="menu-btn ghost" onClick={() => engine.startNight(6)}>
              Noche 6
            </button>
          ) : null}
          {snap.customUnlocked ? (
            <button type="button" className="menu-btn ghost" onClick={() => engine.openCustom()}>
              Custom Night
            </button>
          ) : null}
          <button type="button" className="menu-btn ghost" onClick={() => setHelp((h) => !h)}>
            Cómo se juega
          </button>
          <button type="button" className="menu-btn ghost" onClick={toggleMute}>
            {muted ? "Activar sonido" : "Silenciar"}
          </button>
          <button type="button" className="menu-btn ghost" onClick={() => setSettings((open) => !open)}>
            {settings ? "Cerrar ajustes" : "Ajustes"}
          </button>
        </div>
        {settings ? (
          <div className="settings-panel">
            <label className="settings-control">
              <span>Volumen <strong>{Math.round(volume * 100)}%</strong></span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(event) => updateVolume(Number(event.target.value))}
              />
            </label>
            <label className="settings-check">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(event) => updateReducedMotion(event.target.checked)}
              />
              <span>Reducir parpadeos y movimiento</span>
            </label>
          </div>
        ) : null}
        {help ? (
          <ul className="help">
            <li>Gafas entra por el conducto izquierdo. Ciérrale la puerta. Muecas, por el derecho.</li>
            <li>Chaparro se queda al fondo del pasillo. Parpadea la linterna 3 veces y se va.</li>
            <li>Fachero, al entrar: míralo. Más de 5 segundos sin verlo y te mata. Si lo sostienes la mirada, se retira.</li>
            <li>Tórtolo está en alguna cámara. Tres destellos (botón Destello o F) lo calman. Si no, entra y mata.</li>
            <li>La noche dura 5 minutos. La batería baja despacio, más rápido si dejas varias cosas encendidas.</li>
            <li>CAM 10 (Cocina) y CAM 11 (Almacén) tienen señuelos: golpea ollas para alejar a Gafas o usa la campana para distraer a Muecas. Cuestan 8% de batería y tardan en recargarse.</li>
            <li>Si ocurre un apagón, mantén R durante 3 segundos. El reinicio devuelve 28% de batería y solo puede usarse una vez por noche.</li>
          </ul>
        ) : null}
        <p className="legal">
          Fan game. No afiliado a Scott Cawthon ni Steel Wool. Usa las fotos que enviaste como únicos
          “animatrónicos”.
        </p>
      </div>
    </div>
  );
}

function readPreference<T extends number | boolean>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === typeof fallback) return parsed as T;
  } catch {
    return fallback;
  }
  return fallback;
}

function storePreference(key: string, value: number | boolean) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Preferences remain active for the current session if storage is unavailable.
  }
}

function Stars({
  beaten,
  night6,
  custom,
}: {
  beaten: number;
  night6: boolean;
  custom: boolean;
}) {
  const n = Math.min(5, beaten);
  return (
    <div className="stars" aria-label={`${n} noches ganadas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? "is-on" : ""} />
      ))}
      {night6 ? <span className="is-on extra" /> : null}
      {custom ? <span className="is-on extra" /> : null}
    </div>
  );
}

function AiSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="ai-slider">
      <span>
        {label}
        <strong>{value}</strong>
      </span>
      <input
        type="range"
        min={0}
        max={20}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

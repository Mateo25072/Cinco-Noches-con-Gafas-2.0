import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { ASSETS, CAM_LIST } from "@/lib/game/config";
import type { FnafEngine } from "@/lib/game/engine";
import type { CamId, EngineSnap, ThreatId } from "@/lib/game/types";

const HOURS = ["12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM"];

const CHAR: Record<string, string> = {
  gafas: ASSETS.gafas,
  muecas: ASSETS.mueca,
  chaparro: ASSETS.chaparro,
  fachero: ASSETS.fachero,
  tortolo: ASSETS.tortolo,
};

const JUMP_VIDEO: Record<ThreatId, string> = {
  gafas: ASSETS.gafasJump,
  muecas: ASSETS.muecaJump,
  chaparro: ASSETS.chaparroJump,
  fachero: ASSETS.facheroJump,
  panic: ASSETS.gafasJump,
  tortolo: ASSETS.tortoloJump,
};

export function PlayScreen({
  engine,
  snap,
}: {
  engine: FnafEngine;
  snap: EngineSnap;
}) {
  const panRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const lookRef = useRef(0);
  const keys = useRef({ left: false, right: false });

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let emitAcc = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (typeof document !== "undefined" && document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const speed = 1.35;
      if (keys.current.left) lookRef.current = Math.max(-1, lookRef.current - speed * dt);
      if (keys.current.right) lookRef.current = Math.min(1, lookRef.current + speed * dt);
      engine.setLook(lookRef.current);
      const pct = ((lookRef.current + 1) / 2) * 66.666;
      if (stripRef.current) {
        stripRef.current.style.transform = `translate3d(-${pct}%,0,0)`;
      }
      acc += dt;
      while (acc >= 1 / 60) {
        engine.update(1 / 60);
        acc -= 1 / 60;
      }
      emitAcc += dt;
      if (emitAcc >= 1 / 20) {
        emitAcc = 0;
        engine.emit();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "KeyA" || e.code === "ArrowLeft") keys.current.left = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.current.right = true;
      if (e.code === "KeyQ") {
        e.preventDefault();
        engine.toggleDoor("L");
      }
      if (e.code === "KeyE") {
        e.preventDefault();
        engine.toggleDoor("R");
      }
      if (e.code === "KeyG" || e.code === "KeyV") {
        e.preventDefault();
        engine.toggleGrate();
      }
      if (e.code === "KeyC" || e.code === "Space") {
        e.preventDefault();
        engine.setCameras(!engine.cameras);
      }
      if (e.code === "KeyF") {
        if (engine.cameras) engine.strobeCam();
        else engine.setFlashlight(true);
      }
      if (e.code === "KeyR" && engine.powerOut) {
        e.preventDefault();
        engine.setGeneratorReset(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "KeyA" || e.code === "ArrowLeft") keys.current.left = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.current.right = false;
      if (e.code === "KeyF") engine.setFlashlight(false);
      if (e.code === "KeyR") engine.setGeneratorReset(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [engine]);

  const onPointerMove = (e: PointerEvent) => {
    if (snap.cameras) return;
    const el = panRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(1, r.width);
    const t = Math.min(1, Math.max(0, x)) * 2 - 1;
    lookRef.current = Math.sign(t) * Math.pow(Math.abs(t), 1.12);
  };

  const flashDown = () => engine.setFlashlight(true);
  const flashUp = () => engine.setFlashlight(false);
  const fx = 50 + snap.look * 32;
  const beam = snap.flashlight && snap.flicker < 0.5;
  const darkOff = snap.cameras || !beam || snap.powerOut;

  return (
    <div className="game-stage">
      <div
        ref={panRef}
        className="office-pan"
        onPointerMove={onPointerMove}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("[data-ui]")) return;
          flashDown();
        }}
        onPointerUp={flashUp}
        onPointerLeave={flashUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div ref={stripRef} className="office-strip">
          <OfficePanel src={ASSETS.officeLeft}>
            {snap.gafas === "mouth" && !snap.doorL && !snap.grate ? (
              <Face who="gafas" className="face-vent face-vent-l" />
            ) : null}
            {snap.powerOut ? (
              <div className="generator-reset" data-ui>
                {snap.generatorResetUsed ? (
                  <p>Generador agotado. No queda otro reinicio.</p>
                ) : (
                  <>
                    <p>Apagón: mantén R o el botón 3 segundos para reiniciar el generador.</p>
                    <div className="reset-track">
                      <div style={{ width: `${(snap.generatorResetProgress / 3) * 100}%` }} />
                    </div>
                    <button
                      type="button"
                      className="act"
                      onPointerDown={() => engine.setGeneratorReset(true)}
                      onPointerUp={() => engine.setGeneratorReset(false)}
                      onPointerLeave={() => engine.setGeneratorReset(false)}
                      onPointerCancel={() => engine.setGeneratorReset(false)}
                    >
                      Mantener para reiniciar
                    </button>
                  </>
                )}
              </div>
            ) : null}
            {snap.doorL ? <div className="door-shut" /> : null}
            {snap.grate ? <div className="grate-shut" /> : null}
          </OfficePanel>
          <OfficePanel src={ASSETS.officeCenter}>
            {snap.chaparro === "hall" ? (
              snap.flashlight && Math.abs(snap.look) < 0.5 ? (
                <Face who="chaparro" className="face-hall" />
              ) : (
                <Eyes />
              )
            ) : null}
            {snap.fachero === "office" ? <Face who="fachero" className="face-office" /> : null}
          </OfficePanel>
          <OfficePanel src={ASSETS.officeRight}>
            {snap.muecas === "mouth" && !snap.doorR ? (
              <Face who="muecas" className="face-vent face-vent-r" />
            ) : null}
            {snap.doorR ? <div className="door-shut" /> : null}
          </OfficePanel>
        </div>

        <div
          className={`office-dark ${darkOff ? "is-off" : "is-on"}`}
          style={{ ["--fx" as string]: `${fx}%` }}
        />
        <div className="scanlines" />
        {snap.staticAmt > 0.08 && !snap.cameras ? (
          <div className="static-wash" style={{ opacity: Math.min(0.45, snap.staticAmt * 0.4) }} />
        ) : null}
        {snap.flicker > 0.04 ? (
          <div className="light-flicker" style={{ opacity: Math.min(0.92, snap.flicker) }} />
        ) : null}
        {snap.panic > 0.2 ? (
          <div className="panic-veil" style={{ opacity: (snap.panic - 0.2) * 0.7 }} />
        ) : null}
        {snap.blinded > 0 ? (
          <div className="blind-flash" style={{ opacity: Math.min(1, snap.blinded) }} />
        ) : null}
        {snap.powerOut ? <div className="power-black" /> : null}

        {snap.cameras ? <CameraTablet engine={engine} snap={snap} /> : null}
      </div>

      <Hud engine={engine} snap={snap} flashDown={flashDown} flashUp={flashUp} />

      {snap.phase === "jumpscare" && snap.jumpscare ? (
        <Jumpscare who={snap.jumpscare} engine={engine} />
      ) : null}
      {snap.phase === "gameover" ? (
        <EndCard title="GAME OVER" action="Menú" onAction={() => engine.goMenu()} />
      ) : null}
      {snap.phase === "sixam" ? (
        <EndCard
          title="6 AM"
          subtitle={snap.night === 0 ? "Turno custom sobrevivido" : `Noche ${snap.night} completada`}
          action={snap.night >= 1 && snap.night < 6 ? "Siguiente noche" : "Menú"}
          onAction={() => {
            if (snap.night >= 1 && snap.night < 6) engine.startNight(snap.night + 1);
            else engine.goMenu();
          }}
        />
      ) : null}
      {snap.phase === "intro" ? (
        <div className="intro-card">
          <p className="intro-kicker">{snap.night === 0 ? "Custom Night" : `Noche ${snap.night}`}</p>
          <p className="intro-hour">12 AM</p>
        </div>
      ) : null}
    </div>
  );
}

function OfficePanel({ src, children }: { src: string; children?: ReactNode }) {
  return (
    <div className="office-panel">
      <img src={src} alt="" draggable={false} />
      {children}
    </div>
  );
}

function Face({ who, className }: { who: keyof typeof CHAR; className: string }) {
  return <img src={CHAR[who]} alt="" className={`face ${className}`} draggable={false} />;
}

function Eyes() {
  return (
    <div className="eyes" aria-hidden="true">
      <span />
      <span />
    </div>
  );
}

function CameraTablet({ engine, snap }: { engine: FnafEngine; snap: EngineSnap }) {
  const src = ASSETS.cams[snap.camId];
  const cam = CAM_LIST.find((c) => c.id === snap.camId);
  const gafasHere =
    (snap.camId === "stage" && snap.gafas === "stage") ||
    (snap.camId === "party" && snap.gafas === "party") ||
    (snap.camId === "ventL" && (snap.gafas === "ventL" || snap.gafas === "mouth"));
  const muecasHere =
    (snap.camId === "games" && snap.muecas === "games") ||
    (snap.camId === "storage" && snap.muecas === "storage") ||
    (snap.camId === "cove" && snap.muecas === "cove") ||
    (snap.camId === "ventR" && (snap.muecas === "ventR" || snap.muecas === "mouth"));
  const gafasKitchen = snap.camId === "kitchen" && snap.gafas === "kitchen";
  const chapHere = snap.camId === "hall" && snap.chaparro === "hall";
  const fachHere =
    (snap.camId === "parts" && snap.fachero === "parts") ||
    (snap.camId === "games" && snap.fachero === "games") ||
    (snap.camId === "hall" && snap.fachero === "hall");
  const tortoloHere = snap.tortolo !== "calm" && snap.camId === snap.tortolo;

  return (
    <div className="tablet" data-ui>
      <div className="tablet-bezel">
        <div className={`tablet-feed ${snap.camId === "ventL" || snap.camId === "ventR" ? "nv" : ""}`}>
          <img src={src} alt="" draggable={false} />
          {gafasHere ? <Face who="gafas" className="face-cam" /> : null}
          {gafasKitchen ? <Face who="gafas" className="face-cam" /> : null}
          {muecasHere ? <Face who="muecas" className="face-cam" /> : null}
          {chapHere ? <Face who="chaparro" className="face-cam face-hall-cam" /> : null}
          {fachHere ? <Face who="fachero" className="face-cam" /> : null}
          {tortoloHere ? <Face who="tortolo" className="face-cam" /> : null}
          <div className="tablet-scan" />
          <div className="tablet-static" style={{ opacity: 0.28 + snap.staticAmt * 0.72 }} />
          {snap.staticAmt > 0.42 ? (
            <div className="cam-tear" style={{ top: `${18 + (snap.staticAmt * 57) % 62}%` }} />
          ) : null}
          <div className="tablet-meta">
            <span className="rec">REC</span>
            <span>
              CAM {cam?.num} {cam?.name}
              {tortoloHere ? ` · Tórtolo ${snap.tortoloFlashes}/3` : ""}
            </span>
          </div>
          <button type="button" className="wind-btn" onClick={() => engine.strobeCam()}>
            Destello
          </button>
          {snap.camId === "kitchen" || snap.camId === "storage" ? (
            <button
              type="button"
              className="lure-btn"
              disabled={snap.lureCooldown > 0 || snap.battery <= 0.08}
              onClick={() => engine.soundLure()}
            >
              {snap.lureCooldown > 0
                ? `Señuelo ${Math.ceil(snap.lureCooldown)}s`
                : snap.camId === "kitchen"
                  ? "Golpear ollas · 8% batería"
                  : "Campana · 8% batería"}
            </button>
          ) : null}
        </div>
        <div className="cam-map">
          {CAM_LIST.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`cam-btn ${snap.camId === c.id ? "is-on" : ""} ${snap.tortolo === c.id ? "is-warn" : ""}`}
              onClick={() => engine.setCam(c.id as CamId)}
            >
              <span className="cam-num">{c.num}</span>
              <span>{c.name}</span>
            </button>
          ))}
          <button type="button" className="cam-close" onClick={() => engine.setCameras(false)}>
            Bajar tablet
          </button>
        </div>
      </div>
    </div>
  );
}

function Hud({
  engine,
  snap,
  flashDown,
  flashUp,
}: {
  engine: FnafEngine;
  snap: EngineSnap;
  flashDown: () => void;
  flashUp: () => void;
}) {
  const hour = HOURS[Math.min(6, snap.hour)] ?? "12 AM";
  const lookingL = snap.look < -0.35;
  const lookingR = snap.look > 0.35;
  return (
    <div className="hud" data-ui>
      <div className="hud-top">
        <div className="hud-clock">
          <span className="hud-night">{snap.night === 0 ? "Custom" : `Noche ${snap.night}`}</span>
          <span className="hud-hour">{hour}</span>
        </div>
        <div className="meters">
          <Meter
            label={snap.drain > 0.001 ? `Batería · ${(snap.drain * 100).toFixed(1)}%/s` : "Batería"}
            value={snap.battery}
            danger={snap.battery < 0.22}
          />
          <Meter label="Pánico" value={snap.panic} danger={snap.panic > 0.55} invert />
        </div>
      </div>

      {snap.phoneOn ? (
        <div className="phone">
          <p>Teléfono — línea {snap.phoneLine + 1}</p>
          <button type="button" onClick={() => engine.skipPhone()}>
            Colgar
          </button>
        </div>
      ) : null}

      <div className="alert-stack">
        {snap.gafas === "mouth" ? <p className="warn-flash">Gafas en el conducto izquierdo — cierra la puerta</p> : null}
        {snap.muecas === "mouth" ? <p className="warn-flash">Muecas en el conducto derecho — cierra la puerta</p> : null}
        {snap.chaparro === "hall" ? (
          <p className="scream-hint">Chaparro al fondo — parpadea la linterna {snap.chapFlashes}/3</p>
        ) : null}
        {snap.fachero === "office" ? (
          <p className="warn-flash">Fachero dentro — míralo ({Math.max(0, 5 - snap.fachLook).toFixed(1)}s)</p>
        ) : null}
        {snap.tortolo !== "calm" ? (
          <p className="scream-hint">Tórtolo en las cámaras — destello {snap.tortoloFlashes}/3</p>
        ) : null}
      </div>

      <div className="hud-bottom hud-bottom-5">
        <button
          type="button"
          className={`act ${snap.doorL ? "is-on" : ""} ${lookingL ? "is-focus" : ""}`}
          disabled={snap.powerOut || snap.cameras}
          onClick={() => engine.toggleDoor("L")}
        >
          Puerta I
        </button>
        <button
          type="button"
          className={`act ${snap.grate ? "is-on" : ""} ${lookingL ? "is-focus" : ""}`}
          disabled={snap.powerOut || snap.cameras}
          onClick={() => engine.toggleGrate()}
        >
          Rejilla
        </button>
        <button
          type="button"
          className={`act act-hold ${snap.flashlight ? "is-on" : ""}`}
          disabled={snap.powerOut || snap.cameras}
          onPointerDown={flashDown}
          onPointerUp={flashUp}
          onPointerLeave={flashUp}
        >
          Linterna
        </button>
        <button
          type="button"
          className={`act ${snap.cameras ? "is-on" : ""}`}
          disabled={snap.powerOut}
          onClick={() => engine.setCameras(!snap.cameras)}
        >
          Cámaras
        </button>
        <button
          type="button"
          className={`act ${snap.doorR ? "is-on" : ""} ${lookingR ? "is-focus" : ""}`}
          disabled={snap.powerOut || snap.cameras}
          onClick={() => engine.toggleDoor("R")}
        >
          Puerta D
        </button>
      </div>
      <p className="hud-hint">Q / E puertas · F parpadea · C cámaras · en el monitor, F o Destello</p>
    </div>
  );
}

function Meter({
  label,
  value,
  danger,
  invert,
}: {
  label: string;
  value: number;
  danger?: boolean;
  invert?: boolean;
}) {
  return (
    <div className={`music-meter ${danger ? "is-low" : ""}`}>
      <span>{label}</span>
      <div className="music-track">
        <div
          className={`music-fill ${invert ? "is-panic" : ""}`}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  );
}

function Jumpscare({ who, engine }: { who: ThreatId; engine: FnafEngine }) {
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (hold.current) clearTimeout(hold.current);
    },
    [],
  );
  const finishSoon = (ms: number) => {
    if (hold.current) clearTimeout(hold.current);
    hold.current = setTimeout(() => engine.finishJumpscare(), ms);
  };
  return (
    <div className="jumpscare">
      <video
        src={JUMP_VIDEO[who]}
        autoPlay
        muted
        playsInline
        onEnded={() => finishSoon(500)}
        onError={() => finishSoon(1200)}
      />
    </div>
  );
}

function EndCard({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle?: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="end-card">
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
      <button type="button" className="menu-btn" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FnafEngine } from "./engine.ts";
import type { GameAudio } from "./audio.ts";

function makeEngine() {
  const audio = {
    unlock() {},
    startAmbient() {},
    stopAmbient() {},
    stopPhone() {},
    stopMusicBox() {},
    speak() {},
    setThreatLevel() {},
    lureKitchen() {},
    lureStorage() {},
    generatorRestart() {},
    camStatic() {},
    click() {},
    footsteps() {},
    burstStatic() {},
    setScreamLoop() {},
    powerDown() {},
    vent() {},
    door() {},
    grate() {},
    tablet() {},
    sixAm() {},
    scream() {},
  } as unknown as GameAudio;
  const engine = new FnafEngine(audio);
  engine.phase = "playing";
  engine.ai = { gafas: 0, muecas: 0, chaparro: 0, fachero: 0, tortolo: 0 };
  return engine;
}

describe("new night systems", () => {
  it("uses the kitchen lure to push Gafas back and applies its cost and cooldown", () => {
    const engine = makeEngine();
    engine.cameras = true;
    engine.camId = "kitchen";
    engine.gafas = "kitchen";
    engine.battery = 0.5;

    engine.soundLure();

    assert.equal(engine.gafas, "party");
    assert.equal(engine.battery, 0.42);
    assert.equal(engine.lureCooldown, 18);
    engine.soundLure();
    assert.equal(engine.battery, 0.42);
  });

  it("does not waste a lure on an unrelated camera", () => {
    const engine = makeEngine();
    engine.cameras = true;
    engine.camId = "hall";
    engine.battery = 0.5;

    engine.soundLure();

    assert.equal(engine.battery, 0.5);
    assert.equal(engine.lureCooldown, 0);
  });

  it("restores the generator after a complete three-second hold, once", () => {
    const engine = makeEngine();
    engine.powerOut = true;
    engine.setGeneratorReset(true);

    for (let i = 0; i < 30; i += 1) engine.update(0.1);

    assert.equal(engine.powerOut, false);
    assert.equal(engine.battery, 0.38);
    assert.equal(engine.generatorResetUsed, true);
    engine.powerOut = true;
    engine.setGeneratorReset(true);
    assert.equal(engine.generatorResetProgress, 0);
  });
});

describe("anti-overlap and team AI", () => {
  it("keeps dual mouth from stacking on night 3", () => {
    const engine = makeEngine();
    engine.night = 3;
    engine.phase = "playing";
    engine.ai = { gafas: 20, muecas: 20, chaparro: 0, fachero: 0, tortolo: 0 };
    engine.gafas = "mouth";
    engine.ventTimer = 0;
    engine.staggerLock = 0;
    engine.muecas = "ventR";
    engine.muecasIn = 0;
    for (let i = 0; i < 80; i++) {
      engine.muecasIn = 0;
      engine.update(0.05);
      if ((engine.phase as string) !== "playing") break;
    }
    assert.notEqual(engine.muecas, "mouth");
  });

  it("caps concurrent urgent threats at two", () => {
    const engine = makeEngine();
    engine.night = 5;
    engine.phase = "playing";
    engine.ai = { gafas: 20, muecas: 20, chaparro: 20, fachero: 0, tortolo: 0 };
    engine.gafas = "mouth";
    engine.muecas = "mouth";
    engine.staggerLock = 0;
    engine.chaparro = "away";
    for (let i = 0; i < 60; i++) {
      engine.chapIn = 0;
      engine.update(0.05);
      if ((engine.phase as string) !== "playing") break;
    }
    assert.notEqual(engine.chaparro, "hall");
  });

  it("applies stagger after chaparro enters the hall", () => {
    const engine = makeEngine();
    engine.night = 3;
    engine.phase = "playing";
    engine.ai = { gafas: 0, muecas: 0, chaparro: 20, fachero: 0, tortolo: 0 };
    engine.staggerLock = 0;
    for (let i = 0; i < 80; i++) {
      engine.chapIn = 0;
      engine.update(0.05);
      if (engine.chaparro === "hall") break;
    }
    assert.equal(engine.chaparro, "hall");
    assert.ok(engine.staggerLock > 0);
  });

  it("runs a short night simulation without throwing", () => {
    const engine = makeEngine();
    engine.startNight(3);
    engine.phase = "playing";
    engine.phoneOn = false;
    for (let i = 0; i < 600; i++) {
      engine.update(0.1);
      const phase = engine.phase as string;
      if (phase === "jumpscare" || phase === "sixam" || phase === "gameover") break;
    }
    assert.ok(["playing", "jumpscare", "sixam", "gameover"].includes(engine.phase as string));
  });
});

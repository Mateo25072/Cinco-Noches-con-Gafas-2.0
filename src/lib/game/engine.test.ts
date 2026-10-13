import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FnafEngine } from "./engine.ts";
import type { GameAudio } from "./audio.ts";

function makeEngine() {
  const audio = {
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
    assert.equal(engine.battery, 0.28);
    assert.equal(engine.generatorResetUsed, true);
    engine.powerOut = true;
    engine.setGeneratorReset(true);
    assert.equal(engine.generatorResetProgress, 0);
  });
});

/**
 * Adversarial Stress Testing Suite for Beat3DHighway Rhythm Game
 *
 * Covers:
 * 1. Hit window boundary conditions (80ms vs 81ms, 160ms vs 161ms, IEEE 754 precision).
 * 2. High-frequency lane switching (rapid deterministic toggling & concurrent bursts).
 * 3. Audio time ticking & auto-miss with 50+ tiles (single-tick, frame skips, GC stress).
 * 4. Multiplier scaling staircase and reset on miss.
 * 5. React 19 Strict Mode double-mount / stop-restart audio engine resilience.
 */

import { register } from 'node:module';
try {
  register('./loader.mjs', import.meta.url);
} catch (_e) {}

import {
  useRhythmGameStore,
  HIT_WINDOW_PERFECT,
  HIT_WINDOW_GOOD,
  calculateMultiplier
} from '../src/store/useRhythmGameStore.ts';

// Web Audio API & DOM Mock Environment for Node.js
globalThis.window = globalThis;
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};
window.addEventListener = () => {};
window.removeEventListener = () => {};
window.speechSynthesis = {
  cancel: () => {},
  speak: () => {}
};

class MockAudioParam {
  constructor(initial = 1) {
    this.value = initial;
  }
  setValueAtTime(val, _time) {
    this.value = val;
  }
  exponentialRampToValueAtTime(val, _time) {
    this.value = val;
  }
  cancelScheduledValues(_time) {}
}

class MockGainNode {
  constructor() {
    this.gain = new MockAudioParam(1);
    this.connected = true;
  }
  connect(_dest) {
    this.connected = true;
  }
  disconnect() {
    this.connected = false;
  }
}

class MockOscillatorNode {
  constructor() {
    this.type = 'sine';
    this.frequency = new MockAudioParam(440);
    this.started = false;
    this.stopped = false;
  }
  connect() {}
  disconnect() {}
  start(_time) {
    this.started = true;
  }
  stop(_time) {
    this.stopped = true;
  }
}

class MockBiquadFilterNode {
  constructor() {
    this.type = 'lowpass';
    this.frequency = new MockAudioParam(1000);
    this.Q = new MockAudioParam(1);
  }
  connect() {}
  disconnect() {}
}

class MockAudioBufferSourceNode {
  constructor() {
    this.buffer = null;
    this.started = false;
    this.stopped = false;
  }
  connect() {}
  disconnect() {}
  start(_time) {
    this.started = true;
  }
  stop(_time) {
    this.stopped = true;
  }
}

class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = {};
    this.activeNodes = 0;
  }
  createGain() {
    this.activeNodes++;
    return new MockGainNode();
  }
  createOscillator() {
    this.activeNodes++;
    return new MockOscillatorNode();
  }
  createBuffer(channels, length, sampleRate) {
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData: () => new Float32Array(length)
    };
  }
  createBufferSource() {
    this.activeNodes++;
    return new MockAudioBufferSourceNode();
  }
  createBiquadFilter() {
    this.activeNodes++;
    return new MockBiquadFilterNode();
  }
  async resume() {
    this.state = 'running';
  }
  async close() {
    this.state = 'closed';
  }
}

window.AudioContext = MockAudioContext;

const { RhythmAudioEngine } = await import('../src/services/rhythmAudioEngine.ts');

// Test Assertion Helpers
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  findings: []
};

function assert(condition, message, metadata = {}) {
  results.total++;
  if (condition) {
    results.passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    results.failed++;
    console.error(`  [FAIL] ${message}`);
    results.findings.push({ message, metadata });
  }
}

console.log('================================================================');
console.log('ADVERSARIAL STRESS TEST SUITE: BEAT 3D HIGHWAY');
console.log('================================================================\n');

// ----------------------------------------------------------------
// SUITE 1: Hit Window Boundary Conditions
// ----------------------------------------------------------------
console.log('--- SUITE 1: Hit Window Boundary Conditions (80ms vs 81ms, 160ms vs 161ms) ---');

function resetStoreWithTiles(tiles) {
  useRhythmGameStore.setState({
    score: 0,
    combo: 0,
    maxCombo: 0,
    streak: 0,
    multiplier: 1,
    accuracy: 100,
    totalHits: 0,
    perfectHits: 0,
    goodHits: 0,
    missHits: 0,
    selectedLane: 0,
    activeTiles: tiles,
    currentAudioTime: 0,
    isPlaying: true,
    isPaused: false,
    hitFeedback: null
  });
}

// 1.1 Exact Center Hit (0ms diff)
{
  resetStoreWithTiles([
    { id: 't1', targetTime: 5.0, germanText: 'eins', correctLane: 0, resolved: false }
  ]);
  useRhythmGameStore.setState({ currentAudioTime: 5.0 });
  const res = useRhythmGameStore.getState().evaluateTileHit(0);
  assert(res !== null && res.accuracy === 'perfect', '1.1 Exact center hit (0ms diff) evaluates to PERFECT');
}

// 1.2 Perfect Window Boundary Check (79ms, 80ms, 81ms)
{
  // 79ms late
  resetStoreWithTiles([
    { id: 't-79', targetTime: 5.0, germanText: 'zwei', correctLane: 0, resolved: false }
  ]);
  useRhythmGameStore.setState({ currentAudioTime: 5.079 });
  let res = useRhythmGameStore.getState().evaluateTileHit(0);
  assert(res !== null && res.accuracy === 'perfect', '1.2a 79ms diff evaluates to PERFECT');

  // 80ms late (Exact Perfect Boundary)
  resetStoreWithTiles([
    { id: 't-80', targetTime: 5.0, germanText: 'drei', correctLane: 0, resolved: false }
  ]);
  useRhythmGameStore.setState({ currentAudioTime: 5.080 });
  res = useRhythmGameStore.getState().evaluateTileHit(0);
  const diff80 = Math.abs(5.080 - 5.0);
  assert(
    res !== null && res.accuracy === 'perfect',
    `1.2b Exact 80ms boundary (5.080 - 5.0 = ${diff80}) evaluates to PERFECT`,
    { diff: diff80, actual: res?.accuracy, note: 'May fail if floating point epsilon pushes diff > 0.080' }
  );

  // 81ms late (1ms past Perfect Boundary -> Should be GOOD)
  resetStoreWithTiles([
    { id: 't-81', targetTime: 5.0, germanText: 'vier', correctLane: 0, resolved: false }
  ]);
  useRhythmGameStore.setState({ currentAudioTime: 5.081 });
  res = useRhythmGameStore.getState().evaluateTileHit(0);
  assert(res !== null && res.accuracy === 'good', '1.2c 81ms diff evaluates to GOOD');

  // 79ms early
  resetStoreWithTiles([
    { id: 't-e79', targetTime: 5.0, germanText: 'fuenf', correctLane: 0, resolved: false }
  ]);
  useRhythmGameStore.setState({ currentAudioTime: 4.921 });
  res = useRhythmGameStore.getState().evaluateTileHit(0);
  assert(res !== null && res.accuracy === 'perfect', '1.2d Early 79ms diff evaluates to PERFECT');

  // 80ms early
  resetStoreWithTiles([
    { id: 't-e80', targetTime: 5.0, germanText: 'sechs', correctLane: 0, resolved: false }
  ]);
  useRhythmGameStore.setState({ currentAudioTime: 4.920 });
  res = useRhythmGameStore.getState().evaluateTileHit(0);
  assert(res !== null && res.accuracy === 'perfect', '1.2e Early 80ms diff evaluates to PERFECT');

  // 81ms early
  resetStoreWithTiles([
    { id: 't-e81', targetTime: 5.0, germanText: 'sieben', correctLane: 0, resolved: false }
  ]);
  useRhythmGameStore.setState({ currentAudioTime: 4.919 });
  res = useRhythmGameStore.getState().evaluateTileHit(0);
  assert(res !== null && res.accuracy === 'good', '1.2f Early 81ms diff evaluates to GOOD');
}

// 1.3 Good Window Boundary Check (159ms, 160ms, 161ms)
{
  // 159ms late
  resetStoreWithTiles([
    { id: 't-159', targetTime: 5.0, germanText: 'acht', correctLane: 0, resolved: false }
  ]);
  useRhythmGameStore.setState({ currentAudioTime: 5.159 });
  let res = useRhythmGameStore.getState().evaluateTileHit(0);
  assert(res !== null && res.accuracy === 'good', '1.3a 159ms diff evaluates to GOOD');

  // 160ms late (Exact Good Boundary)
  resetStoreWithTiles([
    { id: 't-160', targetTime: 5.0, germanText: 'neun', correctLane: 0, resolved: false }
  ]);
  useRhythmGameStore.setState({ currentAudioTime: 5.160 });
  res = useRhythmGameStore.getState().evaluateTileHit(0);
  const diff160 = Math.abs(5.160 - 5.0);
  assert(
    res !== null && res.accuracy === 'good',
    `1.3b Exact 160ms boundary (5.160 - 5.0 = ${diff160}) evaluates to GOOD`,
    { diff: diff160, actual: res?.accuracy, note: 'May fail if floating point epsilon pushes diff > 0.160' }
  );

  // 161ms late (Outside Good Window -> Should return null / ignored)
  resetStoreWithTiles([
    { id: 't-161', targetTime: 5.0, germanText: 'zehn', correctLane: 0, resolved: false }
  ]);
  useRhythmGameStore.setState({ currentAudioTime: 5.161 });
  res = useRhythmGameStore.getState().evaluateTileHit(0);
  assert(res === null, '1.3c 161ms diff evaluates to null (outside Good window)');

  // 159ms early
  resetStoreWithTiles([
    { id: 't-e159', targetTime: 5.0, germanText: 'elf', correctLane: 0, resolved: false }
  ]);
  useRhythmGameStore.setState({ currentAudioTime: 4.841 });
  res = useRhythmGameStore.getState().evaluateTileHit(0);
  assert(res !== null && res.accuracy === 'good', '1.3d Early 159ms diff evaluates to GOOD');

  // 160ms early
  resetStoreWithTiles([
    { id: 't-e160', targetTime: 5.0, germanText: 'zwoelf', correctLane: 0, resolved: false }
  ]);
  useRhythmGameStore.setState({ currentAudioTime: 4.840 });
  res = useRhythmGameStore.getState().evaluateTileHit(0);
  assert(res !== null && res.accuracy === 'good', '1.3e Early 160ms diff evaluates to GOOD');

  // 161ms early
  resetStoreWithTiles([
    { id: 't-e161', targetTime: 5.0, germanText: 'dreizehn', correctLane: 0, resolved: false }
  ]);
  useRhythmGameStore.setState({ currentAudioTime: 4.839 });
  res = useRhythmGameStore.getState().evaluateTileHit(0);
  assert(res === null, '1.3f Early 161ms diff evaluates to null (outside Good window)');
}

// 1.4 Wrong Lane Strike Evaluation
{
  resetStoreWithTiles([
    { id: 't-wrong', targetTime: 10.0, germanText: 'vierzehn', correctLane: 0, resolved: false }
  ]);
  useRhythmGameStore.setState({ currentAudioTime: 10.0, combo: 5, streak: 5 });
  const res = useRhythmGameStore.getState().evaluateTileHit(1); // Striking lane 1 when correctLane is 0
  const state = useRhythmGameStore.getState();
  assert(res !== null && res.accuracy === 'miss', '1.4a Striking wrong lane evaluates to MISS');
  assert(state.combo === 0 && state.streak === 0, '1.4b Striking wrong lane resets combo and streak to 0');
  assert(state.missHits === 1, '1.4c Striking wrong lane increments missHits');
}

// 1.5 Multi-Tile Lane Contention Stress
{
  // Tile A in lane 0 at 5.00s, Tile B in lane 1 at 5.04s.
  // Player is in lane 1 at time 5.01s (diff to A is 10ms, diff to B is 30ms).
  resetStoreWithTiles([
    { id: 't-lane0', targetTime: 5.00, germanText: 'A', correctLane: 0, resolved: false },
    { id: 't-lane1', targetTime: 5.04, germanText: 'B', correctLane: 1, resolved: false }
  ]);
  useRhythmGameStore.setState({ currentAudioTime: 5.01 });
  const res = useRhythmGameStore.getState().evaluateTileHit(1);
  // Observation: In current code, candidate is chosen strictly by min diff across ALL unresolved tiles.
  // Tile A has diff 0.01s < Tile B diff 0.03s, so candidate = Tile A.
  // Since player is in lane 1, Tile A is judged 'miss'!
  console.log(`    [INFO] Multi-tile lane contention result: tileId=${res?.tile.id}, accuracy=${res?.accuracy}`);
  assert(res !== null, '1.5 Multi-tile lane contention returns evaluation result');
}

console.log('\n----------------------------------------------------------------');
// ----------------------------------------------------------------
// SUITE 2: High-Frequency Lane Switching
// ----------------------------------------------------------------
console.log('--- SUITE 2: High-Frequency Lane Switching ---');

// 2.1 10,000 Synchronous Lane Toggles
{
  useRhythmGameStore.setState({ selectedLane: 0 });
  const iterations = 10000;
  for (let i = 0; i < iterations; i++) {
    useRhythmGameStore.getState().switchLane();
  }
  const endLane = useRhythmGameStore.getState().selectedLane;
  assert(endLane === 0, `2.1 10,000 lane switches end strictly at lane 0 (actual: ${endLane})`);
}

// 2.2 1,000 Asynchronous Concurrent Burst Switches
{
  useRhythmGameStore.setState({ selectedLane: 0 });
  const promises = [];
  for (let i = 0; i < 1000; i++) {
    promises.push(
      new Promise((resolve) => {
        const lane = (i % 2);
        useRhythmGameStore.getState().setLane(lane);
        resolve();
      })
    );
  }
  await Promise.all(promises);
  const lane = useRhythmGameStore.getState().selectedLane;
  assert(lane === 0 || lane === 1, `2.2 Concurrent lane bursts maintain invariant selectedLane in {0,1} (actual: ${lane})`);
}

// 2.3 Rapid Interleaved Steer & Strike Cycle (1,000 cycles)
{
  const tiles = Array.from({ length: 1000 }, (_, i) => ({
    id: `burst-${i}`,
    targetTime: i * 0.5,
    germanText: `w-${i}`,
    correctLane: (i % 2),
    resolved: false
  }));
  resetStoreWithTiles(tiles);

  for (let i = 0; i < 1000; i++) {
    const lane = (i % 2);
    useRhythmGameStore.getState().setLane(lane);
    useRhythmGameStore.setState({ currentAudioTime: i * 0.5 });
    useRhythmGameStore.getState().evaluateTileHit(lane);
  }

  const finalState = useRhythmGameStore.getState();
  assert(finalState.combo === 1000, `2.3 1,000 interleaved steer-and-strike actions reach combo 1000 (actual: ${finalState.combo})`);
  assert(finalState.perfectHits === 1000, `2.3 All 1,000 interleaved actions scored PERFECT`);
}

console.log('\n----------------------------------------------------------------');
// ----------------------------------------------------------------
// SUITE 3: Audio Time Ticking & Auto-Miss with 50+ Tiles
// ----------------------------------------------------------------
console.log('--- SUITE 3: Audio Time Ticking & Auto-Miss with 50+ Tiles ---');

// 3.1 60 Tiles Sequential Audio Ticking (60 FPS simulation)
{
  const tileCount = 60;
  const tiles = Array.from({ length: tileCount }, (_, i) => ({
    id: `tick-tile-${i}`,
    targetTime: (i + 1) * 1.0, // 1s, 2s, ..., 60s
    germanText: `wort-${i}`,
    correctLane: (i % 2),
    resolved: false
  }));

  resetStoreWithTiles(tiles);
  useRhythmGameStore.setState({ combo: 10, streak: 10, multiplier: 3 });

  // Simulate 60 FPS audio time ticking from 0s to 65s at dt = 16.6ms
  const dt = 1 / 60;
  let simulatedTime = 0;
  let autoMissEvents = 0;

  let lastMissHits = 0;
  while (simulatedTime <= 62.0) {
    simulatedTime += dt;
    useRhythmGameStore.getState().tickAudioTime(simulatedTime);
    const currMiss = useRhythmGameStore.getState().missHits;
    if (currMiss > lastMissHits) {
      autoMissEvents += (currMiss - lastMissHits);
      lastMissHits = currMiss;
    }
  }

  const finalState = useRhythmGameStore.getState();
  assert(finalState.missHits === 60, `3.1a Exactly 60 tiles auto-missed sequentially (actual: ${finalState.missHits})`);
  assert(finalState.combo === 0, `3.1b Combo reset to 0 upon auto-miss (actual: ${finalState.combo})`);
  assert(finalState.streak === 0, `3.1c Streak reset to 0 upon auto-miss (actual: ${finalState.streak})`);
  assert(finalState.multiplier === 1, `3.1d Multiplier reset to 1 upon auto-miss (actual: ${finalState.multiplier})`);
  assert(finalState.accuracy === 0, `3.1e Accuracy is 0% when all tiles missed (actual: ${finalState.accuracy}%)`);
  assert(
    finalState.activeTiles.every((t) => t.resolved && t.hitAccuracy === 'miss'),
    '3.1f All 60 tiles strictly marked resolved:true with hitAccuracy:miss'
  );
}

// 3.2 Large Frame Delta / Tab Sleep Jump (30 tiles skipped in single tick)
{
  const tiles = Array.from({ length: 50 }, (_, i) => ({
    id: `jump-tile-${i}`,
    targetTime: (i + 1) * 1.0,
    germanText: `j-${i}`,
    correctLane: (i % 2),
    resolved: false
  }));

  resetStoreWithTiles(tiles);
  // Direct jump from 0 to 25.5s (should resolve tiles 1..25)
  useRhythmGameStore.getState().tickAudioTime(25.5);
  const stateAfterJump = useRhythmGameStore.getState();

  assert(stateAfterJump.missHits === 25, `3.2a Sudden time jump auto-misses exactly 25 passed tiles in 1 tick (actual: ${stateAfterJump.missHits})`);
  assert(stateAfterJump.totalHits === 25, `3.2b Total hits equals 25`);
  const remainingUnresolved = stateAfterJump.activeTiles.filter((t) => !t.resolved).length;
  assert(remainingUnresolved === 25, `3.2c Exactly 25 future tiles remain unresolved`);
}

// 3.3 Subsequent Ticks Invariance (No Duplicate Counting)
{
  const curMiss = useRhythmGameStore.getState().missHits;
  // Tick further in time where no new notes pass (25.5s -> 25.8s)
  useRhythmGameStore.getState().tickAudioTime(25.6);
  useRhythmGameStore.getState().tickAudioTime(25.7);
  useRhythmGameStore.getState().tickAudioTime(25.8);
  const missHitsAfterTicks = useRhythmGameStore.getState().missHits;
  assert(curMiss === missHitsAfterTicks, `3.3 Subsequent ticks without new passed tiles do not double-count misses (${curMiss} === ${missHitsAfterTicks})`);
}

// 3.4 GC & Performance Profiling on 10,000 tickAudioTime calls
{
  const tiles = Array.from({ length: 60 }, (_, i) => ({
    id: `perf-tile-${i}`,
    targetTime: (i + 1) * 1.0,
    germanText: `perf-${i}`,
    correctLane: 0,
    resolved: false
  }));
  resetStoreWithTiles(tiles);

  const startMem = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  // Run 10,000 frame ticks between 0.1s and 0.9s (where no tiles expire)
  for (let i = 0; i < 10000; i++) {
    useRhythmGameStore.getState().tickAudioTime(0.5);
  }

  const durationMs = performance.now() - startTime;
  const endMem = process.memoryUsage().heapUsed;
  const memDiffMB = (endMem - startMem) / (1024 * 1024);

  console.log(`    [PERF] 10,000 ticks took ${durationMs.toFixed(2)}ms (${(durationMs / 10000).toFixed(4)}ms/tick). Heap delta: ${memDiffMB.toFixed(2)}MB`);
  assert(durationMs < 1000, `3.4 10,000 ticks complete in under 1000ms (actual: ${durationMs.toFixed(2)}ms)`);
}

console.log('\n----------------------------------------------------------------');
// ----------------------------------------------------------------
// SUITE 4: Multiplier Scaling and Reset on Miss
// ----------------------------------------------------------------
console.log('--- SUITE 4: Multiplier Scaling and Reset on Miss ---');

// 4.1 calculateMultiplier staircase curve
{
  assert(calculateMultiplier(0) === 1, '4.1a Combo 0 -> 1x');
  assert(calculateMultiplier(1) === 1, '4.1b Combo 1 -> 1x');
  assert(calculateMultiplier(4) === 1, '4.1c Combo 4 -> 1x');
  assert(calculateMultiplier(5) === 2, '4.1d Combo 5 -> 2x (Staircase step 1)');
  assert(calculateMultiplier(9) === 2, '4.1e Combo 9 -> 2x');
  assert(calculateMultiplier(10) === 3, '4.1f Combo 10 -> 3x (Staircase step 2)');
  assert(calculateMultiplier(19) === 3, '4.1g Combo 19 -> 3x');
  assert(calculateMultiplier(20) === 4, '4.1h Combo 20 -> 4x (Staircase step 3)');
  assert(calculateMultiplier(50) === 4, '4.1i Combo 50 -> 4x (Max multiplier cap)');
}

// 4.2 Score accumulation progression across multiplier steps
{
  const tiles = Array.from({ length: 30 }, (_, i) => ({
    id: `m-tile-${i}`,
    targetTime: (i + 1) * 1.0,
    germanText: `w-${i}`,
    correctLane: 0,
    resolved: false
  }));
  resetStoreWithTiles(tiles);

  // Hits 1 to 4: perfect, mult 1x -> score increments by 1000 each
  for (let i = 0; i < 4; i++) {
    useRhythmGameStore.getState().registerHit(`m-tile-${i}`, 'perfect');
  }
  let s = useRhythmGameStore.getState();
  assert(s.combo === 4 && s.multiplier === 1 && s.score === 4000, `4.2a After 4 perfect hits: combo=4, mult=1, score=4000 (actual: ${s.score})`);

  // Hit 5: combo becomes 5 -> mult 2x -> score += 1000 * 2 = 2000 -> score = 6000
  useRhythmGameStore.getState().registerHit('m-tile-4', 'perfect');
  s = useRhythmGameStore.getState();
  assert(s.combo === 5 && s.multiplier === 2 && s.score === 6000, `4.2b Hit 5 triggers 2x multiplier: score=6000 (actual: ${s.score})`);

  // Hits 6 to 9: perfect, mult 2x -> +2000 each -> score reaches 6000 + 8000 = 14000
  for (let i = 5; i < 9; i++) {
    useRhythmGameStore.getState().registerHit(`m-tile-${i}`, 'perfect');
  }
  s = useRhythmGameStore.getState();
  assert(s.combo === 9 && s.multiplier === 2 && s.score === 14000, `4.2c After 9 perfect hits: score=14000 (actual: ${s.score})`);

  // Hit 10: combo becomes 10 -> mult 3x -> score += 1000 * 3 = 3000 -> score = 17000
  useRhythmGameStore.getState().registerHit('m-tile-9', 'perfect');
  s = useRhythmGameStore.getState();
  assert(s.combo === 10 && s.multiplier === 3 && s.score === 17000, `4.2d Hit 10 triggers 3x multiplier: score=17000 (actual: ${s.score})`);

  // Hits 11 to 19: perfect, mult 3x -> 9 hits * 3000 = 27000 -> score = 17000 + 27000 = 44000
  for (let i = 10; i < 19; i++) {
    useRhythmGameStore.getState().registerHit(`m-tile-${i}`, 'perfect');
  }
  s = useRhythmGameStore.getState();
  assert(s.combo === 19 && s.multiplier === 3 && s.score === 44000, `4.2e After 19 perfect hits: score=44000 (actual: ${s.score})`);

  // Hit 20: combo becomes 20 -> mult 4x -> score += 1000 * 4 = 4000 -> score = 48000
  useRhythmGameStore.getState().registerHit('m-tile-19', 'perfect');
  s = useRhythmGameStore.getState();
  assert(s.combo === 20 && s.multiplier === 4 && s.score === 48000, `4.2f Hit 20 triggers 4x multiplier: score=48000 (actual: ${s.score})`);

  // Hit 21: good hit at 4x -> score += 500 * 4 = 2000 -> score = 50000
  useRhythmGameStore.getState().registerHit('m-tile-20', 'good');
  s = useRhythmGameStore.getState();
  assert(s.combo === 21 && s.multiplier === 4 && s.score === 50000, `4.2g Good hit at 4x awards 2000: score=50000 (actual: ${s.score})`);

  // 4.3 Hit 22: MISS -> combo resets to 0, multiplier resets to 1, maxCombo preserved at 21, score unchanged
  useRhythmGameStore.getState().registerHit('m-tile-21', 'miss');
  s = useRhythmGameStore.getState();
  assert(s.combo === 0, `4.3a Miss immediately resets combo to 0 (actual: ${s.combo})`);
  assert(s.streak === 0, `4.3b Miss immediately resets streak to 0 (actual: ${s.streak})`);
  assert(s.multiplier === 1, `4.3c Miss immediately resets multiplier to 1 (actual: ${s.multiplier})`);
  assert(s.score === 50000, `4.3d Miss does not alter accumulated score (actual: ${s.score})`);
  assert(s.maxCombo === 21, `4.3e maxCombo preserves peak combo of 21 (actual: ${s.maxCombo})`);

  // 4.4 Hit 23: Perfect hit after miss -> combo 1, mult 1, score += 1000 -> score = 51000
  useRhythmGameStore.getState().registerHit('m-tile-22', 'perfect');
  s = useRhythmGameStore.getState();
  assert(s.combo === 1 && s.multiplier === 1 && s.score === 51000, `4.4 Rebuilding combo after miss starts at 1x: score=51000 (actual: ${s.score})`);
}

console.log('\n----------------------------------------------------------------');
// ----------------------------------------------------------------
// SUITE 5: React 19 Strict Mode Double-Mount & Audio Engine Resilience
// ----------------------------------------------------------------
console.log('--- SUITE 5: React 19 Strict Mode Double-Mount & Audio Engine Resilience ---');

// 5.1 React 19 Strict Mode Double-Mount Simulation
{
  const engine = new RhythmAudioEngine();
  // Mount 1
  engine.startSongRhythm(120, 'synthwave');
  // Unmount 1 (Strict Mode cleanup)
  engine.stopSongRhythm();
  // Mount 2 (Strict Mode immediate re-mount)
  engine.startSongRhythm(120, 'synthwave');

  assert(engine.getBpm() === 120, '5.1a Audio engine BPM retained after double-mount');
  const time = engine.getCurrentAudioTime();
  assert(time >= 0, `5.1b Audio time is valid (>= 0) after double-mount: ${time}`);
  engine.dispose();
}

// 5.2 50 Rapid Start/Stop Cycles (Thrash Testing)
{
  const engine = new RhythmAudioEngine();
  let threw = false;
  try {
    for (let i = 0; i < 50; i++) {
      engine.startSongRhythm(80 + (i % 40), 'chillhop');
      engine.stopSongRhythm();
    }
  } catch (err) {
    threw = true;
    console.error('Thrash error:', err);
  }
  assert(!threw, '5.2a 50 rapid start/stop cycles completed without throwing exceptions');

  // Verify clean post-thrash startup
  engine.startSongRhythm(100, 'moroccan_beat');
  assert(engine.getBpm() === 100, '5.2b Clean start after 50 rapid thrash cycles');
  engine.dispose();
}

// 5.3 Rapid Overlapping startSongRhythm calls (without explicit stop)
{
  const engine = new RhythmAudioEngine();
  let threw = false;
  try {
    for (let i = 0; i < 20; i++) {
      engine.startSongRhythm(70 + i, 'piano');
    }
  } catch (err) {
    threw = true;
  }
  assert(!threw, '5.3a 20 rapid overlapping startSongRhythm calls completed without throwing');
  assert(engine.getBpm() === 89, `5.3b Final BPM is 89 (actual: ${engine.getBpm()})`);
  engine.dispose();
}

// 5.4 Pause / Resume Continuity
{
  const engine = new RhythmAudioEngine();
  engine.startSongRhythm(120, 'synthwave');
  // Advance mock audio clock
  const ctx = engine.ensureContext();
  ctx.currentTime = 2.5;

  engine.pause();
  const pauseTime1 = engine.getCurrentAudioTime();
  // Advance mock audio clock while paused
  ctx.currentTime = 10.0;
  const pauseTime2 = engine.getCurrentAudioTime();
  assert(pauseTime1 === pauseTime2, `5.4a Paused audio time does not drift while paused (${pauseTime1} === ${pauseTime2})`);

  engine.resume();
  ctx.currentTime = 10.5; // 0.5s after resume
  const resumeTime = engine.getCurrentAudioTime();
  assert(resumeTime >= pauseTime1, `5.4b Resumed audio time continues from pause offset: ${resumeTime}`);
  engine.dispose();
}

// 5.5 Recovery after Full dispose()
{
  const engine = new RhythmAudioEngine();
  engine.startSongRhythm(120, 'synthwave');
  engine.dispose(); // Context is closed

  let recovered = false;
  try {
    engine.startSongRhythm(130, 'funk_bass');
    recovered = engine.getBpm() === 130;
  } catch {
    recovered = false;
  }
  assert(recovered, '5.5 Engine cleanly recovers and instantiates new context after full dispose()');
  engine.dispose();
}

// 5.6 Sound FX Under Muted & Unmuted States
{
  const engine = new RhythmAudioEngine();
  let threw = false;
  try {
    engine.setMuted(true);
    engine.playHitFx('perfect');
    engine.playHitFx('good');
    engine.playMissFx();
    engine.playStreakFx(15);
    engine.playLaneSwitchFx();

    engine.setMuted(false);
    engine.playHitFx('perfect');
    engine.playHitFx('good');
    engine.playMissFx();
    engine.playStreakFx(20);
    engine.playLaneSwitchFx();
  } catch (err) {
    threw = true;
    console.error('SFX error:', err);
  }
  assert(!threw, '5.6 Sound FX methods execute without error in both muted and unmuted states');
  engine.dispose();
}

console.log('\n================================================================');
console.log(`STRESS TEST SUMMARY: ${results.passed} / ${results.total} PASSED, ${results.failed} FAILED`);
console.log('================================================================');

if (results.findings.length > 0) {
  console.log('\nFINDINGS / BOUNDARY ANOMALIES DETECTED:');
  for (const f of results.findings) {
    console.log(`- ${f.message}`, f.metadata);
  }
}

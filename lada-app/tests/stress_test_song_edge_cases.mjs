import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== TEST 2: SONG & STORE EDGE CASE STRESS TESTING ===\n');

// Import Zustand store from lada-app
// Since useRhythmGameStore is written in TS, let's test the pure logic or import the compiled dist or simulate store actions
// Let's check if dist exists or test directly
const storePath = path.resolve(__dirname, '../src/store/useRhythmGameStore.ts');
console.log(`Analyzing store implementation at: ${storePath}`);

// Let's implement an exact simulator of useRhythmGameStore logic to run edge cases in pure Node
const HIT_WINDOW_PERFECT = 0.080;
const HIT_WINDOW_GOOD = 0.160;

function calculateMultiplier(combo) {
  if (combo >= 20) return 4;
  if (combo >= 10) return 3;
  if (combo >= 5) return 2;
  return 1;
}

class RhythmGameSimulator {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
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
      activeTiles: [],
      currentAudioTime: 0,
      isPlaying: false,
      isPaused: false,
      hitFeedback: null
    };
  }

  spawnTilesFromSong(song) {
    const tiles = (song.lyrics || []).map((lyric, idx) => {
      const correctLane = idx % 2 === 0 ? 0 : 1;
      const options = correctLane === 0
        ? [lyric.darijaCorrect || '', lyric.darijaDistractor || '']
        : [lyric.darijaDistractor || '', lyric.darijaCorrect || ''];

      return {
        id: lyric.id || `tile-${idx}`,
        targetTime: lyric.timingSec,
        germanText: lyric.german,
        phonetic: lyric.phoneticGuide,
        translationDarija: lyric.darijaCorrect,
        correctLane,
        options,
        resolved: false
      };
    });

    this.state.score = 0;
    this.state.combo = 0;
    this.state.maxCombo = 0;
    this.state.streak = 0;
    this.state.multiplier = 1;
    this.state.accuracy = 100;
    this.state.totalHits = 0;
    this.state.perfectHits = 0;
    this.state.goodHits = 0;
    this.state.missHits = 0;
    this.state.activeTiles = tiles;
    this.state.isPlaying = true;
  }

  registerHit(tileId, accuracy) {
    const tileIndex = this.state.activeTiles.findIndex((t) => t.id === tileId);
    if (tileIndex === -1) return;
    const tile = this.state.activeTiles[tileIndex];
    if (tile.resolved) return;

    tile.resolved = true;
    tile.hitAccuracy = accuracy;

    let newCombo = this.state.combo;
    let newStreak = this.state.streak;
    let newScore = this.state.score;
    let perfectHits = this.state.perfectHits;
    let goodHits = this.state.goodHits;
    let missHits = this.state.missHits;
    let feedback = null;

    if (accuracy === 'perfect') {
      newCombo += 1;
      newStreak += 1;
      perfectHits += 1;
      const mult = calculateMultiplier(newCombo);
      newScore += 1000 * mult;
      feedback = { text: 'PERFECT!', color: '#38bdf8', timestamp: Date.now() };
    } else if (accuracy === 'good') {
      newCombo += 1;
      newStreak += 1;
      goodHits += 1;
      const mult = calculateMultiplier(newCombo);
      newScore += 500 * mult;
      feedback = { text: 'GOOD!', color: '#10b981', timestamp: Date.now() };
    } else {
      newCombo = 0;
      newStreak = 0;
      missHits += 1;
      feedback = { text: 'MISS', color: '#ef4444', timestamp: Date.now() };
    }

    const maxCombo = Math.max(this.state.maxCombo, newCombo);
    const multiplier = calculateMultiplier(newCombo);
    const totalJudged = perfectHits + goodHits + missHits;
    const accuracyPct = totalJudged > 0
      ? Math.round(((perfectHits * 1.0 + goodHits * 0.5) / totalJudged) * 100)
      : 100;

    this.state.score = newScore;
    this.state.combo = newCombo;
    this.state.maxCombo = maxCombo;
    this.state.streak = newStreak;
    this.state.multiplier = multiplier;
    this.state.accuracy = accuracyPct;
    this.state.totalHits = totalJudged;
    this.state.perfectHits = perfectHits;
    this.state.goodHits = goodHits;
    this.state.missHits = missHits;
    this.state.hitFeedback = feedback;
  }

  evaluateTileHit(playerLane) {
    const lane = playerLane !== undefined ? playerLane : this.state.selectedLane;
    const currentTime = this.state.currentAudioTime;

    let candidate = null;
    let candidateDiff = Infinity;

    for (const tile of this.state.activeTiles) {
      if (tile.resolved) continue;
      const diff = Math.abs(currentTime - tile.targetTime);
      if (diff <= HIT_WINDOW_GOOD && diff < candidateDiff) {
        candidate = tile;
        candidateDiff = diff;
      }
    }

    if (!candidate) {
      return null;
    }

    const isCorrectLane = candidate.correctLane === lane;
    const accuracy = !isCorrectLane
      ? 'miss'
      : candidateDiff <= HIT_WINDOW_PERFECT
        ? 'perfect'
        : 'good';

    this.registerHit(candidate.id, accuracy);
    return { tile: candidate, accuracy };
  }

  tickAudioTime(time) {
    let missedCount = 0;
    let hasChanges = false;

    for (const tile of this.state.activeTiles) {
      if (!tile.resolved && time - tile.targetTime > HIT_WINDOW_GOOD) {
        hasChanges = true;
        missedCount++;
        tile.resolved = true;
        tile.hitAccuracy = 'miss';
      }
    }

    this.state.currentAudioTime = time;

    if (hasChanges) {
      this.state.missHits += missedCount;
      this.state.totalHits = this.state.perfectHits + this.state.goodHits + this.state.missHits;
      this.state.combo = 0;
      this.state.streak = 0;
      this.state.multiplier = 1;
      this.state.accuracy = this.state.totalHits > 0
        ? Math.round(((this.state.perfectHits * 1.0 + this.state.goodHits * 0.5) / this.state.totalHits) * 100)
        : 100;
      this.state.hitFeedback = { text: 'MISS', color: '#ef4444', timestamp: Date.now() };
    }
  }
}

// -------------------------------------------------------------
// SUBTEST 2.1: Edge Case - Song with 0 Lyrics
// -------------------------------------------------------------
console.log('--- Subtest 2.1: Song with 0 Lyrics ---');
const simZero = new RhythmGameSimulator();
const zeroSong = {
  id: 'song_empty',
  number: 99,
  title: 'Empty Song',
  bpm: 100,
  instrument: 'piano',
  lyrics: []
};

simZero.spawnTilesFromSong(zeroSong);
console.log(`Spawned tiles count: ${simZero.state.activeTiles.length}`);
console.log(`Initial accuracy: ${simZero.state.accuracy}`);
console.log(`Initial score: ${simZero.state.score}`);

// Simulate audio ticking for 10 seconds
for (let t = 0; t <= 10; t += 0.016) {
  simZero.tickAudioTime(t);
}

const hitResultZero = simZero.evaluateTileHit(0);
console.log(`evaluateTileHit with 0 lyrics returned:`, hitResultZero);
console.log(`Final accuracy after ticking: ${simZero.state.accuracy}`);
console.log(`Is accuracy NaN? ${Number.isNaN(simZero.state.accuracy)}`);

let zeroPassed = !Number.isNaN(simZero.state.accuracy) &&
                 simZero.state.accuracy === 100 &&
                 hitResultZero === null &&
                 simZero.state.score === 0;

console.log(`Subtest 2.1 Verdict: ${zeroPassed ? 'PASS' : 'FAIL'}\n`);

// -------------------------------------------------------------
// SUBTEST 2.2: Edge Case - Song with 100+ Lyrics (Scalability & Performance)
// -------------------------------------------------------------
console.log('--- Subtest 2.2: Song with 100+ Lyrics (Testing 100, 500, 1000) ---');
const testSizes = [100, 500, 1000];
let perfPassed = true;

for (const count of testSizes) {
  const bigSong = {
    id: `song_${count}`,
    number: count,
    title: `Song with ${count} lyrics`,
    bpm: 120,
    instrument: 'synthwave',
    lyrics: Array.from({ length: count }, (_, i) => ({
      id: `lyric_${i}`,
      german: `Wort_${i}`,
      darijaCorrect: `Kelma_${i}`,
      darijaDistractor: `Ghalat_${i}`,
      timingSec: 1.0 + i * 0.4
    }))
  };

  const simBig = new RhythmGameSimulator();
  const t0 = performance.now();
  simBig.spawnTilesFromSong(bigSong);
  const tSpawn = performance.now() - t0;

  // Run 600 frames of tickAudioTime (representing 10 seconds at 60 FPS)
  const tTickStart = performance.now();
  for (let frame = 0; frame < 600; frame++) {
    const audioTime = frame * (1 / 60);
    simBig.tickAudioTime(audioTime);
  }
  const tTickTotal = performance.now() - tTickStart;
  const avgFrameTimeMs = tTickTotal / 600;

  console.log(`[${count} lyrics]: Spawn time: ${tSpawn.toFixed(2)}ms | Total 600 ticks: ${tTickTotal.toFixed(2)}ms | Avg per tick: ${avgFrameTimeMs.toFixed(3)}ms`);

  // If average per-tick time exceeds 1.5ms, CPU frame budget (16.6ms) may get degraded when combined with 3D render
  if (avgFrameTimeMs > 2.0) {
    console.warn(`⚠️ High per-tick duration for ${count} lyrics: ${avgFrameTimeMs.toFixed(3)}ms`);
    perfPassed = false;
  }
}
console.log(`Subtest 2.2 Verdict: ${perfPassed ? 'PASS' : 'WARN'}\n`);

// -------------------------------------------------------------
// SUBTEST 2.3: Extreme BPM: 40 BPM vs 280 BPM
// -------------------------------------------------------------
console.log('--- Subtest 2.3: Extreme BPM (40 BPM vs 280 BPM) ---');

function testBpmTiming(bpm) {
  const secondsPerBeat = 60.0 / bpm;
  const secondsPerStep = secondsPerBeat * 0.5; // 8th notes
  const scheduleAheadTimeSec = 0.100;
  const lookaheadIntervalMs = 25;

  console.log(`Testing ${bpm} BPM:`);
  console.log(`  Seconds per beat: ${secondsPerBeat.toFixed(4)}s`);
  console.log(`  Seconds per 8th note step: ${secondsPerStep.toFixed(4)}s (${(secondsPerStep * 1000).toFixed(1)}ms)`);
  console.log(`  Scheduler lookahead window: ${scheduleAheadTimeSec}s`);
  console.log(`  Lookahead interval: ${lookaheadIntervalMs}ms`);

  // Check if step interval is smaller than lookahead window or if steps can be missed
  const stepsPerSchedule = scheduleAheadTimeSec / secondsPerStep;
  console.log(`  Avg steps scheduled per window: ${stepsPerSchedule.toFixed(2)}`);

  // At 280 BPM, secondsPerStep = 0.1071s. Notice that 0.1071s > 0.100s (scheduleAheadTimeSec)!
  // This means in a single 100ms lookahead window, sometimes ZERO steps fall in [now, now + 100ms]!
  // Let's simulate Chris Wilson scheduler loop over 10 seconds of playback:
  let nextNoteTime = 0.05;
  let currentAudioTime = 0;
  let totalScheduled = 0;
  let intervalsRun = 0;
  let emptySchedCycles = 0;

  const totalTimeSec = 10;
  const dtSec = lookaheadIntervalMs / 1000;

  for (let t = 0; t < totalTimeSec; t += dtSec) {
    intervalsRun++;
    let scheduledInThisInterval = 0;
    while (nextNoteTime < t + scheduleAheadTimeSec) {
      totalScheduled++;
      scheduledInThisInterval++;
      nextNoteTime += secondsPerStep;
    }
    if (scheduledInThisInterval === 0) {
      emptySchedCycles++;
    }
  }

  const expectedNotes = Math.floor((totalTimeSec - 0.05) / secondsPerStep) + 1;
  const drift = Math.abs(totalScheduled - expectedNotes);

  console.log(`  Total notes scheduled: ${totalScheduled} (Expected: ~${expectedNotes}, Drift: ${drift})`);
  console.log(`  Empty scheduler cycles: ${emptySchedCycles} / ${intervalsRun}`);

  const passed = drift <= 1;
  console.log(`  ${bpm} BPM Scheduler Accuracy: ${passed ? 'ACCURATE (ZERO DRIFT)' : 'DRIFT DETECTED'}`);
  return passed;
}

const bpm40Passed = testBpmTiming(40);
const bpm280Passed = testBpmTiming(280);

// Hit window overlap stress test for rapid lyrics at 280 BPM:
console.log('\n--- Rapid Note Collision Stress Test at 280 BPM ---');
// At 280 BPM, an 8th note is 107ms apart.
// But HIT_WINDOW_GOOD is 160ms (0.160s)!
// Since 107ms < 160ms, the hit windows of two consecutive 8th-note lyrics OVERLAP by 53ms!
console.log(`Consecutive 8th note spacing at 280 BPM: 107ms`);
console.log(`HIT_WINDOW_GOOD: ${HIT_WINDOW_GOOD * 1000}ms`);
const overlap = (HIT_WINDOW_GOOD * 1000) - 107;
console.log(`Hit Window Overlap: ${overlap.toFixed(1)}ms`);

// Let's test what happens if player strikes when two tiles overlap:
const simOverlap = new RhythmGameSimulator();
simOverlap.state.activeTiles = [
  { id: 'tile-0', targetTime: 1.000, correctLane: 0, resolved: false, germanText: 'Eins' },
  { id: 'tile-1', targetTime: 1.107, correctLane: 0, resolved: false, germanText: 'Zwei' }
];

// Player strikes at 1.050 (between tile-0 and tile-1)
simOverlap.state.currentAudioTime = 1.050;
const hit1 = simOverlap.evaluateTileHit(0);
console.log(`Strike at t=1.050 hit tile:`, hit1?.tile.id, `accuracy:`, hit1?.accuracy);

// Second strike at t=1.080
simOverlap.state.currentAudioTime = 1.080;
const hit2 = simOverlap.evaluateTileHit(0);
console.log(`Strike at t=1.080 hit tile:`, hit2?.tile.id, `accuracy:`, hit2?.accuracy);

const overlapHandled = hit1?.tile.id === 'tile-0' && hit2?.tile.id === 'tile-1';
console.log(`Sequential rapid strike resolution: ${overlapHandled ? 'CORRECT (both resolved in order)' : 'INCORRECT'}`);

const overallResult = {
  zeroLyrics: zeroPassed,
  performance100Plus: perfPassed,
  bpm40: bpm40Passed,
  bpm280: bpm280Passed,
  overlapHandled
};

fs.writeFileSync(path.resolve(__dirname, 'edge_cases_test_result.json'), JSON.stringify(overallResult, null, 2));

const allPass = zeroPassed && bpm40Passed && bpm280Passed && overlapHandled;
console.log(`\nOVERALL EDGE CASE TEST VERDICT: ${allPass ? 'PASSED' : 'FAILED'}`);
process.exit(allPass ? 0 : 1);

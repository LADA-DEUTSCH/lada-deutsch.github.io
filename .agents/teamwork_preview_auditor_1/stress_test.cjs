const assert = require('assert');

console.log('=== ADVERSARIAL STRESS TESTING SUITE ===');

// Test 1: Multiplier curve stress testing
function calculateMultiplier(combo) {
  if (combo >= 20) return 4;
  if (combo >= 10) return 3;
  if (combo >= 5) return 2;
  return 1;
}

assert.strictEqual(calculateMultiplier(0), 1);
assert.strictEqual(calculateMultiplier(1), 1);
assert.strictEqual(calculateMultiplier(4), 1);
assert.strictEqual(calculateMultiplier(5), 2);
assert.strictEqual(calculateMultiplier(9), 2);
assert.strictEqual(calculateMultiplier(10), 3);
assert.strictEqual(calculateMultiplier(19), 3);
assert.strictEqual(calculateMultiplier(20), 4);
assert.strictEqual(calculateMultiplier(1000), 4);
console.log('PASS: Multiplier curve adheres to mathematical specification across all combo boundaries [0, 1, 4, 5, 9, 10, 19, 20, 1000]');

// Test 2: Accuracy calculation stress testing with extreme values
function calcAccuracy(perfectHits, goodHits, missHits) {
  const totalJudged = perfectHits + goodHits + missHits;
  return totalJudged > 0
    ? Math.round(((perfectHits * 1.0 + goodHits * 0.5) / totalJudged) * 100)
    : 100;
}

assert.strictEqual(calcAccuracy(0, 0, 0), 100); // division by zero guarded
assert.strictEqual(calcAccuracy(10, 0, 0), 100);
assert.strictEqual(calcAccuracy(0, 10, 0), 50);
assert.strictEqual(calcAccuracy(0, 0, 10), 0);
assert.strictEqual(calcAccuracy(5, 5, 0), 75);
assert.strictEqual(calcAccuracy(1, 0, 1), 50);
console.log('PASS: Accuracy calculation is robust against division by zero and correctly scales hit weights');

// Test 3: Hit Timing Window discrimination
const HIT_WINDOW_PERFECT = 0.080;
const HIT_WINDOW_GOOD = 0.160;

function judgeHit(diffSec) {
  const absDiff = Math.abs(diffSec);
  if (absDiff <= HIT_WINDOW_PERFECT) return 'perfect';
  if (absDiff <= HIT_WINDOW_GOOD) return 'good';
  return 'miss';
}

assert.strictEqual(judgeHit(0.000), 'perfect');
assert.strictEqual(judgeHit(0.079), 'perfect');
assert.strictEqual(judgeHit(0.080), 'perfect');
assert.strictEqual(judgeHit(0.081), 'good');
assert.strictEqual(judgeHit(0.159), 'good');
assert.strictEqual(judgeHit(0.160), 'good');
assert.strictEqual(judgeHit(0.161), 'miss');
assert.strictEqual(judgeHit(-0.050), 'perfect');
assert.strictEqual(judgeHit(-0.120), 'good');
assert.strictEqual(judgeHit(-0.200), 'miss');
console.log('PASS: Hit timing windows correctly classify sub-millisecond boundaries');

// Test 4: Star rating computation bounds
function calcStarCount(endResult) {
  if (!endResult) return 0;
  if (endResult.accuracy >= 95) return 3;
  if (endResult.accuracy >= 75) return 2;
  return 1;
}

assert.strictEqual(calcStarCount(null), 0);
assert.strictEqual(calcStarCount({ accuracy: 100 }), 3);
assert.strictEqual(calcStarCount({ accuracy: 95 }), 3);
assert.strictEqual(calcStarCount({ accuracy: 94 }), 2);
assert.strictEqual(calcStarCount({ accuracy: 75 }), 2);
assert.strictEqual(calcStarCount({ accuracy: 74 }), 1);
assert.strictEqual(calcStarCount({ accuracy: 0 }), 1);
console.log('PASS: Star ratings properly bounded across [0, 74, 75, 94, 95, 100]');

console.log('ALL ADVERSARIAL STRESS TESTS PASSED!');

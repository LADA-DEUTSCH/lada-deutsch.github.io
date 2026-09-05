import assert from 'assert';
import { detectGermanPhoneticTraps, sanitizeAntiMsa } from '../src/services/phoneticTrapEngine.ts';
import { calculateRetention } from '../src/services/sentientMemoryDb.ts';
import { GeminiRotator } from '../src/lib/geminiRotator.ts';

console.log('🧪 RUNNING PROJECT NEON-POLYGLOT MASTER VERIFICATION SUITE...\n');

// TEST 1: Phonetic Trap Engine & Linguistic Governance
console.log('Test 1: German Phonetic Trap Detection...');
const testIch = detectGermanPhoneticTraps('ich möchte ein Buch');
assert(testIch.hasTrap, 'Should detect traps in phrase');
assert(testIch.traps.some(t => t.category === 'CH_ICH_LAUT' || t.category === 'CH_ACH_LAUT'), 'Should detect ch-Laut');
console.log('  ✓ Ich-Laut & Ach-Laut detected correctly');

const testUmlaut = detectGermanPhoneticTraps('schön für dich');
assert(testUmlaut.traps.some(t => t.category === 'UMLAUT_OE'), 'Should detect Umlaut Ö');
assert(testUmlaut.traps.some(t => t.category === 'UMLAUT_UE'), 'Should detect Umlaut Ü');
console.log('  ✓ Umlauts Ö and Ü mapped against Moroccan vowel instincts');

const testClusterZ = detectGermanPhoneticTraps('Zeit und Katze');
assert(testClusterZ.traps.some(t => t.category === 'CLUSTER_TS_Z'), 'Should detect affricate Z [ts]');
console.log('  ✓ Affricate Z (ts) detected');

// TEST 2: Strict Anti-MSA Sanitization
console.log('Test 2: Anti-MSA Sanitization...');
const msaText = 'يجب عليك أن تتذكر دائماً أن نطق الكلمة بحال هكا';
const cleaned = sanitizeAntiMsa(msaText);
assert(!cleaned.includes('يجب عليك'), 'Should strip MSA "يجب عليك"');
assert(!cleaned.includes('تتذكر دائماً'), 'Should strip MSA "تتذكر دائماً"');
console.log('  ✓ Anti-MSA enforcement passed');

// TEST 3: Sentient Memory Ebbinghaus Retention Decay: R = exp(-Δt / S)
console.log('Test 3: Ebbinghaus SRS Retention Decay Formula...');
const freshRetention = calculateRetention(Date.now(), 1.0);
assert(freshRetention > 0.99, 'Fresh word retention should be ~1.0');

// 2 days elapsed with stability 1.0 -> R = exp(-2/1) = exp(-2) = 0.135 (< 0.40) -> CRITICAL_DECAY
const twoDaysAgo = Date.now() - (2 * 86400000);
const decayedRetention = calculateRetention(twoDaysAgo, 1.0);
assert(decayedRetention < 0.40, 'Decayed retention must fall below 0.40 critical threshold');
assert(decayedRetention > 0.10 && decayedRetention < 0.20, `Expected ~0.135, got ${decayedRetention}`);
console.log(`  ✓ Retention decay: R=${decayedRetention.toFixed(3)} correctly flags CRITICAL_DECAY (< 0.40)`);

// TEST 4: Gemini Rotator 6-Key Pool & Model Specialization
console.log('Test 4: Gemini Rotator 6-Key Pool...');
const testKeys = [
  'KEY_1_FAST_A',
  'KEY_2_FAST_B',
  'KEY_3_PRO_A',
  'KEY_4_PRO_B',
  'KEY_5_AUDIO_A',
  'KEY_6_AUDIO_B'
];
const rotator = new GeminiRotator(testKeys);
const metrics = rotator.getPoolMetrics();
assert.strictEqual(metrics.totalKeys, 6, 'Should load 6 distinct keys');
assert.strictEqual(metrics.activeKeys, 6, 'All keys start active');
assert.strictEqual(metrics.pipelineStats.fast.totalAssigned, 2, '2 keys assigned to Fast Pipeline');
assert.strictEqual(metrics.pipelineStats.deep_linguistic.totalAssigned, 2, '2 keys assigned to Deep Linguistic Pipeline');
assert.strictEqual(metrics.pipelineStats.audio_analytics.totalAssigned, 2, '2 keys assigned to Audio Pipeline');
console.log('  ✓ 6-Key load balancing & model specialization verified');

console.log('\n🎉 ALL 4/4 MASTER VERIFICATION TESTS PASSED PERFECTLY!\n');

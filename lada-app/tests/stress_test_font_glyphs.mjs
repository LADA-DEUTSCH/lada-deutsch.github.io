import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontPath = path.resolve(__dirname, '../public/fonts/helvetiker_regular.typeface.json');
const curriculumPath = path.resolve(__dirname, '../src/services/songCurriculum.ts');

console.log('=== TEST 1: 3D FONT GLYPH VALIDATION ===');
console.log(`Font path: ${fontPath}`);

if (!fs.existsSync(fontPath)) {
  console.error(`FAIL: Font file not found at ${fontPath}`);
  process.exit(1);
}

const fontRaw = fs.readFileSync(fontPath, 'utf8');
let fontData;
try {
  fontData = JSON.parse(fontRaw);
} catch (e) {
  console.error(`FAIL: Failed to parse font JSON: ${e.message}`);
  process.exit(1);
}

console.log(`Font family: ${fontData.familyName || fontData.familyNameEscaped || 'unknown'}`);
console.log(`Resolution: ${fontData.resolution}`);
console.log(`Underline position: ${fontData.underlinePosition}, thickness: ${fontData.underlineThickness}`);

const glyphs = fontData.glyphs || {};
const glyphKeys = Object.keys(glyphs);
console.log(`Total glyphs in font: ${glyphKeys.length}`);

// Test target character sets
const germanUmlauts = ['ä', 'ö', 'ü', 'Ä', 'Ö', 'Ü', 'ß'];
const asciiUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const asciiLower = 'abcdefghijklmnopqrstuvwxyz'.split('');
const asciiDigits = '0123456789'.split('');
const punctuation = [' ', '!', '?', '.', ',', '-', ':', ';', '"', "'", '(', ')', '/', '&', '+'];

console.log('\n--- Checking German Umlauts & Eszett ---');
const missingUmlauts = [];
for (const char of germanUmlauts) {
  const exists = glyphs[char] !== undefined;
  const hasOutline = exists && (glyphs[char].o !== undefined || char === ' ');
  console.log(`Character '${char}' (U+${char.charCodeAt(0).toString(16).padStart(4, '0')}): ${exists ? 'EXISTS' : 'MISSING'}${hasOutline ? ' (valid outline)' : ''}`);
  if (!exists) missingUmlauts.push(char);
}

console.log('\n--- Checking ASCII Uppercase (A-Z) ---');
const missingUpper = asciiUpper.filter(c => glyphs[c] === undefined);
console.log(`Uppercase missing (${missingUpper.length}/${asciiUpper.length}): ${missingUpper.join(', ') || 'NONE'}`);

console.log('\n--- Checking ASCII Lowercase (a-z) ---');
const missingLower = asciiLower.filter(c => glyphs[c] === undefined);
console.log(`Lowercase missing (${missingLower.length}/${asciiLower.length}): ${missingLower.join(', ') || 'NONE'}`);

console.log('\n--- Checking Digits (0-9) ---');
const missingDigits = asciiDigits.filter(c => glyphs[c] === undefined);
console.log(`Digits missing (${missingDigits.length}/${asciiDigits.length}): ${missingDigits.join(', ') || 'NONE'}`);

console.log('\n--- Checking Common Punctuation ---');
const missingPunct = punctuation.filter(c => glyphs[c] === undefined);
console.log(`Punctuation missing (${missingPunct.length}/${punctuation.length}): ${missingPunct.join(', ') || 'NONE'}`);

// Now parse songCurriculum.ts to extract all unique characters used in German lyrics
console.log('\n--- Checking German Lyrics from songCurriculum.ts ---');
let curriculumText = fs.readFileSync(curriculumPath, 'utf8');
// Regex match german: '...'
const germanMatches = [...curriculumText.matchAll(/german:\s*['"`](.*?)['"`]/g)];
console.log(`Found ${germanMatches.length} German lyric entries in songCurriculum.ts`);

const uniqueCharactersInSongs = new Set();
const charUsageCount = {};
for (const match of germanMatches) {
  const lyric = match[1];
  for (const ch of lyric) {
    uniqueCharactersInSongs.add(ch);
    charUsageCount[ch] = (charUsageCount[ch] || 0) + 1;
  }
}

console.log(`Unique characters used in songs: ${uniqueCharactersInSongs.size}`);
const missingSongChars = [];
for (const ch of uniqueCharactersInSongs) {
  if (glyphs[ch] === undefined) {
    missingSongChars.push({ char: ch, code: ch.charCodeAt(0), count: charUsageCount[ch] });
  }
}

if (missingSongChars.length > 0) {
  console.log(`\n⚠️  WARNING: ${missingSongChars.length} characters used in German song lyrics are MISSING from font:`);
  for (const m of missingSongChars) {
    console.log(`  '${m.char}' (U+${m.code.toString(16).padStart(4, '0')}): used ${m.count} times in lyrics`);
  }
} else {
  console.log('✅ ALL characters used in German song lyrics exist in the font!');
}

// Test Three.js Font class shape generation simulation
console.log('\n--- Testing Three.js Glyph Path Integrity ---');
let validOutlineCount = 0;
let invalidOutlineCount = 0;
for (const key of glyphKeys) {
  const g = glyphs[key];
  if (typeof g !== 'object') {
    invalidOutlineCount++;
    continue;
  }
  // Space character has no outline but valid ha
  if (key === ' ' && typeof g.ha === 'number') {
    validOutlineCount++;
    continue;
  }
  if (typeof g.ha === 'number' && typeof g.o === 'string') {
    // Check if outline string conforms to Three.js font outline commands (m, l, q, b, z)
    const commands = g.o.trim().split(/\s+/);
    if (commands.length > 0 && ['m', 'l', 'q', 'b', 'z'].includes(commands[0])) {
      validOutlineCount++;
    } else {
      invalidOutlineCount++;
    }
  } else {
    invalidOutlineCount++;
  }
}
console.log(`Glyphs with valid Three.js outline format: ${validOutlineCount} / ${glyphKeys.length}`);
if (invalidOutlineCount > 0) {
  console.log(`Glyphs with invalid/unrecognized format: ${invalidOutlineCount}`);
}

const summary = {
  fontLoaded: true,
  totalGlyphs: glyphKeys.length,
  missingUmlauts,
  missingUpper,
  missingLower,
  missingDigits,
  missingPunct,
  missingSongChars
};

fs.writeFileSync(path.resolve(__dirname, 'font_test_result.json'), JSON.stringify(summary, null, 2));

if (missingUmlauts.length > 0 || missingUpper.length > 0 || missingLower.length > 0 || missingSongChars.length > 0) {
  console.log('\n❌ FONT TEST STATUS: ISSUES FOUND');
  process.exit(1);
} else {
  console.log('\n✅ FONT TEST STATUS: PASSED');
  process.exit(0);
}

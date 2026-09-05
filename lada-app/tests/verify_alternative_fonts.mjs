import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const curriculumPath = path.resolve(__dirname, '../src/services/songCurriculum.ts');
const curriculumText = fs.readFileSync(curriculumPath, 'utf8');
const germanMatches = [...curriculumText.matchAll(/german:\s*['"`](.*?)['"`]/g)];
const uniqueLyricChars = new Set(germanMatches.flatMap(m => [...m[1]]));

console.log(`Unique characters across all German song lyrics: ${uniqueLyricChars.size}`);

const fontCandidates = [
  { name: 'helvetiker_regular (CURRENT)', path: path.resolve(__dirname, '../public/fonts/helvetiker_regular.typeface.json') },
  { name: 'droid_sans_regular', path: path.resolve(__dirname, '../node_modules/stats-gl/node_modules/three/examples/fonts/droid/droid_sans_regular.typeface.json') },
  { name: 'optimer_regular', path: path.resolve(__dirname, '../node_modules/stats-gl/node_modules/three/examples/fonts/optimer_regular.typeface.json') },
  { name: 'gentilis_regular', path: path.resolve(__dirname, '../node_modules/stats-gl/node_modules/three/examples/fonts/gentilis_regular.typeface.json') }
];

for (const candidate of fontCandidates) {
  if (!fs.existsSync(candidate.path)) {
    console.log(`${candidate.name}: File not found`);
    continue;
  }
  const fontData = JSON.parse(fs.readFileSync(candidate.path, 'utf8'));
  const missing = [...uniqueLyricChars].filter(ch => fontData.glyphs[ch] === undefined);
  console.log(`\nCandidate: ${candidate.name}`);
  console.log(`  Total glyphs: ${Object.keys(fontData.glyphs).length}`);
  console.log(`  Missing lyric characters count: ${missing.length}`);
  if (missing.length > 0) {
    console.log(`  Missing: ${missing.join(' ')}`);
  } else {
    console.log(`  ✅ 100% COVERAGE for all German lyrics!`);
  }
}

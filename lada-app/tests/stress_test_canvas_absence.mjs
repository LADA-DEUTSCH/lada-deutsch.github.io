import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== TEST 4: 2D CANVAS CODEBASE INSPECTION & ARCHITECTURAL PURITY ===\n');

const beat3dPath = path.resolve(__dirname, '../src/components/Beat3DHighway.tsx');
const beat3dWebGLPath = path.resolve(__dirname, '../src/components/Beat3DHighwayWebGL.tsx');
const highwayScenePath = path.resolve(__dirname, '../src/components/highway/HighwayScene.tsx');

const beat3dCode = fs.readFileSync(beat3dPath, 'utf8');
const beat3dWebGLCode = fs.readFileSync(beat3dWebGLPath, 'utf8');
const highwaySceneCode = fs.readFileSync(highwayScenePath, 'utf8');

// List of forbidden 2D canvas patterns
const forbidden2DPatterns = [
  { name: '<canvas HTML tag', regex: /<canvas\b[^>]*>/ },
  { name: 'document.createElement("canvas")', regex: /document\.createElement\(\s*['"]canvas['"]\s*\)/ },
  { name: 'getContext("2d")', regex: /\.getContext\(\s*['"]2d['"]\s*\)/ },
  { name: 'CanvasRenderingContext2D', regex: /CanvasRenderingContext2D/ },
  { name: 'ctx.scale', regex: /\bctx\.scale\b/ },
  { name: 'ctx.translate', regex: /\bctx\.translate\b/ },
  { name: 'ctx.rotate', regex: /\bctx\.rotate\b/ },
  { name: 'ctx.beginPath', regex: /\bctx\.beginPath\b/ },
  { name: 'ctx.closePath', regex: /\bctx\.closePath\b/ },
  { name: 'ctx.arc', regex: /\bctx\.arc\b/ },
  { name: 'ctx.fill', regex: /\bctx\.fill\b/ },
  { name: 'ctx.stroke', regex: /\bctx\.stroke\b/ },
  { name: 'ctx.fillRect', regex: /\bctx\.fillRect\b/ },
  { name: 'ctx.clearRect', regex: /\bctx\.clearRect\b/ },
  { name: 'ctx.fillText', regex: /\bctx\.fillText\b/ },
  { name: 'ctx.strokeText', regex: /\bctx\.strokeText\b/ },
  { name: 'ctx.createLinearGradient', regex: /\bctx\.createLinearGradient\b/ },
  { name: 'ctx.createRadialGradient', regex: /\bctx\.createRadialGradient\b/ },
  { name: 'ctx.shadowBlur', regex: /\bctx\.shadowBlur\b/ },
  { name: 'ctx.shadowColor', regex: /\bctx\.shadowColor\b/ }
];

console.log('1. Inspecting Beat3DHighway.tsx:');
let beat3dViolations = 0;
for (const p of forbidden2DPatterns) {
  const match = p.regex.test(beat3dCode);
  console.log(`  - ${p.name}: ${match ? 'VIOLATION DETECTED' : 'CLEAN (0 occurrences)'}`);
  if (match) beat3dViolations++;
}

console.log('\n2. Inspecting Beat3DHighwayWebGL.tsx:');
let webglViolations = 0;
for (const p of forbidden2DPatterns) {
  const match = p.regex.test(beat3dWebGLCode);
  console.log(`  - ${p.name}: ${match ? 'VIOLATION DETECTED' : 'CLEAN (0 occurrences)'}`);
  if (match) webglViolations++;
}

console.log('\n3. Inspecting HighwayScene.tsx:');
let sceneViolations = 0;
for (const p of forbidden2DPatterns) {
  const match = p.regex.test(highwaySceneCode);
  console.log(`  - ${p.name}: ${match ? 'VIOLATION DETECTED' : 'CLEAN (0 occurrences)'}`);
  if (match) sceneViolations++;
}

// Check for affirmative WebGL / R3F Canvas presence
console.log('\n4. Verifying True React Three Fiber Architecture:');
const usesR3FCanvas = /<Canvas\b[^>]*>/.test(highwaySceneCode);
const usesR3FImport = /from\s+['"]@react-three\/fiber['"]/.test(highwaySceneCode);
const usesPerspectiveCamera = /<PerspectiveCamera\b/.test(highwaySceneCode);
const delegatesToHighwayScene = /<HighwayScene\b/.test(beat3dCode);

console.log(`  - R3F Canvas imported from '@react-three/fiber': ${usesR3FImport}`);
console.log(`  - R3F <Canvas> mounted in HighwayScene: ${usesR3FCanvas}`);
console.log(`  - PerspectiveCamera mounted in HighwayScene: ${usesPerspectiveCamera}`);
console.log(`  - Beat3DHighway delegates 3D viewport to HighwayScene: ${delegatesToHighwayScene}`);

const totalViolations = beat3dViolations + webglViolations + sceneViolations;
const isPure = totalViolations === 0 && usesR3FCanvas && usesR3FImport && delegatesToHighwayScene;

console.log(`\n2D CANVAS ABSENCE VERDICT: ${isPure ? 'PASSED (100% Clean WebGL)' : 'FAILED'}`);

const result = {
  beat3dViolations,
  webglViolations,
  sceneViolations,
  usesR3FCanvas,
  usesR3FImport,
  delegatesToHighwayScene,
  passed: isPure
};

fs.writeFileSync(path.resolve(__dirname, 'canvas_absence_test_result.json'), JSON.stringify(result, null, 2));
process.exit(isPure ? 0 : 1);

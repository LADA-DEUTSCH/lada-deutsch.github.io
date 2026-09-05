import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== TEST 3: POSTPROCESSING & SHADER CONFIGURATION VALIDATION ===\n');

const highwayEffectsPath = path.resolve(__dirname, '../src/components/highway/HighwayEffects.tsx');
const highwayScenePath = path.resolve(__dirname, '../src/components/highway/HighwayScene.tsx');
const choiceGatePath = path.resolve(__dirname, '../src/components/highway/ChoiceGate3D.tsx');

const effectsCode = fs.readFileSync(highwayEffectsPath, 'utf8');
const sceneCode = fs.readFileSync(highwayScenePath, 'utf8');
const gateCode = fs.readFileSync(choiceGatePath, 'utf8');

// Check 1: EffectComposer presence and properties
console.log('1. Checking EffectComposer configuration in HighwayEffects.tsx:');
const hasEffectComposer = /<EffectComposer\b[^>]*>/.test(effectsCode);
const hasEnableNormalPassFalse = /enableNormalPass\s*=\s*\{\s*false\s*\}/.test(effectsCode);
const hasMultisampling = /multisampling\s*=\s*\{\s*\d+\s*\}/.test(effectsCode);

console.log(`  - EffectComposer present: ${hasEffectComposer}`);
console.log(`  - enableNormalPass={false} configured: ${hasEnableNormalPassFalse} (prevents WebGL normal pass overhead)`);
console.log(`  - multisampling configured: ${hasMultisampling}`);

// Check 2: Bloom configuration
console.log('\n2. Checking Bloom configuration in HighwayEffects.tsx:');
const hasBloom = /<Bloom\b[^>]*\/>/.test(effectsCode) || /<Bloom\b[^>]*>/.test(effectsCode);
const hasMipmapBlur = /\bmipmapBlur\b/.test(effectsCode);
const hasLuminanceThreshold = /luminanceThreshold\s*=\s*\{\s*[\d.]+\s*\}/.test(effectsCode);
const hasLuminanceSmoothing = /luminanceSmoothing\s*=\s*\{\s*[\d.]+\s*\}/.test(effectsCode);
const hasIntensity = /intensity\s*=\s*\{\s*[\d.]+\s*\}/.test(effectsCode);

console.log(`  - Bloom component present: ${hasBloom}`);
console.log(`  - mipmapBlur enabled: ${hasMipmapBlur} (high quality AAA blur without tile artifacts)`);
console.log(`  - luminanceThreshold defined: ${hasLuminanceThreshold}`);
console.log(`  - luminanceSmoothing defined: ${hasLuminanceSmoothing}`);
console.log(`  - intensity defined: ${hasIntensity}`);

// Check 3: Check for deprecated properties or Three.js breaking changes
console.log('\n3. Checking for deprecated postprocessing / Three.js patterns:');
const deprecatedPatterns = [
  { name: 'sRGBEncoding (deprecated in Three r152+)', regex: /sRGBEncoding/ },
  { name: 'LinearEncoding (deprecated in Three r152+)', regex: /LinearEncoding/ },
  { name: 'material.flatShading boolean property (should be flatShading)', regex: /flatShading\s*=\s*\{true\}/ },
  { name: 'raw gl_FragColor without output encoding', regex: /gl_FragColor\s*=/ },
  { name: 'Legacy WebGLRenderTarget without colorSpace', regex: /new\s+THREE\.WebGLRenderTarget\([^)]*\)/ }
];

let deprecatedFound = false;
for (const dep of deprecatedPatterns) {
  const found = dep.regex.test(effectsCode) || dep.regex.test(sceneCode) || dep.regex.test(gateCode);
  console.log(`  - ${dep.name}: ${found ? 'FOUND (WARNING)' : 'CLEAN'}`);
  if (found) deprecatedFound = true;
}

// Check 4: Cyber-glassmorphism physical material in ChoiceGate3D
console.log('\n4. Checking Cyber-Glassmorphism physical shader in ChoiceGate3D.tsx:');
const hasMeshPhysical = /<meshPhysicalMaterial\b/.test(gateCode);
const hasTransmission = /transmission\s*=\s*\{[\d.]+\}/.test(gateCode);
const hasRoughness = /roughness\s*=\s*\{[\d.]+\}/.test(gateCode);
const hasIor = /ior\s*=\s*\{[\d.]+\}/.test(gateCode);
const hasThickness = /thickness\s*=\s*\{[\d.]+\}/.test(gateCode);

console.log(`  - meshPhysicalMaterial present: ${hasMeshPhysical}`);
console.log(`  - transmission defined: ${hasTransmission}`);
console.log(`  - roughness defined: ${hasRoughness}`);
console.log(`  - ior defined: ${hasIor}`);
console.log(`  - thickness defined: ${hasThickness}`);

const postprocessingValid = hasEffectComposer && hasEnableNormalPassFalse && hasBloom && hasMipmapBlur && !deprecatedFound && hasMeshPhysical;

console.log(`\nPOSTPROCESSING & SHADER TEST VERDICT: ${postprocessingValid ? 'PASSED' : 'FAILED'}`);

const result = {
  hasEffectComposer,
  hasEnableNormalPassFalse,
  hasMultisampling,
  hasBloom,
  hasMipmapBlur,
  hasLuminanceThreshold,
  hasMeshPhysical,
  deprecatedFound,
  passed: postprocessingValid
};

fs.writeFileSync(path.resolve(__dirname, 'postprocessing_test_result.json'), JSON.stringify(result, null, 2));
process.exit(postprocessingValid ? 0 : 1);

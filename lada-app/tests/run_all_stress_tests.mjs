import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('   CHALLENGER 2: EMPIRICAL STRESS TESTING SUITE   ');
console.log('====================================================\n');

const testSuites = [
  {
    id: 'test_1_font',
    name: '3D Font Asset & German Glyph Coverage',
    script: path.resolve(__dirname, 'stress_test_font_glyphs.mjs')
  },
  {
    id: 'test_2_edge_cases',
    name: 'Song Edge Cases (0 lyrics, 100+ lyrics, 40 & 280 BPM)',
    script: path.resolve(__dirname, 'stress_test_song_edge_cases.mjs')
  },
  {
    id: 'test_3_postprocessing',
    name: 'Postprocessing & Shader Validation',
    script: path.resolve(__dirname, 'stress_test_postprocessing_shaders.mjs')
  },
  {
    id: 'test_4_canvas_absence',
    name: '2D Canvas Logic Absence & Architectural Purity',
    script: path.resolve(__dirname, 'stress_test_canvas_absence.mjs')
  }
];

const results = [];

for (const suite of testSuites) {
  console.log(`\n▶ RUNNING: ${suite.name}...`);
  const proc = spawnSync('node', [suite.script], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8'
  });

  const passed = proc.status === 0;
  console.log(proc.stdout);
  if (proc.stderr) {
    console.error(proc.stderr);
  }

  results.push({
    id: suite.id,
    name: suite.name,
    passed,
    exitCode: proc.status
  });
}

console.log('\n====================================================');
console.log('                 SUMMARY REPORT                     ');
console.log('====================================================');

let anyFailed = false;
for (const r of results) {
  const statusStr = r.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${statusStr}] ${r.name}`);
  if (!r.passed) anyFailed = true;
}

const finalVerdict = anyFailed ? 'REQUEST_CHANGES' : 'APPROVE';
console.log(`\nFINAL EMPIRICAL VERDICT: ${finalVerdict}`);

fs.writeFileSync(
  path.resolve(__dirname, 'master_stress_test_summary.json'),
  JSON.stringify({ timestamp: new Date().toISOString(), verdict: finalVerdict, suites: results }, null, 2)
);

process.exit(anyFailed ? 1 : 0);

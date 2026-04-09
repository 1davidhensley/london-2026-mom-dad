// One-off verification: extract data + birds from index.html and simulate matching.
// Run with: node docs/superpowers/birds-verify.js [dp|mom]
const fs = require('fs');
const path = require('path');

const mode = process.argv[2] || 'dp';
if (mode === 'parity') {
  runParityCheck();
  process.exit(0);
}
const htmlPath = mode === 'mom'
  ? path.join(__dirname, '..', '..', 'mom-dad', 'index.html')
  : path.join(__dirname, '..', '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const script = html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];

function runParityCheck() {
  const dpHtml = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
  const mdHtml = fs.readFileSync(path.join(__dirname, '..', '..', 'mom-dad', 'index.html'), 'utf8');
  const dp = loadBirds(dpHtml);
  const md = loadBirds(mdHtml);

  console.log('[Parity] D&P birds:', dp.length, '| M&D birds:', md.length);
  const mdLondon = md.filter(b => b.regions && b.regions.includes('london'));
  console.log('[Parity] M&D London birds:', mdLondon.length, '(should be 7)');
  console.log();

  // Map D&P ids to matching M&D ids (kingfisher is renamed in mom-dad for split)
  const idMap = {
    'common-kingfisher': 'common-kingfisher-london'
  };

  let diffs = 0;
  for (const dpBird of dp) {
    const mdId = idMap[dpBird.id] || dpBird.id;
    const mdBird = md.find(b => b.id === mdId);
    if (!mdBird) {
      console.log('  MISSING in M&D:', dpBird.id);
      diffs++;
      continue;
    }
    const sameName = mdBird.name === dpBird.name;
    const sameEmoji = mdBird.emoji === dpBird.emoji;
    const sameBlurb = mdBird.blurb === dpBird.blurb;
    const sameFact = mdBird.funFact === dpBird.funFact;
    const ok = sameName && sameEmoji && sameBlurb && sameFact;
    console.log(' ', ok ? 'MATCH' : 'DIFF ', dpBird.emoji, dpBird.name.padEnd(22),
      !sameName ? '[name]' : '',
      !sameEmoji ? '[emoji]' : '',
      !sameBlurb ? '[blurb]' : '',
      !sameFact ? '[funFact]' : '');
    if (!ok) diffs++;
  }
  console.log();
  console.log('Parity diffs:', diffs);
  console.log();
  console.log('(Any DIFF on blurb/funFact is fine IF it is one of the deliberate divergences');
  console.log('documented in the plan Task 17 Step 4 — pelican day-23 wink and kingfisher split.)');
}

function loadBirds(html) {
  const script = html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
  const startRe = /const\s+birds\s*=\s*\[/;
  const m = script.match(startRe);
  if (!m) throw new Error('No const birds');
  const start = m.index;
  let i = script.indexOf('[', start);
  let depth = 0, inStr = null, esc = false;
  for (; i < script.length; i++) {
    const ch = script[i];
    if (esc) { esc = false; continue; }
    if (inStr) {
      if (ch === '\\') esc = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  while (i < script.length && script[i] !== ';') i++;
  return new Function(script.slice(start, i + 1) + '\nreturn birds;')();
}

// Find the exact line-anchored terminators for the two consts
function extractConst(name) {
  const startRe = new RegExp('const\\s+' + name + '\\s*=\\s*\\[');
  const startMatch = script.match(startRe);
  if (!startMatch) throw new Error('No const ' + name);
  const start = startMatch.index;
  // Walk from `[` counting brackets (respecting strings) until matching `]`
  let i = script.indexOf('[', start);
  let depth = 0;
  let inStr = null;
  let escape = false;
  for (; i < script.length; i++) {
    const ch = script[i];
    if (escape) { escape = false; continue; }
    if (inStr) {
      if (ch === '\\') escape = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  // Skip trailing ;
  while (i < script.length && script[i] !== ';') i++;
  return script.slice(start, i + 1);
}

if (mode === 'dp') {
  const body = extractConst('dayData') + '\n' + extractConst('birds') + '\nreturn {dayData, birds};';
  const { dayData, birds } = new Function(body)();

  console.log('[David & Paula] dayData days:', dayData.length, '| birds:', birds.length);
  console.log();
  console.log('== Day → Bird match simulation ==');
  for (const day of dayData) {
    const matches = birds.filter(b => b.dayNumbers.includes(day.number));
    const label = matches.length ? matches.map(b => b.emoji + ' ' + b.name).join(' + ') : '(no chip)';
    console.log('  Day ' + day.number + ' — ' + day.theme);
    console.log('    →', label);
  }
  const validDays = new Set(dayData.map(d => d.number));
  let orphans = 0;
  for (const b of birds) for (const n of b.dayNumbers) {
    if (!validDays.has(n)) { console.log('ORPHAN:', b.name, 'day', n); orphans++; }
  }
  console.log('\nOrphans found:', orphans);
  console.log('\n== Bird copy integrity ==');
  for (const b of birds) {
    const missing = [];
    for (const k of ['id', 'name', 'emoji', 'where', 'blurb', 'funFact']) if (!b[k]) missing.push(k);
    if (!b.dayNumbers || !b.dayNumbers.length) missing.push('dayNumbers');
    console.log(' ', b.emoji, b.name.padEnd(24), missing.length ? 'MISSING ' + missing.join(',') : 'OK');
  }
} else {
  // mom-dad mode: match by weather.location region
  const body = extractConst('itinerary') + '\n' + extractConst('birds') + '\nreturn {itinerary, birds};';
  const { itinerary, birds } = new Function(body)();

  console.log('[Mom & Dad] itinerary days:', itinerary.length, '| birds:', birds.length);
  console.log();
  const counts = {};
  for (const b of birds) for (const r of b.regions) counts[r] = (counts[r] || 0) + 1;
  console.log('Birds per region:', counts);
  console.log();
  console.log('== Day → bird match simulation ==');
  for (const d of itinerary) {
    const region = (d.weather.location || '').toLowerCase();
    const matches = birds.filter(b => b.regions.includes(region));
    console.log('  ' + d.date + ' [' + d.weather.location + '] → ' + matches.length + ' birds: ' + matches.map(b => b.name).join(', '));
  }
  console.log('\n== Bird integrity check ==');
  for (const b of birds) {
    const missing = [];
    for (const k of ['id', 'name', 'emoji', 'where', 'blurb', 'funFact']) if (!b[k]) missing.push(k);
    if (!b.regions || !b.regions.length) missing.push('regions');
    console.log(' ', b.emoji, b.name.padEnd(24), '[' + b.regions.join(',').padEnd(10) + ']', missing.length ? 'MISSING ' + missing.join(',') : 'OK');
  }
}

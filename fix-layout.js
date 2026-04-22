const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'container/provisioning/dashboards/cloudflare-network-analytics.json');
const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// ============================================================
// 1. Move Passed panels (id=15,16) from Overview into Traffic Statistics row
// ============================================================
// Remove panels 15 and 16 from top-level
const passed15 = d.panels.find(p => p.id === 15);
const passed16 = d.panels.find(p => p.id === 16);
d.panels = d.panels.filter(p => p.id !== 15 && p.id !== 16);
console.log('Removed Passed panels (15, 16) from Overview');

// Find Traffic Statistics row and prepend passed panels before dropped ones
const tsRow = d.panels.find(p => p.type === 'row' && p.title === 'Traffic Statistics');
if (!tsRow) { console.error('Traffic Statistics row not found'); process.exit(1); }

// Set gridPos for passed panels (before the dropped ones)
// Passed panels go first, then dropped panels below
passed15.gridPos = { h: 8, w: 12, x: 0, y: 36 };
passed16.gridPos = { h: 8, w: 12, x: 12, y: 36 };
// Push dropped panels down
for (const p of tsRow.panels) {
  p.gridPos.y = 44; // below passed panels (36 + 8)
}
tsRow.panels = [passed15, passed16, ...tsRow.panels];
console.log('Moved Passed panels into Traffic Statistics row (' + tsRow.panels.length + ' panels)');

// ============================================================
// 2. Adjust Overview panel positions (Traffic by Dest Prefix moves up)
// ============================================================
// Panels 1 and 2 were at y=26 (below the Passed panels). Move them up to y=18.
for (const p of d.panels) {
  if (p.type !== 'row' && (p.id === 1 || p.id === 2)) {
    console.log('  Panel ' + p.id + ' y: ' + p.gridPos.y + ' -> 18');
    p.gridPos.y = 18;
  }
}

// ============================================================
// 3. Recalculate row y positions
//    Overview children now end at y=18+h=8 = 26
//    So first collapsed row starts at y=26
// ============================================================
const rowOrder = ['Traffic Statistics', 'Advanced TCP Protection', 'Magic Firewall', 'Spectrum', 'Diagnostics'];

// Move Diagnostics to end: remove and re-insert at the right position
const diagIdx = d.panels.findIndex(p => p.type === 'row' && p.title === 'Diagnostics');
const [diagRow] = d.panels.splice(diagIdx, 1);

// Find where Spectrum row is and insert Diagnostics after it
const specIdx = d.panels.findIndex(p => p.type === 'row' && p.title === 'Spectrum');
d.panels.splice(specIdx + 1, 0, diagRow);
console.log('Moved Diagnostics row to after Spectrum');

// Now set y positions for all rows
let rowY = 26;
for (const title of rowOrder) {
  const row = d.panels.find(p => p.type === 'row' && p.title === title);
  if (row) {
    console.log('  Row ' + title + ': y ' + row.gridPos.y + ' -> ' + rowY);
    row.gridPos.y = rowY;
    rowY++;
  }
}

// ============================================================
// 4. Fix Packet Size Distribution: column type number -> string
// ============================================================
const diagRowFinal = d.panels.find(p => p.type === 'row' && p.title === 'Diagnostics');
for (const panel of diagRowFinal.panels) {
  if (panel.id === 23) { // Packet Size Distribution
    for (const target of panel.targets) {
      for (const col of target.columns) {
        if (col.selector === 'dimensions.ipTotalLengthBuckets' && col.type === 'number') {
          col.type = 'string';
          console.log('Fixed Panel 23: ipTotalLengthBuckets type number -> string');
        }
      }
    }
  }
}

// ============================================================
// Write and verify
// ============================================================
fs.writeFileSync(filePath, JSON.stringify(d, null, 2) + '\n');
console.log('\nDone. Verifying layout...');

const v = JSON.parse(fs.readFileSync(filePath, 'utf8'));
for (const p of v.panels) {
  if (p.type === 'row') {
    console.log('ROW: ' + p.title + ' y=' + p.gridPos.y + ' collapsed=' + p.collapsed + ' panels=' + (p.panels ? p.panels.length : 0));
    for (const cp of (p.panels || [])) {
      console.log('  -> id=' + cp.id + ' "' + cp.title + '" y=' + cp.gridPos.y);
    }
  } else {
    console.log('  id=' + p.id + ' "' + p.title + '" y=' + p.gridPos.y);
  }
}

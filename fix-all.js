const fs = require('fs');
const f = 'container/provisioning/dashboards/cloudflare-network-analytics.json';
const d = JSON.parse(fs.readFileSync(f, 'utf8'));

// ============================================================
// FIX #3: Pie charts - completely new approach
// Change reduceOptions.values to true so each row = a slice
// Remove transformations that may interfere
// ============================================================
for (const id of [3, 4]) {
  const p = d.panels.find(x => x.id === id);
  if (!p) { console.log(`Panel ${id} not found!`); continue; }
  
  // Set reduceOptions to use each row as a value (not aggregate)
  p.options.reduceOptions = {
    values: true,
    calcs: ["lastNotNull"],
    fields: ""
  };
  
  // Remove transformations - let the pie chart handle raw data
  p.transformations = [];
  
  console.log(`Fixed pie chart "${p.title}": values=true, no transformations`);
}

// ============================================================
// FIX #4: Move 3 Spectrum panels inside the collapsed row
// The row (id 500) has panels:[], but the 3 spectrum panels
// (ids 12, 13, 14) are separate entries after the row.
// Grafana collapsed rows need child panels inside panels[].
// ============================================================
const rowIdx = d.panels.findIndex(x => x.id === 500 && x.type === 'row');
if (rowIdx === -1) {
  console.log('Spectrum row not found!');
} else {
  // Collect all panels after the row that belong to Spectrum (y >= 46)
  const spectrumPanels = [];
  const remaining = [];
  for (let i = rowIdx + 1; i < d.panels.length; i++) {
    const panel = d.panels[i];
    if (panel.type !== 'row' && panel.gridPos && panel.gridPos.y >= 46) {
      spectrumPanels.push(panel);
    } else {
      remaining.push(panel);
    }
  }
  
  // Move them inside the row's panels array
  d.panels[rowIdx].panels = spectrumPanels;
  
  // Rebuild panels array: everything up to and including the row, then remaining
  d.panels = [...d.panels.slice(0, rowIdx + 1), ...remaining];
  
  console.log(`Moved ${spectrumPanels.length} panels into Spectrum row (ids: ${spectrumPanels.map(p => p.id).join(', ')})`);
}

fs.writeFileSync(f, JSON.stringify(d, null, 2) + '\n');
console.log('Done');

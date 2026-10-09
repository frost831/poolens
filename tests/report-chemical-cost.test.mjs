import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const start = app.indexOf('function getReportChemRows() {');
const end = app.indexOf('function hasAnyReportReading() {', start);
assert.ok(start >= 0 && end > start);

function reportCostHarness(values, rows) {
  const elements = { 'rpt-cost-total': { textContent: '' } };
  const context = {
    document: {
      querySelectorAll: () => rows.map(id => ({ id: `chem-row-${id}` })),
      getElementById: id => elements[id] || null,
    },
    _rptVal: id => values[id] ?? '',
    a3Text: key => ({ 'packet.costIncomplete': 'Incomplete', 'packet.costNotEntered': 'Not entered' })[key],
    setEl: (id, value) => { elements[id] = { textContent: value }; },
  };
  const methods = vm.runInNewContext(`${app.slice(start, end)}\n({ getReportChemRows, reportChemicalCost, updateReportCostSummary })`, context);
  return { ...methods, elements };
}

test('missing chemical prices stay unknown in the report and total', () => {
  const h = reportCostHarness({ 'cr-name-1': 'Chlorine', 'cr-amt-1': '1 gal' }, ['1']);
  const chemicals = h.getReportChemRows();
  assert.equal(chemicals[0].cost, null);
  assert.equal(h.reportChemicalCost(chemicals), null);
  h.updateReportCostSummary();
  assert.equal(h.elements['rpt-cost-total'].textContent, 'Not entered');
  assert.match(h.elements['rpt-inventory-summary'].textContent, /Enter every chemical cost/);
});

test('partial pricing is not presented as a complete stop cost', () => {
  const h = reportCostHarness({ 'cr-name-1': 'Chlorine', 'cr-cost-1': '8.25', 'cr-name-2': 'Acid' }, ['1', '2']);
  assert.equal(h.reportChemicalCost(h.getReportChemRows()), null);
  h.updateReportCostSummary();
  assert.equal(h.elements['rpt-cost-total'].textContent, 'Incomplete');
});

test('explicit zero is a valid entered price and remains distinct from blank', () => {
  const h = reportCostHarness({ 'cr-name-1': 'Customer chemical', 'cr-cost-1': '0' }, ['1']);
  assert.equal(h.reportChemicalCost(h.getReportChemRows()), 0);
  h.updateReportCostSummary();
  assert.equal(h.elements['rpt-cost-total'].textContent, '$0.00');
});

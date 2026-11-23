let learningPilotData = null;
async function learningOwnerRequest(body = null) {
  const key = secret();
  if (!key) throw new Error('Enter your owner dashboard secret first.');
  const response = await fetch('/api/learning', { method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || 'Learning request failed.');
  return data;
}

async function loadLearningPilot() {
  const panel = document.getElementById('learning-pilot');
  panel.textContent = 'Loading learning review…';
  try {
    learningPilotData = await learningOwnerRequest();
    const data = learningPilotData, latest = data.versions[0], report = latest?.report;
    const active = data.versions.find(v => v.status === 'active');
    panel.innerHTML = `<div class="actions"><span class="pill">${esc(active ? 'Active reviewed knowledge' : 'Shadow mode')}</span><span class="tiny">${data.counts.pending} pending · ${data.counts.verified} verified · ${data.counts.real} real cases</span></div>
      <p class="tiny">${esc(report ? `${report.holdoutGroups ?? 0} independent holdout groups. ${report.promotable ? 'Gate passed.' : (report.reasons || []).join(' ')}` : 'No evaluation yet. New feedback must be verified before it can be evaluated.')}</p>
      <div class="actions"><button type="button" onclick="learningOwnerAction('evaluate')">Evaluate candidate</button>
      ${latest?.status === 'candidate' && report?.promotable ? `<button type="button" onclick="learningOwnerAction('promote','${esc(latest.id)}')">Activate verified candidate</button>` : ''}
      ${active ? '<button type="button" class="warn" onclick="learningOwnerAction(\'rollback\')">Return to baseline</button>' : ''}</div>
      <p id="learning-owner-status" role="status" class="tiny"></p>
      <div style="margin-top:14px;">${data.cases.filter(c => c.status === 'pending').map(c => {
        const o = JSON.parse(c.observation);
        return `<article style="border-top:1px solid #dbe8ef;padding:14px 0;" data-learning-case="${esc(c.id)}">
          <strong>${esc([o.brand, o.model, o.component].filter(Boolean).join(' / ') || o.category)}</strong>
          <p class="tiny">${esc(c.outcome)} · ${esc(c.traffic_class)} · ${esc(c.created_at)}</p><p>${esc(c.reported_label || '')}</p><p>${esc(c.note || '')}</p>
          <label class="tiny" for="label-${esc(c.id)}">Verified family</label><select id="label-${esc(c.id)}" style="min-height:44px;margin:5px 0 10px;"><option value="">Cannot identify / abstain</option>${data.labels.map(l => `<option value="${esc(l.id)}">${esc(l.name)}</option>`).join('')}</select>
          <label class="tiny" for="evidence-${esc(c.id)}">Official manufacturer reference URL</label><input id="evidence-${esc(c.id)}" type="url" placeholder="https://manufacturer.example/manual" style="min-height:44px;margin:5px 0 10px;">
          <div class="actions"><button type="button" onclick="reviewLearningCase('${esc(c.id)}','verified')">Verify against reference</button><button type="button" class="secondary" onclick="reviewLearningCase('${esc(c.id)}','rejected')">Reject contribution</button></div>
        </article>`;
      }).join('') || '<p class="tiny">No pending feedback. Consented PartSnap contributions will appear here.</p>'}</div>`;
  } catch (error) { panel.textContent = error.message; }
}

async function learningOwnerAction(action, id) {
  const status = document.getElementById('learning-owner-status');
  if (status) status.textContent = 'Saving…';
  try { await learningOwnerRequest({ action, id }); await loadLearningPilot(); }
  catch (error) { if (status) status.textContent = error.message; }
}

async function reviewLearningCase(id, status) {
  const message = document.getElementById('learning-owner-status');
  try {
    await learningOwnerRequest({ action: 'review', id, status, expectedLabel: document.getElementById(`label-${id}`).value || null,
      evidenceUrl: document.getElementById(`evidence-${id}`).value.trim(), evidenceKind: 'manufacturer_reference' });
    await loadLearningPilot();
  } catch (error) { if (message) message.textContent = error.message; }
}

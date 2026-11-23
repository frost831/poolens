// Uses the existing signed-in request helper. Never uploads an image or email.
function renderLearningGuidance(learning) {
  if (learning?.mode !== 'active' || !learning.candidates?.length) return '';
  const cards = learning.candidates.filter(c => /^https:\/\//.test(c.evidenceUrl || ''));
  return `<section style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;padding:12px;margin:10px 0;"><h3 style="font-size:14px;color:#065f46;margin:0 0 6px;">Reviewed equipment guidance</h3>
    ${cards.map(c => `<p style="font-size:12px;line-height:1.5;color:#064e3b;"><a href="${escAttr(c.evidenceUrl)}" target="_blank" rel="noopener noreferrer">${escHtml(c.name || c.label)}</a> — family reference only. Verify model, dimensions and fitment before ordering.</p>`).join('')}</section>`;
}

function renderLearningFeedback(outcome = 'helpful') {
  const panel = document.getElementById('partsnap-feedback-panel');
  const learning = _lastPartSnapResult?.learning;
  if (!panel || !learning?.receipt) return;
  const labels = { helpful: 'Helpful', saved_time: 'Saved time', wrong: 'Wrong result', missing: 'Missing information', confirmed: 'Confirmed identification' };
  panel.innerHTML = `
    <section aria-label="Improve PartSnap" style="background:#fff;border:1px solid #99c9ca;border-radius:12px;padding:16px;margin:8px 0 20px;">
      <p style="color:#0f766e;font-size:11px;font-weight:900;margin:0 0 5px;">PARTSNAP FEEDBACK</p>
      <h3 style="font-size:17px;margin:0 0 8px;color:#0f172a;">Help the next identification</h3>
      <label for="learning-outcome" style="display:block;font-weight:700;font-size:13px;margin-bottom:5px;">How did this result work?</label>
      <select id="learning-outcome" style="width:100%;min-height:44px;padding:9px;border:1px solid #94a3b8;border-radius:8px;background:#fff;margin-bottom:12px;">
        ${Object.entries(labels).map(([key, label]) => `<option value="${key}" ${key === outcome ? 'selected' : ''}>${label}</option>`).join('')}
      </select>
      <label for="learning-correction" style="display:block;font-weight:700;font-size:13px;margin-bottom:5px;">Correct equipment or part name (optional)</label>
      <input id="learning-correction" maxlength="100" placeholder="For example: Hayward Super Pump basket" style="width:100%;box-sizing:border-box;min-height:44px;padding:10px;border:1px solid #94a3b8;border-radius:8px;margin-bottom:12px;">
      <label for="learning-note" style="display:block;font-weight:700;font-size:13px;margin-bottom:5px;">What confirmed it? (optional)</label>
      <textarea id="learning-note" maxlength="500" rows="3" placeholder="Equipment details only. Leave out names, addresses, contact details and links." style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #94a3b8;border-radius:8px;resize:vertical;margin-bottom:12px;"></textarea>
      <label style="display:flex;gap:10px;align-items:flex-start;font-size:12px;line-height:1.5;color:#334155;margin-bottom:14px;">
        <input id="learning-consent" type="checkbox" style="width:20px;height:20px;flex-shrink:0;margin-top:2px;">
        <span>I agree to share this scan's equipment details and my feedback to improve SplashLens. Photos and contact details are excluded. Feedback is reviewed before use. <a href="/privacy.html#learning-feedback" target="_blank" rel="noopener">Details</a></span>
      </label>
      <button id="learning-submit" type="button" onclick="submitLearningFeedback()" style="width:100%;min-height:46px;background:#0f766e;color:white;border:0;border-radius:8px;font-size:14px;font-weight:800;cursor:pointer;">Send for review</button>
      <p id="learning-status" role="status" aria-live="polite" style="font-size:12px;line-height:1.5;color:#334155;margin:10px 0 0;"></p>
      <button type="button" onclick="withdrawLearningFeedback()" style="min-height:44px;background:transparent;border:0;color:#475569;text-decoration:underline;font-size:12px;cursor:pointer;margin-top:5px;">Delete my learning feedback</button>
    </section>`;
  panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

async function submitLearningFeedback() {
  const status = document.getElementById('learning-status'), button = document.getElementById('learning-submit');
  if (!status || !button || button.disabled) return;
  if (!document.getElementById('learning-consent')?.checked) { status.textContent = 'Please agree to share the equipment details before sending.'; return; }
  const learning = _lastPartSnapResult?.learning;
  if (!learning?.receipt) { status.textContent = 'Run a new PartSnap scan before sending feedback.'; return; }
  button.disabled = true;
  status.textContent = 'Saving your feedback…';
  try {
    const payload = await splashLensProtectedRequest('/api/learning', {
      action: 'submit', receipt: learning.receipt, consent: true, consentVersion: learning.consentVersion,
      outcome: document.getElementById('learning-outcome').value,
      reportedLabel: document.getElementById('learning-correction').value.trim(), note: document.getElementById('learning-note').value.trim(),
    });
    savePartSnapReviewTicket({ id: payload.ticketId, createdAt: new Date().toLocaleString(), status: 'sent to review', summary: 'Equipment feedback awaiting verification' });
    trackSplashLensEvent('partsnap_result_feedback', { outcome: document.getElementById('learning-outcome').value, review_ticket_id: payload.ticketId, source: 'consented-learning' });
    status.textContent = `Saved for review. Ticket ${payload.ticketId}. This feedback has not changed live answers.`;
    button.textContent = 'Saved for review';
  } catch (error) {
    status.textContent = error.message || 'Could not save. Your details are still here; please try again.';
    button.disabled = false;
  }
}

async function withdrawLearningFeedback() {
  const status = document.getElementById('learning-status');
  if (!status) return;
  status.textContent = 'Deleting your learning feedback…';
  try {
    await splashLensProtectedRequest('/api/learning', { action: 'forget' });
    status.textContent = 'Your stored learning feedback has been deleted and knowledge snapshots have been retired.';
    const submit = document.getElementById('learning-submit');
    if (submit) { submit.disabled = false; submit.textContent = 'Send for review'; }
  } catch (error) { status.textContent = error.message || 'Could not delete. Please try again.'; }
}

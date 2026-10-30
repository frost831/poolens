const form = document.getElementById('deletion-form');
const status = document.getElementById('status');
const email = document.getElementById('email');
const code = document.getElementById('code');
const submit = document.getElementById('submit-request');
let accountToken = '';

function show(message, isError = false) {
  status.textContent = message;
  status.dataset.error = String(isError);
}

async function post(path, body, token = '') {
  const response = await fetch(path, {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'X-SplashLens-Account-Token': token } : {}) },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    const error = new Error(result.error || 'Please try again.');
    error.status = response.status;
    throw error;
  }
  return result;
}

document.getElementById('send-code').addEventListener('click', async (event) => {
  if (!email.reportValidity()) return;
  const button = event.currentTarget;
  button.disabled = true;
  accountToken = '';
  submit.disabled = true;
  show('Sending a verification code…');
  try {
    await post('/api/free-profile', { action: 'request_code', feature: 'privacy_deletion', email: email.value.trim(), props: { path: '/data-deletion.html' } });
    document.getElementById('verify-section').hidden = false;
    code.focus();
    show('Enter the code sent to your SplashLens email. It expires in 10 minutes.');
  } catch (error) { show(error.message, true); }
  finally { button.disabled = false; }
});

document.getElementById('verify-code').addEventListener('click', async (event) => {
  if (!email.reportValidity() || !code.reportValidity()) return;
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const result = await post('/api/free-profile', { action: 'verify_code', email: email.value.trim(), code: code.value.trim(), props: { source_feature: 'privacy_deletion', path: '/data-deletion.html' } });
    if (!result.accountToken?.startsWith('sl_account_v1.')) throw new Error('Verification did not return an account session. Please request a new code.');
    accountToken = result.accountToken;
    email.readOnly = true;
    document.getElementById('send-code').disabled = true;
    submit.disabled = false;
    show('Email verified. Choose what to delete, type DELETE, and submit your request.');
  } catch (error) { show(error.message, true); }
  finally { button.disabled = Boolean(accountToken); code.readOnly = Boolean(accountToken); }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!accountToken || !form.reportValidity()) return;
  submit.disabled = true;
  try {
    const result = await post('/api/privacy-deletion', {
      scope: form.elements.scope.value,
      confirmation: form.elements.confirmation.value,
    }, accountToken);
    show(`Request ${result.requestId} received. This is a request, not a completed deletion. We process it manually within ${result.processingDays} days (by ${new Date(result.expectedBy).toLocaleDateString()}) and confirm completion by email.`);
    form.hidden = true;
    accountToken = '';
    code.value = '';
  } catch (error) {
    show(error.message, true);
    if (error.status === 401 || error.status === 403) {
      accountToken = '';
      email.readOnly = false;
      code.value = '';
      code.readOnly = false;
      document.getElementById('send-code').disabled = false;
      document.getElementById('verify-code').disabled = false;
    }
    submit.disabled = !accountToken;
  }
});

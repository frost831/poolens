import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Native window proof is required in addition to DOM assertions: automation
// can still operate a Chrome page behind an Android protection/error dialog.
export function checkNativeWindow(xml) {
  if (typeof xml !== 'string' || !/<hierarchy\b/.test(xml) || !/<node\b/.test(xml) || !/<\/hierarchy>\s*$/.test(xml)) {
    return { ok: false, code: 'missing_native_window' };
  }
  if (/isn(?:'|&apos;)t responding|aerr_close/i.test(xml)) return { ok: false, code: 'android_anr' };
  if (/Check that Google Play is enabled|up-to-date version before opening the app/i.test(xml)) return { ok: false, code: 'google_play_required' };
  if (/android:id\/(?:alertTitle|buttonPanel)|text="Something went wrong"/i.test(xml)) return { ok: false, code: 'unexpected_native_dialog' };
  return { ok: true, code: 'native_window_clear' };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let result;
  try { result = checkNativeWindow(readFileSync(process.argv[2], 'utf8')); }
  catch { result = { ok: false, code: 'missing_native_window' }; }
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}

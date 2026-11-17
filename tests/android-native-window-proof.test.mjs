import test from 'node:test';
import assert from 'node:assert/strict';
import { checkNativeWindow } from '../tools/check-android-native-window.mjs';

test('native acceptance rejects observed System UI and Google Play protection dialogs even when DOM checks pass', () => {
  const window = text => `<hierarchy rotation="0"><node class="android.widget.FrameLayout"><node class="android.widget.TextView" text="${text}" /></node></hierarchy>`;
  assert.deepEqual(checkNativeWindow(window("System UI isn't responding")), { ok: false, code: 'android_anr' });
  assert.deepEqual(checkNativeWindow(window("Check that Google Play is enabled on your device and that you're using an up-to-date version before opening the app.")), { ok: false, code: 'google_play_required' });
  assert.equal(checkNativeWindow(window('Something went wrong')).ok, false);
  assert.equal(checkNativeWindow('<hierarchy><node resource-id="android:id/alertTitle" text="Blocked" /></hierarchy>').ok, false);
});

test('native window proof requires an actual hierarchy and permits normal app or keyboard controls', () => {
  for (const xml of [undefined, '', 'DOM tests passed', '<hierarchy />', '<hierarchy><node />']) assert.equal(checkNativeWindow(xml).ok, false);
  assert.deepEqual(checkNativeWindow('<hierarchy><node package="com.android.chrome" text="Work email" /><node text="Not now" /></hierarchy>'), { ok: true, code: 'native_window_clear' });
});

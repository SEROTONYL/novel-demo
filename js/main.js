import { consentValid, resetConsent } from './storage.js';
import { createScreens } from './screens.js';
import * as disclaimer from './screens/disclaimer.js';
import * as splash from './screens/splash.js';

async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

// ?reset сбрасывает согласие, чтобы предупреждение можно было показать снова
const params = new URLSearchParams(location.search);
if (params.has('reset')) {
  resetConsent();
  params.delete('reset');
  const rest = params.toString();
  history.replaceState(null, '', location.pathname + (rest ? `?${rest}` : ''));
}

try {
  const [config, ui] = await Promise.all([loadJson('data/config.json'), loadJson('data/ui.json')]);
  document.title = config.title;

  const screens = createScreens({
    root: document.getElementById('app'),
    fadeEl: document.getElementById('fade'),
    screens: { disclaimer, splash },
    ctx: { config, ui },
  });

  screens.start(consentValid(config.consentDays) ? 'splash' : 'disclaimer');
} catch (err) {
  document.getElementById('app').textContent = `Не удалось загрузить игру: ${err.message}`;
}

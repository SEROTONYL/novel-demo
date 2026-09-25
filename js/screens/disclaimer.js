// Экран предупреждения. Тело текста без эффектов, глитч только на заголовке.
import { saveConsent } from '../storage.js';

// Должны совпадать с анимацией .dc-line в css/disclaimer.css
const REVEAL_BASE = 300;
const REVEAL_STEP = 280;
const REVEAL_DUR = 900;

const DARK_MS = 1400;
const TITLE_MS = 1100;
const NO_SCROLL_UNLOCK_MS = 2000;

function template(t) {
  const steps = t.steps.map((s) => `<li class="dc-line">${s}</li>`).join('');
  const remember = t.remember.map((s) => `<p class="dc-line">${s}</p>`).join('');
  return `
    <section class="dc" data-state="dark" data-hint="off">
      <div class="dc-blinds" aria-hidden="true"></div>
      <header class="dc-head">
        <h1 class="dc-title"></h1>
        <p class="dc-sub"></p>
      </header>
      <div class="dc-scroll" tabindex="0" role="region" aria-label="Текст предупреждения">
        <div class="dc-body">
          <p class="dc-line dc-attn">${t.attention}</p>
          <p class="dc-line">${t.intro}</p>
          <p class="dc-line">${t.ifPanic}</p>
          <ol class="dc-steps">${steps}</ol>
          ${remember}
          <p class="dc-line">${t.emergency}</p>
          <p class="dc-line dc-note">${t.note}</p>
          <div class="dc-foot dc-line">
            <label class="dc-check">
              <input type="checkbox" disabled>
              <span>${t.checkLabel}</span>
            </label>
            <button class="dc-btn" type="button" disabled>${t.continue}</button>
          </div>
        </div>
      </div>
      <p class="dc-hint" aria-live="polite"><span>↓</span> ${t.scrollHint}</p>
    </section>`;
}

export function mount(root, { ui, go }) {
  const t = ui.disclaimer;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.innerHTML = template(t);
  const dc = root.querySelector('.dc');
  const title = root.querySelector('.dc-title');
  const scroller = root.querySelector('.dc-scroll');
  const check = root.querySelector('.dc-check input');
  const button = root.querySelector('.dc-btn');
  const lines = root.querySelectorAll('.dc-line');

  title.textContent = t.title;
  title.dataset.text = t.title;
  root.querySelector('.dc-sub').textContent = t.subtitle;
  lines.forEach((el, i) => el.style.setProperty('--i', i));

  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };

  let alive = true;
  let revealed = false;
  let unlocked = false;
  let idleTimer = null;

  const atEnd = () => scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 12;
  const overflows = () => scroller.scrollHeight > scroller.clientHeight + 2;

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    dc.dataset.hint = 'off';
    check.disabled = false;
  }

  // Чекмарк оживает, когда текст дочитан до конца. Если прокрутки нет,
  // то через пару секунд после появления.
  function update() {
    if (!alive || !revealed || unlocked) return;
    if (overflows()) {
      if (idleTimer) {
        clearTimeout(idleTimer);
        timers.delete(idleTimer);
        idleTimer = null;
      }
      if (atEnd()) unlock();
      else dc.dataset.hint = 'on';
    } else {
      dc.dataset.hint = 'off';
      if (!idleTimer) idleTimer = later(unlock, NO_SCROLL_UNLOCK_MS);
    }
  }

  function glitch(ms) {
    title.classList.add('is-glitch');
    later(() => title.classList.remove('is-glitch'), ms);
  }

  function glitchLater() {
    later(() => {
      glitch(240);
      glitchLater();
    }, 4000 + Math.random() * 5000);
  }

  function light() {
    dc.dataset.state = 'lit';
    const revealMs = reduced ? 0 : REVEAL_BASE + (lines.length - 1) * REVEAL_STEP + REVEAL_DUR;
    later(() => {
      revealed = true;
      update();
    }, revealMs);
    if (!reduced) glitchLater();
  }

  if (reduced) {
    light();
  } else {
    later(() => {
      dc.dataset.state = 'title';
      glitch(420);
      later(light, TITLE_MS);
    }, DARK_MS);
  }

  scroller.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);

  check.addEventListener('change', () => {
    button.disabled = !check.checked;
  });

  button.addEventListener('click', () => {
    button.disabled = true;
    check.disabled = true;
    saveConsent();
    go('splash');
  });

  return function unmount() {
    alive = false;
    timers.forEach(clearTimeout);
    timers.clear();
    removeEventListener('resize', update);
  };
}

// Главное меню: портрет, руки на отдельных слоях, кнопки.
// Кнопки «Играть / Сохранения / Настройки» пока без действия.
const Z = { behind: 1, front: 10 };

function rotateHint(root) {
  const el = document.createElement('div');
  el.className = 'mn-rot';
  el.setAttribute('role', 'alert');
  el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg><div>Лучше играть, повернув телефон</div>`;
  root.appendChild(el);
  const portrait = matchMedia('(orientation: portrait)');
  const touch = matchMedia('(pointer: coarse)');
  let t = 0, h = 0;
  const hide = () => {
    clearTimeout(t);
    el.classList.remove('vis');
    clearTimeout(h);
    h = setTimeout(() => el.classList.remove('on'), 400);
  };
  const show = () => {
    clearTimeout(h);
    el.classList.add('on');
    requestAnimationFrame(() => el.classList.add('vis'));
    clearTimeout(t);
    t = setTimeout(hide, 5000);
  };
  const check = () => (portrait.matches && touch.matches && innerWidth < 900 ? show() : hide());
  portrait.addEventListener('change', check);
  el.addEventListener('click', hide);
  check();
  return () => {
    portrait.removeEventListener('change', check);
    clearTimeout(t);
    clearTimeout(h);
  };
}

// Свет экрана «живёт»: раз в 2–5 с меняется пост — короткий провал яркости,
// новая яркость, иногда розоватый оттенок; изредка вспышка уведомления.
function feedLight(root) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const $ = (q) => root.querySelector(q);
  const base = () => [$('.g-base'), ...root.querySelectorAll('.mn-hand-glow')];
  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
  };
  const tick = () => {
    const b = 0.55 + Math.random() * 0.45;
    base().forEach((el) => (el.style.opacity = b * 0.6));
    later(() => base().forEach((el) => (el.style.opacity = b)), 220);
    $('.g-pink').style.opacity = Math.random() < 0.35 ? 0.3 + Math.random() * 0.4 : 0;
    if (Math.random() < 0.15) {
      later(() => $('.g-flash').classList.add('on'), 600);
      later(() => $('.g-flash').classList.remove('on'), 720);
    }
    later(tick, 2000 + Math.random() * 3000);
  };
  later(tick, 1200);
  return () => timers.forEach(clearTimeout);
}

export function mount(root, { config, go }) {
  root.innerHTML = `
    <section class="mn">
      <div class="mn-stage">
        <div class="mn-scene"><img src="assets/menu/face-light.webp" alt=""><img src="assets/menu/face-dark.webp" alt="">
          <div class="mn-glow" aria-hidden="true"><i class="g-shade"></i><i class="g-base"></i><i class="g-pink"></i><i class="g-flash"></i></div>
        </div>
        <div class="mn-hands"></div>
        <button class="mn-back" type="button">← К дисклеймеру</button>
        <div class="mn-ui">
          <h1 class="mn-title">Out of<span>the Feed</span></h1>
          <div class="mn-menu">
            <button class="mn-btn" type="button">Играть</button>
            <button class="mn-btn" type="button">Сохранения</button>
            <button class="mn-btn" type="button">Настройки</button>
          </div>
        </div>
      </div>
    </section>`;

  root.querySelector('.mn-back').addEventListener('click', () => go('disclaimer'));

  let alive = true;
  fetch('data/menu-scene.json', { cache: 'no-cache' })
    .then((r) => r.json())
    .then((cfg) => {
      if (!alive) return;
      const layer = root.querySelector('.mn-hands');
      Object.values(cfg.hands).forEach((h, i) => {
        const d = document.createElement('div');
        d.className = 'mn-hand';
        d.style.left = h.anchor === 'left' ? '0' : 'auto';
        d.style.right = h.anchor === 'right' ? '0' : 'auto';
        d.style.transformOrigin = h.pivot;
        d.style.transform = `translate(${h.x}%,${h.y}%) rotate(${h.angle}deg) scale(${h.scale})`;
        d.style.zIndex = Z[h.layer] + i;
        d.innerHTML = `<div class="mn-hand-in"><img src="${h.src}" alt=""><i class="mn-hand-glow" aria-hidden="true"></i></div>`;
        const b = h.breathe;
        if (b) {
          const inner = d.firstElementChild;
          inner.style.transformOrigin = b.origin || h.pivot;
          inner.style.setProperty('--bx', `${b.x}%`);
          inner.style.setProperty('--by', `${b.y}%`);
          inner.style.setProperty('--ba', `${b.angle}deg`);
          inner.style.animation = `mn-breathe ${b.period / 2}s ease-in-out ${b.delay}s infinite alternate`;
        }
        const g = d.querySelector('.mn-hand-glow');
        g.style.webkitMaskImage = g.style.maskImage = `url(${h.src})`;
        layer.appendChild(d);
      });
    })
    .catch(() => {});

  const stopHint = rotateHint(root);
  const stopFeed = feedLight(root);
  return () => {
    alive = false;
    stopHint();
    stopFeed();
  };
}

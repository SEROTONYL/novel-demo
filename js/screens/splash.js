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
  const base = () => [$('.g-base'), $('.mn-dust'), ...root.querySelectorAll('.mn-hand-glow')];
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

// Пылинки в конусе света: случайное место, размер, скорость, снос вбок
function dust(box, n) {
  const r = (a, b) => a + Math.random() * (b - a);
  for (let k = 0; k < n; k++) {
    const p = document.createElement('i');
    const t = r(8, 15);
    p.style.cssText = `left:${r(58, 86)}%;top:${r(72, 100)}%;--s:${r(0.35, 1)}%;--t:${t}s;--d:${-r(0, t)}s;--dx:${r(-3, 3)}cqw;--o:${r(0.5, 1)}`;
    box.appendChild(p);
  }
}

// Глитч: частоты в секундах, [от, до]
const GLITCH = { title: [6, 12], face: [12, 20] };

function glitches(root) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
  };
  const every = ([a, b], fn) => {
    const run = () => { fn(); later(run, (a + Math.random() * (b - a)) * 1000); };
    later(run, (a + Math.random() * (b - a)) * 1000);
  };
  const title = root.querySelector('.mn-title');
  every(GLITCH.title, () => {
    title.classList.add('is-glitch');
    later(() => title.classList.remove('is-glitch'), 240);
  });
  // Портрет: 3 полосы лица съезжают вбок, одна — только тёмная половина,
  // наползает на светлую. Два кадра по ~75 мс, свет экрана в этот миг проседает.
  const stage = root.querySelector('.mn-stage');
  const slices = [...root.querySelectorAll('.mn-slices > div')];
  const r = (a, b) => a + Math.random() * (b - a);
  const frame = () => slices.forEach((el, i) => {
    const top = r(15, 80), h = r(3, 9);
    el.style.clipPath = `inset(${top}% 0 ${100 - top - h}% 0)`;
    el.classList.toggle('dark', i === 0);
    el.style.transform = `translateX(${i === 0 ? -r(8, 14) : r(-2.5, 2.5)}%)`;
  });
  every(GLITCH.face, () => {
    frame();
    stage.classList.add('is-glitch');
    later(frame, 75);
    later(() => stage.classList.remove('is-glitch'), 150);
  });
  return () => timers.forEach(clearTimeout);
}

export function mount(root, { config, go }) {
  root.innerHTML = `
    <section class="mn">
      <div class="mn-stage">
        <div class="mn-scene"><img src="assets/menu/face-light.webp" alt=""><img src="assets/menu/face-dark.webp" alt="">
          <div class="mn-slices" aria-hidden="true">${'<div><img src="assets/menu/face-light.webp" alt=""><img src="assets/menu/face-dark.webp" alt=""></div>'.repeat(3)}</div>
          <div class="mn-dust" aria-hidden="true"></div>
          <div class="mn-glow" aria-hidden="true"><i class="g-shade"></i><i class="g-base"></i><i class="g-pink"></i><i class="g-flash"></i></div>
        </div>
        <div class="mn-hands"></div>
        <button class="mn-back" type="button">← К дисклеймеру</button>
        <div class="mn-ui">
          <h1 class="mn-title" data-text="Out of&#10;the Feed">Out of<span>the Feed</span></h1>
          <div class="mn-menu">
            <button class="mn-btn" type="button">Играть</button>
            <button class="mn-btn" type="button">Сохранения</button>
            <button class="mn-btn" type="button">Настройки</button>
          </div>
        </div>
      </div>
    </section>`;

  root.querySelector('.mn-back').addEventListener('click', () => go('disclaimer'));

  // Старый iOS Safari игнорирует touch-action при щипке
  const noPinch = (e) => e.preventDefault();
  const mn = root.querySelector('.mn');
  mn.addEventListener('gesturestart', noPinch);

  // Показываем сцену, когда все картинки готовы, иначе они выскакивают по одной
  const stage = root.querySelector('.mn-stage');
  const decoded = (img) => (img.decode ? img.decode() : Promise.resolve()).catch(() => {});
  const reveal = () => requestAnimationFrame(() => stage.classList.add('is-ready'));
  const revealFallback = setTimeout(reveal, 5000);

  let alive = true;
  fetch('data/menu-scene.json', { cache: 'no-cache' })
    .then((r) => r.json())
    .then((cfg) => {
      if (!alive) return;
      const layer = root.querySelector('.mn-hands');
      Object.entries(cfg.hands).forEach(([key, h], i) => {
        const d = document.createElement('div');
        d.className = 'mn-hand';
        d.dataset.hand = key;
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
    .catch(() => {})
    .then(() => Promise.all([...stage.querySelectorAll('.mn-scene > img, .mn-hand img')].map(decoded)))
    .then(() => {
      if (!alive) return;
      clearTimeout(revealFallback);
      reveal();
    });

  dust(root.querySelector('.mn-dust'), 30);
  const stopHint = rotateHint(root);
  const stopFeed = feedLight(root);
  const stopGlitch = glitches(root);
  return () => {
    alive = false;
    clearTimeout(revealFallback);
    mn.removeEventListener('gesturestart', noPinch);
    stopHint();
    stopFeed();
    stopGlitch();
  };
}

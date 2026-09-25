// Менеджер экранов. Экран это модуль с mount(root, ctx), который может
// вернуть функцию очистки. Переход между экранами идёт через чёрный.
const FADE_MS = 1000;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

export function createScreens({ root, fadeEl, screens, ctx }) {
  let cleanup = null;
  let busy = false;

  function mountScreen(name) {
    cleanup?.();
    root.replaceChildren();
    cleanup = screens[name].mount(root, { ...ctx, go }) ?? null;
  }

  async function go(name) {
    if (busy) return;
    busy = true;
    fadeEl.classList.add('on');
    await wait(FADE_MS);
    mountScreen(name);
    await nextFrame();
    fadeEl.classList.remove('on');
    busy = false;
  }

  return { start: mountScreen, go };
}

// Согласие с предупреждением хранится в localStorage. Если хранилище
// недоступно (приватное окно, запрет), считаем, что согласия нет.
const KEY = 'novel.consent';
const DAY = 24 * 60 * 60 * 1000;

export function consentValid(days) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const { at } = JSON.parse(raw);
    return typeof at === 'number' && Date.now() - at < days * DAY;
  } catch {
    return false;
  }
}

export function saveConsent() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ at: Date.now() }));
  } catch {
    // без хранилища предупреждение просто покажется снова
  }
}

export function resetConsent() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // нечего сбрасывать
  }
}

// Заглушка. Настоящая заставка обсуждается отдельно.
export function mount(root, { config }) {
  root.innerHTML = `
    <section class="splash">
      <h2></h2>
      <p>заставка тут</p>
    </section>`;
  root.querySelector('h2').textContent = config.title;
}

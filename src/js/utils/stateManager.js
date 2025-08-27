const renderers = new Map();
const visibility = new Map();

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const id = entry.target.dataset.stateId;
    if (!id) return;
    visibility.set(id, entry.isIntersecting);
    if (entry.isIntersecting) {
      const renderer = renderers.get(id);
      const data = entry.target._pendingState;
      if (renderer && data) {
        renderer(data);
        entry.target._pendingState = null;
      }
    }
  });
});

export function register(id, el, renderFn) {
  el.dataset.stateId = id;
  renderers.set(id, renderFn);
  observer.observe(el);
}

export function update(id, data) {
  const el = document.querySelector(`[data-state-id="${id}"]`);
  if (!el) return;
  if (visibility.get(String(id))) {
    const renderer = renderers.get(String(id));
    renderer && renderer(data);
  } else {
    el._pendingState = data;
  }
}

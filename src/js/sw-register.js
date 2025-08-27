document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .finally(() => {
        navigator.serviceWorker
          .register('/service-worker.min.js')
          .then(() => {
            window.cleanApiCache = () =>
              navigator.serviceWorker.controller?.postMessage({ type: 'clean' });
          })
          .catch((err) => console.error('SW registration failed', err));
      });
  }
});

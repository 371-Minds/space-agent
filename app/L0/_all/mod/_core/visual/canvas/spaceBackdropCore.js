export const SPACE_BACKDROP_RUNTIME_KEY = "__spaceBackdropRuntime";
const SPACE_BACKDROP_SELECTOR = "[data-space-backdrop]";

function clampSpaceBackdropZoom(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }

  return Math.min(4, Math.max(0.25, value));
}

function createSpaceBackdropZoomBaseline() {
  return Object.freeze({
    devicePixelRatio: window.devicePixelRatio || 1,
    outerInnerRatio:
      window.innerWidth > 0 && window.outerWidth > 0 ? window.outerWidth / window.innerWidth : 1,
    visualViewportScale: window.visualViewport?.scale || 1
  });
}

function measureSpaceBackdropZoom(baseline) {
  const visualViewportScale = window.visualViewport?.scale || 1;

  if (Math.abs(visualViewportScale - baseline.visualViewportScale) > 0.001) {
    return clampSpaceBackdropZoom(visualViewportScale / baseline.visualViewportScale);
  }

  const devicePixelRatio = window.devicePixelRatio || baseline.devicePixelRatio || 1;

  if (Math.abs(devicePixelRatio - baseline.devicePixelRatio) > 0.001) {
    return clampSpaceBackdropZoom(devicePixelRatio / baseline.devicePixelRatio);
  }

  if (window.innerWidth > 0 && window.outerWidth > 0 && baseline.outerInnerRatio > 0) {
    return clampSpaceBackdropZoom((window.outerWidth / window.innerWidth) / baseline.outerInnerRatio);
  }

  return 1;
}

export function addMediaChangeListener(mediaQuery, handler) {
  if (typeof mediaQuery?.addEventListener === "function") {
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }

  if (typeof mediaQuery?.addListener === "function") {
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }

  return () => {};
}

export function createSpaceBackdropRuntime(
  root = document.querySelector(SPACE_BACKDROP_SELECTOR),
  {
    canvas = document.body,
    variantClassName = ""
  } = {}
) {
  if (!root) {
    return null;
  }

  if (root[SPACE_BACKDROP_RUNTIME_KEY]) {
    return root[SPACE_BACKDROP_RUNTIME_KEY];
  }

  const cleanupFns = [];
  const zoomBaseline = createSpaceBackdropZoomBaseline();
  let zoomFrame = 0;

  const addCleanup = (cleanupFn) => {
    if (typeof cleanupFn === "function") {
      cleanupFns.push(cleanupFn);
    }
  };

  const syncScale = () => {
    zoomFrame = 0;

    if (!canvas) {
      return;
    }

    const pageZoom = measureSpaceBackdropZoom(zoomBaseline);
    const backdropScale = pageZoom > 0 ? 1 / pageZoom : 1;
    canvas.style.setProperty("--space-backdrop-scale", backdropScale.toFixed(4));
  };

  const requestScaleSync = () => {
    if (zoomFrame) {
      return;
    }

    zoomFrame = window.requestAnimationFrame(syncScale);
  };

  if (variantClassName) {
    root.classList.add(variantClassName);
    addCleanup(() => root.classList.remove(variantClassName));
  }

  window.addEventListener("resize", requestScaleSync, { passive: true });
  addCleanup(() => window.removeEventListener("resize", requestScaleSync));

  window.visualViewport?.addEventListener("resize", requestScaleSync, { passive: true });
  addCleanup(() => window.visualViewport?.removeEventListener("resize", requestScaleSync));

  window.visualViewport?.addEventListener("scroll", requestScaleSync, { passive: true });
  addCleanup(() => window.visualViewport?.removeEventListener("scroll", requestScaleSync));

  const runtime = {
    addCleanup,
    destroy() {
      if (zoomFrame) {
        window.cancelAnimationFrame(zoomFrame);
        zoomFrame = 0;
      }

      cleanupFns.splice(0).reverse().forEach((cleanupFn) => cleanupFn());
      delete root[SPACE_BACKDROP_RUNTIME_KEY];
    },
    root,
    syncScale: requestScaleSync
  };

  root[SPACE_BACKDROP_RUNTIME_KEY] = runtime;
  requestScaleSync();
  return runtime;
}

export function destroySpaceBackdrop(root = document.querySelector(SPACE_BACKDROP_SELECTOR)) {
  root?.[SPACE_BACKDROP_RUNTIME_KEY]?.destroy();
}

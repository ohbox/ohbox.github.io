// index3d.js —— 行動裝置改 PNG；桌機/平板載 Spline；動態切換免重整
const SCENE_URL   = 'https://prod.spline.design/8Kujwbatk76bW3AM/scene.splinecode';
const RUNTIME_URL = 'https://unpkg.com/@splinetool/runtime@0.9.482/build/runtime.js';
const MOBILE_BP   = 680;

// 可能用到的 Spline 應用實例（若 runtime 有提供 pause/play）
let appInstance = null;

// 判斷是否視為手機（寬度 or 粗指標）
function isMobileLike() {
  return window.matchMedia(`(max-width:${MOBILE_BP}px)`).matches
      || window.matchMedia('(pointer: coarse)').matches;
}

// 可選：簡單 WebGL 可用性檢查（桌機/平板才用）
function isWebGLAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch (e) { return false; }
}

// 入口：在頁面 ready 後呼叫一次
export function initSpline3D() {
  const canvas = document.getElementById('canvas3d');
  if (!canvas) return;

  // 保險：避免某些瀏覽器把 canvas 算成 0 高
  canvas.style.display = canvas.style.display || 'block';
  if (!canvas.style.minHeight) canvas.style.minHeight = '280px';

  // 初次套用模式
  applyMode();

  // 監聽媒體查詢變動，動態切換 PNG/Canvas（免重整）
  const mqWidth  = window.matchMedia(`(max-width:${MOBILE_BP}px)`);
  const mqCoarse = window.matchMedia('(pointer: coarse)');
  const onChange = debounce(applyMode, 80);
  mqWidth.addEventListener('change', onChange);
  mqCoarse.addEventListener('change', onChange);
  window.addEventListener('orientationchange', () => setTimeout(applyMode, 120));

  // 滾輪穿透（避免 canvas 阻擋頁面滾動）
  canvas.addEventListener('wheel', (e) => {
    window.scrollBy({ top: e.deltaY, behavior: 'smooth' });
  }, { passive: true });

  // —— 內部：依目前狀態切換與載入邏輯 ——
  function applyMode() {
    const mobile = isMobileLike();

    if (mobile) {
      // 手機：不載 Spline；若已載，則暫停（若有 API）
      try { appInstance?.pause?.(); } catch (_) {}
      // 讓你的轉場不用等（手機顯示 PNG）
      if (!canvas.dataset.mobileReadyEmitted) {
        canvas.dataset.mobileReadyEmitted = '1';
        document.dispatchEvent(new CustomEvent('page:ready', { detail: { source: 'mobile-poster' } }));
      }
      return;
    }

    // 桌機/平板：需顯示/載入 Spline
    if (!isWebGLAvailable()) {
      // 桌機但無 WebGL：不強制做事，畫面會看不到 3D（如需桌機 fallback，可自行加一張桌機海報）
      return;
    }

    if (canvas.dataset.loaded === '1') {
      // 已載過 → 嘗試恢復播放（若有 API），並通知轉場就緒（cache）
      try { appInstance?.play?.(); } catch (_) {}
      if (!canvas.dataset.cacheReadyEmitted) {
        canvas.dataset.cacheReadyEmitted = '1';
        document.dispatchEvent(new CustomEvent('page:ready', { detail: { source: 'spline-cache' } }));
      }
      return;
    }

    // 尚未載 → 懶載（進視口附近或空檔才載）
    setupLazyLoadOnce(canvas);
  }
}

// 懶載：只設置一次
function setupLazyLoadOnce(canvas) {
  if (canvas.dataset.lazySetup === '1') return;
  canvas.dataset.lazySetup = '1';

  const startLoad = () => loadSpline(canvas);

  const io = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      io.disconnect();
      startLoad();
    }
  }, { rootMargin: '200px 0px' });
  io.observe(canvas);

  if ('requestIdleCallback' in window) {
    requestIdleCallback(startLoad, { timeout: 1800 });
  } else {
    setTimeout(startLoad, 1800);
  }
}

// 載入 Spline（桌機/平板）
async function loadSpline(canvas) {
  if (canvas.dataset.loaded === '1' || canvas.dataset.loading === '1') return;
  canvas.dataset.loading = '1';

  try {
    const { Application } = await import(/* @vite-ignore */ RUNTIME_URL);
    const app = new Application(canvas);
    appInstance = app;

    await app.load(SCENE_URL);

    canvas.classList.add('is-ready');
    canvas.dataset.loaded = '1';

    // 通知轉場：首頁就緒（只發一次）
    if (!canvas.dataset.readyEmitted) {
      canvas.dataset.readyEmitted = '1';
      document.dispatchEvent(new CustomEvent('page:ready', { detail: { source: 'spline' } }));
    }
  } catch (err) {
    console.error('[spline] load failed:', err);
    // 桌機載入失敗：若要桌機 fallback，可在 HTML 另外放一張桌機海報並用 CSS 顯示
  } finally {
    canvas.dataset.loading = '';
  }
}

// 小工具：簡單 debounce
function debounce(fn, delay = 120) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}



// // index3d.js
// const SCENE_URL   = 'https://prod.spline.design/8Kujwbatk76bW3AM/scene.splinecode';
// const RUNTIME_URL = 'https://unpkg.com/@splinetool/runtime@0.9.482/build/runtime.js';
// const FALLBACK_PNG = 'image/homepage/resource-Hero/spline.png';
// const MOBILE_BP   = 680; // 判定手機的斷點

// // ★ ADD: 可能用到的 Spline 應用實例（若 runtime 有提供 pause/dispose 可使用）
// let appInstance = null;

// // ★ ADD: WebGL/裝置支援檢查（桌機/平板用；手機改顯 PNG 就不檢查了）
// function isWebGLAvailable() {
//   try {
//     const c = document.createElement('canvas');
//     return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
//   } catch (e) { return false; }
// }

// // ★ ADD: 判定是否採用「行動版靜態圖」
// function isMobileLike() {
//   return window.matchMedia(`(max-width:${MOBILE_BP}px)`).matches
//       || window.matchMedia('(pointer: coarse)').matches;
// }

// // ★ ADD: 確保有一張 fallback 圖片節點（如果不存在就動態建立）
// function ensureFallbackImage(canvas) {
//   let img = document.getElementById('canvas3d-fallback');
//   if (!img) {
//     img = document.createElement('img');
//     img.id = 'canvas3d-fallback';
//     img.alt = 'Hero';
//     img.decoding = 'async';
//     img.loading = 'lazy';
//     img.style.display = 'none';
//     img.style.width = '150%';
//     img.style.marginTop = '200px';
//     img.style.height = 'auto';
//     img.style.objectFit = 'cover';
//     img.src = FALLBACK_PNG;
//     canvas.parentNode.insertBefore(img, canvas.nextSibling);
//   }
//   return img;
// }

// // ★ ADD: 顯示/隱藏：行動版 PNG 或 Spline Canvas
// function showFallback(canvas, img) {
//   canvas.style.display = 'none';
//   img.style.display = 'block';
// }

// function showCanvas(canvas, img) {
//   img.style.display = 'none';
//   canvas.style.display = 'block';
// }

// // ★ ADD: 僅在需要時設定懶載流程（避免在手機模式就提早載入）
// function setupLazyLoadOnce(canvas, fallbackImg) {
//   if (canvas.dataset.lazySetup === '1') return;              // 已設過
//   canvas.dataset.lazySetup = '1';

//   const startLoad = () => loadSpline(canvas, fallbackImg);

//   // 進視口附近才載
//   const io = new IntersectionObserver((entries) => {
//     if (entries.some(e => e.isIntersecting)) {
//       io.disconnect();
//       startLoad();
//     }
//   }, { rootMargin: '200px 0px' });
//   io.observe(canvas);

//   // 保險：閒置後也會載
//   if ('requestIdleCallback' in window) {
//     requestIdleCallback(() => startLoad(), { timeout: 1800 });
//   } else {
//     setTimeout(startLoad, 1800);
//   }
// }

// // 入口：在頁面 ready 後呼叫一次
// export function initSpline3D() {
//   const canvas = document.getElementById('canvas3d');
//   if (!canvas) return;

//   // ★ ADD: 確保 canvas 有可見高度（避免某些真機算到 0 高）
//   canvas.style.display = canvas.style.display || 'block';
//   if (!canvas.style.minHeight) canvas.style.minHeight = '280px';

//   // ★ ADD: 準備 fallback 圖
//   const fallbackImg = ensureFallbackImage(canvas);

//   // ★ ADD: 初次套用模式（手機→PNG；桌機/平板→Canvas）
//   applyMode();

//   // ★ ADD: 監聽媒體查詢變動，動態切換 PNG/Canvas
//   const mqWidth  = window.matchMedia(`(max-width:${MOBILE_BP}px)`);
//   const mqCoarse = window.matchMedia('(pointer: coarse)');
//   const onChange = () => applyMode();
//   mqWidth.addEventListener('change', onChange);
//   mqCoarse.addEventListener('change', onChange);
//   window.addEventListener('orientationchange', () => setTimeout(applyMode, 120));

//   // 保留你的滾輪穿透（避免 canvas 阻擋頁面滾動）
//   canvas.addEventListener('wheel', (e) => {
//     window.scrollBy({ top: e.deltaY, behavior: 'smooth' });
//   }, { passive: true });

//   // ★ ADD: 根據目前裝置狀態切換與載入邏輯
//   function applyMode() {
//     const mobile = isMobileLike();

//     if (mobile) {
//       // 手機：顯 PNG；如已載 Spline 可暫停（若有 API）
//       showFallback(canvas, fallbackImg);
//       try { appInstance?.pause?.(); } catch (_) {}
//       // 不設置懶載流程，避免行動版也去載 3D
//       return;
//     }

//     // 桌機/平板
//     // 如果不支援 WebGL，直接顯 PNG
//     if (!isWebGLAvailable()) {
//       showFallback(canvas, fallbackImg);
//       return;
//     }

//     // 顯示 Canvas
//     showCanvas(canvas, fallbackImg);

//     // 已載過 → 可以發 ready（切回時轉場不卡）
//     if (canvas.dataset.loaded === '1') {
//       document.dispatchEvent(new CustomEvent('page:ready', { detail: { source: 'spline-cache' } }));
//       // 亦可嘗試恢復（若有 API）
//       try { appInstance?.play?.(); } catch (_) {}
//       return;
//     }

//     // 尚未載 → 設置懶載
//     setupLazyLoadOnce(canvas, fallbackImg);
//   }
// }

// // 載入 Spline（桌機/平板）
// async function loadSpline(canvas, fallbackImg) {
//   if (canvas.dataset.loaded === '1' || canvas.dataset.loading === '1') return;
//   canvas.dataset.loading = '1';

//   try {
//     const { Application } = await import(/* @vite-ignore */ RUNTIME_URL);
//     const app = new Application(canvas);
//     // ★ ADD: 保留應用實例，切換時可 pause/play（若 API 存在）
//     appInstance = app;

//     await app.load(SCENE_URL);

//     canvas.classList.add('is-ready');
//     canvas.dataset.loaded = '1';

//     // 通知轉場：首頁就緒
//     if (!canvas.dataset.readyEmitted) {
//       canvas.dataset.readyEmitted = '1';
//       document.dispatchEvent(new CustomEvent('page:ready', { detail: { source: 'spline' } }));
//     }
//   } catch (err) {
//     console.error('[spline] load failed:', err);
//     // 若桌機載入失敗，就退回靜態圖
//     showFallback(canvas, fallbackImg);
//   } finally {
//     canvas.dataset.loading = '';
//   }
// }

// index3d.js
const SCENE_URL = 'https://prod.spline.design/8Kujwbatk76bW3AM/scene.splinecode';
const RUNTIME_URL = 'https://unpkg.com/@splinetool/runtime@0.9.482/build/runtime.js';

// ★ ADD: WebGL/裝置支援檢查與 fallback
function isWebGLAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch (e) { return false; }
}

function showSplineFallback(canvas, reason = '') {
  // 你可以改成顯示一張靜態圖或 skeleton
  canvas.classList.add('spline-fallback'); // 交給 CSS 露出占位
  // 同時告訴轉場「頁面就緒」，避免一直等
  document.dispatchEvent(new CustomEvent('page:ready', { detail: { source: 'spline-fallback', reason } }));
}

// 入口：在頁面 ready 後呼叫一次
export function initSpline3D() {
  const canvas = document.getElementById('canvas3d');
  if (!canvas) return;

    // ★ ADD: 確保行動版不會出現 0 高（常見真機問題）
  canvas.style.display = 'block';
  if (!canvas.style.minHeight) {
    canvas.style.minHeight = '280px'; // 可依設計調整
  }

  // ★ ADD: 裝置不支援 WebGL → 直接走 fallback
  if (!isWebGLAvailable()) {
    showSplineFallback(canvas, 'no-webgl');
    return;
  }

  // ★ ADD: 若之前已載過（回首頁），馬上告知轉場「頁面已就緒」
  if (canvas.dataset.loaded === '1') {
    document.dispatchEvent(new CustomEvent('page:ready', { detail: { source: 'spline-cache' } }));
    // ★ CHANGE: 不要 return；讓下方 wheel 綁定仍能執行
    // return;
  }

  // 只在進入視口附近時才載入；否則等頁面空檔再載
  const startLoad = () => loadSpline(canvas); 
  const io = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      io.disconnect();
      startLoad();
    }
  }, { rootMargin: '200px 0px' });
  io.observe(canvas);

  // 保險：若使用者停在頂部但沒觸發 IO，閒置時也會載
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => startLoad(), { timeout: 1800 });
  } else {
    setTimeout(startLoad, 1800);
  }

  // 保留你的滾輪穿透（避免 canvas 阻擋頁面滾動）
  canvas.addEventListener('wheel', (e) => {
    window.scrollBy({ top: e.deltaY, behavior: 'smooth' });
  }, { passive: true });
}

async function loadSpline(canvas) {
  // ★ ADD: 載入中防重入（避免 IO + idle 併發）
  if (canvas.dataset.loaded === '1' || canvas.dataset.loading === '1') return;
  canvas.dataset.loading = '1';

  try {
    // 1) 動態載 runtime（若你把檔案放本機，就改成相對路徑即可）
    const { Application } = await import(/* @vite-ignore */ RUNTIME_URL);

    // 2) 建立 app 並載入場景（等待真正完成）
    const app = new Application(canvas);
    await app.load(SCENE_URL);

    // 3) 載入完成 → 顯示 canvas（淡入），標記已載
    canvas.classList.add('is-ready');
    canvas.dataset.loaded = '1';


 // ★ ADD: 首次載入完成 → 通知轉場「首頁就緒」
    if (!canvas.dataset.readyEmitted) {
      canvas.dataset.readyEmitted = '1';
      document.dispatchEvent(new CustomEvent('page:ready', { detail: { source: 'spline' } }));
    }
  } catch (err) {
    console.error('[spline] load failed:', err);
  } finally {
    // ✅ 無論成功或失敗都清掉 loading 鎖
    canvas.dataset.loading = '';
  }
}


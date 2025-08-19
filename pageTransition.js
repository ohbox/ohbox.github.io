// pageTransition.js

// ====== 全域可調參數 ======
const MIN_HOLD_SEC = 0.85;      // 遮罩最少停留秒數
const MAX_WAIT_READY_SEC = 0.4; // 最長等待頁面 ready 的秒數（避免卡死，可調）

// 轉場隨機圖片
const transitionImages = [
  './image/characters/design.png',
  './image/characters/develop.png',
  './image/characters/coffee.png',
  './image/characters/idea.png'
];

// 命名空間 → 對應 JS 檔與初始化函式
const scriptMap = {
  index:  { path: './main.js', init: 'mainInitiate' },
  project:{ path: './sub.js',  init: 'subInitiate' }
};

// ====== Utils ======
function waitForNextPageReady(next) {
  // 回首頁要等 Spline；其它頁面直接就緒
  const needHeavyReady = next?.namespace === 'index';
  if (!needHeavyReady) return Promise.resolve();

  // 首頁：等 index3d.js 發出 'page:ready'（含超時保險）
  return new Promise(resolve => {
    let cleaned = false;
    const done = () => {
      if (cleaned) return;
      cleaned = true;
      clearTimeout(to);
      document.removeEventListener('page:ready', onReady, true);
      resolve();
    };
    const onReady = () => done();
    const to = setTimeout(done, MAX_WAIT_READY_SEC * 1000);
    document.addEventListener('page:ready', onReady, { once: true, capture: true });
  });
}

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

function loadPageModule(ns) {
  const cfg = scriptMap[ns];
  if (!cfg) return;
  loadScriptOnce(cfg.path).then(() => {
    const initFn = window[cfg.init];
    if (typeof initFn === 'function') {
      console.log(`✅ ${cfg.init} triggered`);
      initFn();
    } else {
      console.warn(`⚠️ ${cfg.init} is not defined`);
    }
  }).catch(err => {
    console.error(`❌ Failed to load script: ${cfg.path}`, err);
  });
}

// ====== Barba 轉場 ======
let isTransitioning = false;

barba.init({
  transitions: [{
    name: 'custom-transition',
    sync: true,

    async leave({ current }) {
      isTransitioning = true;
      const done = this.async();

      // ★ ADD：讓 afterEnter 可以等待「mask-in + 最少停留」的總時間
      window.__minHoldPromise = new Promise(r =>
        setTimeout(r, (0.6 + MIN_HOLD_SEC) * 1000) // 0.6 = mask-in 時間
      );

      // 隨機圖片
      const img = document.getElementById('transition-image');
      img.src = transitionImages[(Math.random() * transitionImages.length) | 0];

      // 初始狀態
      gsap.set('#transition-mask',  { x: '-100%' });
      gsap.set('#transition-image', { opacity: 0, scale: 0.8 });

      // 進場與停留
      const tl = gsap.timeline({ onComplete: done });
      tl.to('#transition-mask',  { x: '0%',   duration: 0.6, ease: 'power2.inOut' }, 0)
        .to('#transition-image', { opacity: 1, scale: 1.4, duration: 0.2, ease: 'power2.out' }, 0.5)
        .to({}, { duration: 0.8 }, 0.6); // 保持 0.8s 再切頁
    },

    enter() {
      // 不在這裡做退場動畫，避免過早觸發
      window.scrollTo(0, 0);
    }
  }]
});

// 等最少停留 + 新頁就緒 → 再做遮罩滑出，完成後才初始化新頁 JS
barba.hooks.afterEnter(async ({ next }) => {
  if (!isTransitioning) return;

  try {
    await Promise.all([
      window.__minHoldPromise ?? Promise.resolve(),
      waitForNextPageReady(next)
    ]);
  } catch (e) {
    console.warn('wait ready failed:', e);
  } finally {
    requestAnimationFrame(() => {
      gsap.set('#transition-mask', { willChange: 'transform' });
      gsap.timeline()
        .to('#transition-mask', { x: '100%', duration: 0.6, ease: 'power2.inOut' })
        .set('#transition-mask',  { x: '-100%', willChange: 'auto' })
        .set('#transition-image', { opacity: 0, scale: 0.8 })
        .add(() => {
          isTransitioning = false;

          // ★ 在 mask-out 完成後才載入並初始化該頁 JS（避免卡動畫）
          loadPageModule(next.namespace);

          // ★ 發事件給頁面：需要延後的重初始化可監聽這個時機
          document.dispatchEvent(new CustomEvent('transition:maskout-done', { detail: { ns: next.namespace } }));
        });
    });

    // 清除臨時 Promise
    window.__minHoldPromise = null;
  }
});

// ====== 連結行為（僅限 .page-link） ======
document.querySelectorAll('a.page-link').forEach(link => {
  link.addEventListener('click', (e) => {
    const targetHref = link.getAttribute('href');
    const currentUrl = window.location.pathname;

    if (targetHref === currentUrl || targetHref === './' || targetHref === '') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      e.preventDefault();
      barba.go(targetHref);
    }
  });
});

// ★ ADD：防止在 mask-out 過程中又提早再初始化一次（避免卡頓）
barba.hooks.afterEnter(({ next }) => {
  if (isTransitioning) return; // ★ ADD：遮罩退場尚未完成就跳過
  setTimeout(() => {
    requestAnimationFrame(() => {
      loadPageModule(next.namespace);
    });
  }, 100);
});

// 首次載入時也要初始化目前頁面的模組（非轉場進入）
document.addEventListener('DOMContentLoaded', () => {
  const ns = document.querySelector('[data-barba-container]')?.dataset.barbaNamespace;
  if (ns) loadPageModule(ns);
});

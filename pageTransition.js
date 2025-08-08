
const transitionImages = [
  './image/characters/design.png',
  './image/characters/develop.png',
  './image/characters/coffee.png',
  './image/characters/idea.png'
];

// 🧠 命名空間對應的 JS 檔與初始化函式
const scriptMap = {
  index: {
    path: './main.js',
    init: 'mainInitiate'
  },
  project: {
    path: './sub.js',
    init: 'subInitiate'
  }
};

// ✅ 載入 JS 檔（只載入一次）
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(); // 已載入
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

// ✅ 根據 namespace 載入對應 JS 模組並執行初始化
function loadPageModule(ns) {
  const config = scriptMap[ns];
  if (!config) return;

  loadScriptOnce(config.path).then(() => {
    const initFn = window[config.init];
    if (typeof initFn === 'function') {
      console.log(`✅ ${config.init} triggered`);
      initFn();
    } else {
      console.warn(`⚠️ ${config.init} is not defined`);
    }
  }).catch((err) => {
    console.error(`❌ Failed to load script: ${config.path}`, err);
  });
}


let isTransitioning = false;

barba.init({
  transitions: [
    {
      name: 'custom-transition',
      sync: true,

      async leave({ current }) {
        isTransitioning = true;
        const done = this.async();

        // 隨機圖片
        const img = document.getElementById('transition-image');
        const randomIndex = Math.floor(Math.random() * transitionImages.length);
        img.src = transitionImages[randomIndex];

        // 遮罩預設位置與圖片透明
        gsap.set("#transition-mask", { x: '-100%' });
        gsap.set("#transition-image", { opacity: 0, scale: 0.8 });

        const tl = gsap.timeline({ onComplete: done });

        // 遮罩滑入
        tl.to("#transition-mask", {
          x: '0%',
          duration: 0.6,
          ease: 'power2.inOut'
        }, 0);

        // 圖片淡入
        tl.to("#transition-image", {
          opacity: 1,
          scale: 1.4,
          duration: 0.2,
          ease: 'power2.out'
        }, 0.5);

        // 遮罩停留
        tl.to({}, { duration: 0.8 }, 0.6); // 等待後觸發切頁
      },

      // ❌ 不處理遮罩滑出（避免提前觸發）
      enter() {
        window.scrollTo(0, 0);
      }
    }
  ]
});

barba.hooks.afterEnter(() => {
  if (!isTransitioning) return;

  setTimeout(() => {
    requestAnimationFrame(() => {
      gsap.set("#transition-mask", { willChange: 'transform' }); // ✅ 強制 GPU 合成

      gsap.timeline()
        .to("#transition-mask", {
          x: '100%',
          duration: 0.6,
          ease: 'power2.inOut'
        })
        .set("#transition-mask", { x: '-100%', willChange: 'auto' }) // ✅ 重置
        .set("#transition-image", { opacity: 0, scale: 0.8 })
        .add(() => { isTransitioning = false; });
    });
  }, 210);
});


// ✅ 限定 .page-link 才觸發轉場，若同頁僅捲至頂部
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

// ✅ 切頁後：載入該頁 JS
barba.hooks.afterEnter(({ next }) => {
  setTimeout(() => {
    requestAnimationFrame(() => {
      loadPageModule(next.namespace);
    });
  }, 100);
});

// ✅ 首次載入頁面也要執行初始化
document.addEventListener('DOMContentLoaded', () => {
  const ns = document.querySelector('[data-barba-container]')?.dataset.barbaNamespace;
  if (ns) loadPageModule(ns);
});



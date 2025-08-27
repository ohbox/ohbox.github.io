window.mainInitiate = function () {
  console.log("[main.js loaded]");


  // ✅ 初始化 index 專用的 3D 模型模組（支援 ES Module）
import('./index3d.js').then(module => {
  requestIdleCallback(() => {
    module.initSpline3D();
  });
});



//about scan characters
// === About: scan characters (desktop hover + mobile fixed overlay) ===
(() => {
  const BREAKPOINT = 680;
  const container = document.getElementById('myCharacterContainer');
  const baseImage = document.getElementById('baseImage');
  const scanImage = document.getElementById('scanImage');
  const scannerIndicator = document.getElementById('scannerIndicator');
  if (!container || !baseImage || !scanImage) return;

  // ---------- 共用：套用/清除遮罩 ----------
  function applyMask(top, height) {
    // 底圖：掃描區隱形
    const m1 = `linear-gradient(to bottom, black ${top}px, transparent ${top}px, transparent ${top + height}px, black ${top + height}px)`;
    baseImage.style.webkitMaskImage = m1;
    baseImage.style.maskImage = m1;

    // 掃描圖：只顯示掃描區
    const m2 = `linear-gradient(to bottom, transparent ${top}px, black ${top}px, black ${top + height}px, transparent ${top + height}px)`;
    scanImage.style.webkitMaskImage = m2;
    scanImage.style.maskImage = m2;
    scanImage.style.display = 'block';
  }

  function clearMask() {
    baseImage.style.maskImage = baseImage.style.webkitMaskImage = 'none';
    scanImage.style.maskImage = scanImage.style.webkitMaskImage = 'none';
    scanImage.style.display = 'none';
  }

  // ---------- 桌機：沿用 hover 掃描 ----------
  function enableDesktopHover() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const minHeight = 28;
    const maxHeight = 88;
    const padding = 8;

    container.addEventListener('mouseenter', () => {
      if (scannerIndicator) scannerIndicator.style.opacity = '1';
      scanImage.style.display = 'block';
    });

    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      let y = e.clientY - rect.top;

      y = Math.max(padding + minHeight / 2, Math.min(rect.height - padding - minHeight / 2, y));
      const availableTop = y - padding;
      const availableBottom = rect.height - padding - y;
      const minDist = Math.min(availableTop, availableBottom);
      let dynamicHeight = Math.max(minHeight, Math.min(maxHeight, minDist * 2));

      let topOffset = y - dynamicHeight / 2;
      let bottomOffset = rect.height - (topOffset + dynamicHeight);
      if (bottomOffset < padding) {
        bottomOffset = padding;
        dynamicHeight = rect.height - topOffset - padding;
      }

      if (scannerIndicator) {
        scannerIndicator.style.top = `${topOffset}px`;
        scannerIndicator.style.height = `${dynamicHeight}px`;
      }
      applyMask(topOffset, dynamicHeight);
    });

    container.addEventListener('mouseleave', () => {
      if (scannerIndicator) scannerIndicator.style.opacity = '0';
      clearMask();
    });
  }

// ---------- Mobile: fixed center scan overlay (only inside .avatar-illustration) ----------
const SCAN_MOBILE_FIXED_OVERLAY_ID = 'scanOverlay'; // 與 CSS 同一個 id
const SCAN_MOBILE_FIXED_HEIGHT = 72;                // 與 CSS 高度保持一致
let scanMobileFixedEnabled = false;

function scanMobileFixedEnsureOverlay() {
  let overlay = document.getElementById(SCAN_MOBILE_FIXED_OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = SCAN_MOBILE_FIXED_OVERLAY_ID;
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
  }
  return overlay;
}

// 允許區域：容錯選擇 .avatar-illustration
function selectAllowedIllustration() {
  return (
    document.querySelector('.avatar-illustration') ||
    document.querySelector('.AboutSection .contentWrap .content-left .avatar-illustration') ||
    document.querySelector('[data-avatar-illustration]') ||
    null
  );
}

// ※ 不依賴 overlay 的 rect（因為 display:none 會得到 0）
// 取代舊的 getOverlayViewportYRange
function getOverlayViewportRect(overlay) {
  const cs = getComputedStyle(overlay);

  // 寬度：display:none 時 getComputedStyle 可能回 0，用視窗寬作 fallback（對應 CSS 的 min(68vw, 240px)）
  let w = parseFloat(cs.width);
  if (!w || Number.isNaN(w)) w = Math.min(window.innerWidth * 0.68, 240);

  // 高度：display:none 時也可能回 0，用常數 fallback
  let h = parseFloat(cs.height);
  if (!h || Number.isNaN(h)) h = SCAN_MOBILE_FIXED_HEIGHT;

  const left = (window.innerWidth  - w) / 2;
  const top  = (window.innerHeight - h) / 2;
  return { left, top, right: left + w, bottom: top + h, width: w, height: h };
}

// 取代舊的 scanMobileFixedUpdate（加入 .avatar-illustration 裁切與 clip-path）
function scanMobileFixedUpdate() {
  if (!scanMobileFixedEnabled) return;

  const overlay = document.getElementById(SCAN_MOBILE_FIXED_OVERLAY_ID);
  if (!overlay) return;

  const cr = container.getBoundingClientRect();      // 角色容器（不變）
  const ov = getOverlayViewportRect(overlay);        // overlay 在 viewport 的完整矩形

  const illustrationEl = selectAllowedIllustration(); // 允許區域
  if (!illustrationEl) {
    // 找不到允許區域 → 回退舊行為（不裁切）
    const y1 = Math.max(0, ov.top - cr.top);
    const y2 = Math.min(cr.height, ov.bottom - cr.top);
    const h  = Math.max(0, y2 - y1);
    if (h > 0) {
      overlay.classList.add('visible');
      overlay.style.clipPath = '';
      applyMask(y1, h);
    } else {
      overlay.classList.remove('visible');
      overlay.style.clipPath = '';
      clearMask();
    }
    return;
  }

  // overlay 與 .avatar-illustration 的交集（viewport 座標）
  const ir = illustrationEl.getBoundingClientRect();
  const ixLeft   = Math.max(ov.left,   ir.left);
  const ixRight  = Math.min(ov.right,  ir.right);
  const ixTop    = Math.max(ov.top,    ir.top);
  const ixBottom = Math.min(ov.bottom, ir.bottom);
  const ixW = Math.max(0, ixRight - ixLeft);
  const ixH = Math.max(0, ixBottom - ixTop);

  if (ixW <= 0 || ixH <= 0) {
    overlay.classList.remove('visible');
    overlay.style.clipPath = '';
    clearMask();
    return;
  }

  // 將交集轉為 overlay 自身的剪裁（只顯示落在 avatar-illustration 裡的那一段）
  const cutLeft   = Math.max(0, ixLeft   - ov.left);
  const cutRight  = Math.max(0, ov.right - ixRight);
  const cutTop    = Math.max(0, ixTop    - ov.top);
  const cutBottom = Math.max(0, ov.bottom - ixBottom);

  overlay.classList.add('visible');
  overlay.style.clipPath = `inset(${cutTop}px ${cutRight}px ${cutBottom}px ${cutLeft}px round 6px)`;

  // 套用角色容器的遮罩（依 overlay 的未裁切位置計算）
  const y1 = Math.max(0, ov.top - cr.top);
  const y2 = Math.min(cr.height, ov.bottom - cr.top);
  const h  = Math.max(0, y2 - y1);
  if (h > 0) {
    applyMask(y1, h);
  } else {
    clearMask();
  }
}


function scanMobileFixedEnable() {
  if (scanMobileFixedEnabled) return;
  scanMobileFixedEnsureOverlay();
  scanMobileFixedEnabled = true;

  // 👇 讓整個人物容器在手機時不吃點擊/觸控/hover
  container.dataset.prevPointerEvents = container.style.pointerEvents || '';
  container.style.pointerEvents = 'none';

  window.addEventListener('scroll', scanMobileFixedUpdate, { passive: true });
  window.addEventListener('resize', scanMobileFixedUpdate, { passive: true });
  scanMobileFixedUpdate();
}

function scanMobileFixedDisable() {
  if (!scanMobileFixedEnabled) return;
  scanMobileFixedEnabled = false;

  window.removeEventListener('scroll', scanMobileFixedUpdate);
  window.removeEventListener('resize', scanMobileFixedUpdate);

  // 👇 還原人物容器原本的指標行為
  container.style.pointerEvents = container.dataset.prevPointerEvents || '';
  delete container.dataset.prevPointerEvents;

  document.getElementById(SCAN_MOBILE_FIXED_OVERLAY_ID)?.remove();
  clearMask();
}

// 保留原 applyMode 名稱（若他處有呼叫不需改動）
function applyMode() {
  if (window.innerWidth <= BREAKPOINT) {
    scanMobileFixedDisable(); // 先清再開，避免殘留
    scanMobileFixedEnable();
  } else {
    scanMobileFixedDisable();
    clearMask();
  }
}


  // 初始化
  enableDesktopHover();
  applyMode();

  // 監聽 RWD 切換
  const mq = window.matchMedia(`(max-width: ${BREAKPOINT}px)`);
  mq.addEventListener('change', applyMode);
})();



//ruler
    const createRuler = (container, showLabels) => {
      const lines = Math.ceil(document.body.scrollHeight / 25);
      for (let i = 0; i <= lines; i++) {
        const value = i * 25;
        const mark = document.createElement("div");
        const label = document.createElement("span");
        const dash = document.createElement("span");

        label.className = "label";
        dash.className = "dash";

        const showLabel = showLabels && value % 50 === 0 && value % 100 !== 50;
        label.textContent = showLabel ? value : '';
        dash.classList.add((i % 2 === 0) ? "long" : "short");

        mark.append(label, dash);
        container.appendChild(mark);
      }
    };

    createRuler(document.getElementById("ruler-left"), true);
    createRuler(document.getElementById("ruler-right"), false);
    

//interactive grid
const grid = document.getElementById("grid");
    const rows = 34;
    const cols = 60;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement("glow-grid-cell"); // renamed below to grid-cell tag
        cell.classList.add("glow-cell");
        cell.dataset.row = r;
        cell.dataset.col = c;
        grid.appendChild(cell);
      }
    }

    let previous = [];

    grid.addEventListener("mouseover", (e) => {
      if (!e.target.classList.contains("glow-cell")) return;

      previous.forEach(cell => {
        cell.classList.remove("center", "glow-left", "glow-right", "glow-top", "glow-bottom");
      });
      previous = [];

      const row = parseInt(e.target.dataset.row);
      const col = parseInt(e.target.dataset.col);

      e.target.classList.add("center");
      previous.push(e.target);

      const directions = [
        [-1, 0, "glow-top"],
        [1, 0, "glow-bottom"],
        [0, -1, "glow-left"],
        [0, 1, "glow-right"]
      ];

      directions.forEach(([dr, dc, className]) => {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const neighbor = document.querySelector(`.glow-cell[data-row='${nr}'][data-col='${nc}']`);
          if (neighbor) {
            neighbor.classList.add(className);
            previous.push(neighbor);
          }
        }
      });
    });

    grid.addEventListener("mouseout", () => {
      previous.forEach(cell => {
        cell.classList.remove("center", "glow-left", "glow-right", "glow-top", "glow-bottom");
      });
      previous = [];
    });



//cursor
    const cursor = document.querySelector('.custom-cursor')
    const svgObjects = document.querySelectorAll('.svg-slot object');

    document.addEventListener('mousemove', (e) => {
      cursor.style.top = `${e.clientY}px`;
      cursor.style.left = `${e.clientX}px`;
    });

    

    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('cursor-hover');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('cursor-hover');
      });
    });

    // 所有 object 綁定 hover 顯示/隱藏游標邏輯
    svgObjects.forEach(obj => {
      obj.addEventListener('mouseenter', () => {
        cursor.style.opacity = '0';
        document.body.style.cursor = 'default';
      });
      obj.addEventListener('mouseleave', () => {
        cursor.style.opacity = '1';
        document.body.style.cursor = 'none';
      });
    });

    

    
// circular progress //
 function animateCircle(circle) {
      const target = parseInt(circle.getAttribute('data-percent'));
      let current = 0;
      const inner = circle.querySelector('.progress-inner');

      const interval = setInterval(() => {
        if (current >= target) {
          clearInterval(interval);
        } else {
          current++;
          const percent = current;
          circle.style.background = `conic-gradient(#f8a56f ${percent}%, #444 ${percent}%)`;
          inner.textContent = percent + '%';
        }
      }, 15);
    }

    function observeAndAnimate() {
      const circles = document.querySelectorAll('.progress-circle');
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            animateCircle(entry.target);
            entry.target.classList.add('animated');
          }
        });
      }, {
        threshold: 0.6
      });

      circles.forEach(circle => observer.observe(circle));
    }

    window.addEventListener('DOMContentLoaded', observeAndAnimate);

    observeAndAnimate();


//smooth transition to anchor position & nav-item active//
const navItems = document.querySelectorAll('.nav-item');

// 只觀察這 4 個 section
const observedSections = ['works', 'about', 'testimonial', 'contact'].map(id =>
  document.getElementById(id)
);

function updateActiveNav() {
  let activeFound = false;

  for (let i = 0; i < observedSections.length; i++) {
    const sectionTop = observedSections[i].getBoundingClientRect().top;
    const sectionBottom = observedSections[i].getBoundingClientRect().bottom;

    // 當該 section 中線進入視口
    if (sectionTop < window.innerHeight / 2 && sectionBottom > window.innerHeight / 2) {
      navItems.forEach(item => item.classList.remove('active'));
      navItems[i].classList.add('active');
      activeFound = true;
      break;
    }
  }

  // 若沒有任何 section 被命中，清除所有 active
  if (!activeFound) {
    navItems.forEach(item => item.classList.remove('active'));
  }
}

// 點擊滑動（保留）
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(item.getAttribute('href'));
    target.scrollIntoView({ behavior: 'smooth' });
  });
});

// 初始化與滾動時更新
window.addEventListener('scroll', updateActiveNav);
window.addEventListener('load', updateActiveNav);



//nav-menu//
function reloadHamburgerObject() {
  const obj = document.getElementById('hamburgerSvg');
  if (!obj) return;

  const data = obj.getAttribute('data');
  const parent = obj.parentNode;
  const clone = obj.cloneNode(true);
  clone.setAttribute('data', data + '?v=' + Date.now());
  parent.replaceChild(clone, obj);

  clone.addEventListener('load', () => {
    const svgDoc = clone.contentDocument;
    const svgRoot = svgDoc?.querySelector('svg');
    if (!svgRoot) return;

    svgRoot.style.cursor = 'pointer';

    // 🧠 控制是否是自動觸發點擊
    let isProgrammaticClick = false;

    svgRoot.addEventListener('click', () => {
      if (isProgrammaticClick) {
        isProgrammaticClick = false;
        return; // 避免 toggle 回彈
      }

      document.querySelector('.mobile-nav-overlay')?.classList.toggle('open');
      document.querySelector('.hamburger')?.classList.toggle('active');

      // ★ ADDED：依目前開關狀態同步 body 旗標（給 scanOverlay 用）
      document.body.classList.toggle(
        'menu-open',
        !!document.querySelector('.mobile-nav-overlay')?.classList.contains('open')
      );

    });

    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(item.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });

        // ✅ 關閉 overlay menu
        document.querySelector('.mobile-nav-overlay')?.classList.remove('open');
        document.querySelector('.hamburger')?.classList.remove('active');
        
        // ★ ADDED：關閉時確保移除 body 旗標
        document.body.classList.remove('menu-open');

        // ✅ 自動點擊 icon，但防止再 toggle 回彈
        isProgrammaticClick = true;
        svgRoot.dispatchEvent(new Event('click'));
      });
    });
  });
}
reloadHamburgerObject();

//tilt hover effect for work card //
const tiltCards = document.querySelectorAll('.tilt-card');

function enableTilt(card) {
  card.addEventListener('mousemove', handleMouseMove);
  card.addEventListener('mouseleave', resetTilt);
}

function disableTilt(card) {
  card.removeEventListener('mousemove', handleMouseMove);
  card.removeEventListener('mouseleave', resetTilt);
  card.style.transform = 'rotateX(0deg) rotateY(0deg)';
}

function handleMouseMove(e) {
  const card = e.currentTarget;
  const { width, height, left, top } = card.getBoundingClientRect();
  const x = e.clientX - left;
  const y = e.clientY - top;

  const rotateX = ((y / height) - 0.5) * -20;
  const rotateY = ((x / width) - 0.5) * 20;

  card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

function resetTilt(e) {
  e.currentTarget.style.transform = 'rotateX(0deg) rotateY(0deg)';
}

function updateTiltBehavior() {
  const shouldEnable = window.innerWidth > 1024;

  tiltCards.forEach(card => {
    shouldEnable ? enableTilt(card) : disableTilt(card);
  });
}

// 初始化
updateTiltBehavior();

// 監聽視窗尺寸變化
window.addEventListener('resize', updateTiltBehavior);


//instant-time-display//
  function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  function updateTaiwanTime() {
    const now = new Date();

    // 取得台灣時間下的日期與時間資訊
    const taiwanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const day = taiwanTime.getDate();
    const month = taiwanTime.toLocaleString("en-US", { month: "short" }); // e.g., "Jun"
    const suffix = getOrdinalSuffix(day);

    const timeStr = taiwanTime.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    document.getElementById("time-display").textContent = `${month} ${day}${suffix} ${timeStr} (GMT+8)`;
  }

  updateTaiwanTime();
  setInterval(updateTaiwanTime, 1000);




// infinite-looping-animation-duplicate//
['duplicate1', 'duplicate2', 'duplicate3'].forEach(id => {
    const el = document.getElementById(id);
    el.innerHTML += el.innerHTML; // 複製一次內容以實現無縫滾動
  });



 //progress-bar-animation-setting//
     const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const fill = entry.target.querySelector('.progress-fill');
          const percent = entry.target.getAttribute('data-percent');
          fill.style.width = percent + '%';
          obs.unobserve(entry.target); // 只執行一次動畫
        }
      });
    }, {
      threshold: 0.5
    });

    document.querySelectorAll('.strength').forEach(strength => {
      observer.observe(strength);
    }); 




//hover glowing card //
//infinite-looping-testimonial-carousel//

const testimonialCarousel = document.querySelector('.testimonial-carousel-container');
const testimonialTrack = document.querySelector('.testimonial-carousel-track');

// 複製內容一次（使用 clone-safe 方法）
const originalCards = testimonialTrack.innerHTML;
testimonialTrack.insertAdjacentHTML('beforeend', originalCards);

//*Hover Glowing Card ===
function bindHoverEffect() {
  const allCards = testimonialTrack.querySelectorAll(".testimonial-card");

  testimonialTrack.addEventListener("mousemove", function (e) {
    allCards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--xPos", `${x}px`);
      card.style.setProperty("--yPos", `${y}px`);
    });
  });
}
bindHoverEffect();

// === Infinite Carousel ===
let carouselSpeed = 0.5;
let carouselPosition = 0;
let carouselPaused = false;
let autoScrollFrame;

function animateCarousel() {
  if (!carouselPaused) {
    carouselPosition -= carouselSpeed;
    const maxScroll = testimonialTrack.scrollWidth / 2;

    if (Math.abs(carouselPosition) >= maxScroll) {
      carouselPosition = 0;
    }

    testimonialTrack.style.transform = `translateX(${carouselPosition}px)`;
  }

  autoScrollFrame = requestAnimationFrame(animateCarousel);
}

// === Pause on hover ===
testimonialCarousel.addEventListener('mouseenter', () => {
  carouselSpeed = 0.1;
});
testimonialCarousel.addEventListener('mouseleave', () => {
  carouselSpeed = 0.5;
});

requestAnimationFrame(animateCarousel);

// === Drag to scroll (Pointer Events: mouse + touch) ===
let isDragging = false;
let pointerId = null;
let startX = 0;
let startPos = 0;
let pauseTimeout;

function onPointerDown(e) {
  // 滑鼠只接受主鍵；觸控一律接受
  if (e.pointerType === 'mouse' && e.button !== 0) return;

  isDragging = true;
  pointerId = e.pointerId ?? null;
  startX = e.clientX;
  startPos = carouselPosition;

  // 暫停自動播放
  carouselPaused = true;
  clearTimeout(pauseTimeout);

  testimonialTrack.setPointerCapture?.(pointerId);

  // ✅ 只在觸控/手寫筆阻擋預設，避免抑制 mousemove，讓 custom cursor 照常更新
  if (e.pointerType !== 'mouse') e.preventDefault();

  // ✅ 用樣式避免選字/呼叫選單，不需靠 preventDefault
  testimonialTrack.style.userSelect = 'none';
  testimonialTrack.style.webkitUserSelect = 'none';
  testimonialTrack.style.webkitTouchCallout = 'none';
}

function onPointerMove(e) {
  if (!isDragging) return;
  const dx = e.clientX - startX;
  carouselPosition = startPos + dx; // 立即跟手
  testimonialTrack.style.transform = `translateX(${carouselPosition}px)`;
}

function onPointerUp(e) {
  if (!isDragging) return;
  isDragging = false;

  if (pointerId != null) testimonialTrack.releasePointerCapture?.(pointerId);

  // 還原暫時樣式
  testimonialTrack.style.userSelect = '';
  testimonialTrack.style.webkitUserSelect = '';
  testimonialTrack.style.webkitTouchCallout = '';

  // 放手後延遲恢復自動播放（可改秒數）
  pauseTimeout = setTimeout(() => {
    carouselPaused = false;
  }, 1600);
}

// 綁定 Pointer 事件（涵蓋滑鼠＋觸控）
testimonialTrack.addEventListener('pointerdown', onPointerDown, { passive: false });
testimonialTrack.addEventListener('pointermove', onPointerMove, { passive: true });
testimonialTrack.addEventListener('pointerup', onPointerUp, { passive: true });
testimonialTrack.addEventListener('pointercancel', onPointerUp, { passive: true });
testimonialTrack.addEventListener('pointerleave', onPointerUp, { passive: true });


//*Change-image-on-different-resolution//
const featureObjects = document.querySelectorAll('.responsive-svg');
const tabletMediaQuery = window.matchMedia('(max-width: 1024px)');

function updateSVGs(e) {
  featureObjects.forEach(obj => {
    const originalSrc = obj.dataset.src; // e.g., "s1-hover.svg"

    if (e.matches) {
      // 切換為 -load.svg
      const loadSrc = originalSrc.replace('-hover.svg', '-load.svg');
      obj.data = loadSrc;
    } else {
      // 還原為 -hover.svg
      obj.data = originalSrc;
    }
  });
}

// 初始載入時執行一次
updateSVGs(tabletMediaQuery);

// 加入媒體查詢監聽
tabletMediaQuery.addEventListener('change', updateSVGs);

// 初始載入時先執行
updateSVGs(tabletMediaQuery);

// 註冊 resize 偵測器
tabletMediaQuery.addEventListener('change', updateSVGs);



//*Feature-cards-carousel-usage//
(() => {
  // ===== 可調參數 =====
  const BREAKPOINT = 680;
  const AUTO_SCROLL_INTERVAL = 4000;
  const RESUME_DELAY_AFTER_INTERACTION = 1000;

  const featureCardWrapper = document.getElementById('feature-card-wrapper');
  const indicator = document.getElementById('dotIndicator');
  if (!featureCardWrapper || !indicator) return;

  const isSmall = () => window.innerWidth <= BREAKPOINT;

  let currentIndex = 0;
  let autoScrollTimer;
  let resumeTimer;
  let dragEnabled = false;

  const getCards = () => featureCardWrapper.querySelectorAll('.featureCard');
  const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

  function scrollToIndex(index) {
    const cards = getCards();
    if (!cards.length) return;
    const i = clamp(index, 0, cards.length - 1);
    featureCardWrapper.scrollTo({ left: cards[i].offsetLeft, behavior: 'smooth' });
    updateDots(i);
  }

  function updateDots(index) {
    indicator.querySelectorAll('.dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  function setupDots() {
    const cards = getCards();
    indicator.innerHTML = '';
    cards.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = `dot${i === 0 ? ' active' : ''}`;
      dot.addEventListener('click', () => {
        stopAutoScroll();
        currentIndex = i;
        scrollToIndex(i);
        restartAutoScrollDelayed();
      });
      indicator.appendChild(dot);
    });
  }

  function getClosestCardIndex() {
    const cards = getCards();
    const x = featureCardWrapper.scrollLeft;
    let closest = { index: 0, diff: Infinity };
    cards.forEach((card, i) => {
      const d = Math.abs(card.offsetLeft - x);
      if (d < closest.diff) closest = { index: i, diff: d };
    });
    return closest.index;
  }

  function startAutoScroll() {
    clearInterval(autoScrollTimer);
    const cards = getCards();
    if (!isSmall() || cards.length <= 1) return;
    autoScrollTimer = setInterval(() => {
      currentIndex = (currentIndex + 1) % cards.length;
      scrollToIndex(currentIndex);
    }, AUTO_SCROLL_INTERVAL);
  }

  function stopAutoScroll() {
    clearInterval(autoScrollTimer);
    clearTimeout(resumeTimer);
  }

  function restartAutoScrollDelayed() {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      currentIndex = getClosestCardIndex();
      updateDots(currentIndex);
      startAutoScroll();
    }, RESUME_DELAY_AFTER_INTERACTION);
  }

  // === Pointer 拖拉（小螢幕一律啟用；觸控/滑鼠皆可） ===
  let dragging = false, dragStartX = 0, dragStartLeft = 0, draggedDistance = 0;

  function onPointerDown(e) {
    if (!isSmall()) return;                   // 只在小螢幕啟用拖拉
    dragging = true;
    draggedDistance = 0;
    dragStartX = e.clientX;
    dragStartLeft = featureCardWrapper.scrollLeft;

    stopAutoScroll();
    featureCardWrapper.classList.add('no-snap');   // 暫停 snap，跟手更順
    featureCardWrapper.setPointerCapture?.(e.pointerId);

    // ✅ 只在觸控/手寫筆阻擋預設（避免原生滾動與 JS 衝突）
    if (e.pointerType !== 'mouse') e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const delta = e.clientX - dragStartX;
    draggedDistance = Math.max(draggedDistance, Math.abs(delta));
    featureCardWrapper.scrollLeft = dragStartLeft - delta; // 跟手拖動
  }

  function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    featureCardWrapper.releasePointerCapture?.(e.pointerId);

    // 恢復 snap 並貼齊最近卡片
    featureCardWrapper.classList.remove('no-snap');
    currentIndex = getClosestCardIndex();
    scrollToIndex(currentIndex);

    restartAutoScrollDelayed();
  }

  function preventClickWhenDragged(e) {
    if (draggedDistance > 5) { e.preventDefault(); e.stopPropagation(); }
  }

  function enablePointerDrag() {
    if (dragEnabled) return;
    featureCardWrapper.addEventListener('pointerdown', onPointerDown, { passive: false });
    featureCardWrapper.addEventListener('pointermove', onPointerMove, { passive: true });
    featureCardWrapper.addEventListener('pointerup', onPointerUp, { passive: true });
    featureCardWrapper.addEventListener('pointercancel', onPointerUp, { passive: true });
    featureCardWrapper.addEventListener('pointerleave', onPointerUp, { passive: true });
    featureCardWrapper.addEventListener('click', preventClickWhenDragged, true);
    dragEnabled = true;
  }

  function disablePointerDrag() {
    if (!dragEnabled) return;
    featureCardWrapper.removeEventListener('pointerdown', onPointerDown);
    featureCardWrapper.removeEventListener('pointermove', onPointerMove);
    featureCardWrapper.removeEventListener('pointerup', onPointerUp);
    featureCardWrapper.removeEventListener('pointercancel', onPointerUp);
    featureCardWrapper.removeEventListener('pointerleave', onPointerUp);
    featureCardWrapper.removeEventListener('click', preventClickWhenDragged, true);
    featureCardWrapper.classList.remove('no-snap');
    dragging = false;
    dragEnabled = false;
  }

  // 初始化
  const debounce = (fn, delay = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; };
  function initializeCarousel() {
    stopAutoScroll();
    if (isSmall()) {
      setupDots();
      currentIndex = getClosestCardIndex();
      scrollToIndex(currentIndex);
      startAutoScroll();
      enablePointerDrag();   // ← 不再限制「桌機滑鼠」；小螢幕就啟用
    } else {
      indicator.innerHTML = '';
      disablePointerDrag();
    }
  }
  window.addEventListener('load', initializeCarousel);
  window.addEventListener('resize', debounce(initializeCarousel, 150));

  // 觸控保險：任何觸碰即暫停，稍後恢復
  featureCardWrapper.addEventListener('touchstart', () => { stopAutoScroll(); restartAutoScrollDelayed(); }, { passive: true });

  // 滾動時更新 dot
  featureCardWrapper.addEventListener('scroll', () => {
    if (isSmall()) {
      currentIndex = getClosestCardIndex();
      updateDots(currentIndex);
    }
  }, { passive: true });
})();



//調整在canvas區域的滾動手感//  

(() => {
  // 🎯 調整倍率（外面 110px vs 內部 60px -> 110/60 ≈ 1.8333）
  const MULT = 2.6; // 可微調手感

  // 目標區域：優先用 #canvas3d，找不到就用 .canvas-wrapper
  const target = document.getElementById('canvas3d') || document.querySelector('.canvas-wrapper');
  if (!target) return;

  // 只在桌機指標精細裝置啟用（避免觸控誤觸）
  const isPointerFine = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
  if (!isPointerFine) return;

  if (window.__wheelAmpBound) return; // 防止重複綁定（Barba 轉場常見）
  window.__wheelAmpBound = true;

  const scrollingEl = document.scrollingElement || document.documentElement;

  window.addEventListener('wheel', (e) => {
    // 不影響 Ctrl/Pinch 的縮放手勢
    if (e.ctrlKey) return;

    // 目標元素若不可見就跳過
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const { clientX: x, clientY: y } = e;
    const over =
      x >= rect.left && x <= rect.right &&
      y >= rect.top  && y <= rect.bottom;

    if (!over) return; // 只有在 canvas 區域內才介入

    // 標準化 delta：不同瀏覽器/裝置的 deltaMode 不同
    let dx = e.deltaX;
    let dy = e.deltaY;
    if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) { dx *= 16; dy *= 16; }
    else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) { dx *= window.innerWidth; dy *= window.innerHeight; }

    // 攔截預設滾動，改用放大後的位移
    e.preventDefault();
    scrollingEl.scrollBy({
      left:  dx * MULT,
      top:   dy * MULT,
      behavior: 'auto'  // 千萬別用 'smooth'，會造成連續滾動卡頓
    });
  }, { passive: false });
})();


}
















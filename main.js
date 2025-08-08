window.mainInitiate = function () {
  console.log("[main.js loaded]");


  // ✅ 初始化 index 專用的 3D 模型模組（支援 ES Module）
import('./index3d.js').then(module => {
  requestIdleCallback(() => {
    module.initSpline3D();
  });
});



//about scan characters
  const container = document.getElementById('myCharacterContainer');
  const baseImage = document.getElementById('baseImage');
  const scanImage = document.getElementById('scanImage');
  const scannerIndicator = document.getElementById('scannerIndicator');

  const minHeight = 28;
  const maxHeight = 88;
  const padding = 8;

  container.addEventListener('mouseenter', () => {
    scannerIndicator.style.opacity = '1';
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

    scannerIndicator.style.top = `${topOffset}px`;
    scannerIndicator.style.height = `${dynamicHeight}px`;

    // 圖1遮罩：將 baseImage 套用遮罩使掃描區消失
    baseImage.style.webkitMaskImage = `linear-gradient(to bottom, black ${topOffset}px, transparent ${topOffset}px, transparent ${topOffset + dynamicHeight}px, black ${topOffset + dynamicHeight}px)`;
    baseImage.style.maskImage = `linear-gradient(to bottom, black ${topOffset}px, transparent ${topOffset}px, transparent ${topOffset + dynamicHeight}px, black ${topOffset + dynamicHeight}px)`;

    // 圖2遮罩：只在掃描區顯示
    scanImage.style.webkitMaskImage = `linear-gradient(to bottom, transparent ${topOffset}px, black ${topOffset}px, black ${topOffset + dynamicHeight}px, transparent ${topOffset + dynamicHeight}px)`;
    scanImage.style.maskImage = `linear-gradient(to bottom, transparent ${topOffset}px, black ${topOffset}px, black ${topOffset + dynamicHeight}px, transparent ${topOffset + dynamicHeight}px)`;
  });

  container.addEventListener('mouseleave', () => {
    scannerIndicator.style.opacity = '0';
    scanImage.style.maskImage = 'none';
    scanImage.style.webkitMaskImage = 'none';
    scanImage.style.display = 'none';
    baseImage.style.maskImage = 'none';
    baseImage.style.webkitMaskImage = 'none';
  });



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
    });

    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(item.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });

        // ✅ 關閉 overlay menu
        document.querySelector('.mobile-nav-overlay')?.classList.remove('open');
        document.querySelector('.hamburger')?.classList.remove('active');

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

// === Drag to scroll ===
let isDragging = false;
let startX;
let scrollStart;
let pauseTimeout;

testimonialTrack.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX;
  scrollStart = carouselPosition;
  carouselPaused = true;
  testimonialTrack.style.cursor = 'grabbing';
  clearTimeout(pauseTimeout);
});

window.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    testimonialTrack.style.cursor = '';
    pauseTimeout = setTimeout(() => {
      carouselPaused = false;
    }, 1600); // 自動重啟
  }
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const deltaX = e.clientX - startX;
  carouselPosition = scrollStart + deltaX;
  testimonialTrack.style.transform = `translateX(${carouselPosition}px)`;
});


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
const featureCardWrapper = document.getElementById('feature-card-wrapper');
const indicator = document.getElementById('dotIndicator');

let currentIndex = 0;
let autoScrollTimer;
let restartTimer;

function getCards() {
  return featureCardWrapper.querySelectorAll('.featureCard');
}

function scrollToIndex(index) {
  const cards = getCards();
  featureCardWrapper.scrollTo({ left: cards[index].offsetLeft, behavior: 'smooth' });
  updateDots(index);
}

function updateDots(index) {
  indicator.querySelectorAll('.dot').forEach((dot, i) =>
    dot.classList.toggle('active', i === index)
  );
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
  const scrollLeft = wrapper.scrollLeft;

  return [...cards].reduce((closest, card, i) => {
    const diff = Math.abs(card.offsetLeft - scrollLeft);
    return diff < closest.diff ? { index: i, diff } : closest;
  }, { index: 0, diff: Infinity }).index;
}

function startAutoScroll() {
  clearInterval(autoScrollTimer);
  const cards = getCards();
  if (window.innerWidth > 680) return;

  autoScrollTimer = setInterval(() => {
    currentIndex = (currentIndex + 1) % cards.length;
    scrollToIndex(currentIndex);
  }, 4000);
}

function stopAutoScroll() {
  clearInterval(autoScrollTimer);
  clearTimeout(restartTimer);
}

function restartAutoScrollDelayed() {
  restartTimer = setTimeout(() => {
    currentIndex = getClosestCardIndex();
    updateDots(currentIndex);
    startAutoScroll();
  }, 4000);
}

function initializeCarousel() {
  stopAutoScroll();

  if (window.innerWidth <= 680) {
    setupDots();
    currentIndex = 0;
    scrollToIndex(currentIndex);
    startAutoScroll();
  } else {
    indicator.innerHTML = '';
  }
}

// === Event bindings ===
window.addEventListener('load', initializeCarousel);
window.addEventListener('resize', initializeCarousel);

['touchstart', 'mousedown'].forEach(evt =>
  wrapper.addEventListener(evt, () => {
    stopAutoScroll();
    restartAutoScrollDelayed();
  })
);

wrapper.addEventListener('scroll', () => {
  if (window.innerWidth <= 680) {
    currentIndex = getClosestCardIndex();
    updateDots(currentIndex);
  }
});

}
















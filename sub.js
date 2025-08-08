
window.subInitiate = function () {
  console.log("[sub.js loaded]");
//Dock//
    const dockContainer = document.getElementById('dockContainer');
    const dock = document.getElementById('dock');
    const dockItems = Array.from(dock.getElementsByClassName('dock-item'));
    const dockWrapper = document.getElementById('dockWrapper');

    dockContainer.addEventListener('mouseenter', () => {
      dockContainer.classList.add('expand');
    });

    dockContainer.addEventListener('mouseleave', () => {
      dockContainer.classList.remove('expand');
      dockItems.forEach(item => {
        item.style.width = '50px';
        item.style.height = '50px';
      });
    });

    dockContainer.addEventListener('mousemove', (e) => {
      const rect = dock.getBoundingClientRect();
      const centerXs = dockItems.map(item => {
        const r = item.getBoundingClientRect();
        return r.left + r.width / 2;
      });

      centerXs.forEach((centerX, index) => {
        const distance = Math.abs(e.clientX - centerX);
        const maxDistance = 150;
        const clamped = Math.max(0, maxDistance - distance);
        const scale = 1.1 + (clamped / maxDistance) * (2 - 1.1);
        const baseSize = 50;
        const newSize = baseSize * scale;
        dockItems[index].style.width = `${newSize}px`;
        dockItems[index].style.height = `${newSize}px`;
      });
    });

    // dock hide on scroll down, show on scroll up
    let lastScrollY = window.scrollY;
    let isDockHidden = false;
    let ticking = false;

    function updateDockVisibility() {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && !isDockHidden) {
        dockWrapper.classList.add('hidden');
        isDockHidden = true;
      } else if (currentScrollY < lastScrollY && isDockHidden) {
        dockWrapper.classList.remove('hidden');
        isDockHidden = false;
      }

      lastScrollY = currentScrollY;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateDockVisibility);
        ticking = true;
      }
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
    

//cursor
    const cursor = document.querySelector('.custom-cursor');
    const projectArea = document.getElementById('projectArea');
    const svgObjects = document.querySelectorAll('object');


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


    // 進入 projectArea 改變 custom cursor 顏色
    projectArea.addEventListener('mouseenter', () => {
      cursor.classList.add('dark');
    });
    projectArea.addEventListener('mouseleave', () => {
      cursor.classList.remove('dark');
    });


  }


  





    













/* Shared project switcher with scroll-direction reveal. */
(function () {
  var destinations = [
    { href: 'index.html', name: 'Home', home: true },
    { href: 'project-rg.html', name: 'Resume Genius', icon: 'image/projects/RG-logo.png' },
    { href: 'project-gopublics.html', name: 'GoPublics', icon: 'image/projects/gopublics-symbol.svg' },
    { href: 'project-yotta.html', name: 'Yotta', icon: 'image/projects/YOTTA-logo.png', bright: true },
    { href: 'project-cupo.html', name: 'Cupo', icon: 'image/projects/CUPO-logo.png', bright: true }
  ];

  var dock = document.createElement('nav');
  dock.className = 'project-dock';
  dock.setAttribute('aria-label', 'Home and project navigation');

  var currentPath = window.location.pathname.split('/').pop();
  destinations.forEach(function (destination) {
    var isCurrent = destination.href === currentPath;
    var item = document.createElement(isCurrent ? 'span' : 'a');
    item.className = 'project-dock__item';
    if (isCurrent) {
      item.setAttribute('aria-current', 'page');
    } else {
      item.href = destination.href;
      item.setAttribute('data-nav', 'true');
      item.setAttribute('aria-label', destination.name);
    }

    if (destination.home) {
      var homeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      homeIcon.setAttribute('viewBox', '0 0 24 24');
      homeIcon.setAttribute('fill', 'none');
      homeIcon.setAttribute('stroke', 'currentColor');
      homeIcon.setAttribute('stroke-width', '1.8');
      homeIcon.setAttribute('stroke-linecap', 'round');
      homeIcon.setAttribute('stroke-linejoin', 'round');
      homeIcon.setAttribute('aria-hidden', 'true');
      homeIcon.innerHTML = '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z"/>';
      item.appendChild(homeIcon);
    } else {
      var icon = document.createElement('img');
      icon.src = destination.icon;
      icon.alt = '';
      icon.setAttribute('aria-hidden', 'true');
      if (destination.bright) icon.className = 'project-dock__icon--bright';
      item.appendChild(icon);
    }

    var label = document.createElement('span');
    label.className = 'project-dock__tooltip';
    label.textContent = destination.name;
    item.appendChild(label);

    dock.appendChild(item);
  });

  document.body.appendChild(dock);

  var dockItems = Array.prototype.slice.call(dock.querySelectorAll('.project-dock__item'));
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var restSize = 40;
  var maxItemBlur = 2;
  var pointerX = Infinity;
  var animationFrame = 0;
  var lastFrame = 0;
  var iconStates = dockItems.map(function (item) {
    return { item: item, size: restSize, velocity: 0 };
  });

  function animateDock(time) {
    var elapsed = lastFrame ? Math.min((time - lastFrame) / 1000, 0.032) : 1 / 60;
    lastFrame = time;
    var centers = iconStates.map(function (state) {
      var bounds = state.item.getBoundingClientRect();
      return bounds.left + bounds.width / 2;
    });
    var settled = true;

    iconStates.forEach(function (state, index) {
      var proximity = Math.max(0, 1 - Math.abs(pointerX - centers[index]) / 150);
      var target = restSize + proximity * 40;
      state.velocity += ((target - state.size) * 500 - state.velocity * 34) * elapsed;
      state.size += state.velocity * elapsed;
      if (Math.abs(target - state.size) < 0.05 && Math.abs(state.velocity) < 0.5) {
        state.size = target;
        state.velocity = 0;
      } else {
        settled = false;
      }
      state.item.style.setProperty('--dock-size', state.size.toFixed(2) + 'px');
      var blurProgress = Math.min(1, Math.max(0, (state.size - restSize) / 40));
      state.item.style.setProperty('--dock-blur', (blurProgress * maxItemBlur).toFixed(2) + 'px');
    });

    if (!settled) {
      animationFrame = window.requestAnimationFrame(animateDock);
    } else {
      animationFrame = 0;
      lastFrame = 0;
    }
  }

  function startDockAnimation() {
    if (!animationFrame) animationFrame = window.requestAnimationFrame(animateDock);
  }

  dock.addEventListener('pointermove', function (event) {
    if (event.pointerType !== 'mouse' || !finePointer.matches || reducedMotion.matches) return;
    pointerX = event.clientX;
    startDockAnimation();
  });
  dock.addEventListener('pointerleave', function () {
    pointerX = Infinity;
    startDockAnimation();
  });

  var lastY = Math.max(0, window.scrollY || window.pageYOffset || 0);
  var travel = 0;
  var direction = 0;
  var scheduled = false;

  function setHidden(hidden) {
    if (hidden && dock.contains(document.activeElement)) return;
    if (hidden) {
      pointerX = Infinity;
      startDockAnimation();
    }
    dock.classList.toggle('is-hidden', hidden);
    dock.setAttribute('aria-hidden', hidden ? 'true' : 'false');
    dock.inert = hidden;
  }

  function updateDock() {
    var y = Math.max(0, window.scrollY || window.pageYOffset || 0);
    var delta = y - lastY;
    lastY = y;

    if (y < 72) {
      travel = 0;
      direction = 0;
      setHidden(false);
      scheduled = false;
      return;
    }
    if (!delta) {
      scheduled = false;
      return;
    }

    var nextDirection = delta > 0 ? 1 : -1;
    if (nextDirection !== direction) {
      direction = nextDirection;
      travel = delta;
    } else {
      travel += delta;
    }

    if (direction > 0 && travel >= 8) setHidden(true);
    if (direction < 0 && travel <= -8) setHidden(false);
    scheduled = false;
  }

  window.addEventListener('scroll', function () {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateDock);
  }, { passive: true });

  dock.addEventListener('focusin', function () { setHidden(false); });
})();

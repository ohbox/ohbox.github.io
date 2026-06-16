/* About — Capability Dashboard: Skills / Strengths / Capacity / Language / Interests */
(function () {

  /* ---------------- Data ---------------- */

  var skillsData = [
    'Design System', 'Handoff & Specs', 'HTML/CSS', 'Wireframing', 'Prototyping',
    'User Research', 'Competitive Analysis', 'Responsive Web Design', 'Visual UI Design',
    'Critical Thinking', 'User-centered Iteration', 'Micro-interaction',
    'Cross-functional Collaboration', 'Organizing Information', 'Storytelling',
    'Vibe Design & Coding', 'Information Architecture', 'User Journey Mapping',
    'Product Thinking', 'AI Prompting', 'AI-driven Research', 'AI-powered Ideation',
    'AI Workflow Automation', 'AI-generated Evaluation'
  ];

  var strengthsData = [
    { label: 'Critical Thinking', level: 8 },
    { label: 'Self-Disciplined', level: 9 },
    { label: 'Continuous Learning', level: 7 },
    { label: 'Problem Solving', level: 8 },
    { label: 'Collaboration', level: 6 },
    { label: 'Time-Management', level: 8 }
  ];

  var languageData = [
    { label: 'Chinese', level: 'Native', value: 94 },
    { label: 'English', level: 'Advanced', value: 82 }
  ];

  var interestsData = [
    { label: 'MOVIE', icon: 'image/about/movie.png' },
    { label: 'BADMINTON', icon: 'image/about/badminton.png' },
    { label: 'TRAVEL', icon: 'image/about/travel.png' },
    { label: 'PETS', icon: 'image/about/pet.png' },
    { label: 'BOARD GAME', icon: 'image/about/board-game.png' }
  ];

  /* ---------------- Helpers ---------------- */

  function debounce(fn, wait) {
    var timer;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  /* ============ 1. Skills & Expertise — Matter.js physics collision ============ */

  /* Explicit particle spec: [count, visualPx, color] */
  var GRAY   = 'rgba(255,255,255,0.28)';
  var ORANGE = '#F07040';
  var YELLOW = '#FFC56B';
  var PARTICLE_SPEC = [
    // 0.6 × 0.6
    [8,  0.6, GRAY], [10, 0.6, ORANGE], [6,  0.6, YELLOW],
    // 1 × 1
    [8,  1,   GRAY], [10, 1,   ORANGE], [4,  1,   YELLOW],
    // 2 × 2
    [4,  2,   GRAY], [5,  2,   ORANGE], [2,  2,   YELLOW],
    // 4 × 4
    [2,  4,   GRAY], [4,  4,   ORANGE], [3,  4,   YELLOW],
    // 6 × 6
    [3,  6,   GRAY], [6,  6,   ORANGE], [2,  6,   YELLOW]
  ];

  function renderSkillChips(panel) {
    var layer = panel.querySelector('[data-cap-chips]');
    layer.innerHTML = skillsData.map(function (label) {
      return '<span class="cap-chip">' + label + '</span>';
    }).join('');
  }

  function setupSkillsPhysics(panel, cleanupFns) {
    var M = window.Matter;
    if (!M) return;

    var container    = panel.querySelector('.cap-skills-body');
    var chipsLayer   = panel.querySelector('[data-cap-chips]');
    var particleLayer = panel.querySelector('[data-cap-particles]');

    /* Holds the teardown for the currently-running physics instance */
    var localDestroy = null;

    function startPhysics() {
      /* Tear down any previous instance first */
      if (localDestroy) { localDestroy(); localDestroy = null; }
      container.classList.remove('is-dragging');

      var W = container.clientWidth;
      var H = container.clientHeight;
      if (!W || !H) return;

      var engine = M.Engine.create({ gravity: { x: 0, y: 0.3 } });
      var world  = engine.world;

      /* Boundary walls */
      var wallOpts = { isStatic: true, friction: 0.4, restitution: 0.2 };
      M.World.add(world, [
        M.Bodies.rectangle(W / 2, H + 32,  W * 2, 64, wallOpts),
        M.Bodies.rectangle(-32,   H / 2,   64, H * 2, wallOpts),
        M.Bodies.rectangle(W + 32, H / 2,  64, H * 2, wallOpts),
        M.Bodies.rectangle(W / 2, -32,     W * 2, 64, wallOpts)
      ]);

      /* Chip bodies — reset transforms for fresh measurement, then distribute */
      var chipEls = Array.prototype.slice.call(chipsLayer.querySelectorAll('.cap-chip'));
      chipEls.forEach(function (c) {
        c.style.opacity       = '1';
        c.style.transform     = 'none';
        c.style.animation     = 'none';
        c.style.pointerEvents = 'none';
      });

      var cols = Math.ceil(Math.sqrt(chipEls.length * (W / H)));
      var chipData = chipEls.map(function (chip, idx) {
        var w = Math.max(chip.offsetWidth, 60);
        var h = Math.max(chip.offsetHeight, 28);
        var col  = idx % cols;
        var row  = Math.floor(idx / cols);
        var rows = Math.ceil(chipEls.length / cols);
        var cellW = W / cols;
        var cellH = H / rows;
        var x = Math.max(w / 2 + 4, Math.min(W - w / 2 - 4,
          cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * 0.6));
        var y = Math.max(h / 2 + 4, Math.min(H - h / 2 - 4,
          cellH * (row + 0.5) + (Math.random() - 0.5) * cellH * 0.6));

        var body = M.Bodies.rectangle(x, y, w, h, {
          restitution: 0.25, friction: 0.18, frictionAir: 0.016, label: 'chip'
        });
        M.Body.setVelocity(body, { x: (Math.random() - 0.5) * 2.5, y: (Math.random() - 0.5) * 2.5 });
        M.Body.setAngle(body, (Math.random() - 0.5) * 0.4);
        M.World.add(world, body);
        return { el: chip, body: body, w: w, h: h };
      });

      /* Square particle bodies — explicit spec */
      particleLayer.innerHTML = '';
      var particleData = [];
      PARTICLE_SPEC.forEach(function (spec) {
        var count = spec[0], vSize = spec[1], color = spec[2];
        var pSize = Math.max(vSize, 1.5);
        for (var i = 0; i < count; i++) {
          var margin = pSize / 2 + 2;
          var px = Math.random() * (W - margin * 2) + margin;
          var py = Math.random() * (H - margin * 2) + margin;
          var pBody = M.Bodies.rectangle(px, py, pSize, pSize, {
            restitution: 0.45, friction: 0.04, frictionAir: 0.006, label: 'particle'
          });
          M.Body.setVelocity(pBody, { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 });
          M.World.add(world, pBody);

          var pEl = document.createElement('span');
          pEl.style.cssText =
            'position:absolute;left:0;top:0;' +
            'width:' + vSize + 'px;height:' + vSize + 'px;' +
            'background:' + color + ';pointer-events:none;';
          particleLayer.appendChild(pEl);
          particleData.push({ el: pEl, body: pBody, size: pSize, vSize: vSize });
        }
      });

      var runner = M.Runner.create();
      M.Runner.run(runner, engine);

      /* Click-to-drag */
      var mouse = M.Mouse.create(container);
      mouse.element.removeEventListener('mousewheel',     mouse.mousewheel);
      mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
      mouse.element.removeEventListener('wheel',          mouse.mousewheel);
      container.style.touchAction = 'pan-y';

      var mouseConstraint = M.MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: { stiffness: 0.1, damping: 0.12, angularStiffness: 0.08, render: { visible: false } }
      });
      M.World.add(world, mouseConstraint);

      M.Events.on(mouseConstraint, 'startdrag', function () { container.classList.add('is-dragging'); });
      M.Events.on(mouseConstraint, 'enddrag',   function () { container.classList.remove('is-dragging'); });

      /* DOM sync */
      var rafId;
      function syncDOM() {
        chipData.forEach(function (cd) {
          var p = cd.body.position, a = cd.body.angle;
          cd.el.style.transform =
            'translate(' + (p.x - cd.w / 2).toFixed(1) + 'px,' + (p.y - cd.h / 2).toFixed(1) + 'px)' +
            (Math.abs(a) > 0.004 ? ' rotate(' + a.toFixed(4) + 'rad)' : '');
        });
        particleData.forEach(function (pd) {
          var p = pd.body.position, a = pd.body.angle, vs = pd.vSize;
          pd.el.style.transform =
            'translate(' + (p.x - vs / 2).toFixed(2) + 'px,' + (p.y - vs / 2).toFixed(2) + 'px)' +
            (Math.abs(a) > 0.004 ? ' rotate(' + a.toFixed(4) + 'rad)' : '');
        });
        rafId = requestAnimationFrame(syncDOM);
      }
      rafId = requestAnimationFrame(syncDOM);

      /* Store teardown for this instance */
      localDestroy = function () {
        cancelAnimationFrame(rafId);
        M.Runner.stop(runner);
        M.World.clear(world);
        M.Engine.clear(engine);
      };
    }

    /* ResizeObserver — reinitialize when container dimensions change */
    var resizeTimer;
    var ro = new ResizeObserver(function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(startPhysics, 200);
    });
    ro.observe(container);

    /* Initial start — wait for fonts for accurate chip measurements */
    function triggerStart() {
      requestAnimationFrame(function () { requestAnimationFrame(startPhysics); });
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(triggerStart);
    } else {
      triggerStart();
    }

    /* Global cleanup (page navigation / section teardown) */
    cleanupFns.push(function () {
      ro.disconnect();
      clearTimeout(resizeTimer);
      if (localDestroy) { localDestroy(); }
    });
  }

  /* ============ 2. Strengths — 40-segment precision bar ============ */

  var STRENGTH_SEGMENTS = 40;

  function renderStrengths(root) {
    root.innerHTML = strengthsData.map(function (item) {
      var filled = Math.round((item.level / 10) * STRENGTH_SEGMENTS);
      var segs = '';
      for (var i = 0; i < STRENGTH_SEGMENTS; i++) {
        segs += '<span class="cap-seg' + (i < filled ? ' filled' : '') + '"></span>';
      }
      return (
        '<div class="cap-strength-row">' +
        '<div class="cap-strength-head">' +
        '<span class="cap-strength-label">' + item.label + '</span>' +
        '<span class="cap-strength-level">LV.' + item.level + '</span>' +
        '</div>' +
        '<div class="cap-tube">' + segs + '</div>' +
        '</div>'
      );
    }).join('');
  }

  function animateStrengths(panel, reduced) {
    var allFilled = panel.querySelectorAll('.cap-seg.filled');
    if (!allFilled.length) return;

    /* Set initial hidden state without GSAP so no transform is applied */
    Array.prototype.forEach.call(allFilled, function (seg) { seg.style.opacity = '0'; });

    if (reduced) {
      Array.prototype.forEach.call(allFilled, function (seg) { seg.style.opacity = '1'; });
      return;
    }

    /* Collect segments per bar once, before the trigger fires */
    var tubeSegs = Array.prototype.map.call(panel.querySelectorAll('.cap-tube'), function (tube) {
      return Array.prototype.slice.call(tube.querySelectorAll('.cap-seg.filled'));
    });

    ScrollTrigger.create({
      trigger: panel,
      start: 'top 85%',
      once: true,
      onEnter: function () {
        var DURATION = 2400;
        var startTime = null;

        function frame(now) {
          if (!startTime) startTime = now;
          var t = Math.min((now - startTime) / DURATION, 1);
          var p = easeInCubic(t);
          /* All bars advance together — reveal Math.round(p * count) segments per bar */
          tubeSegs.forEach(function (segs) {
            var show = Math.round(p * segs.length);
            segs.forEach(function (seg, i) {
              seg.style.opacity = i < show ? '1' : '0';
            });
          });
          if (t < 1) requestAnimationFrame(frame);
          else {
            tubeSegs.forEach(function (segs) {
              segs.forEach(function (seg) { seg.style.opacity = '1'; });
            });
          }
        }
        requestAnimationFrame(frame);
      }
    });
  }

  /* ============ 3. Capacity — AI chip video ============ */

  var CAPACITY_VIDEO =
    '<div class="cap-capacity-media">' +
    '<video class="cap-capacity-video" autoplay muted loop playsinline preload="metadata" aria-label="AI chip animation">' +
    '<source src="image/about/AI-CHIP.mp4" type="video/mp4">' +
    '</video>' +
    '</div>';

  function setupCapacityPanel(panel, reduced) {
    var body = panel.querySelector('[data-cap-root="capacity"]');
    body.innerHTML = CAPACITY_VIDEO;
    if (reduced) {
      var video = body.querySelector('.cap-capacity-video');
      if (video) video.pause();
    }
  }

  /* ============ 4. Language — radial proficiency charts ============ */

  var LANG_RING_R       = 84;
  var LANG_RING_C       = 2 * Math.PI * LANG_RING_R;
  var LANG_TICK_COUNT   = 60;
  var LANG_ANIM_DURATION = 2400;

  function easeInCubic(t) { return t * t * t; }

  function buildLangTicks() {
    var ticks = '';
    for (var i = 0; i < LANG_TICK_COUNT; i++) {
      var angle = (360 / LANG_TICK_COUNT) * i;
      ticks += '<rect class="cap-lang-tick" x="118.5" y="4" width="3" height="11" transform="rotate(' + angle + ' 120 120)"/>';
    }
    return '<g class="cap-lang-ticks">' + ticks + '</g>';
  }

  function renderLanguage(root) {
    root.innerHTML = languageData.map(function (item) {
      return (
        '<div class="cap-lang-card">' +
        '<h3 class="cap-lang-title">' + item.label + '</h3>' +
        '<p class="cap-lang-label">' + item.level.toUpperCase() + '</p>' +
        '<div class="cap-lang-chart">' +
        '<svg class="cap-lang-svg" viewBox="0 0 240 240" aria-hidden="true">' +
        buildLangTicks() +
        '<circle class="cap-lang-track" cx="120" cy="120" r="' + LANG_RING_R + '" fill="none"/>' +
        '<circle data-lang-progress class="cap-lang-progress" cx="120" cy="120" r="' + LANG_RING_R + '" fill="none" ' +
        'stroke-dasharray="' + LANG_RING_C + '" stroke-dashoffset="' + LANG_RING_C + '"/>' +
        '<circle class="cap-lang-inner" cx="120" cy="120" r="68" fill="none"/>' +
        '</svg>' +
        '<div class="cap-lang-value" data-lang-value>0%</div>' +
        '</div>' +
        '</div>'
      );
    }).join('');
  }

  function animateLanguage(panel, reduced) {
    var cards = panel.querySelectorAll('.cap-lang-card');
    if (!cards.length) return;

    /* Build per-card targets once */
    var targets = Array.prototype.map.call(cards, function (card, i) {
      return {
        value:   languageData[i].value,
        circle:  card.querySelector('[data-lang-progress]'),
        valueEl: card.querySelector('[data-lang-value]')
      };
    });

    function setFinal() {
      targets.forEach(function (target) {
        target.circle.setAttribute('stroke-dashoffset', LANG_RING_C * (1 - target.value / 100));
        target.valueEl.textContent = target.value + '%';
      });
    }

    if (reduced) { setFinal(); return; }

    /* Single observer on the panel — both cards start the same rAF loop simultaneously */
    var played = false;
    var observer = new IntersectionObserver(function (entries) {
      if (played || !entries[0].isIntersecting) return;
      played = true;
      observer.disconnect();

      var start = null;
      function frame(now) {
        if (start === null) start = now;
        var t = Math.min((now - start) / LANG_ANIM_DURATION, 1);
        var p = easeInCubic(t);
        targets.forEach(function (target) {
          var current = target.value * p;
          target.circle.setAttribute('stroke-dashoffset', LANG_RING_C * (1 - current / 100));
          target.valueEl.textContent = Math.round(current) + '%';
        });
        if (t < 1) requestAnimationFrame(frame);
        else setFinal();
      }
      requestAnimationFrame(frame);
    }, { threshold: 0.3 });

    observer.observe(panel);
  }

  /* ============ 5. Interests — infinite auto-sliding carousel ============ */

  function renderInterests(root) {
    var cardHTML = interestsData.map(function (item) {
      return (
        '<div class="cap-interest-card">' +
        '<img class="cap-interest-icon" src="' + item.icon + '" alt="">' +
        '<span class="cap-interest-label">' + item.label + '</span>' +
        '</div>'
      );
    }).join('');
    /* Duplicate cards for seamless infinite loop */
    root.innerHTML = cardHTML + cardHTML;
  }

  /* ============ Init ============ */

  function init(cleanupFns) {
    var dashboard = document.querySelector('[data-cap-dashboard]');
    if (!dashboard || dashboard.dataset.capReady === 'true') return;
    dashboard.dataset.capReady = 'true';

    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var skillsPanel    = dashboard.querySelector('[data-cap="skills"]');
    var strengthsPanel = dashboard.querySelector('[data-cap="strengths"]');
    var capacityPanel  = dashboard.querySelector('[data-cap="capacity"]');
    var languagePanel  = dashboard.querySelector('[data-cap="language"]');
    var interestsRoot  = dashboard.querySelector('[data-cap-root="interests"]');

    renderSkillChips(skillsPanel);
    if (!reduced) {
      setupSkillsPhysics(skillsPanel, cleanupFns);
    } else {
      var chipsLayer = skillsPanel.querySelector('[data-cap-chips]');
      chipsLayer.classList.add('cap-skills-chips--static');
      Array.prototype.slice.call(chipsLayer.querySelectorAll('.cap-chip')).forEach(function (c) {
        c.style.opacity = '1';
        c.style.animation = 'none';
      });
    }

    renderStrengths(strengthsPanel.querySelector('[data-cap-root="strengths"]'));
    animateStrengths(strengthsPanel, reduced);

    renderLanguage(languagePanel.querySelector('[data-cap-root="language"]'));
    animateLanguage(languagePanel, reduced);

    renderInterests(interestsRoot);

    setupCapacityPanel(capacityPanel, reduced);
  }

  window.AboutDashboard = { init: init };
})();

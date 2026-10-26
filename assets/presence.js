/* v3 Feedback board: you become "Me" (a design tool's multiplayer cursor); 2-3 made-up collaborators wander in for 6-12 seconds each. */
(function () {
  'use strict';
  var NAMES = ['Ava', 'Noah', 'Yuki', 'Mateo', 'Priya', 'Liam', 'Sofia', 'Kenji', 'Zoe', 'Omar', 'Chloe', 'Ethan', 'Mei', 'Lucas', 'Anna', 'Raj', 'Nora', 'Felix', 'Hana', 'Diego'];
  var COLORS = ['#F6CF8E', '#F2A7C3', '#B3A4F5', '#7FD6C2', '#FF4D6D']; // the research-note colours plus the redline red; orange stays "Me"
  // the multiplayer cursor: tip at the origin, its axis (tip to notch) running down-right at about 50 degrees, so the name tag's corner sits in the notch
  var ARROW = '<svg viewBox="-1.5 -1.5 20 22" aria-hidden="true"><path d="M0 0L16 8.3 8.3 10 4.3 17.5z" fill="currentColor" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  function rand(a, b) { return a + Math.random() * (b - a); }

  window.mountPresence = function (board, opts) {
    opts = opts || {};
    if (!board || !matchMedia('(pointer: fine)').matches) return;
    var layer = document.createElement('div'); layer.className = 'mp'; layer.setAttribute('aria-hidden', 'true'); board.appendChild(layer);
    board.setAttribute('data-svg-zone', ''); // the site's own cursor steps aside while you're on the board

    function make(name, color, me) {
      var el = document.createElement('div'); el.className = 'mc' + (me ? ' me' : ''); el.style.setProperty('--c', color);
      el.innerHTML = ARROW + '<span class="nm"></span>'; el.lastChild.textContent = name; layer.appendChild(el); return el;
    }
    var me = make('Me', '#F07040', true), meOn = false;
    var W = board.clientWidth, H = board.clientHeight;
    new ResizeObserver(function () { W = board.clientWidth; H = board.clientHeight; }).observe(board);

    /* ---------- you ---------- */
    board.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse') return;
      board.classList.add('mp-on'); meOn = true; me.classList.add('on'); join();
    });
    board.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = board.getBoundingClientRect(); me.style.transform = 'translate(' + (e.clientX - r.left) + 'px,' + (e.clientY - r.top) + 'px)';
      if (!meOn) { meOn = true; board.classList.add('mp-on'); me.classList.add('on'); }
    });
    board.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      board.classList.remove('mp-on'); meOn = false; me.classList.remove('on');
    });

    /* ---------- the others ---------- */
    var bots = [], pending = 0, raf = 0, last = 0;
    function pickName() {
      var used = bots.map(function (b) { return b.name; }), pool = NAMES.filter(function (n) { return used.indexOf(n) < 0; });
      return pool[Math.floor(Math.random() * pool.length)];
    }
    function pickColor() {
      var used = bots.map(function (b) { return b.color; }), pool = COLORS.filter(function (c) { return used.indexOf(c) < 0; });
      return pool[Math.floor(Math.random() * pool.length)];
    }
    function add() {
      pending--; if (bots.length >= 3) return;
      var name = pickName(), color = pickColor(), edge = Math.floor(Math.random() * 4), t = rand(0.15, 0.85);
      var x = edge === 0 ? t : edge === 1 ? 1.02 : edge === 2 ? t : -0.02, y = edge === 0 ? -0.04 : edge === 1 ? t : edge === 2 ? 1.04 : t;
      var b = { name: name, color: color, el: make(name, color, false), x: x, y: y, tx: rand(0.1, 0.9), ty: rand(0.12, 0.88), k: rand(0.03, 0.055), next: 0, dieAt: performance.now() + rand(6000, 12000), leaving: false, ph: rand(0, 6) };
      b.el.style.transform = 'translate(' + x * W + 'px,' + y * H + 'px)'; void b.el.offsetWidth; b.el.classList.add('on');
      bots.push(b); if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    }
    function join() { // 2-3 people, arriving a little apart; only when the board is quiet
      if (opts.reduced) return;
      var want = (Math.random() < 0.5 ? 2 : 3) - bots.length - pending;
      for (var i = 0; i < want; i++) { pending++; setTimeout(add, i * rand(500, 1600) + rand(150, 500)); }
    }
    function tick(now) {
      var dt = Math.min(64, now - last) / 16.7; last = now;
      for (var i = bots.length - 1; i >= 0; i--) {
        var b = bots[i];
        if (!b.leaving && now > b.dieAt) { // walk off the nearest edge and fade out
          b.leaving = true; b.el.classList.remove('on'); b.k = 0.05;
          var dx = Math.min(b.x, 1 - b.x), dy = Math.min(b.y, 1 - b.y);
          if (dx < dy) b.tx = b.x < 0.5 ? -0.06 : 1.06; else b.ty = b.y < 0.5 ? -0.08 : 1.08;
          setTimeout((function (bb) { return function () { bb.el.remove(); bots.splice(bots.indexOf(bb), 1); }; })(b), 480);
        }
        if (!b.leaving && now > b.next) { // a new waypoint: sometimes a short nudge, sometimes a long cross of the board
          if (Math.random() < 0.55) { b.tx = Math.min(0.95, Math.max(0.05, b.x + rand(-0.14, 0.14))); b.ty = Math.min(0.92, Math.max(0.08, b.y + rand(-0.2, 0.2))); }
          else { b.tx = rand(0.06, 0.94); b.ty = rand(0.1, 0.9); }
          b.k = rand(0.025, 0.06); b.next = now + rand(700, 2400);
        }
        b.x += (b.tx - b.x) * b.k * dt; b.y += (b.ty - b.y) * b.k * dt;
        var jx = Math.sin(now / 230 + b.ph) * 1.4, jy = Math.cos(now / 290 + b.ph) * 1.4; // a hand is never perfectly still
        b.el.style.transform = 'translate(' + (b.x * W + jx).toFixed(1) + 'px,' + (b.y * H + jy).toFixed(1) + 'px)';
      }
      raf = bots.length ? requestAnimationFrame(tick) : 0;
    }
  };
})();

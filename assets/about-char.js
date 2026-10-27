/* About character sheet (v3). Scroll unlocks six Inspector panels around Tom's character; each panel is wired to
   the part of him it describes, and an X-ray lens follows the pointer (or the newest panel) to show the skeleton. */
window.mountCharacter = function (root, opts) {
  var A = opts.about, reduced = opts.reduced, fine = matchMedia('(pointer: fine)').matches;
  var $ = function (s, c) { return (c || root).querySelector(s); }, $$ = function (s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  // Process tags are a first pass from the skill names, to confirm with Tom.
  var SKILLS = [
    ['User Research', 'research'], ['Competitive Analysis', 'research'], ['User Journey Mapping', 'research'], ['Information Architecture', 'research'],
    ['Organizing Information', 'research'], ['Critical Thinking', 'research'], ['Product Thinking', 'research'], ['AI-driven Research', 'research'],
    ['Wireframing', 'craft'], ['Visual UI Design', 'craft'], ['Design System', 'craft handoff'], ['Responsive Web Design', 'craft handoff'],
    ['Prototyping', 'craft animate'], ['AI Prompting', 'craft'], ['AI-powered Ideation', 'craft'], ['Micro-interaction', 'animate'],
    ['Storytelling', 'animate'], ['Vibe Design & Coding', 'craft animate'], ['Handoff & Specs', 'handoff'], ['HTML/CSS', 'handoff'],
    ['Cross-functional Collaboration', 'handoff'], ['User-centered Iteration', 'research handoff'], ['AI Workflow Automation', 'handoff'], ['AI-generated Evaluation', 'research']
  ];
  var STRENGTHS = [['Critical Thinking', 8], ['Self-Disciplined', 9], ['Continuous Learning', 7], ['Problem Solving', 8], ['Collaboration', 6], ['Time-Management', 8]];
  var LANGS = [['Chinese', 'Native', 94], ['English', 'Advanced', 82]];
  var INTERESTS = [['Movie', 'movie'], ['Badminton', 'badminton'], ['Travel', 'travel'], ['Pets', 'pet'], ['Board game', 'board-game']];
  var ICON = {
    research: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/>', craft: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 7l3 3"/>',
    animate: '<path d="M3 18c4 0 5-12 9-12s5 12 9 12"/>', handoff: '<path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4M9 12h6M12 9v6"/>'
  };
  var bar = function (n, of) { var s = ''; for (var i = 0; i < of; i++) s += '<i data-on="' + (i < n ? 1 : 0) + '"></i>'; return '<div class="ax-bar">' + s + '</div>'; };
  var shortBio = A.bio.split('. ').slice(0, 2).join('. ') + '.';
  var RING_R = 84, RING_C = 2 * Math.PI * RING_R;
  // Skills radar: one quadrant per process step (clockwise from top: Research, Craft, Animate, Handoff),
  // each skill a blip that lights up as the sweep passes, then fades.
  var QUAD = ['research', 'craft', 'animate', 'handoff'], BLIPS = [];
  (function () {
    QUAD.forEach(function (q, qi) {
      var mine = SKILLS.filter(function (s) { return s[1].split(' ')[0] === q; });
      mine.forEach(function (s, k) {
        var ang = qi * 90 + 6 + (k + 0.5) * (78 / mine.length), rad = [0.9, 0.52, 0.74, 0.32, 0.64, 0.42, 0.84, 0.26, 0.58][k % 9];
        BLIPS.push({ name: s[0], tags: s[1], ang: ang, rad: rad, lit: -1e9 });
      });
    });
  })();
  function radar() {
    // bezel: a tick every 5°, longer every 30° with its bearing; scope: 5 range rings, 12 spokes, a fine mesh
    var g = '', c = 100;
    for (var d = 0; d < 360; d += 5) {
      var a = (d - 90) * Math.PI / 180, long = d % 30 === 0, r1 = long ? 92.5 : 94.5, r2 = 97;
      g += '<line x1="' + (c + Math.cos(a) * r1).toFixed(2) + '" y1="' + (c + Math.sin(a) * r1).toFixed(2) + '" x2="' + (c + Math.cos(a) * r2).toFixed(2) + '" y2="' + (c + Math.sin(a) * r2).toFixed(2) + '" class="' + (long ? 'tl' : 'ts') + '"/>';
      if (long) g += '<text x="' + (c + Math.cos(a) * 87.5).toFixed(2) + '" y="' + (c + Math.sin(a) * 87.5 + 1.3).toFixed(2) + '">' + (d < 100 ? (d < 10 ? '00' : '0') : '') + d + '</text>';
    }
    for (var k = 1; k <= 5; k++) g += '<circle cx="100" cy="100" r="' + (k * 16.4).toFixed(1) + '" class="' + (k === 5 ? 'ring o' : 'ring') + '"/>';
    for (var sp = 0; sp < 360; sp += 30) { var b2 = (sp - 90) * Math.PI / 180; g += '<line x1="100" y1="100" x2="' + (100 + Math.cos(b2) * 82).toFixed(2) + '" y2="' + (100 + Math.sin(b2) * 82).toFixed(2) + '" class="' + (sp % 90 ? 'spk' : 'axis') + '"/>'; }
    g += '<circle cx="100" cy="100" r="97" class="bez"/><circle cx="100" cy="100" r="99.5" class="bez2"/><circle cx="100" cy="100" r="1.6" class="ctr"/>';
    return '<div class="ax-radar" id="axRadar"><span class="mesh"></span>' +
      '<svg class="scope" viewBox="0 0 200 200" aria-hidden="true">' + g + '</svg>' +
      QUAD.map(function (q, i) { return '<span class="rq q' + i + '">' + q + '</span>'; }).join('') +
      '<span class="sweep" id="axSweep"></span>' +
      BLIPS.map(function (b, i) {
        var a = (b.ang - 90) * Math.PI / 180, x = 50 + Math.cos(a) * b.rad * 41, y = 50 + Math.sin(a) * b.rad * 41; // inside the outer range ring
        return '<span class="blip' + (x > 50 ? ' lft' : '') + '" data-i="' + i + '" data-p="' + b.tags + '" style="left:' + x.toFixed(2) + '%;top:' + y.toFixed(2) + '%"><i></i><em>' + b.name + '</em></span>';
      }).join('') + '</div>' +
      '<div class="ax-rd mono"><span>AZ <b id="axAz">000°</b></span><span>TARGETS <b>' + BLIPS.length + '</b></span><span>LOCK <b id="axLock">ALL</b></span></div>';
  }
  function ring() {
    var t = ''; for (var i = 0; i < 60; i++) t += '<rect class="tk" x="118.5" y="4" width="3" height="11" transform="rotate(' + i * 6 + ' 120 120)"/>';
    return '<svg viewBox="0 0 240 240" aria-hidden="true">' + t + '<circle class="trk" cx="120" cy="120" r="' + RING_R + '"/>' +
      '<circle class="prg" cx="120" cy="120" r="' + RING_R + '" stroke-dasharray="' + RING_C + '" stroke-dashoffset="' + RING_C + '"/><circle class="inr" cx="120" cy="120" r="68"/></svg>';
  }
  // Working pattern in Taipei time. Placeholder hours, to confirm with Tom: core 10–18 on weekdays, flexible 9 and 19–21.
  function level(day, h) {
    if (day > 4) return (day === 5 && h >= 10 && h < 13) ? 1 : 0;
    if (h >= 10 && h < 18) return h === 13 ? 2 : 3;
    if (h === 9 || (h >= 18 && h < 21)) return 1;
    return 0;
  }
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function taipeiNow() {
    var date = new Date(), parts = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(date).forEach(function (part) { parts[part.type] = part.value; });
    return {
      day: DAYS.indexOf(parts.weekday),
      hour: Number(parts.hour),
      time: new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', hour: 'numeric', minute: '2-digit', hour12: true }).format(date)
    };
  }
  function availabilityLabel(day, hour) {
    return ['Off hours in Taipei', 'Flexible hours', 'Core hours — lunch', 'Core hours — online'][level(day, hour)];
  }
  function matrix() {
    var tp = taipeiNow(), nowDay = tp.day, nowH = tp.hour, cells = '';
    DAYS.forEach(function (d, di) {
      cells += '<span class="d">' + d + '</span>';
      for (var h = 0; h < 24; h++) {
        var lv = level(di, h), now = di === nowDay && h === nowH;
        var slot = d + ' ' + (h < 10 ? '0' : '') + h + ':00 Taipei';
        cells += '<i data-day="' + di + '" data-hour="' + h + '" data-slot-title="' + slot + '" class="' + (lv ? 'lv' + lv : '') + (now ? ' now' : '') + '" style="--dl:' + ((di * 24 + h) % 37 * 14) + 'ms" title="' + slot + '"></i>';
      }
    });
    return '<div class="ax-av-top"><b>Open to new projects</b><span data-av-status>' + availabilityLabel(nowDay, nowH) + '</span></div>' +
      '<div class="ax-mx">' + cells + '<div class="ax"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div></div>' +
      '<div class="ax-legend"><span><i style="background:var(--accent)"></i>Core</span><span><i style="background:rgba(240,112,64,.62)"></i>Lunch</span>' +
      '<span><i style="background:rgba(240,112,64,.28)"></i>Flexible</span><span><i style="outline:1px solid var(--ink)"></i>Now</span></div>' +
      '<p class="ax-note">Taipei · GMT+8 · it’s <time data-av-clock>' + tp.time + '</time> here</p>';
  }

  // unlock order alternates sides; anchors are points on the character image (percent of its box)
  var PANELS = [
    { id: 'sum', side: 'l', name: 'Summary', st: 'Lv.06 · Taipei', at: [50, 16], body: '<div class="ax-in ax-sum"><h4>' + A.hi + '</h4><p>' + shortBio + '</p><blockquote>“' + A.quote + '”</blockquote>' +
        '<a class="btn btn--fill" href="' + A.resume + '" data-resume download>Download resume ↓</a></div>' },
    { id: 'str', side: 'r', name: 'Strengths', st: 'avg 7.7', at: [52, 44], body: '<div class="ax-in">' + STRENGTHS.map(function (s) {
        return '<div class="ax-row"><div class="k">' + s[0] + '<b>LV.' + s[1] + '</b></div>' + bar(Math.round(s[1] * 4), 40) + '</div>'; }).join('') + '</div>' },
    { id: 'badge', side: 'l', name: 'ID badge', st: 'Holder · Po-Hung Lin', at: [41, 39], body: '<div class="ax-badge"><div class="ab-lc" id="ab-lc"></div></div>' },
    { id: 'skills', side: 'r', name: 'Expertise', st: SKILLS.length + ' items', at: [70, 53], body: '<div class="ax-in"><div class="ax-filter" role="group" aria-label="Filter skills by process step">' +
        '<button type="button" data-f="all" aria-pressed="true">All</button>' + ['research', 'craft', 'animate', 'handoff'].map(function (k) {
          return '<button type="button" data-f="' + k + '" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' + ICON[k] + '</svg>' + k + '</button>'; }).join('') +
        '</div>' + radar() + '</div>' },
    { id: 'lang', side: 'l', name: 'Language', st: '2 spoken', at: [50, 27], body: '<div class="ax-in"><div class="ax-lang">' + LANGS.map(function (l) {
        return '<div class="ax-row" data-v="' + l[2] + '"><h5>' + l[0] + '</h5><small>' + l[1] + '</small><div class="ax-ring">' + ring() + '<b>0%</b></div></div>'; }).join('') + '</div></div>' },
    { id: 'int', side: 'r', name: 'Interests', st: INTERESTS.length + ' assets', at: [58, 93], body: '<div class="ax-in"><div class="ax-int">' + INTERESTS.map(function (n) {
        return '<div><img src="image/about/' + n[1] + '.png" alt=""><span>' + n[0].toUpperCase() + '</span></div>'; }).join('') + '</div></div>' },
    { id: 'avail', side: 'l', name: 'Availability', st: 'Open · GMT+8', at: [29, 52], body: '<div class="ax-in">' + matrix() + '</div>' },
    // AI skills drawn from the bio: research synthesis, rapid prototyping, prompting and light coding with AI
    { id: 'ai', side: 'r', name: 'AI Skills', st: '3 skills', at: [57, 9], body: '<div class="ax-in"><div class="ax-ai-top"><span class="halo"></span>' +
        '<canvas class="ai-cv" id="aiCv" role="img" aria-label="A sphere of orange particles with the letters AI at its centre"></canvas><span class="st2">Model · <b>in the loop</b></span></div><ul class="ax-ai">' +
        [['AI-driven prototyping', 'Prompting and rapid prototypes to explore ideas faster'],
         ['AI-assisted user research', 'Synthesising research and finding patterns sooner'],
         ['Low-code & AI co-development', 'Light coding with AI, closer to what ships']].map(function (r, i) {
          return '<li><span aria-hidden="true"></span><b>' + r[0] + '</b><small>' + r[1] + '</small></li>'; }).join('') + '</ul></div>' }
  ];
  var chev = '<svg class="ch" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 3.5l3 3 3-3"/></svg>';
  var lock = '<span class="lk"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2.5" y="5.5" width="7" height="5"/><path d="M4 5.5V4a2 2 0 0 1 4 0v1.5"/></svg>Locked</span>';
  function panel(p) { // every slot exists from the start; locked ones are just a dimmed, padlocked header
    return '<section class="ipanel ax-p is-locked" data-id="' + p.id + '"><header role="button" tabindex="0" aria-expanded="false" aria-controls="ax-body-' + p.id + '"><i><b></b><b></b><b></b></i>' + p.name + '<span class="st">' + p.st + '</span>' + lock + chev + '</header>' +
      '<div class="ax-body" id="ax-body-' + p.id + '"><div>' + p.body + '</div></div></section>';
  }
  root.innerHTML = '<div class="ax-stage" id="axStage">' +
    '<div class="ax-col l">' + PANELS.filter(function (p) { return p.side === 'l'; }).map(panel).join('') + '</div>' +
    '<div class="ax-char" id="axChar" data-focal="Component / Tom Lin · LV.06">' +
      '<span class="ax-floor" aria-hidden="true"></span>' +
      '<div class="ax-fig"><img src="assets/3d-human-original.webp" alt="3D character of Tom: glasses, orange jacket, hands on hips">' +
      '<img class="xr" src="assets/3d-human-skeleton.webp" alt="" aria-hidden="true"><span class="ax-lens" aria-hidden="true"><span>X-RAY</span></span></div>' +
      '<div class="ax-plate"><b>Tom Lin</b><span>UI/UX Designer · <em>LV.06</em> · 6+ yrs</span></div></div>' +
    '<div class="ax-col r">' + PANELS.filter(function (p) { return p.side === 'r'; }).map(panel).join('') + '</div>' +
    '<div class="ax-slots" id="axSlots" aria-live="polite"><span class="sq">' + PANELS.map(function () { return '<i></i>'; }).join('') + '</span><b>0/' + PANELS.length + '</b><em>Scroll to unlock</em></div>' +
    '<svg class="ax-wires" id="axWires" aria-hidden="true">' + PANELS.map(function (p) { return '<path pathLength="1" data-id="' + p.id + '"/><rect width="7" height="7" data-id="' + p.id + '"/>'; }).join('') + '</svg>' +
    '</div>';

  var stage = $('#axStage'), track = root, ch = $('#axChar'), fig = $('.ax-fig'), lens = $('.ax-lens');
  var els = {}; PANELS.forEach(function (p) { els[p.id] = { p: p, el: $('.ax-p[data-id="' + p.id + '"]'), path: $('path[data-id="' + p.id + '"]'), sq: $('rect[data-id="' + p.id + '"]') }; });
  var stacked = function () { return innerWidth <= 1000; };
  var unlocked = 0, pinned = { l: null, r: null }, mobileActive = 'sum';

  function updateAvailability() {
    var tp = taipeiNow();
    $$('.ax-mx i[data-day]', root).forEach(function (cell) {
      var isNow = Number(cell.dataset.day) === tp.day && Number(cell.dataset.hour) === tp.hour;
      cell.classList.toggle('now', isNow);
      cell.title = isNow ? cell.dataset.slotTitle + ' · now ' + tp.time : cell.dataset.slotTitle;
    });
    var status = $('[data-av-status]', root), clock = $('[data-av-clock]', root);
    if (status) status.textContent = availabilityLabel(tp.day, tp.hour);
    if (clock) clock.textContent = tp.time;
  }
  updateAvailability();
  setInterval(updateAvailability, 60000);

  /* ---------- stat fills play once, when their panel unlocks ---------- */
  function fill(id) {
    var e = els[id].el; if (e.dataset.filled) return; e.dataset.filled = 1;
    var bars = $$('.ax-bar', e).map(function (b) { return $$('i[data-on="1"]', b); }), vals = $$('.ax-row[data-v]', e);
    var t0 = performance.now();
    (function f(now) {
      var t = reduced ? 1 : Math.min(1, (now - t0) / 1600), k = 1 - Math.pow(1 - t, 3);
      bars.forEach(function (segs) { var n = Math.round(k * segs.length); segs.forEach(function (s, i) { s.classList.toggle('on', i < n); }); });
      vals.forEach(function (r) {
        var v = +r.dataset.v * k; r.querySelector('b').textContent = Math.round(v) + '%';
        var pr = r.querySelector('.prg'); if (!pr) return;
        pr.setAttribute('stroke-dashoffset', RING_C * (1 - v / 100));
      });
      if (t < 1) requestAnimationFrame(f);
    })(t0);
  }

  /* ---------- unlocking: newest panel on each side is open, earlier ones fold to their header ---------- */
  function setUnlocked(n) {
    if (n === unlocked) return;
    var old = unlocked; unlocked = n; pinned.l = pinned.r = null;
    layout();
    if (!reduced) for (var k = old; k < n; k++) (function (el) { el.classList.add('just'); setTimeout(function () { el.classList.remove('just'); }, 1000); })(els[PANELS[k].id].el);
  }
  function layout() {
    var latest = { l: null, r: null };
    PANELS.forEach(function (p, i) {
      var on = stacked() || i < unlocked; els[p.id].el.classList.toggle('is-on', on); els[p.id].el.classList.toggle('is-locked', !on);
      if (on) latest[p.side] = p.id;
      if (on) fill(p.id);
    });
    PANELS.forEach(function (p) {
      var open = stacked() ? mobileActive === p.id : (pinned[p.side] || latest[p.side]) === p.id;
      els[p.id].el.classList.toggle('is-open', open);
      $('header', els[p.id].el).setAttribute('aria-expanded', String(open));
    });
    var sl = $('#axSlots'); if (sl) {
      $$('.sq i', sl).forEach(function (q, i) { q.classList.toggle('on', stacked() || i < unlocked); });
      var n = stacked() ? PANELS.length : unlocked; $('b', sl).textContent = n + '/' + PANELS.length;
      $('em', sl).textContent = n === PANELS.length ? 'All unlocked' : 'Scroll to unlock';
    }
  }
  root.addEventListener('click', function (e) {
    var h = e.target.closest('.ax-p > header'); if (!h) return;
    var p = els[h.parentNode.dataset.id].p, i = PANELS.indexOf(p);
    if (stacked()) {
      mobileActive = mobileActive === p.id ? null : p.id;
      layout();
      return;
    }
    if (i >= unlocked) { // a locked slot: scroll to the point where it unlocks
      var r = track.getBoundingClientRect();
      scrollTo({ top: r.top + scrollY + (i + 0.72) / (PANELS.length + 0.6) * (track.offsetHeight - innerHeight), behavior: reduced ? 'auto' : 'smooth' });
      return;
    }
    pinned[p.side] = p.id; layout();
  });
  root.addEventListener('keydown', function (e) {
    var h = e.target.closest && e.target.closest('.ax-p > header');
    if (!h || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault(); h.click();
  });

  /* ---------- skills × process (same four tools as the hero) ---------- */
  root.addEventListener('click', function (e) {
    var b = e.target.closest('.ax-filter button'); if (!b) return;
    $$('.ax-filter button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    $$('.blip').forEach(function (c) {
      var hit = b.dataset.f !== 'all' && c.dataset.p.split(' ').indexOf(b.dataset.f) > -1;
      c.classList.toggle('hit', hit); c.classList.toggle('dim', b.dataset.f !== 'all' && !hit);
    });
    $('#axLock').textContent = b.dataset.f.toUpperCase();
    requestAnimationFrame(declutter);
    // point the sweep at the chosen step's quadrant
    var qi = QUAD.indexOf(b.dataset.f); if (qi > -1) { sweepHold = performance.now() + 1600; sweepTo = qi * 90 + 85; }
  });

  /* ---------- X-ray lens: follows the pointer over him, otherwise rests on the newest panel's anchor ---------- */
  var lp = { x: 50, y: 40 }, lt = { x: 50, y: 40 }, over = false, lr = 0;
  ch.addEventListener('pointermove', function (e) { var r = fig.getBoundingClientRect(); over = true; lt.x = (e.clientX - r.left) / r.width * 100; lt.y = (e.clientY - r.top) / r.height * 100; });
  ch.addEventListener('pointerleave', function () { over = false; });
  if (!fine) ch.addEventListener('click', function (e) { var r = fig.getBoundingClientRect(); lt.x = (e.clientX - r.left) / r.width * 100; lt.y = (e.clientY - r.top) / r.height * 100; });

  // pinned labels (a filter is on) must not sit on each other: push later ones down until they clear
  function declutter() {
    var ems = $$('.blip em'); ems.forEach(function (e) { e.style.marginTop = ''; });
    var placed = [];
    $$('.blip.hit em').map(function (e) { return { e: e, r: e.getBoundingClientRect() }; })
      .sort(function (a, b) { return a.r.top - b.r.top; })
      .forEach(function (o) {
        var shift = 0, moved = true;
        while (moved) {
          moved = false;
          placed.forEach(function (q) {
            var t = o.r.top + shift;
            if (o.r.left < q.right && q.left < o.r.right && t < q.bottom + 2 && q.top < t + o.r.height) { shift = q.bottom + 3 - o.r.top; moved = true; }
          });
        }
        if (shift) o.e.style.marginTop = shift + 'px';
        placed.push({ left: o.r.left, right: o.r.right, top: o.r.top + shift, bottom: o.r.bottom + shift });
      });
  }
  addEventListener('resize', function () { requestAnimationFrame(declutter); });

  /* ---------- AI sphere: a wavy shell of particles that breathes, scatters under the pointer and settles back;
     the "AI" glyph in the middle is its own particle cloud and ignores the pointer ---------- */
  (function aiSphere(cv) {
    var ctx = cv.getContext('2d'), dpr = 1, W = 0, H = 0, R = 60, raf = 0, seen = false, t0 = performance.now();
    var P = [], G = [], D = [], mouse = { x: -1e4, y: -1e4, on: false, vx: 0, vy: 0, sp: 0 };
    // a lat/long mesh, so the shell reads as woven lines rather than random dots
    var LAT = 70, LON = 120;
    for (var a = 1; a < LAT; a++) for (var nb = Math.max(8, Math.round(LON * Math.sin(a / LAT * Math.PI))), b = 0; b < nb; b++) { // fewer per ring near the poles, so they don't bunch up
      var th = a / LAT * Math.PI, ph = b / nb * Math.PI * 2 + (a % 2) * Math.PI / nb;
      P.push({ x: Math.sin(th) * Math.cos(ph), y: Math.cos(th), z: Math.sin(th) * Math.sin(ph), ph: Math.random() * 6.283, ox: 0, oy: 0, vx: 0, vy: 0 });
    }
    // lumps: soft bumps and dents at random directions, each swelling on its own clock
    var BUMPS = [];
    for (var k = 0; k < 13; k++) {
      var u = Math.random() * 2 - 1, v = Math.random() * 6.283, q = Math.sqrt(1 - u * u);
      BUMPS.push({ x: q * Math.cos(v), y: u, z: q * Math.sin(v), amp: (k % 3 === 0 ? -1 : 1) * (0.09 + Math.random() * 0.1), sp: 0.5 + Math.random() * 0.9, ph: Math.random() * 6.283, w: 6 + Math.random() * 7 });
    }
    for (var d0 = 0; d0 < 140; d0++) D.push({ a: Math.random() * 6.283, r: 1.08 + Math.random() * 0.35, y: Math.random() * 2 - 1, sp: 0.1 + Math.random() * 0.3, ph: Math.random() * 6.283 });
    function glyph() { // sample "AI" from an offscreen canvas into points
      var c = document.createElement('canvas'), w = 120, h = 70; c.width = w; c.height = h;
      var g = c.getContext('2d'); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '700 56px "Space Grotesk", sans-serif'; g.fillText('AI', w / 2, h / 2 + 3);
      var dd = g.getImageData(0, 0, w, h).data; G = [];
      for (var yy = 0; yy < h; yy += 2) for (var xx = 0; xx < w; xx += 2) {
        if (dd[((yy | 0) * w + (xx | 0)) * 4 + 3] > 140) G.push({ x: xx - w / 2, y: yy - h / 2, ph: Math.random() * 6.283 });
      }
    }
    function size() {
      dpr = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; if (!W || !H) return;
      cv.width = W * dpr; cv.height = H * dpr; R = Math.min(W, H) * 0.38;
    }
    // orange family, but a real gradient across the ball: gold → amber → orange → coral → rose
    var PAL = [[255, 214, 140], [255, 170, 80], [240, 112, 64], [232, 72, 74], [214, 52, 110]];
    function mix(k) {
      var f = Math.max(0, Math.min(.999, k)) * (PAL.length - 1), i = f | 0, u = f - i, a0 = PAL[i], a1 = PAL[i + 1];
      return [a0[0] + (a1[0] - a0[0]) * u, a0[1] + (a1[1] - a0[1]) * u, a0[2] + (a1[2] - a0[2]) * u];
    }
    function draw(now) {
      raf = 0; if (!cv.clientHeight) return;
      if (cv.clientWidth !== W || cv.clientHeight !== H) size();
      var t = (now - t0) / 1000, cx = W / 2, cy = H / 2, ry = t * 0.22, rx = -0.4 + Math.sin(t * 0.3) * 0.12;
      var cr = Math.cos(ry), sr = Math.sin(ry), cX = Math.cos(rx), sX = Math.sin(rx), breathe = 1 + Math.sin(t * 1.1) * 0.03;
      var bAmp = BUMPS.map(function (b) { return b.amp * (0.55 + 0.45 * Math.sin(t * b.sp + b.ph)); });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      // on paper, additive light washes out: draw normally and let the rims and glyph darken instead of glow
      var lt = document.documentElement.getAttribute('data-theme') === 'light', rs = lt ? -60 : 40, gl = lt ? -70 : 25;
      ctx.globalCompositeOperation = lt ? 'source-over' : 'lighter';
      for (var i = 0; i < P.length; i++) {
        var p = P[i], disp = 0;
        for (var k = 0; k < BUMPS.length; k++) {
          var b = BUMPS[k], dot = p.x * b.x + p.y * b.y + p.z * b.z; disp += bAmp[k] * Math.exp(-b.w * (1 - dot));
        }
        // fine folds riding over the lumps, plus each particle's own breath
        disp += 0.032 * Math.sin(p.y * 13 + t * 1.6) * Math.cos(p.x * 9 - t * 1.1) + 0.02 * Math.sin(p.z * 17 - t * 1.3) + 0.012 * Math.sin(t * 2.2 + p.ph);
        var m = (1 + disp) * breathe, x = p.x * m, y = p.y * m, z = p.z * m;
        var x1 = x * cr + z * sr, z1 = -x * sr + z * cr, y1 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
        var persp = 3.2 / (3.2 - z2), sx = cx + x1 * R * persp, sy = cy + y1 * R * persp;
        if (mouse.on && mouse.sp > 0.2) { // the pointer blasts particles out: away from it, along its stroke, with some spread
          var dx = sx + p.ox - mouse.x, dy = sy + p.oy - mouse.y, d2 = dx * dx + dy * dy, rad = 64;
          if (d2 < rad * rad) {
            var dd = Math.sqrt(d2) || 1, f = Math.pow(1 - dd / rad, 1.4) * (3 + Math.min(mouse.sp, 40) * 0.22), j = (Math.random() - 0.5) * 1.2;
            var ux = dx / dd, uy = dy / dd, cj = Math.cos(j), sj = Math.sin(j);
            p.vx += (ux * cj - uy * sj) * f + mouse.vx * 0.18 * (1 - dd / rad); p.vy += (ux * sj + uy * cj) * f + mouse.vy * 0.18 * (1 - dd / rad);
          }
        }
        // loose return: a soft spring with little drag, so scattered particles drift home instead of snapping back
        p.vx += -p.ox * 0.012; p.vy += -p.oy * 0.012; p.vx *= 0.94; p.vy *= 0.94; p.ox += p.vx; p.oy += p.vy;
        var kick = Math.min(1, Math.sqrt(p.vx * p.vx + p.vy * p.vy) / 6);
        var front = (z2 / (1 + Math.abs(disp)) + 1) / 2, rim = Math.pow(1 - Math.min(1, Math.abs(z2)), 2.2); // edges glow, like a lit silhouette
        var c = mix((x1 * 0.62 - y1 * 0.42 + 1.05) / 2.1), a = 0.06 + front * 0.32 + rim * 0.5 + kick * 0.6; // flying particles flare
        ctx.fillStyle = 'rgba(' + (c[0] + rim * rs | 0) + ',' + (c[1] + rim * rs | 0) + ',' + (c[2] + rim * rs * .75 | 0) + ',' + Math.min(1, a).toFixed(3) + ')';
        var sz = 0.55 + front * 0.75; ctx.fillRect(sx + p.ox - sz / 2, sy + p.oy - sz / 2, sz, sz);
      }
      // dust drifting around the ball
      for (var j = 0; j < D.length; j++) {
        var q = D[j], ang = q.a + t * q.sp * 0.3, dr = q.r + Math.sin(t * q.sp + q.ph) * 0.04;
        var dxp = Math.cos(ang) * dr, dzp = Math.sin(ang) * dr, c2 = mix((dxp + 1.3) / 2.6);
        ctx.fillStyle = 'rgba(' + (c2[0] | 0) + ',' + (c2[1] | 0) + ',' + (c2[2] | 0) + ',' + (0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.7 + q.ph))).toFixed(3) + ')';
        ctx.fillRect(cx + dxp * R * 0.98, cy + q.y * R * 0.95 + dzp * 6, 1, 1);
      }
      ctx.globalCompositeOperation = 'source-over';
      // the glyph: brighter, twinkling, untouched by the pointer
      var gs = R / 74;
      for (var g2 = 0; g2 < G.length; g2++) {
        var e = G[g2], tw = 0.6 + 0.4 * Math.sin(t * 2.4 + e.ph), cg = mix(0.05 + (e.y / 70 + 0.5) * 0.5);
        ctx.fillStyle = 'rgba(' + (cg[0] + gl * .8 | 0) + ',' + (cg[1] + gl | 0) + ',' + (cg[2] + gl | 0) + ',' + (0.55 + tw * 0.45).toFixed(3) + ')';
        ctx.fillRect(cx + e.x * gs - 0.6, cy + e.y * gs + Math.sin(t * 1.6 + e.x * 0.08) * 0.6 - 0.6, 1.2, 1.2);
      }
      mouse.sp *= 0.85; mouse.vx *= 0.85; mouse.vy *= 0.85; // a resting pointer stops blasting
      if (!reduced && seen) raf = requestAnimationFrame(draw);
    }
    cv.addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect(), nx = e.clientX - r.left, ny = e.clientY - r.top;
      if (mouse.on) { mouse.vx = nx - mouse.x; mouse.vy = ny - mouse.y; mouse.sp = Math.hypot(mouse.vx, mouse.vy); }
      mouse.x = nx; mouse.y = ny; mouse.on = true;
    });
    cv.addEventListener('pointerleave', function () { mouse.on = false; });
    new IntersectionObserver(function (es) {
      seen = es[0].isIntersecting;
      if (seen && !raf) raf = requestAnimationFrame(draw);
    }).observe(cv);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { glyph(); size(); requestAnimationFrame(draw); });
    // the panel opens and closes; restart drawing when it becomes visible again
    new ResizeObserver(function () { if (seen && !raf) raf = requestAnimationFrame(draw); }).observe(cv);
  })($('#aiCv'));

  /* ---------- radar sweep: turns clockwise on its own, follows the pointer when it's inside ---------- */
  var azEl = $('#axAz'), rd = $('#axRadar'), sweepEl = $('#axSweep'), blipEls = $$('.blip'), sweep = 0, sweepTo = null, sweepHold = 0, rOver = false, lastT = 0;
  rd.addEventListener('pointermove', function (e) {
    var r = rd.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    rOver = true; sweepTo = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
  });
  rd.addEventListener('pointerleave', function () { rOver = false; sweepTo = null; });
  function radarTick(now) {
    var dt = lastT ? Math.min(now - lastT, 50) : 16; lastT = now;
    var prev = sweep;
    if (sweepTo != null && (rOver || now < sweepHold)) {
      var d = ((sweepTo - sweep + 540) % 360) - 180; sweep += d * 0.14;
    } else if (!reduced) { sweep += dt * 0.09; sweepTo = rOver ? sweepTo : null; }
    sweep = (sweep + 360) % 360;
    sweepEl.style.transform = 'rotate(' + sweep.toFixed(2) + 'deg)';
    var az = Math.round(sweep) % 360; azEl.textContent = (az < 100 ? (az < 10 ? '00' : '0') : '') + az + '°';
    // light every blip the leading edge crossed this frame (in either direction)
    var lo = Math.min(prev, sweep), hi = Math.max(prev, sweep), wrap = Math.abs(sweep - prev) > 180;
    BLIPS.forEach(function (b, i) {
      var crossed = wrap ? (b.ang >= hi || b.ang <= lo) : (b.ang >= lo && b.ang <= hi);
      if (crossed) b.lit = now;
      var k = Math.max(0, 1 - (now - b.lit) / 1600);
      blipEls[i].style.setProperty('--k', k.toFixed(3));
    });
  }

  /* ---------- wires: from each unlocked panel's header to its anchor ---------- */
  function wires() {
    var sr = stage.getBoundingClientRect(), fr = fig.getBoundingClientRect(), latest = { l: null, r: null };
    PANELS.forEach(function (p, i) { if (i < unlocked) latest[p.side] = p.id; });
    PANELS.forEach(function (p, i) {
      var o = els[p.id], on = i < unlocked && !stacked(), lk = i >= unlocked && !stacked();
      o.path.classList.toggle('on', on); o.sq.classList.toggle('on', on);
      o.path.classList.toggle('lk', lk); o.sq.classList.toggle('lk', lk); // locked slots keep a faint dotted wire to their anchor
      var hot = on && (o.el.classList.contains('is-open'));
      o.path.classList.toggle('hot', hot); o.sq.classList.toggle('hot', hot);
      if (!on && !lk) return;
      var hr = o.el.querySelector('header').getBoundingClientRect(), y = hr.top + hr.height / 2 - sr.top;
      var x = (p.side === 'l' ? hr.right + 1 : hr.left - 1) - sr.left;
      var ax = fr.left - sr.left + fr.width * p.at[0] / 100, ay = fr.top - sr.top + fr.height * p.at[1] / 100;
      var mid = p.side === 'l' ? Math.min(x + 28, ax - 20) : Math.max(x - 28, ax + 20);
      o.path.setAttribute('d', 'M' + x + ' ' + y + 'H' + mid + 'L' + ax + ' ' + ay);
      o.sq.setAttribute('x', ax - 3.5); o.sq.setAttribute('y', ay - 3.5);
    });
    return latest;
  }

  var raf = 0, visible = false;
  function frame() {
    raf = requestAnimationFrame(frame);
    var r = track.getBoundingClientRect(), vh = innerHeight;
    if (!stacked()) {
      var p = clamp(-r.top / (r.height - vh), 0, 1);
      setUnlocked(Math.min(PANELS.length, Math.floor(p * (PANELS.length + 0.6) + 0.35)));
    } else if (unlocked !== PANELS.length) { unlocked = PANELS.length; layout(); }
    if (els.skills.el.classList.contains('is-open')) radarTick(performance.now());
    var latest = wires(), last = PANELS.filter(function (q, i) { return i < unlocked; }).pop();
    if (!over && last) { var a = (pinned.r && els[pinned.r].p) || (pinned.l && els[pinned.l].p) || last; lt.x = a.at[0]; lt.y = a.at[1]; }
    lp.x += (lt.x - lp.x) * 0.12; lp.y += (lt.y - lp.y) * 0.12;
    var want = (unlocked > 0 || over) ? Math.max(46, fig.clientWidth * 0.17) : 0; lr += (want - lr) * 0.12;
    fig.style.setProperty('--lx', lp.x.toFixed(2) + '%'); fig.style.setProperty('--ly', lp.y.toFixed(2) + '%'); fig.style.setProperty('--lr', lr.toFixed(1) + 'px');
    lens.style.setProperty('--lr', lr.toFixed(1) + 'px');
    lens.style.transform = 'translate(' + (fig.offsetLeft + fig.clientWidth * lp.x / 100) + 'px,' + (fig.offsetTop + fig.clientHeight * lp.y / 100) + 'px)';
    lens.style.opacity = lr > 6 ? 1 : 0;
  }
  new IntersectionObserver(function (es) {
    visible = es[0].isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame); else if (!visible) { cancelAnimationFrame(raf); raf = 0; }
  }).observe(track);
  addEventListener('resize', layout);
  layout();
};

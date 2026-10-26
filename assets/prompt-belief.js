/* v3 Belief: the quote as a prompt in an AI editor. Scrolling the editor into view types the prompt (read-only);
   Send fakes a thinking pass and answers in one of three expressions. Nothing leaves the page. */
(function () {
  'use strict';

  var PROMPT = 'Think outside the Box, but don’t forget inside';
  var V3 = window.V3I18n;
  function tr(value) { return V3 ? V3.t(value) : value; }
  function textRuns(value) {
    var s = tr(value), zh = V3 && V3.lang() === 'zh';
    var units = zh ? Array.from(s) : s.split(' ');
    return units.map(function (part) { return '<span class="w">' + part + '</span>'; }).join(zh ? '' : ' ');
  }
  var THINK = [
    { id: 'quick', name: 'Quick', note: 'Answers on instinct', t: '~1s', ms: 900, steps: ['Reading the prompt'] },
    { id: 'think', name: 'Think', note: 'Weighs both sides', t: '~2s', ms: 2200, steps: ['Reading the prompt', 'Weighing outside against inside'] },
    { id: 'deep', name: 'Deep Think', note: 'Questions the brief first', t: '~4s', ms: 3800,
      steps: ['Reading the prompt', 'Questioning the brief', 'Listing the constraints', 'Looking for the tension between them'] }
  ];
  var EXPR = [
    { id: 'text', name: 'Text', note: 'Words, as usual', t: 'Default', last: 'Writing the reply' },
    { id: 'abstract', name: 'Abstract', note: 'An object you can turn and open', t: '3D', last: 'Modelling the box' },
    { id: 'figurative', name: 'Figurative', note: 'The idea drawn as a layout', t: 'Frame', last: 'Measuring the layout' }
  ];
  var TEXT = {
    quick: ['Short version: break the rules on purpose, then make sure real people can still use what you made.',
      'If that sounds like your next project, let’s build it together.'],
    think: ['Outside the box is where ideas come from. Inside is where they become usable: constraints, edge cases, and the person on the other side of the screen.',
      'I like working in both places, and I’d like to do it with you.'],
    deep: ['I read the prompt as two moves. Outside: question the brief, borrow from other fields, and prototype the odd idea early. Inside: respect what makes it shippable, from accessibility and engineering limits to the user’s actual day.',
      'Good work sits in the tension between the two. Want to find it in your project? Let’s work on it together.']
  };
  var CAP = {
    abstract: {
      quick: 'Here’s the idea as an object.',
      think: 'A box has an outside and an inside. Turn it to read the outside, then open it to see what’s inside.',
      deep: 'The outside walls are the parts you’re allowed to question. The inside is what those walls protect. Turn it to read one, unfold it to read the other.'
    },
    figurative: {
      quick: 'Here’s the idea as a layout. {V} the two bold words.',
      think: '{V} “outside” to see a word reach past the frame, and “inside” to see one held within it.',
      deep: 'The same sentence, drawn as a layout. “outside” reaches past the frame, and the redline measures the gap. “inside” stays within it, padded, with Clip content on. A good design needs both. {V} either word.'
    }
  };

  var I = {
    bulb: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M6 12.5h4M6.6 14.5h2.8M8 1.5a4.5 4.5 0 0 0-2.6 8.2c.4.3.6.8.6 1.3v.5h4V11c0-.5.2-1 .6-1.3A4.5 4.5 0 0 0 8 1.5z"/></svg>',
    shapes: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><rect x="1.5" y="1.5" width="7" height="7"/><circle cx="10.5" cy="10.5" r="4"/></svg>',
    chev: '<svg class="ch" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 3.5l3 3 3-3"/></svg>',
    wave: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" aria-hidden="true"><path d="M2 6.5v3M5 4.5v7M8 2.5v11M11 5v6M14 7v2"/></svg>',
    up: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 13.5V3M3.5 7.5 8 3l4.5 4.5"/></svg>',
    spin: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 2a6 6 0 1 1-6 6"/></svg>',
    spark: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1l1.6 5.4L15 8l-5.4 1.6L8 15l-1.6-5.4L1 8l5.4-1.6z"/></svg>'
  };
  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; }
  function words(s) { return s.split(' ').map(function (w) { return '<span class="wd">' + w + '</span>'; }).join(' '); }

  window.mountPromptBelief = function (pe, opts) {
    opts = opts || {};
    var reduced = !!opts.reduced, mode = { think: 'think', expr: 'text' };
    var $ = function (s, r) { return (r || pe).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || pe).querySelectorAll(s)); };

    function dd(key, label, icon, list) {
      var cur = find(list, mode[key]);
      return '<div class="pe-dd" data-dd="' + key + '"><button type="button" class="pe-chip" aria-haspopup="listbox" aria-expanded="false" aria-label="' + label + ': ' + cur.name + '">' +
        icon + '<span class="v">' + cur.name + '</span>' + I.chev + '</button>' +
        '<ul class="pe-menu" role="listbox" aria-label="' + label + '"><li class="hd" role="presentation">' + label + '</li>' +
        list.map(function (o) {
          return '<li role="option" tabindex="-1" data-v="' + o.id + '" aria-selected="' + (o.id === cur.id) + '"><b>' + o.name + '</b><small>' + o.note + '</small><span class="t">' + o.t + '</span></li>';
        }).join('') + '</ul></div>';
    }
    pe.innerHTML =
      '<header><i><b></b><b></b><b></b></i><span class="pe-head-label"><span class="pe-head-full">Prompt · Belief</span><span class="pe-head-short">Prompt</span></span>' +
        '<span class="st"><span class="pe-head-status-full">Simulated · nothing is sent</span><span class="pe-head-status-short">nothing is sent</span></span></header>' +
      '<div class="pe-comp">' +
        '<div class="pe-in" role="textbox" aria-readonly="true" aria-label="Prompt (read-only)" tabindex="0"><span class="tx"></span><span class="pe-caret" aria-hidden="true"></span>' +
          '<span class="ph">Ask anything…</span><span class="pe-ro" aria-hidden="true">Read-only · it’s what I believe</span></div>' +
        '<div class="pe-row"><div class="pe-opts">' + dd('think', 'Thinking', I.bulb, THINK) + dd('expr', 'Expression', I.shapes, EXPR) + '</div>' +
          '<div class="pe-act"><span class="pe-tip" aria-hidden="true">Send to see the reply</span>' +
            '<button type="button" class="pe-chip pe-mic" aria-disabled="true" title="Voice input isn’t available here">' + I.wave + '<span>Voice</span></button>' +
            '<button type="button" class="pe-send" disabled aria-label="Send prompt">' + I.up + '</button></div></div>' +
      '</div>' +
      '<div class="pe-out" hidden><div class="pe-meta"><span class="ai">' + I.spark + 'ohbox</span><span class="md"></span>' +
        '<button type="button" class="pe-st" aria-expanded="true" aria-label="Thinking steps" disabled><span class="pe-st-copy"><span class="pe-st-label">Thinking</span><span class="pe-st-time" aria-hidden="true"></span></span>' + I.chev + '</button></div>' +
        '<ol class="pe-steps"></ol><div class="pe-body" aria-live="polite"></div></div>';

    var inp = $('.pe-in'), tx = $('.tx'), send = $('.pe-send'), tip = $('.pe-tip'), ro = $('.pe-ro');
    var out = $('.pe-out'), ai = $('.ai', out), md = $('.md', out), st = $('.pe-st'), stLabel = $('.pe-st-label'), stTime = $('.pe-st-time'), stepsEl = $('.pe-steps'), body = $('.pe-body');

    /* ---------- dropdowns ---------- */
    function closeAll() { $$('.pe-dd.open').forEach(function (d) { d.classList.remove('open'); $('.pe-chip', d).setAttribute('aria-expanded', 'false'); }); }
    function openDd(d, focus) {
      d.classList.add('open'); $('.pe-chip', d).setAttribute('aria-expanded', 'true');
      if (focus) $('[aria-selected="true"]', d).focus();
    }
    function pick(opt) {
      var d = opt.closest('.pe-dd'), key = d.dataset.dd, list = key === 'think' ? THINK : EXPR, o = find(list, opt.dataset.v), chip = $('.pe-chip', d);
      mode[key] = o.id;
      $$('[role="option"]', d).forEach(function (x) { x.setAttribute('aria-selected', x === opt); });
      $('.v', chip).textContent = o.name; chip.setAttribute('aria-label', (key === 'think' ? 'Thinking' : 'Expression') + ': ' + o.name);
      closeAll(); chip.focus();
    }
    pe.addEventListener('click', function (e) {
      var chip = e.target.closest('.pe-dd > .pe-chip');
      if (chip) { var d = chip.parentNode, was = d.classList.contains('open'); closeAll(); if (!was) openDd(d, e.detail === 0); return; }
      var opt = e.target.closest('[role="option"]'); if (opt) pick(opt);
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.pe-dd')) closeAll(); });
    pe.addEventListener('keydown', function (e) {
      var opt = e.target.closest('[role="option"]'), chip = e.target.closest('.pe-dd > .pe-chip');
      if (chip && e.key === 'ArrowDown') { e.preventDefault(); closeAll(); openDd(chip.parentNode, true); return; }
      if (!opt) { if (e.key === 'Escape') closeAll(); return; }
      var d = opt.closest('.pe-dd'), opts2 = $$('[role="option"]', d), k = opts2.indexOf(opt);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); opts2[(k + (e.key === 'ArrowDown' ? 1 : opts2.length - 1)) % opts2.length].focus(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(opt); }
      else if (e.key === 'Escape' || e.key === 'Tab') { closeAll(); if (e.key === 'Escape') $('.pe-chip', d).focus(); }
    });
    function lockOpts(on) { $$('.pe-dd > .pe-chip').forEach(function (c) { c.disabled = on; }); }
    $('.pe-mic').addEventListener('click', function (e) { e.preventDefault(); });

    /* ---------- the prompt types itself once the editor is in view; it can't be edited ---------- */
    var typed = false, typingVersion = 0, activeReply = null;
    function ready() { inp.classList.add('is-done'); send.disabled = false; send.classList.add('ping'); tip.classList.add('on'); }
    function typeIt() {
      if (typed) return; typed = true; inp.classList.add('has-text');
      var phrase = tr(PROMPT), token = ++typingVersion;
      if (reduced) { tx.textContent = phrase; return ready(); }
      var chars = Array.from(phrase), i = 0;
      (function tick() {
        if (token !== typingVersion) return;
        i++; tx.textContent = chars.slice(0, i).join('');
        if (i >= chars.length) return setTimeout(ready, 260);
        var c = chars[i - 1]; setTimeout(tick, c === ',' || c === '，' ? 300 : c === ' ' ? 70 + Math.random() * 70 : 34 + Math.random() * 48);
      })();
    }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); setTimeout(typeIt, reduced ? 0 : 380); }
    }, { threshold: 0.9, rootMargin: '0px 0px -18% 0px' });
    io.observe(inp);
    var roT = 0;
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); if (!send.disabled) send.click(); return; }
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault(); ro.classList.add('on'); clearTimeout(roT); roT = setTimeout(function () { ro.classList.remove('on'); }, 1600);
      }
    });

    /* ---------- send: think, then answer ---------- */
    var runId = 0, cleanup = null;
    function reveal(el, at) { // bring a new block into view without yanking the page
      var r = el.getBoundingClientRect(), vh = innerHeight;
      if (r.top > vh * (at || 0.72)) scrollBy({ top: r.top - vh * 0.32, behavior: reduced ? 'auto' : 'smooth' });
    }
    send.addEventListener('click', function () {
      if (send.disabled) return;
      var id = ++runId, th = find(THINK, mode.think), ex = find(EXPR, mode.expr), steps = th.steps.concat(ex.last);
      if (cleanup) { cleanup(); cleanup = null; }
      closeAll(); lockOpts(true);
      send.disabled = true; send.classList.remove('ping'); send.classList.add('is-busy'); send.innerHTML = I.spin; send.setAttribute('aria-label', 'Thinking in progress');
      tip.classList.remove('on');
      out.hidden = false; ai.classList.add('busy'); md.textContent = tr(th.name) + ' · ' + tr(ex.name);
      st.disabled = true; st.classList.remove('has-elapsed'); st.classList.add('is-thinking'); st.setAttribute('aria-expanded', 'true'); st.setAttribute('aria-label', 'Thinking steps'); stLabel.textContent = 'Thinking in progress'; stTime.textContent = '';
      stepsEl.hidden = false; stepsEl.innerHTML = steps.map(function (s) { return '<li>' + s + '</li>'; }).join(''); body.innerHTML = '';
      reveal(out, 0.8);
      var lis = stepsEl.children, per = reduced ? 0 : th.ms / steps.length, t0 = performance.now();
      steps.forEach(function (s, k) {
        setTimeout(function () { if (id !== runId) return; if (k) lis[k - 1].className = 'done'; lis[k].className = 'on'; }, per * k);
      });
      setTimeout(function () {
        if (id !== runId) return;
        lis[lis.length - 1].className = 'done';
        ai.classList.remove('busy'); st.classList.remove('is-thinking'); st.disabled = false;
        var elapsed = Math.max(0.1, (performance.now() - t0) / 1000).toFixed(1);
        stLabel.textContent = 'Thought for'; stTime.textContent = elapsed + 's'; st.classList.add('has-elapsed');
        st.setAttribute('aria-expanded', 'false'); st.setAttribute('aria-label', 'Thought for ' + elapsed + ' seconds. Show thinking steps'); stepsEl.hidden = true;
        activeReply = { th: th, ex: ex, id: id };
        ({ text: renderText, abstract: renderBox, figurative: renderFig })[ex.id](th, id);
        setTimeout(function () { reveal(body.firstElementChild || body); }, 60);
        send.classList.remove('is-busy'); send.innerHTML = I.up; send.setAttribute('aria-label', 'Send again'); send.disabled = false; lockOpts(false);
        tip.textContent = 'Pick another mode, then send again';
      }, per * steps.length + (reduced ? 0 : 280));
    });
    st.addEventListener('click', function () {
      var open = st.getAttribute('aria-expanded') !== 'true';
      st.setAttribute('aria-expanded', open); st.setAttribute('aria-label', open ? 'Hide thinking steps' : 'Show thinking steps'); stepsEl.hidden = !open;
    });
    function stream(list, ms, id, done) {
      if (reduced) { list.forEach(function (w) { w.classList.add('on'); }); return done(); }
      var k = 0;
      (function step() { if (id !== runId) return; if (k >= list.length) return done(); list[k++].classList.add('on'); setTimeout(step, ms); })();
    }

    /* text: the logo, a welcome and an invitation, streamed word by word */
    function renderText(th, id) {
      body.innerHTML = '<div class="r-text"><object class="r-logo" data="logo/logo_anime.svg" type="image/svg+xml" aria-label="ohbox logo"></object>' +
        '<h3>Welcome to ohbox’s workspace.</h3>' +
        TEXT[th.id].map(function (p) { return '<p>' + textRuns(p) + '</p>'; }).join('') +
        '<a class="r-cta" href="#contact">Start a project together <span aria-hidden="true">→</span></a></div>';
      stream($$('.w', body), th.id === 'quick' ? 16 : 24, id, function () { $('.r-cta', body).classList.add('on'); tip.classList.add('on'); });
    }

    /* figurative: the quote as a layout. The orange frame around the editor is the Frame; redlines measure how far
       "outside" reaches past it and how "inside" is padded within it. Hover/focus a bold word, or tap it, or use the switch. */
    function renderFig(th, id) {
      var zh = V3 && V3.lang() === 'zh', touch = matchMedia('(hover: none)').matches, V = tr(touch ? 'Tap' : 'Hover');
      var cap = tr(CAP.figurative[th.id]).replace('{V}', V);
      function kw(cls, label, ann) {
        return '<span class="kw ' + cls + '" tabindex="0" role="button" aria-pressed="false" data-k="' + (cls === 'kw-out' ? 'out' : 'in') + '"><span class="wd"><em>' + label + '</em></span><span class="ann" aria-hidden="true">' + ann + '</span></span>';
      }
      function runs(value) { return Array.from(value).map(function (c) { return '<span class="wd">' + c + '</span>'; }).join(''); }
      var quote = zh
        ? '<span class="b">' + runs('「思考要跳出') + kw('kw-out', '框外', 'Overflow: Visible') + runs('，') + '</span>' +
          '<span class="b">' + runs('也別忘了顧及') + kw('kw-in', '框內', 'Clip content: On') + runs('。」') + '</span>'
        : '<span class="b">' + words('“Think') + ' ' + kw('kw-out', 'outside', 'Overflow: Visible') + ' ' + words('the Box') + '<span class="wd">,</span></span>' +
          '<span class="b">' + words('but don’t forget') + ' ' + kw('kw-in', 'inside', 'Clip content: On') + '<span class="wd">”</span></span>';
      body.innerHTML = '<p class="r-cap">' + cap + '</p><div class="r-fig">' +
        '<blockquote class="pq">' + quote + '</blockquote>' +
        '<span class="sel" aria-hidden="true"></span><span class="dim" aria-hidden="true"><i></i><b></b></span><span class="dimv" aria-hidden="true"><b></b></span>' +
        '<div class="bx-panel ipanel"><header><i><b></b><b></b><b></b></i><span>Layer · <span data-layer>Quote</span></span><span></span></header>' +
          '<dl><div><dt>Position</dt><dd data-pos>Auto</dd></div><div><dt>Padding</dt><dd data-pad>0</dd></div>' +
          '<div><dt>Clip content</dt><dd><button type="button" class="switch" role="switch" aria-checked="false" aria-label="Clip content"></button></dd></div>' +
          '<div><dt>Overflow</dt><dd data-o>Visible</dd></div></dl></div></div>';
      var fig = $('.r-fig', body), pq = $('.pq', body), dim = $('.dim', body), dimv = $('.dimv', body), sel = $('.sel', body), sw = $('.switch', body), kws = $$('.kw', body);
      var STATE = { out: ['outside', 'Absolute', '0', 'Visible'], in: ['inside', 'Auto', '24', 'Hidden'], none: ['Quote', 'Auto', '0', 'Visible'] };
      var cur = null, pinned = null, live = false, held = false;
      function drawDim() { // outside: a selection around the word, its distance to the orange frame, and its distance to the panel below
        var fs = parseFloat(getComputedStyle(pq).fontSize), w = $('.kw-out .wd', body).getBoundingClientRect(), f = fig.getBoundingClientRect(), pr = pe.getBoundingClientRect();
        var sl = w.left - fs * 0.08, sr = w.right + fs * 0.08, st = w.top + fs * 0.1, sb = w.bottom - fs * 0.1;
        sel.style.left = (sl - f.left) + 'px'; sel.style.top = (st - f.top) + 'px'; sel.style.width = (sr - sl) + 'px'; sel.style.height = (sb - st) + 'px';
        var tr = document.getElementById('tracker'), pad = tr && getComputedStyle(tr).display !== 'none' ? 12 : 0, left = (sl + sr) / 2 < (pr.left + pr.width / 2);
        var edge = left ? pr.left - pad : pr.right + pad, x0 = left ? edge : sr, x1 = left ? sl : edge;
        dim.style.left = (x0 - f.left) + 'px'; dim.style.width = Math.max(0, x1 - x0) + 'px'; dim.style.top = ((st + sb) / 2 - f.top) + 'px'; // level with the middle of the selection
        $('b', dim).textContent = '+' + Math.round(Math.max(0, x1 - x0));
        var panelTop = $('.bx-panel', body).getBoundingClientRect().top, gap = Math.max(0, panelTop - sb);
        dimv.style.left = ((sl + sr) / 2 - f.left) + 'px'; dimv.style.top = (sb - f.top) + 'px'; dimv.style.height = gap + 'px';
        $('b', dimv).textContent = '+' + Math.round(gap);
      }
      function setState(k) {
        if (k === cur) return; cur = k;
        pq.dataset.k = k || ''; var S = STATE[k || 'none'];
        $('[data-layer]', body).textContent = tr(S[0]); $('[data-pos]', body).textContent = tr(S[1]); $('[data-pad]', body).textContent = S[2]; $('[data-o]', body).textContent = tr(S[3]);
        sw.setAttribute('aria-checked', k === 'in'); fig.classList.toggle('is-out', k === 'out');
        kws.forEach(function (n) { n.setAttribute('aria-pressed', n.dataset.k === pinned); });
        if (k === 'out') drawDim();
      }
      function pin(k) { pinned = pinned === k ? null : k; held = true; setState(pinned); }
      kws.forEach(function (n) {
        n.addEventListener('pointerenter', function (e) { if (live && e.pointerType === 'mouse') setState(n.dataset.k); });
        n.addEventListener('pointerleave', function (e) { if (live && e.pointerType === 'mouse') setState(pinned); });
        n.addEventListener('focus', function () { if (live) setState(n.dataset.k); });
        n.addEventListener('blur', function () { if (live) setState(pinned); });
        n.addEventListener('click', function () { if (live) pin(n.dataset.k); });
        n.addEventListener('keydown', function (e) { if (live && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pin(n.dataset.k); } });
      });
      sw.addEventListener('click', function () { held = true; pinned = cur === 'in' ? 'out' : 'in'; setState(pinned); });
      function onResize() { if (cur === 'out') drawDim(); }
      addEventListener('resize', onResize);
      // the words light up first; then the two bold ones announce themselves, and without a mouse the page demos both once
      stream($$('.pq .wd', body), 70, id, function () {
        live = true; pq.classList.add('live'); tip.classList.add('on');
        if (touch && !reduced) [700, 3200, 5700].forEach(function (t, n) {
          setTimeout(function () { if (id === runId && !held) setState(n === 0 ? 'out' : n === 1 ? 'in' : pinned); }, t);
        });
      });
      cleanup = function () { removeEventListener('resize', onResize); };
    }

    /* abstract: a box with the quote outside and what "inside" means inside; it folds itself up from its net */
    function face(cls, o, i, inner) { return '<div class="f ' + cls + '"><div class="i">' + i + '</div><div class="o">' + o + '</div>' + (inner || '') + '</div>'; }
    function renderBox(th, id) {
      var DC = matchMedia('(pointer: coarse)').matches ? 'Double-tap' : 'Double-click'; // touch screens tap, mice click
      function tipText(action) { return tr('Drag to rotate · ' + DC + ' to ' + action); }
      body.innerHTML = '<p class="r-cap">' + tr(CAP.abstract[th.id]) + '</p><div class="r-box">' +
        '<div class="cx-stage" tabindex="0" role="group" aria-roledescription="3D box" data-cursor="DRAG" aria-label="A box with the quote on its outside. Drag or use the arrow keys to turn it; ' + DC.toLowerCase() + ' or press Enter to unfold it.">' +
          '<div class="cx open">' +
            face('f-b', '<span>ohbox</span>', '<small>04</small><span>inside</span>') +
            face('f-n', '<span>the</span>', '<small>02</small><span>Users</span>', face('f-l', '<img src="logo/logo.svg" alt="">', '<small>01</small><span>but don’t forget</span>')) +
            face('f-w', '<span>Box</span>', '<small>03</small><span>Constraints</span>') +
            face('f-e', '<span>outside</span>', '<small>05</small><span>Edge cases</span>') +
            face('f-s', '<span>Think</span>', '<small>06</small><span>Accessibility</span>') +
          '</div><span class="cx-tip">' + tipText('fold') + '</span></div>' +
        '<div class="cx-ins ipanel"><header><i><b></b><b></b><b></b></i>Object · Box<span class="st" data-state>Unfolded</span></header>' +
          '<dl><div><dt>Rotate X</dt><dd data-rx>0°</dd></div><div><dt>Rotate Z</dt><dd data-rz>0°</dd></div><div><dt>Faces</dt><dd>6</dd></div></dl>' +
          '<ul class="cx-keys"><li><kbd>Drag</kbd>Turn it any way</li><li><kbd>' + DC + '</kbd><span data-act>Fold it</span></li>' +
          '<li><kbd>Arrow keys</kbd>Turn it step by step</li><li><kbd>Enter</kbd>Fold or unfold</li></ul>' +
          '<button type="button" class="pbtn" data-btn>Fold</button></div></div>';
      var stage = $('.cx-stage', body), cx = $('.cx', body), tipEl = $('.cx-tip', body);
      var OPEN = { rx: 0, rz: 0, tz: 0, ty: 0.37, sc: 0.74 };
      var s = { rx: 0, rz: 0, tz: 0, ty: 0.37, sc: 0.74 }, open = true, tw = null, drag = null, vel = 0, idleUntil = 0, lastTap = 0, raf = 0, alive = true, shown = '';
      function apply() {
        var S = cx.offsetWidth;
        cx.style.transform = 'translateY(' + (s.ty * S).toFixed(2) + 'px) scale(' + s.sc.toFixed(4) + ') rotateX(' + s.rx.toFixed(2) + 'deg) rotateZ(' + s.rz.toFixed(2) + 'deg) translateZ(' + (s.tz * S).toFixed(2) + 'px)';
        var rx = Math.round(((s.rx % 360) + 360) % 360), rz = Math.round(((s.rz % 360) + 360) % 360), k = rx + '|' + rz;
        if (k !== shown) { shown = k; $('[data-rx]', body).textContent = rx + '°'; $('[data-rz]', body).textContent = rz + '°'; }
      }
      function tween(to, ms) {
        var from = {}, t0 = performance.now(); for (var key in s) from[key] = s[key];
        tw = function (now) {
          var t = Math.min(1, (now - t0) / (reduced ? 1 : ms)), e = 1 - Math.pow(1 - t, 3);
          for (var key2 in to) s[key2] = from[key2] + (to[key2] - from[key2]) * e;
          if (t >= 1) tw = null;
        };
      }
      function setOpen(v) {
        open = v; cx.classList.toggle('open', v); vel = 0;
        if (v) tween({ rx: Math.round(s.rx / 360) * 360, rz: Math.round(s.rz / 360) * 360, tz: OPEN.tz, ty: OPEN.ty, sc: OPEN.sc }, 950);
        else tween({ rx: Math.round(s.rx / 360) * 360 + 62, rz: s.rz + 35, tz: -0.5, ty: 0, sc: 1 }, 1100);
        $('[data-state]', body).textContent = v ? 'Unfolded' : 'Folded';
        $('[data-act]', body).textContent = v ? 'Fold it' : 'Unfold it';
        $('[data-btn]', body).textContent = v ? 'Fold' : 'Unfold';
        tipEl.textContent = tipText(v ? 'fold' : 'unfold');
        idleUntil = performance.now() + (v ? 0 : 1600);
      }
      stage.addEventListener('pointerdown', function (e) {
        if (e.button) return;
        stage.setPointerCapture(e.pointerId); tw = null; vel = 0;
        drag = { x: e.clientX, y: e.clientY, moved: 0 }; stage.classList.add('drag');
      });
      stage.addEventListener('pointermove', function (e) {
        if (!drag) return;
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
        s.rz -= dx * 0.45; s.rx -= dy * 0.45; vel = -dx * 0.45; idleUntil = performance.now() + 4000;
      });
      function up() {
        if (!drag) return;
        if (drag.moved < 6) { var now = performance.now(); if (now - lastTap < 340) { lastTap = 0; vel = 0; setOpen(!open); } else lastTap = now; }
        drag = null; stage.classList.remove('drag');
      }
      stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
      stage.addEventListener('keydown', function (e) {
        var step = { ArrowLeft: [0, 12], ArrowRight: [0, -12], ArrowUp: [12, 0], ArrowDown: [-12, 0] }[e.key];
        if (step) { e.preventDefault(); tw = null; vel = 0; s.rx += step[0]; s.rz += step[1]; idleUntil = performance.now() + 4000; }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open); }
      });
      $('[data-btn]', body).addEventListener('click', function () { setOpen(!open); });
      var vis = true, io2 = new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis && alive && !raf) raf = requestAnimationFrame(loop); });
      io2.observe(stage);
      function loop(now) {
        raf = 0; if (!alive || !vis) return;
        if (tw) tw(now);
        else if (!drag && Math.abs(vel) > 0.02) { s.rz += vel; vel *= 0.93; }
        else if (!drag && !open && !reduced && now > idleUntil) s.rz += 0.16; // turns so the outside reads Think → outside → the → Box
        apply(); raf = requestAnimationFrame(loop);
      }
      apply(); raf = requestAnimationFrame(loop);
      setTimeout(function () { if (id === runId && alive) setOpen(false); }, reduced ? 0 : 450); // the net folds itself into a box
      tip.classList.add('on');
      cleanup = function () { alive = false; cancelAnimationFrame(raf); io2.disconnect(); };
    }

    document.addEventListener('pfx-lang-change', function () {
      var activeThink = activeReply ? activeReply.th : find(THINK, mode.think);
      var activeExpr = activeReply ? activeReply.ex : find(EXPR, mode.expr);
      md.textContent = tr(activeThink.name) + ' · ' + tr(activeExpr.name);
      if (typed) { typingVersion++; tx.textContent = tr(PROMPT); ready(); }
      if (!activeReply || out.hidden) return;
      if (cleanup) { cleanup(); cleanup = null; }
      body.innerHTML = '';
      ({ text: renderText, abstract: renderBox, figurative: renderFig })[activeReply.ex.id](activeReply.th, activeReply.id);
    });

    // the reply changes the page height: keep ScrollTrigger's offsets for the sections below in step
    var rT = 0;
    new ResizeObserver(function () { clearTimeout(rT); rT = setTimeout(function () { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }, 200); }).observe(pe);
  };
})();

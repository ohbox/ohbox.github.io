/* Theme: light / dark / system. Loaded in <head> without defer, so data-theme is set before the first paint.
   The choice is stored per browser and shared by every page; pages without a switch just follow it.
   Pages with <div class="pfx-theme" data-theme-switch></div> get the switch built into it. */
(function () {
  var KEY = 'pfx-theme', DEFAULT = 'dark', root = document.documentElement;
  var sys = window.matchMedia ? matchMedia('(prefers-color-scheme: light)') : null;

  function stored() { try { var v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' || v === 'system' ? v : DEFAULT; } catch (e) { return DEFAULT; } }
  function resolve(pref) { return pref === 'system' ? (sys && sys.matches ? 'light' : 'dark') : pref; }
  var pref = stored();
  root.setAttribute('data-theme', resolve(pref));
  root.setAttribute('data-theme-pref', pref);

  function set(next) {
    var was = root.getAttribute('data-theme'), now = resolve(next);
    pref = next; root.setAttribute('data-theme-pref', next); root.setAttribute('data-theme', now);
    if (was !== now) window.dispatchEvent(new CustomEvent('pfx-theme-change', { detail: { theme: now, pref: next } }));
  }
  // a circle of the new theme opens from the switch; without View Transitions (or with reduced motion) it just swaps
  function change(next, origin) {
    try { localStorage.setItem(KEY, next); } catch (e) {}
    var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!origin || reduced || !document.startViewTransition || resolve(next) === root.getAttribute('data-theme')) { set(next); sync(); return; }
    var r = origin.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    var end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var t = document.startViewTransition(function () { set(next); sync(); });
    t.ready.then(function () {
      root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + end + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 700, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
  }
  if (sys) {
    var onSys = function () { if (pref === 'system') set('system'); };
    sys.addEventListener ? sys.addEventListener('change', onSys) : sys.addListener(onSys);
  }
  // another tab changed it
  window.addEventListener('storage', function (e) { if (e.key === KEY) { set(stored()); sync(); } });

  var ICON = {
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="miter"><path d="M20 14.6A8.5 8.5 0 0 1 9.4 4a8.5 8.5 0 1 0 10.6 10.6z"/></svg>',
    system: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3.5 5h17v11h-17zM2 19.5h20"/></svg>'
  };
  var CHECK = '<svg class="ck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var OPTS = [['light', 'Light'], ['dark', 'Dark'], ['system', 'System']], boxes = [];

  function sync() {
    boxes.forEach(function (box) {
      box.querySelectorAll('.pfx-theme-btn svg').forEach(function (s) { s.classList.toggle('is-on', s.getAttribute('data-icon') === pref); });
      box.querySelectorAll('[role="menuitemradio"]').forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-pref') === pref)); });
    });
  }
  function build(box) {
    box.innerHTML = '<button type="button" class="pfx-theme-btn" aria-haspopup="menu" aria-expanded="false" aria-label="Color theme">' +
      OPTS.map(function (o) { return ICON[o[0]].replace('<svg ', '<svg data-icon="' + o[0] + '" aria-hidden="true" '); }).join('') + '</button>' +
      '<div class="pfx-theme-menu" role="menu" aria-label="Color theme">' + OPTS.map(function (o) {
        return '<button type="button" role="menuitemradio" data-pref="' + o[0] + '" aria-checked="false" tabindex="-1">' +
          ICON[o[0]].replace('<svg ', '<svg aria-hidden="true" ') + '<span>' + o[1] + '</span>' + CHECK + '</button>'; }).join('') + '</div>';
    var btn = box.querySelector('.pfx-theme-btn'), items = [].slice.call(box.querySelectorAll('[role="menuitemradio"]'));
    function open(on, focus) {
      box.classList.toggle('is-open', on); btn.setAttribute('aria-expanded', String(on));
      if (on && focus) (items.filter(function (b) { return b.getAttribute('aria-checked') === 'true'; })[0] || items[0]).focus();
    }
    btn.addEventListener('click', function () { open(!box.classList.contains('is-open'), true); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(true, true); } });
    items.forEach(function (b, i) {
      b.addEventListener('click', function () { open(false); btn.focus(); change(b.getAttribute('data-pref'), btn); });
      b.addEventListener('keydown', function (e) {
        var k = e.key, n = items.length;
        if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); items[(i + (k === 'ArrowDown' ? 1 : n - 1)) % n].focus(); }
        else if (k === 'Home' || k === 'End') { e.preventDefault(); items[k === 'Home' ? 0 : n - 1].focus(); }
        else if (k === 'Escape' || k === 'Tab') { open(false); if (k === 'Escape') btn.focus(); }
      });
    });
    document.addEventListener('pointerdown', function (e) { if (!box.contains(e.target)) open(false); });
    boxes.push(box);
  }
  function init() { [].forEach.call(document.querySelectorAll('[data-theme-switch]'), build); sync(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.PfxTheme = { get: function () { return root.getAttribute('data-theme'); }, pref: function () { return pref; }, set: function (p) { change(p); } };
})();

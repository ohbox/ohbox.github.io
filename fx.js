/* Shared portfolio effects: custom cursor, page transitions, scroll reveals, magnetic hovers. */
(function () {
  var FX = {};
  var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  /* ---------------- Custom cursor ---------------- */
  FX.initCursor = function () {
    if (!fine) return;
    var dot = document.createElement('div');
    var ring = document.createElement('div');
    dot.setAttribute('aria-hidden', 'true');
    ring.setAttribute('aria-hidden', 'true');
    dot.style.cssText = 'position:fixed;top:0;left:0;width:8px;height:8px;border-radius:50%;background:#F07040;pointer-events:none;z-index:9999;transform:translate(-100px,-100px);will-change:transform;transition:opacity .2s ease;';
    ring.style.cssText = 'position:fixed;top:0;left:0;width:38px;height:38px;border-radius:50%;border:1px solid rgba(240,112,64,0.55);pointer-events:none;z-index:9998;transform:translate(-100px,-100px);transition:width .25s ease,height .25s ease,border-color .25s ease,background .25s ease,opacity .2s ease;will-change:transform;display:flex;align-items:center;justify-content:center;font:600 9px/1 "Space Mono",monospace;letter-spacing:.14em;color:#0C0C0E;';
    document.body.appendChild(ring);
    document.body.appendChild(dot);
    document.documentElement.style.cursor = 'none';
    var addNoCursor = document.createElement('style');
    addNoCursor.textContent = 'a,button,[data-cursor]{cursor:none!important}';
    document.head.appendChild(addNoCursor);

    var mx = -100, my = -100, rx = -100, ry = -100;
    var inSvgZone = false;

    window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });

    document.addEventListener('mouseover', function (e) {
      /* SVG zone: hide custom cursor, let native pointer interact with SVG */
      var svgZone = e.target && e.target.closest && e.target.closest('[data-svg-zone]');
      if (svgZone) {
        if (!inSvgZone) {
          inSvgZone = true;
          document.documentElement.style.cursor = 'default';
          dot.style.opacity = '0';
          ring.style.opacity = '0';
        }
        return;
      }
      /* Leaving SVG zone */
      if (inSvgZone) {
        inSvgZone = false;
        document.documentElement.style.cursor = 'none';
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }

      var t = e.target.closest && e.target.closest('a,button,[data-cursor]');
      if (t) {
        var label = t.getAttribute('data-cursor');
        ring.style.width = label ? '74px' : '58px';
        ring.style.height = label ? '74px' : '58px';
        ring.style.background = 'rgba(240,112,64,0.92)';
        ring.style.borderColor = 'rgba(240,112,64,0.92)';
        ring.textContent = label || '';
        dot.style.opacity = label ? '0' : '1';
      } else {
        ring.style.width = '38px'; ring.style.height = '38px';
        ring.style.background = 'transparent';
        ring.style.borderColor = 'rgba(240,112,64,0.55)';
        ring.textContent = '';
        dot.style.opacity = '1';
      }
    });

    (function loop() {
      requestAnimationFrame(loop);
      if (inSvgZone) return;
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      dot.style.transform = 'translate(' + (mx - 4) + 'px,' + (my - 4) + 'px)';
      var half = ring.offsetWidth / 2;
      ring.style.transform = 'translate(' + (rx - half) + 'px,' + (ry - half) + 'px)';
    })();
  };

  /* ---------------- Page transitions ---------------- */
  var transitionsInitialized = false;
  FX.initTransitions = function () {
    if (transitionsInitialized) return;
    transitionsInitialized = true;

    var wrap = document.getElementById('pfx-transition');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'pfx-transition';
      wrap.setAttribute('aria-hidden', 'true');
      wrap.style.cssText = 'position:fixed;inset:0;z-index:9990;pointer-events:auto;';
      var orangeLayer = document.createElement('div');
      orangeLayer.setAttribute('data-pfx-layer', 'orange');
      orangeLayer.style.cssText = 'position:absolute;inset:0;background:#F07040;transform:translateY(0%);';
      var charcoalLayer = document.createElement('div');
      charcoalLayer.setAttribute('data-pfx-layer', 'charcoal');
      charcoalLayer.style.cssText = 'position:absolute;inset:0;background:#101013;transform:translateY(0%);';
      var brandLayer = document.createElement('div');
      brandLayer.setAttribute('data-pfx-layer', 'brand');
      brandLayer.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 13px/1 "Space Mono",monospace;letter-spacing:.5em;color:rgba(244,242,238,0.9);text-indent:.5em;';
      brandLayer.textContent = 'TOM\u00b7LIN';
      wrap.appendChild(orangeLayer);
      wrap.appendChild(charcoalLayer);
      wrap.appendChild(brandLayer);
      document.body.appendChild(wrap);
    }

    var orange = wrap.querySelector('[data-pfx-layer="orange"]');
    var charcoal = wrap.querySelector('[data-pfx-layer="charcoal"]');
    var brand = wrap.querySelector('[data-pfx-layer="brand"]');
    wrap.style.display = 'block';
    wrap.style.pointerEvents = 'auto';

    var easing = 'cubic-bezier(0.76, 0, 0.24, 1)';
    function animate(el, from, to, dur, delay) {
      el.style.transition = 'none';
      el.style.transform = from;
      void el.offsetHeight;
      el.style.transition = 'transform ' + dur + 'ms ' + easing + ' ' + (delay || 0) + 'ms';
      el.style.transform = to;
    }

    animate(charcoal, 'translateY(0%)', 'translateY(-100%)', 850, 120);
    animate(orange, 'translateY(0%)', 'translateY(-100%)', 850, 230);
    brand.style.transition = 'opacity .4s ease 250ms';
    brand.style.opacity = '1';
    setTimeout(function () { brand.style.opacity = '0'; }, 320);
    setTimeout(function () {
      wrap.style.display = 'none';
      wrap.style.pointerEvents = 'none';
    }, 1250);

    var navigating = false;
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-nav]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
      e.preventDefault();
      if (navigating) return;
      var destination = new URL(href, window.location.href);
      if (destination.href === window.location.href) return;
      navigating = true;
      wrap.style.display = 'block';
      wrap.style.pointerEvents = 'auto';
      brand.style.opacity = '0';
      animate(orange, 'translateY(100%)', 'translateY(0%)', 600, 0);
      animate(charcoal, 'translateY(100%)', 'translateY(0%)', 600, 110);
      setTimeout(function () { brand.style.opacity = '1'; }, 500);
      setTimeout(function () { window.location.assign(destination.href); }, 780);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { FX.initTransitions(); }, { once: true });
  } else {
    FX.initTransitions();
  }

  /* ---------------- Scroll reveals (GSAP) ---------------- */
  FX.initReveals = function () {
    if (!window.gsap) return;
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('[data-reveal]').forEach(function (el) {
      var d = parseFloat(el.getAttribute('data-reveal-delay') || '0');
      gsap.fromTo(el,
        { autoAlpha: 0, y: 44 },
        { autoAlpha: 1, y: 0, duration: 1.0, delay: d, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    gsap.utils.toArray('[data-reveal-img]').forEach(function (el) {
      gsap.fromTo(el,
        { autoAlpha: 0, y: 60, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1.15, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  };

  /* ---------------- Magnetic hover ---------------- */
  FX.initMagnetic = function () {
    if (!fine) return;
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.25;
        var y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform .45s cubic-bezier(0.16,1,0.3,1)';
        el.style.transform = 'translate(0,0)';
        setTimeout(function () { el.style.transition = ''; }, 460);
      });
    });
  };

  window.PortfolioFX = FX;
})();

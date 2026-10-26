/* Shared data + helpers for landing prototypes v1–v3. Content mirrors index.html. */
window.PROTO = (function () {
  var projects = [
    { id: 'rg', name: 'ResumeGenius', years: '2022 — 2026', kind: 'Web Platform', href: 'project-rg.html',
      img: 'image/projects/1.png', logo: 'image/projects/RG-logo.png',
      desc: 'An online platform that helps users create professional resumes and cover letters with customizable templates and step-by-step guidance.',
      tags: ['UI/UX Design', 'Design System', 'Micro-interaction', 'Research', 'Rapid Prototyping'], cs: 'CS.01 — Web Platform', bg: 'linear-gradient(160deg, #1A1612, #0F0F12 70%)' },
    { id: 'gp', name: 'GoPublics', years: '2024', kind: 'Publishing Platform', href: 'project-gopublics.html',
      img: 'image/projects/gopublics-tablet-dashboard-clear.webp', logo: 'image/projects/gopublics-symbol.svg',
      desc: 'An independent publishing platform that brings writing, website setup, and reader management into one workspace.',
      tags: ['0→1 Product Design', 'Research', 'Content Workflow', 'Website Management'], cs: 'CS.02 — Publishing Platform', bg: 'linear-gradient(160deg, #17120F, #0F0F12 70%)' },
    { id: 'yt', name: 'Yotta', years: '2020 — 2022', kind: 'Learning Platform', href: 'project-yotta.html',
      img: 'image/projects/2.png', logo: 'image/projects/YOTTA-logo.png',
      desc: 'An online learning platform. Courses cover fascinating subjects in a wide range of fields — life, language, engineering, business and more.',
      tags: ['UI/UX Design', 'Design Thinking', 'Online Learning', 'E-commerce', 'Mascot Creation'], cs: 'CS.03 — Learning Platform', bg: 'linear-gradient(200deg, #10161A, #0F0F12 70%)', bright: true },
    { id: 'cp', name: 'Cupo', years: '2018 — 2019', kind: 'Mobile App', href: 'project-cupo.html',
      img: 'image/projects/3.png', logo: 'image/projects/CUPO-logo.png',
      desc: 'A student-based productivity tool that boosts motivation and fights procrastination by rewarding you with coupons.',
      tags: ['App Design', 'Concept Design', 'Gamification', 'Graduate Project'], cs: 'CS.04 — Mobile App', bg: 'linear-gradient(160deg, #121420, #0F0F12 70%)', bright: true }
  ];

  var quotes = [
    { name: 'Rachel Lee', role: 'Product Manager', img: 'image/testimonial/testimonial14.png',
      text: 'Working with Tom was a game-changer for our product. His design intuition and attention to user behavior helped us simplify a complex flow into something our users now rave about.' },
    { name: 'Gendry Morales', role: 'Co-founder, Flightplan', img: 'image/testimonial/testimonial1.png',
      text: 'Tom is an incredibly talented web and UI designer who is very skilled with animation. Definitely a pleasure to work with and will go to any lengths to achieve outstanding results!' },
    { name: 'Wilkie Tan', role: 'Design Tutor / Creator', img: 'image/testimonial/testimonial2.png',
      text: 'Takes great pride in his work and is often meticulous with the details that go into the development of the projects.' },
    { name: 'Harim Song', role: 'Sessional Design Tutor', img: 'image/testimonial/testimonial3.png',
      text: 'Tom constantly exceeds expectations and uses excellent design skills. Even under pressure he had the capacity to build strong work relationships.' },
    { name: 'David Chen', role: 'Lead Front-end Developer', img: 'image/testimonial/testimonial15.png',
      text: 'Tom brings design systems to life with remarkable clarity. He anticipates edge cases, thinks in components, and truly collaborates like a tech-native designer.' }
  ];

  var about = {
    hi: "Hi, I'm Tom Lin — good to meet you!",
    bio: "With 6+ years in UI/UX design, I create user-centered digital products through research, prototyping, and testing with purpose. I'm hands-on from discovery to delivery, detail-oriented yet pragmatic — knowing when to polish and when to ship. I use AI as part of my workflow for research synthesis, inspiration, prompting, rapid prototyping, and light coding, allowing me to explore faster and communicate ideas more clearly. I value design systems, accessibility, and smooth collaboration with developers and product teams from concept to hand-off.",
    quote: 'Good design starts with empathy and ends with impact.',
    email: 'ohbox0408@gmail.com',
    resume: 'resume/Tom_Lin_UIUX_Designer_Resume.pdf'
  };

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

  /* Page transitions come from the live site's fx.js (entry reveal + a[data-nav] exits), so the hand-off
     into project-*.html is identical. go() replays the same exit for navigations started from script. */
  function slide(el, delay) {
    el.style.transition = 'none'; el.style.transform = 'translateY(100%)'; void el.offsetHeight;
    el.style.transition = 'transform 600ms cubic-bezier(0.76, 0, 0.24, 1) ' + delay + 'ms'; el.style.transform = 'translateY(0%)';
  }
  function go(href) {
    var wrap = document.getElementById('pfx-transition');
    if (!wrap || reduced) { location.href = href; return; }
    var brand = wrap.querySelector('[data-pfx-layer="brand"]');
    wrap.style.display = 'block'; wrap.style.pointerEvents = 'auto'; brand.style.opacity = '0';
    slide(wrap.querySelector('[data-pfx-layer="orange"]'), 0);
    slide(wrap.querySelector('[data-pfx-layer="charcoal"]'), 110);
    setTimeout(function () { brand.style.opacity = '1'; }, 500);
    setTimeout(function () { location.assign(href); }, 780);
  }

  var toastEl = null, toastT = 0;
  function toast(msg) {
    if (!toastEl) { toastEl = el('<div class="p-toast" role="status" aria-live="polite"></div>'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200);
  }
  function copy(text, done) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { toast(done || 'Copied to clipboard'); }, function () { toast(text); });
  }

  function boot(current) {
    // coming back from a project page via bfcache: drop the exit wipe that was left covering the page
    window.addEventListener('pageshow', function (e) {
      var wrap = document.getElementById('pfx-transition');
      if (e.persisted && wrap) { wrap.style.display = 'none'; wrap.style.pointerEvents = 'none'; }
    });
  }

  function clock(node) {
    function tick() {
      node.textContent = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (GMT+8)';
    }
    tick(); setInterval(tick, 1000);
  }

  return { projects: projects, quotes: quotes, about: about, el: el, go: go, toast: toast, copy: copy, boot: boot, clock: clock, reduced: reduced };
})();

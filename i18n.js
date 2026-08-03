/* Site-wide EN / 中文(繁體) language switch.
   - Static text: elements marked data-i18n="key" get innerHTML swapped from DICT.
   - Dynamic panels (About dashboard chips/strengths/language/interests) and the
     scroll-scrubbed quote are re-rendered via hooks the host page/script exposes.
   - Preference persists in localStorage and applies on every page that includes this file. */
(function () {

  var STORAGE_KEY = 'pfx-lang';

  var DICT = {
    /* ---------- nav ---------- */
    'nav.process':  { en: 'PROCESS',  zh: '流程' },
    'nav.work':     { en: 'WORK',     zh: '作品' },
    'nav.about':    { en: 'ABOUT',    zh: '關於' },
    'nav.feedback': { en: 'FEEDBACK', zh: '評價' },
    'nav.contact':  { en: 'CONTACT',  zh: '聯絡' },
    'nav.chat':     { en: "LET'S CHAT", zh: '聊聊吧' },
    'nav.side.hello': { en: 'HELLO', zh: '哈囉' },

    'nav.mobile.processTitle': { en: 'Process', zh: '流程' },
    'nav.mobile.processItem':  { en: 'Work flow', zh: '工作流程' },
    'nav.mobile.worksTitle':   { en: 'Works', zh: '作品' },
    'nav.mobile.aboutTitle':   { en: 'About', zh: '關於' },
    'nav.mobile.aboutItem':    { en: "It's me", zh: '認識一下我' },
    'nav.mobile.feedbackTitle':{ en: 'Feedback', zh: '評價' },
    'nav.mobile.feedbackItem': { en: 'What they say', zh: '他們怎麼說' },
    'nav.mobile.contactTitle': { en: 'Contact', zh: '聯絡' },
    'nav.mobile.contactItem':  { en: "Let's chat", zh: '聊聊吧' },

    /* ---------- hero ---------- */
    'hero.badge': { en: 'AVAILABLE FOR WORK', zh: '現正接案中' },
    'hero.line1': { en: 'Hi, I am', zh: '嗨,我是' },
    'hero.desc': {
      en: 'A UI/UX Designer turning complexity into intuitive digital experiences — with a creative spark, blending systemic design and refined interfaces.',
      zh: '我是一名 UI/UX 設計師,擅長把複雜的問題轉化為直覺易懂的數位體驗——用一點創意火花,結合系統化設計與精緻介面。'
    },
    'hero.cta.work': { en: 'VIEW MY WORK', zh: '查看作品' },
    'hero.location': { en: 'TAIPEI, TAIWAN', zh: '台灣・台北' },
    'hero.scroll':   { en: 'SCROLL', zh: '向下滾動' },

    /* ---------- process ---------- */
    'process.eyebrow': { en: 'DESIGN PROCESS', zh: '設計流程' },
    'process.heading': { en: 'Aesthetics and<br>Usability', zh: '美感,亦是<br>可用性' },
    'process.desc': {
      en: 'I design with a user-first mindset, crafting experiences that are both visually striking and effortlessly intuitive.',
      zh: '我秉持使用者優先的設計思維,打造兼具視覺張力與直覺易用的體驗。'
    },
    'process.s1': { en: 'Research', zh: '使用者研究' },
    'process.s2': { en: 'Craft Visuals', zh: '視覺打磨' },
    'process.s3': { en: 'Make Animation', zh: '動效製作' },
    'process.s4': { en: 'Design Handoff', zh: '設計交付' },

    /* ---------- work ---------- */
    'work.eyebrow': { en: 'NOW, THE GOOD STUFF', zh: '好戲上場' },
    'work.heading': { en: 'A selection of<br>Recent Works', zh: '近期作品<br>精選' },
    'work.desc': {
      en: 'Magic I make with my mouse — projects that demonstrate my approach to UX thinking and visual UI design.',
      zh: '滑鼠點出來的魔法——這些作品展現了我在 UX 思維與視覺 UI 設計上的方法。'
    },
    'work.cta': { en: 'VIEW CASE STUDY', zh: '查看案例' },

    'project.rg.tag': { en: 'CS.01 — WEB PLATFORM', zh: 'CS.01 — 網頁平台' },
    'project.rg.desc': {
      en: 'An online platform that helps users create professional resumes and cover letters with customizable templates and step-by-step guidance.',
      zh: '一個協助使用者快速生成專業履歷與求職信的線上平台,提供可自訂範本與 AI 技術指引,並提供豐富的職涯資源與專屬社群支援。'
    },
    'project.yotta.tag': { en: 'CS.02 — LEARNING PLATFORM', zh: 'CS.02 — 學習平台' },
    'project.yotta.desc': {
      en: 'An online learning platform. Courses cover fascinating subjects in a wide range of fields — life, language, engineering, business and more.',
      zh: '台灣知名的跨領域線上學習平台,課程橫跨生活、語言、工程、商業等多元領域的有趣主題,並提供企業培訓方案。'
    },
    'project.cupo.tag': { en: 'CS.03 — MOBILE APP', zh: 'CS.03 — 行動應用程式' },
    'project.cupo.desc': {
      en: 'A student-based productivity tool that boosts motivation and fights procrastination by rewarding you with coupons.',
      zh: '一款專為學生打造的效率工具,透過優惠券獎勵機制提升動力、對抗拖延。'
    },

    /* ---------- quote ---------- */
    'quote.eyebrow': { en: 'YEP, THIS IS WHAT I BELIEVE', zh: '這就是我的信念' },
    'quote.cta': { en: "LET'S CONNECT", zh: '保持聯絡' },

    /* ---------- about ---------- */
    'about.eyebrow': { en: "HEY, LET'S GET TO KNOW ME", zh: '來認識我一下' },
    'about.heading': { en: 'Who I Am', zh: '關於我' },
    'about.badge.profile': { en: 'PROFILE', zh: '個人檔案' },
    'about.badge.open': { en: 'OPEN TO NEW PROJECTS', zh: '開放接案中' },
    'about.bio.hi': { en: "Hi, I'm Tom Lin — good to meet you!", zh: '嗨,我是 Tom Lin,很高興認識你!' },
    'about.bio.text': {
      en: "With 6+ years in UI/UX design, I create user-centered digital products through research, prototyping, and testing with purpose. I'm hands-on from discovery to delivery, detail-oriented yet pragmatic — knowing when to polish and when to ship. I use AI as part of my workflow for research synthesis, inspiration, prompting, rapid prototyping, and light coding, allowing me to explore faster and communicate ideas more clearly. I value design systems, accessibility, and smooth collaboration with developers and product teams from concept to hand-off.",
      zh: '我有 6 年以上的 UI/UX 設計經驗,透過有目的的研究、原型設計與測試,打造以使用者為核心的數位產品。從探索到交付,我都親力親為——注重細節,但也很務實,清楚知道什麼時候該打磨、什麼時候該上線。我把 AI 融入日常工作流程,用它整理研究資料、激發靈感、寫 prompt、快速做原型,也會寫一些簡單的程式,讓我能更快探索想法、更清楚地把概念傳達出去。我很重視設計系統、無障礙設計,以及從發想到交付,和工程師、產品團隊之間的順暢協作。'
    },
    'about.bio.quote': {
      en: '"Good design starts with empathy and ends with impact."',
      zh: '「好的設計,始於同理心,終於影響力。」'
    },
    'about.cta.resume': { en: 'DOWNLOAD RESUME', zh: '下載履歷' },

    /* ---------- capability dashboard panel titles ---------- */
    'dash.skills':     { en: 'Skills &amp; Expertise', zh: '技能與專長' },
    'dash.language':   { en: 'Language', zh: '語言能力' },
    'dash.capacity':   { en: 'Capacity', zh: 'AI 應用能力' },
    'dash.strengths':  { en: 'Strengths', zh: '個人特質' },
    'dash.interests':  { en: 'Interests', zh: '興趣' },

    /* ---------- feedback ---------- */
    'feedback.eyebrow': { en: "BANG, I'VE DONE A GREAT JOB", zh: '成果,有目共睹' },
    'feedback.heading': { en: 'What People Say', zh: '大家怎麼說' },
    'feedback.desc': {
      en: "Here's what collaborators, clients and colleagues have said about my design approach.",
      zh: '以下是合作夥伴、客戶與同事對我設計方式的真實回饋。'
    },
    'feedback.role.pm':        { en: 'PRODUCT MANAGER', zh: '產品經理' },
    'feedback.role.cofounder': { en: 'CO-FOUNDER, FLIGHTPLAN', zh: '共同創辦人・FLIGHTPLAN' },
    'feedback.role.tutor1':    { en: 'DESIGN TUTOR / CREATOR', zh: '設計導師 / 創作者' },
    'feedback.role.tutor2':    { en: 'SESSIONAL DESIGN TUTOR', zh: '兼任設計講師' },
    'feedback.role.dev':       { en: 'LEAD FRONT-END DEVELOPER', zh: '前端技術主管' },

    /* ---------- contact ---------- */
    'contact.eyebrow': { en: 'CHEERS, CONTACT ME PLEASE', zh: '說吧,想聊聊嗎' },
    'contact.heading': { en: "Think I'd fit<br>your project", zh: '覺得我適合<br>你的專案嗎' },
    'contact.desc': {
      en: 'Get in touch with me about a project, a collaboration, or just to say hello.',
      zh: '無論是專案合作,或只是想打聲招呼,都歡迎與我聯絡。'
    },
    'contact.phone': { en: 'PHONE ME', zh: '打給我' },
    'contact.email': { en: 'EMAIL ME', zh: '寫信給我' },
    'contact.visit': { en: 'VISIT ME', zh: '來找我' },
    'contact.location': { en: 'Taipei, Taiwan', zh: '台灣台北' },
    'contact.cta': { en: 'REACH OUT TO ME', zh: '立即聯絡我' },

    /* ---------- footer ---------- */
    'footer.top': { en: 'BACK TO TOP ↑', zh: '回到頂部 ↑' },

    /* ---------- project case-study pages (shared) ---------- */
    'proj.back':       { en: 'BACK TO WORK', zh: '回作品列表' },
    'proj.timeline':   { en: 'TIMELINE', zh: '專案期間' },
    'proj.category':   { en: 'CATEGORY', zh: '類別' },
    'proj.role':       { en: 'ROLE', zh: '角色' },
    'proj.highlights': { en: 'HIGHLIGHTS', zh: '亮點' },
    'proj.type':       { en: 'TYPE', zh: '類型' },
    'proj.content':    { en: 'PROJECT CONTENT', zh: '專案內容' },

    'proj.rg.badge':   { en: 'CASE STUDY — 01', zh: '案例研究 — 01' },
    'proj.rg.category.value':   { en: 'Web Platform', zh: '網頁平台' },
    'proj.rg.highlights.value': { en: 'Design System + Optimization', zh: '設計系統與優化' },

    'proj.yotta.badge': { en: 'CASE STUDY — 02', zh: '案例研究 — 02' },
    'proj.yotta.category.value':   { en: 'Learning Platform', zh: '學習平台' },
    'proj.yotta.highlights.value': { en: 'Multiple-status Elements + Ecommerce', zh: '多狀態元件與電商功能' },
    'proj.yotta.icon.life':     { en: 'Life', zh: '生活' },
    'proj.yotta.icon.design':   { en: 'Design', zh: '設計' },
    'proj.yotta.icon.business': { en: 'Business', zh: '商業' },
    'proj.yotta.icon.language': { en: 'Language', zh: '語言' },
    'proj.yotta.icon.tech':     { en: 'Tech', zh: '科技' },

    'proj.cupo.badge': { en: 'CASE STUDY — 03', zh: '案例研究 — 03' },
    'proj.cupo.category.value': { en: 'Mobile App', zh: '行動應用程式' },
    'proj.cupo.type.value':     { en: 'Graduate Project', zh: '畢業專題' },
    'proj.cupo.interactive':    { en: 'INTERACTIVE PROTOTYPE', zh: '互動原型' },
    'proj.cupo.tryit':          { en: 'TRY IT OUT', zh: '立即體驗' },
    'proj.cupo.via':            { en: 'VIA PROTOPIE', zh: '透過 ProtoPie 製作' }
  };

  function getLang() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    return saved === 'zh' ? 'zh' : 'en';
  }

  function persistLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  function applyStatic(lang) {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      var entry = DICT[key];
      if (!entry) continue;
      nodes[i].innerHTML = entry[lang] || entry.en;
    }
  }

  function updateToggles(lang) {
    var toggles = document.querySelectorAll('[data-lang-toggle]');
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].setAttribute('data-lang-active', lang);
      toggles[i].setAttribute('aria-checked', lang === 'zh' ? 'true' : 'false');
    }
  }

  function apply(lang) {
    applyStatic(lang);
    updateToggles(lang);
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-Hant' : 'en');

    if (window.PfxQuoteRebuild) { try { window.PfxQuoteRebuild(lang); } catch (e) {} }
    if (window.PfxHeroClockLang) { try { window.PfxHeroClockLang(lang); } catch (e) {} }
    if (window.AboutDashboard && window.AboutDashboard.setLanguage) { try { window.AboutDashboard.setLanguage(lang); } catch (e) {} }

    if (window.ScrollTrigger) {
      /* Text length changes shift section positions — recalc trigger offsets */
      clearTimeout(apply._raf);
      apply._raf = setTimeout(function () { try { window.ScrollTrigger.refresh(); } catch (e) {} }, 60);
    }

    document.dispatchEvent(new CustomEvent('pfx-lang-change', { detail: { lang: lang } }));
  }

  function toggleLang() {
    var next = getLang() === 'zh' ? 'en' : 'zh';
    persistLang(next);
    apply(next);
  }

  function buildToggle(extraClass) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pfx-lang-toggle' + (extraClass ? ' ' + extraClass : '');
    btn.setAttribute('data-lang-toggle', 'true');
    btn.setAttribute('role', 'switch');
    btn.setAttribute('aria-label', 'Switch language / 切換語言');
    btn.innerHTML =
      '<span class="pfx-lang-toggle-thumb" aria-hidden="true"></span>' +
      '<span class="pfx-lang-toggle-opt" data-lang-opt="en">EN</span>' +
      '<span class="pfx-lang-toggle-opt" data-lang-opt="zh">中</span>';
    btn.addEventListener('click', toggleLang);
    return btn;
  }

  function injectToggles() {
    /* Desktop nav: 8px left of the LET'S CHAT button */
    var chatLink = document.querySelector('.pfx-main-nav a[href^="mailto:"]');
    if (chatLink && chatLink.parentNode && !document.querySelector('.pfx-lang-toggle-desktop')) {
      var wrap = document.createElement('div');
      wrap.className = 'pfx-nav-lang-group';
      chatLink.parentNode.insertBefore(wrap, chatLink);
      wrap.appendChild(buildToggle('pfx-lang-toggle-desktop'));
      wrap.appendChild(chatLink);
    }

    /* Mobile: directly left of the hamburger icon */
    var hamburger = document.querySelector('.pfx-hamburger-btn');
    if (hamburger && hamburger.parentNode && !document.querySelector('.pfx-lang-toggle-mobile')) {
      var mWrap = document.createElement('div');
      mWrap.className = 'pfx-mobile-controls';
      hamburger.parentNode.insertBefore(mWrap, hamburger);
      mWrap.appendChild(buildToggle('pfx-lang-toggle-mobile'));
      mWrap.appendChild(hamburger);
    }
  }

  function init() {
    injectToggles();
    apply(getLang());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PfxI18n = { getLang: getLang, setLang: function (l) { persistLang(l); apply(l); }, dict: DICT };
})();

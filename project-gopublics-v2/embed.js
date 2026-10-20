(function () {
  class GoPublicsCaseStudy extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const template = document.getElementById('gopublics-case-study-template');
      if (!template) return;
      const root = this.attachShadow({ mode: 'open' });
      root.append(template.content.cloneNode(true));
      this.bindNavigation(root);
    }

    bindNavigation(root) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      root.addEventListener('click', (event) => {
        const link = event.target.closest && event.target.closest('a[href^="#"]');
        if (!link) return;
        const id = decodeURIComponent(link.getAttribute('href').slice(1));
        const target = root.getElementById(id);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
      });
    }
  }

  if (!customElements.get('gopublics-case-study')) {
    customElements.define('gopublics-case-study', GoPublicsCaseStudy);
  }
})();

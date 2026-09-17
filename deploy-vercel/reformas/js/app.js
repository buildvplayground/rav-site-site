/* ==========================================================================
   RAV Obras — app.js (compartilhado por index.html, reformas.html,
   fornecedores/ e trabalhe-conosco/)
   SEGUNDA PROPOSTA DE DESIGN — seletores/markup reconstruídos para o novo
   sistema (prefixo rv-), mas a ENGENHARIA de interação (easing, rede de
   segurança de 3 camadas do reveal, trava de foco, contrato do lightbox,
   consentimento LGPD) é a mesma lógica já testada na rodada anterior — o
   pedido do cliente foi "outra proposta visual", não "reescreva algoritmos
   que já funcionam". Zero dependências externas.
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var docEl = document.documentElement;
  /* Preenchido pelo módulo do lightbox; usado também pela galeria por segmento
     para abrir QUALQUER lista de imagens no mesmo lightbox. */
  var openLightbox = null;

  /* ---------------------------------------------------------------------
     Ano do rodapé
  --------------------------------------------------------------------- */
  var yearEls = document.querySelectorAll('[data-year]');
  for (var y = 0; y < yearEls.length; y++) { yearEls[y].textContent = new Date().getFullYear(); }

  /* ---------------------------------------------------------------------
     Header — transparente sobre o hero, solidifica ao rolar ~60px.
     Páginas sem hero (fornecedores/trabalhe-conosco) começam sólidas: não
     há foto por trás para justificar transparência.
  --------------------------------------------------------------------- */
  var header = document.querySelector('[data-header]');
  var hasHero = !!document.querySelector('.rv-hero');
  if (header && !hasHero) header.classList.add('is-solid');
  var ticking = false;
  function applyScroll() {
    ticking = false;
    var yy = window.pageYOffset || docEl.scrollTop || 0;
    if (header && hasHero) header.classList.toggle('is-solid', yy > 60);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(applyScroll); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  applyScroll();

  /* ---------------------------------------------------------------------
     Menu mobile / off-canvas (agora é a navegação completa em qualquer
     tela — o header transparente só mostra logo+hambúrguer)
  --------------------------------------------------------------------- */
  var menu = document.querySelector('[data-mobile-menu]');
  var navToggle = document.querySelector('[data-nav-toggle]');
  function isLightboxOpen() {
    var lb = document.querySelector('[data-lightbox]');
    return !!(lb && lb.getAttribute('data-open') === 'true');
  }
  var menuLastFocused = null;
  function menuFocusables() {
    if (!menu) return [];
    return [].slice.call(menu.querySelectorAll('a,button')).filter(function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
  }
  function setMenu(open) {
    if (!menu) return;
    if (open) {
      menuLastFocused = document.activeElement;
      menu.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      menu.setAttribute('aria-hidden', 'false');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(function () { menu.setAttribute('data-open', 'true'); });
      /* rede de segurança: rAF não roda em documento oculto/aba de fundo */
      setTimeout(function () { menu.setAttribute('data-open', 'true'); }, 80);
      var f = menuFocusables();
      if (f.length) try { f[0].focus(); } catch (e) {}
    } else {
      menu.setAttribute('data-open', 'false');
      menu.setAttribute('aria-hidden', 'true');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
      if (!isLightboxOpen()) document.body.style.overflow = '';
      setTimeout(function () { if (menu.getAttribute('data-open') !== 'true') menu.style.display = 'none'; }, reduce ? 0 : 380);
      if (menuLastFocused && menuLastFocused.focus) try { menuLastFocused.focus(); } catch (e) {}
    }
  }
  if (navToggle) navToggle.addEventListener('click', function () {
    var open = navToggle.getAttribute('aria-expanded') === 'true';
    setMenu(!open);
  });
  document.querySelectorAll('[data-menu-close]').forEach(function (el) {
    el.addEventListener('click', function () { setMenu(false); });
  });
  document.querySelectorAll('[data-mobile-menu] a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (!(menu && menu.getAttribute('data-open') === 'true')) return;
    if (e.key === 'Escape') { setMenu(false); return; }
    /* Trava de foco: com o menu full-screen aberto, Tab não pode escapar
       para o header/conteúdo escondido atrás dele (WCAG 2.4.11/2.1.2). */
    if (e.key === 'Tab') {
      var f = menuFocusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (f.indexOf(document.activeElement) === -1) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------------------------------------------------------------------
     Scroll suave nas âncoras internas (arquitetura "com motor"):
     html usa scroll-behavior:auto e este script cuida do deslocamento,
     descontando o header fixo. Desligado em touch (deixa o momentum
     nativo) e nunca ativo com overlay aberto.
  --------------------------------------------------------------------- */
  var HEADER_OFFSET = 96; /* header-h (80) + respiro — mesmo valor do scroll-padding-top em styles.css */
  function easeInOutQuint(t) { return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2; }
  var scrollAnim = null;
  function smoothScrollTo(targetY) {
    var startY = window.pageYOffset || docEl.scrollTop || 0;
    var maxY = Math.max(0, (docEl.scrollHeight || 0) - (window.innerHeight || 0));
    var destY = Math.max(0, Math.min(targetY, maxY));
    var dist = destY - startY;
    if (scrollAnim) { cancelAnimationFrame(scrollAnim); scrollAnim = null; }
    if (reduce || isTouch || Math.abs(dist) < 2) { window.scrollTo(0, destY); return; }
    var dur = Math.max(500, Math.min(1100, Math.abs(dist) * 0.6));
    var t0 = null;
    function step(now) {
      if (t0 === null) t0 = now;
      var p = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, startY + dist * easeInOutQuint(p));
      if (p < 1) scrollAnim = requestAnimationFrame(step); else scrollAnim = null;
    }
    scrollAnim = requestAnimationFrame(step);
  }
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function () { if (scrollAnim) { cancelAnimationFrame(scrollAnim); scrollAnim = null; } }, { passive: true });
  });
  document.addEventListener('click', function (e) {
    var el = e.target;
    var a = el && el.closest ? el.closest('a[href^="#"]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.length < 2) return;
    var tgt;
    try { tgt = document.getElementById(href.slice(1)); } catch (err) { tgt = null; }
    if (!tgt) return;
    e.preventDefault();
    var inMenu = menu && menu.contains(a);
    if (inMenu) setMenu(false);
    var go = function () {
      var yy = tgt.getBoundingClientRect().top + (window.pageYOffset || docEl.scrollTop || 0) - HEADER_OFFSET;
      smoothScrollTo(yy);
      if (window.history && history.pushState) { try { history.pushState(null, '', href); } catch (err2) {} }
    };
    if (inMenu) setTimeout(go, 380); else go();
  }, false);

  /* ---------------------------------------------------------------------
     Reveal on scroll — opacity + translateY/X, stagger automático por
     grupo de irmãos com [data-reveal]. Gatilho em 3 camadas: (1) primeira
     tela por timer, independente do observer — IntersectionObserver não
     dispara em documento oculto/aba de fundo; (2) scroll normal via
     IntersectionObserver; (3) rede de segurança final.
  --------------------------------------------------------------------- */
  var revealEls = [].slice.call(document.querySelectorAll('[data-reveal]'));
  revealEls.forEach(function (el) {
    var parent = el.parentElement;
    var sibs = parent ? [].slice.call(parent.children).filter(function (c) { return c.hasAttribute('data-reveal'); }) : [el];
    var idx = Math.max(0, sibs.indexOf(el));
    el.style.transitionDelay = (sibs.length > 1 ? Math.min(idx, 7) * 80 : 0) + 'ms';
  });
  function revealNow(el) { el.classList.add('is-in'); }
  function isInViewport(el) {
    var r = el.getBoundingClientRect();
    return r.top < (window.innerHeight || docEl.clientHeight) && r.bottom > 0;
  }
  if (reduce) {
    revealEls.forEach(revealNow);
  } else {
    var revealedSet = Object.create(null);
    function markRevealed(el, idx) { if (!revealedSet[idx]) { revealedSet[idx] = true; revealNow(el); } }
    if ('IntersectionObserver' in window) {
      var rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { var i = revealEls.indexOf(entry.target); markRevealed(entry.target, i); rio.unobserve(entry.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      revealEls.forEach(function (el) { rio.observe(el); });
    }
    setTimeout(function () {
      revealEls.forEach(function (el, i) { if (isInViewport(el)) markRevealed(el, i); });
    }, 150);
    setTimeout(function () {
      revealEls.forEach(function (el, i) { markRevealed(el, i); });
    }, 2500);
  }

  /* CTA final "Como funciona" — passos horizontais, um único disparo.
     Mesma rede de segurança do reveal geral. */
  var stepsEl = document.querySelector('.rv-steps-row');
  if (stepsEl) {
    if (reduce) {
      stepsEl.classList.add('is-in');
    } else {
      var stepsRevealed = false;
      function revealSteps() { if (!stepsRevealed) { stepsRevealed = true; stepsEl.classList.add('is-in'); } }
      if ('IntersectionObserver' in window) {
        var sio = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) { if (entry.isIntersecting) revealSteps(); });
        }, { threshold: 0.3 });
        sio.observe(stepsEl);
      }
      setTimeout(function () { if (isInViewport(stepsEl)) revealSteps(); }, 150);
      setTimeout(revealSteps, 2500);
    }
  }

  /* ---------------------------------------------------------------------
     FAQ — acordeão, uma pergunta aberta por vez, primeira aberta por
     padrão (marcada com data-open="true" no HTML).
  --------------------------------------------------------------------- */
  var faqItems = [].slice.call(document.querySelectorAll('.rv-faq-item'));
  function setFaq(item, open) {
    var btn = item.querySelector('.rv-faq-q');
    var panel = item.querySelector('.rv-faq-a');
    item.setAttribute('data-open', open ? 'true' : 'false');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (panel) panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
  }
  faqItems.forEach(function (item) {
    var btn = item.querySelector('.rv-faq-q');
    if (!btn) return;
    setFaq(item, item.getAttribute('data-open') === 'true');
    btn.addEventListener('click', function () {
      var isOpen = item.getAttribute('data-open') === 'true';
      faqItems.forEach(function (other) { if (other !== item) setFaq(other, false); });
      setFaq(item, !isOpen);
    });
  });
  function resyncOpenFaq() {
    faqItems.forEach(function (item) {
      if (item.getAttribute('data-open') === 'true') setFaq(item, true);
    });
  }
  window.addEventListener('resize', resyncOpenFaq);
  /* A altura é medida via scrollHeight logo no load, antes da webfont
     trocar a fonte de fallback (FOUT) — re-mede quando a fonte carrega
     (e num fallback por tempo). */
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(resyncOpenFaq); }
  setTimeout(resyncOpenFaq, 500);

  /* ---------------------------------------------------------------------
     Lightbox da galeria de casos/portfólio — setas, teclado (Esc/←/→),
     swipe, contador "N / total", trava de scroll do body, trava de foco.
  --------------------------------------------------------------------- */
  (function () {
    var lb = document.querySelector('[data-lightbox]');
    if (!lb) return;
    var img = lb.querySelector('[data-lb-img]');
    var closeBtn = lb.querySelector('[data-lb-close]');
    var prevBtn = lb.querySelector('[data-lb-prev]');
    var nextBtn = lb.querySelector('[data-lb-next]');
    var counter = lb.querySelector('[data-lb-count]');
    var lastFocused = null, cur = 0, items = [];

    function isOpen() { return lb.getAttribute('data-open') === 'true'; }
    function show(i) {
      if (!items.length) return;
      cur = ((i % items.length) + items.length) % items.length;
      var it = items[cur];
      if (counter) counter.textContent = (cur + 1) + ' / ' + items.length;
      img.setAttribute('src', it.src || '');
      img.setAttribute('alt', it.alt || '');
    }
    /* Abre o lightbox com QUALQUER lista [{src, alt}] a partir do índice i.
       Exposto em openLightbox p/ o portfólio e a galeria por segmento. */
    function openWith(list, i) {
      items = list || [];
      if (!items.length) return;
      lb.setAttribute('data-single', items.length < 2 ? 'true' : 'false');
      lastFocused = document.activeElement;
      lb.setAttribute('data-open', 'true');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      show(i || 0);
      requestAnimationFrame(function () { requestAnimationFrame(function () { lb.classList.add('is-visible'); }); });
      setTimeout(function () { lb.classList.add('is-visible'); }, 80);
      if (closeBtn) try { closeBtn.focus(); } catch (e) {}
    }
    openLightbox = openWith;

    function close() {
      lb.classList.remove('is-visible');
      lb.setAttribute('aria-hidden', 'true');
      if (!(menu && menu.getAttribute('data-open') === 'true')) document.body.style.overflow = '';
      var finished = function () {
        lb.setAttribute('data-open', 'false');
        img.setAttribute('src', '');
        lb.removeEventListener('transitionend', finished);
      };
      if (reduce) { finished(); } else { lb.addEventListener('transitionend', finished); setTimeout(finished, 400); }
      if (lastFocused && lastFocused.focus) try { lastFocused.focus(); } catch (e) {}
    }
    if (closeBtn) closeBtn.addEventListener('click', function (e) { e.stopPropagation(); close(); });
    if (prevBtn) prevBtn.addEventListener('click', function (e) { e.stopPropagation(); show(cur - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function (e) { e.stopPropagation(); show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { close(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
      else if (e.key === 'Tab') {
        var focusables = [closeBtn, prevBtn, nextBtn].filter(Boolean);
        if (!focusables.length) return;
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    var sx = 0, sy = 0, swiping = false;
    lb.addEventListener('touchstart', function (e) {
      if (!isOpen() || e.touches.length !== 1) { swiping = false; return; }
      swiping = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (!swiping) return; swiping = false;
      if (items.length < 2) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.3) show(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });

    /* Portfólio (.rv-case): monta a lista uma vez e abre o lightbox no clique */
    var figs = [].slice.call(document.querySelectorAll('.rv-case'));
    if (figs.length) {
      var caseItems = figs.map(function (fig) {
        var im = fig.querySelector('img');
        return { src: im ? (im.getAttribute('src') || '') : '', alt: im ? (im.getAttribute('alt') || '') : '' };
      });
      figs.forEach(function (fig, i) {
        var im = fig.querySelector('img');
        var alt = im ? (im.getAttribute('alt') || '') : '';
        fig.setAttribute('tabindex', '0');
        fig.setAttribute('role', 'button');
        fig.setAttribute('aria-label', 'Ampliar foto' + (alt ? ': ' + alt : ''));
        fig.addEventListener('click', function () { openWith(caseItems, i); });
        fig.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWith(caseItems, i); }
        });
      });
    }
  })();

  /* ---------------------------------------------------------------------
     Galeria por segmento — a lista de "Onde atuamos/reformamos" vira um
     seletor; ao lado (desktop) / abaixo (mobile) um painel mostra as fotos
     do segmento ativo. Clicar numa foto reabre o mesmo lightbox.
     Data-driven: RAV_SEGMENTS mapeia segmento -> lista de fotos. Para
     adicionar fotos por segmento depois, basta editar esse objeto. Segmentos
     sem foto ficam não-clicáveis (marcados no HTML como --soon).
  --------------------------------------------------------------------- */
  var RAV_SEGMENTS = {
    escritorios: [
      { src: 'assets/img/segmentos/seg-escritorios-1.webp', alt: 'Sala de gerência com divisórias de vidro e marcenaria, obra comercial entregue pela RAV' },
      { src: 'assets/img/segmentos/seg-escritorios-2.webp', alt: 'Escritório em open space com estações de trabalho, obra comercial entregue pela RAV' },
      { src: 'assets/img/segmentos/seg-escritorios-3.webp', alt: 'Escritório individual com estação de trabalho, obra comercial entregue pela RAV' },
      { src: 'assets/img/segmentos/seg-escritorios-4.webp', alt: 'Recepção corporativa com estações de trabalho, obra comercial entregue pela RAV' }
    ],
    clinicas: [
      { src: 'assets/img/segmentos/seg-clinicas-1.webp', alt: 'Sala de espera de clínica com poltronas, obra comercial entregue pela RAV' },
      { src: 'assets/img/segmentos/seg-clinicas-2.webp', alt: 'Fileira de consultórios com portas, obra comercial entregue pela RAV' },
      { src: 'assets/img/segmentos/seg-clinicas-3.webp', alt: 'Recepção de clínica com balcão de atendimento, obra comercial entregue pela RAV' },
      { src: 'assets/img/segmentos/seg-clinicas-4.webp', alt: 'Área de espera de clínica finalizada, obra comercial entregue pela RAV' }
    ],
    laboratorios: [
      { src: 'assets/img/segmentos/seg-laboratorios-1.webp', alt: 'Laboratório com instrumentos sobre bancada, obra comercial entregue pela RAV' },
      { src: 'assets/img/segmentos/seg-laboratorios-2.webp', alt: 'Laboratório com bancada de inox e equipamentos, obra comercial entregue pela RAV' },
      { src: 'assets/img/segmentos/seg-laboratorios-3.webp', alt: 'Sala de laboratório com bancada e armários, obra comercial entregue pela RAV' },
      { src: 'assets/img/segmentos/seg-laboratorios-4.webp', alt: 'Laboratório com capela de exaustão, obra comercial entregue pela RAV' }
    ],
    lojas: [
      { src: 'assets/img/segmentos/seg-lojas-1.webp', alt: 'Fachada de loja de varejo finalizada, obra comercial entregue pela RAV' },
      { src: 'assets/img/segmentos/seg-lojas-2.webp', alt: 'Galpão comercial finalizado, obra comercial entregue pela RAV' }
    ]
  };
  (function () {
    var root = document.querySelector('[data-segments]');
    if (!root) return;
    var panel = root.querySelector('[data-seg-panel]');
    var buttons = [].slice.call(root.querySelectorAll('[data-seg]'));
    if (!panel || !buttons.length) return;
    var ZOOM_SVG = '<span class="rv-seg-thumb-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></span>';

    function buildPanel(seg) {
      var photos = RAV_SEGMENTS[seg] || [];
      panel.innerHTML = '';
      if (!photos.length) return;
      var grid = document.createElement('div');
      grid.className = 'rv-seg-grid';
      photos.forEach(function (p, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rv-seg-thumb';
        btn.setAttribute('aria-label', 'Ampliar foto' + (p.alt ? ': ' + p.alt : ''));
        var im = document.createElement('img');
        im.src = p.src; im.alt = p.alt || ''; im.loading = 'lazy';
        btn.appendChild(im);
        btn.insertAdjacentHTML('beforeend', ZOOM_SVG);
        btn.addEventListener('click', function () { if (openLightbox) openLightbox(photos, i); });
        grid.appendChild(btn);
      });
      panel.appendChild(grid);
    }
    function select(btn) {
      buttons.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-current', on ? 'true' : 'false');
      });
      buildPanel(btn.getAttribute('data-seg'));
    }
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () { select(btn); });
    });
    var withPhotos = buttons.filter(function (b) { return (RAV_SEGMENTS[b.getAttribute('data-seg')] || []).length; });
    if (withPhotos.length) select(withPhotos[0]);
  })();

  /* ---------------------------------------------------------------------
     Scrollspy — destaca o link ativo da navegação principal
  --------------------------------------------------------------------- */
  (function () {
    if (!('IntersectionObserver' in window)) return;
    var links = [].slice.call(document.querySelectorAll('.rv-nav a[href^="#"]'));
    var secs = [];
    links.forEach(function (a) {
      var h = a.getAttribute('href');
      var s = h ? document.querySelector(h) : null;
      if (s) secs.push(s);
    });
    if (!secs.length) return;
    function activate(id) {
      links.forEach(function (a) {
        if (a.getAttribute('href') === id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }
    var vis = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { vis['#' + en.target.id] = en.isIntersecting ? en.intersectionRatio : 0; });
      var best = null, bv = 0;
      Object.keys(vis).forEach(function (k) { if (vis[k] > bv) { bv = vis[k]; best = k; } });
      if (best && bv > 0) activate(best);
    }, { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 1] });
    secs.forEach(function (s) { spy.observe(s); });
  })();

  /* ---------------------------------------------------------------------
     Política de Privacidade (modal) + Cookie Notice — LGPD
     Compartilhado por index.html, reformas.html, fornecedores/ e
     trabalhe-conosco/. O consentimento é lembrado via localStorage e
     também dispara um evento no dataLayer, para que tags de analytics
     (GTM/GA4) instaladas depois só disparem com consentimento aceito.
  --------------------------------------------------------------------- */
  (function () {
    function openModal(id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeModal(id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('open');
      var menuOpen = menu && menu.getAttribute('data-open') === 'true';
      var otherModalOpen = document.querySelectorAll('.rv-privacy-overlay.open').length > 0;
      if (!menuOpen && !otherModalOpen && !isLightboxOpen()) document.body.style.overflow = '';
    }
    document.querySelectorAll('[data-modal]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openModal(el.getAttribute('data-modal'));
      });
    });
    var privacyClose = document.getElementById('privacyClose');
    var privacyOverlay = document.getElementById('privacyOverlay');
    if (privacyClose) privacyClose.addEventListener('click', function () { closeModal('privacyOverlay'); });
    if (privacyOverlay) privacyOverlay.addEventListener('click', function (e) {
      if (e.target === privacyOverlay) closeModal('privacyOverlay');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.querySelectorAll('.rv-privacy-overlay.open').length) closeModal('privacyOverlay');
    });

    /* ---- Cookie notice --------------------------------------------- */
    var COOKIE_KEY = 'rav_obras_cookie_ok';
    var notice = document.getElementById('cookieNotice');
    window.dataLayer = window.dataLayer || [];

    function pushConsent(consent) {
      window.dataLayer.push({ event: 'cookie_consent', consent: consent });
    }
    function saveConsent(consent) {
      try { localStorage.setItem(COOKIE_KEY, consent); } catch (e) {}
    }
    function readConsent() {
      try { return localStorage.getItem(COOKIE_KEY); } catch (e) { return null; }
    }
    function dismissCookie(consent) {
      if (notice) notice.classList.remove('show');
      saveConsent(consent);
      pushConsent(consent);
    }
    if (notice) {
      var saved = readConsent();
      if (!saved) {
        setTimeout(function () { notice.classList.add('show'); }, 1200);
      } else {
        pushConsent(saved === 'declined' ? 'declined' : 'accepted');
      }
    }
    var cookieAccept = document.getElementById('cookieAccept');
    var cookieDecline = document.getElementById('cookieDecline');
    if (cookieAccept) cookieAccept.addEventListener('click', function () { dismissCookie('accepted'); });
    if (cookieDecline) cookieDecline.addEventListener('click', function () { dismissCookie('declined'); });
  })();
})();

/* ============================================================
   FreshNest — interactive behaviours
   ============================================================ */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Floating bubbles ---------- */
  (function bubbles() {
    if (reduceMotion) return;
    var wrap = document.querySelector('.bubbles');
    if (!wrap) return;
    var count = window.innerWidth < 640 ? 10 : 18;
    for (var i = 0; i < count; i++) {
      var b = document.createElement('span');
      b.className = 'bubble';
      var size = 12 + Math.random() * 60;
      b.style.width = b.style.height = size + 'px';
      b.style.left = Math.random() * 100 + '%';
      b.style.animationDuration = (14 + Math.random() * 16) + 's';
      b.style.animationDelay = (-Math.random() * 20) + 's';
      wrap.appendChild(b);
    }
  })();

  /* ---------- Nav: scrolled state + mobile menu ---------- */
  var nav = document.getElementById('nav');
  var onScroll = function () {
    if (window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var toggle = document.getElementById('menuToggle');
  if (toggle) {
    toggle.addEventListener('click', function () { nav.classList.toggle('open'); });
    nav.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- Card spotlight follow ---------- */
  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    });
  });

  /* ---------- Animated counters ---------- */
  var countObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      var target = parseFloat(el.getAttribute('data-count'));
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var dur = 1400, start = performance.now();
      function tick(now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = target * eased;
        el.textContent = decimals ? val.toFixed(decimals)
          : Math.round(val).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = decimals ? target.toFixed(decimals) : target.toLocaleString();
      }
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(function (el) { countObserver.observe(el); });

  /* ============================================================
     INTERACTIVE 3D SOFA VIEW
     Tilts the real sofa photo in 3D. Drag to change the angle,
     auto-sways on its own, and is wired to a slider.
     ============================================================ */
  (function viewer3d() {
    var stage = document.getElementById('spin3d');
    var viewer = document.getElementById('viewer360');
    if (!stage || !viewer) return;
    var range = document.getElementById('spinRange');
    var label = document.getElementById('angleLabel');
    var toggleBtn = document.getElementById('spinToggle');

    var MAX = 40;               // max yaw in degrees
    var angle = 0;              // -MAX .. MAX
    var auto = !reduceMotion;
    var dragging = false, lastX = 0;
    var t = 0;

    function render() {
      var ry = angle;                 // yaw
      var rx = -angle * 0.10;         // slight coupled pitch for depth
      stage.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      if (range) range.value = Math.round(angle);
      if (label) label.textContent = Math.round(angle) + '°';
    }

    function setAngle(a) {
      angle = Math.max(-MAX, Math.min(MAX, a));
      render();
    }

    function loop() {
      if (auto && !dragging) {
        t += 0.012;
        angle = Math.sin(t) * MAX;    // gentle left-right sway
        render();
      }
      requestAnimationFrame(loop);
    }

    viewer.addEventListener('pointerdown', function (e) {
      dragging = true; lastX = e.clientX;
      viewer.setPointerCapture(e.pointerId);
    });
    viewer.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX; lastX = e.clientX;
      setAngle(angle + dx * 0.4);
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      viewer.addEventListener(ev, function () { dragging = false; });
    });

    if (range) {
      range.addEventListener('input', function () {
        auto = false; toggleBtn.textContent = '▶';
        setAngle(parseInt(range.value, 10));
      });
    }
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        auto = !auto;
        toggleBtn.textContent = auto ? '⏸' : '▶';
        if (auto) t = Math.asin(Math.max(-1, Math.min(1, angle / MAX)));
      });
      toggleBtn.textContent = auto ? '⏸' : '▶';
    }

    render();
    if (!reduceMotion) requestAnimationFrame(loop);
  })();

  /* ---------- Before / After slider ---------- */
  (function beforeAfter() {
    var ba = document.getElementById('ba');
    var before = document.getElementById('baBefore');
    var handle = document.getElementById('baHandle');
    if (!ba) return;

    function setPct(pct) {
      pct = Math.max(0, Math.min(100, pct));
      before.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      handle.style.left = pct + '%';
      handle.setAttribute('aria-valuenow', Math.round(pct));
    }
    var active = false;
    function fromEvent(clientX) {
      var r = ba.getBoundingClientRect();
      setPct(((clientX - r.left) / r.width) * 100);
    }
    ba.addEventListener('pointerdown', function (e) { active = true; fromEvent(e.clientX); ba.setPointerCapture(e.pointerId); });
    ba.addEventListener('pointermove', function (e) { if (active) fromEvent(e.clientX); });
    ['pointerup', 'pointercancel'].forEach(function (ev) { ba.addEventListener(ev, function () { active = false; }); });
    handle.addEventListener('keydown', function (e) {
      var cur = parseFloat(handle.getAttribute('aria-valuenow')) || 50;
      if (e.key === 'ArrowLeft') { setPct(cur - 4); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setPct(cur + 4); e.preventDefault(); }
    });
    setPct(50);
  })();

  /* ---------- Quote form ---------- */
  (function quoteForm() {
    var form = document.getElementById('quoteForm');
    if (!form) return;
    var msg = document.getElementById('formMsg');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name, email = form.email;
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      name.classList.toggle('invalid', !name.value.trim());
      email.classList.toggle('invalid', !emailOk);
      if (!name.value.trim() || !emailOk) {
        msg.style.color = '#ff8a8a';
        msg.textContent = 'Please add your name and a valid email.';
        return;
      }
      msg.style.color = '';
      msg.textContent = 'Thanks, ' + name.value.trim().split(' ')[0] + '! Your instant quote is on its way. ✨';
      form.reset();
    });
    ['name', 'email'].forEach(function (id) {
      form[id].addEventListener('input', function () { this.classList.remove('invalid'); });
    });
  })();

  /* ---------- Footer year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

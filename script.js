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
     360° SOFA VIEWER  (procedurally drawn — no image assets)
     Renders a sofa from any yaw angle onto a canvas. Drag to
     rotate, auto-spins otherwise, and is wired to a slider.
     ============================================================ */
  (function viewer360() {
    var canvas = document.getElementById('spinCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    var range = document.getElementById('spinRange');
    var label = document.getElementById('angleLabel');
    var toggleBtn = document.getElementById('spinToggle');
    var viewer = document.getElementById('viewer360');

    var angle = 0;          // degrees 0..359
    var auto = !reduceMotion;
    var dragging = false, lastX = 0;

    function project(p, yaw) {
      // rotate around Y axis, simple perspective
      var c = Math.cos(yaw), s = Math.sin(yaw);
      var x = p.x * c - p.z * s;
      var z = p.x * s + p.z * c;
      var persp = 320 / (320 + z);
      return { x: W / 2 + x * persp, y: H / 2 + (p.y - z * 0.18) * persp, z: z, s: persp };
    }

    // A box helper returns its 8 projected corners
    function box(cx, cy, cz, w, h, d, yaw) {
      var pts = [], hx = w / 2, hy = h / 2, hz = d / 2;
      var corners = [
        [-hx,-hy,-hz],[hx,-hy,-hz],[hx,hy,-hz],[-hx,hy,-hz],
        [-hx,-hy, hz],[hx,-hy, hz],[hx,hy, hz],[-hx,hy, hz]
      ];
      for (var i = 0; i < 8; i++) {
        pts.push(project({ x: cx + corners[i][0], y: cy + corners[i][1], z: cz + corners[i][2] }, yaw));
      }
      return pts;
    }

    function facePath(p, a, b, c, d) {
      ctx.beginPath();
      ctx.moveTo(p[a].x, p[a].y); ctx.lineTo(p[b].x, p[b].y);
      ctx.lineTo(p[c].x, p[c].y); ctx.lineTo(p[d].x, p[d].y);
      ctx.closePath();
    }

    function avgZ(p) { var z = 0; for (var i = 0; i < p.length; i++) z += p[i].z; return z / p.length; }

    function drawBox(cx, cy, cz, w, h, d, yaw, base) {
      var p = box(cx, cy, cz, w, h, d, yaw);
      // faces: [indices, shade]
      var faces = [
        { i: [0,1,2,3], sh: 0.72 }, // back
        { i: [4,5,6,7], sh: 1.00 }, // front
        { i: [0,4,7,3], sh: 0.60 }, // left
        { i: [1,5,6,2], sh: 0.60 }, // right
        { i: [3,2,6,7], sh: 0.85 }, // bottom
        { i: [0,1,5,4], sh: 1.15 }  // top
      ].map(function (f) {
        var fp = f.i.map(function (ix) { return p[ix]; });
        return { fp: fp, sh: f.sh, z: avgZ(fp) };
      });
      faces.sort(function (a, b) { return b.z - a.z; }); // painter's algo
      faces.forEach(function (f) {
        facePath(f.fp, 0, 1, 2, 3);
        ctx.fillStyle = shade(base, f.sh);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.10)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    // shade an rgb base colour by a lighting factor k
    function shade(base, k) {
      var r = Math.min(255, base[0] * k);
      var g = Math.min(255, base[1] * k);
      var b = Math.min(255, base[2] * k);
      return 'rgb(' + (r|0) + ',' + (g|0) + ',' + (b|0) + ')';
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var yaw = angle * Math.PI / 180;

      // floor shadow
      ctx.save();
      var sh = ctx.createRadialGradient(W/2, H*0.78, 10, W/2, H*0.78, 200);
      sh.addColorStop(0, 'rgba(0,0,0,0.45)');
      sh.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sh;
      ctx.beginPath();
      ctx.ellipse(W/2, H*0.80, 190, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      var mint = [62, 201, 167];
      var mintLight = [110, 224, 195];

      // --- assemble sofa from boxes, drawn back-to-front by depth ---
      var parts = [];
      // base body
      parts.push({ z: 0, fn: function () { drawBox(0, 20, 0, 200, 46, 80, yaw, mint); } });
      // seat cushions (2)
      parts.push({ z: -1, fn: function () { drawBox(-52, -6, 6, 88, 26, 66, yaw, mintLight); } });
      parts.push({ z: -1, fn: function () { drawBox(52, -6, 6, 88, 26, 66, yaw, mintLight); } });
      // back rest
      parts.push({ z: 30, fn: function () { drawBox(0, -34, -30, 200, 60, 24, yaw, mint); } });
      // back cushions (2)
      parts.push({ z: 28, fn: function () { drawBox(-52, -34, -20, 86, 48, 18, yaw, mintLight); } });
      parts.push({ z: 28, fn: function () { drawBox(52, -34, -20, 86, 48, 18, yaw, mintLight); } });
      // armrests
      parts.push({ z: 0, fn: function () { drawBox(-108, -14, 4, 26, 64, 80, yaw, mintLight); } });
      parts.push({ z: 0, fn: function () { drawBox(108, -14, 4, 26, 64, 80, yaw, mintLight); } });
      // legs
      var legY = 54;
      [[-92,34],[92,34],[-92,-34],[92,-34]].forEach(function (l) {
        parts.push({ z: l[1], fn: (function(lx,lz){ return function(){ drawBox(lx, legY, lz, 12, 22, 12, yaw, [28,120,96]); }; })(l[0], l[1]) });
      });

      // sort by rotated depth of each part's anchor z so far parts draw first
      parts.forEach(function (pt) {
        var c = Math.cos(yaw), s = Math.sin(yaw);
        pt.sortZ = pt.z * c; // approx depth after yaw for anchor
      });
      // Better: compute actual projected z of anchor
      parts.forEach(function (pt) {
        var pr = project({ x: 0, y: 0, z: pt.z }, yaw);
        pt.sortZ = pr.z;
      });
      parts.sort(function (a, b) { return b.sortZ - a.sortZ; });
      parts.forEach(function (pt) { pt.fn(); });

      // sparkle overlay
      drawSparkle();
    }

    var sparkT = 0;
    function drawSparkle() {
      if (reduceMotion) return;
      sparkT += 0.02;
      var pts = [[0.28,0.30],[0.7,0.26],[0.5,0.6],[0.8,0.62]];
      pts.forEach(function (p, i) {
        var a = 0.4 + 0.6 * Math.abs(Math.sin(sparkT + i));
        var x = p[0] * W, y = p[1] * H, r = 2 + 2 * Math.abs(Math.sin(sparkT + i));
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = '#eafff8';
        ctx.beginPath();
        for (var k = 0; k < 4; k++) {
          var ang = k * Math.PI / 2;
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(ang) * r * 2, y + Math.sin(ang) * r * 2);
          ctx.lineTo(x + Math.cos(ang + 0.3) * r, y + Math.sin(ang + 0.3) * r);
        }
        ctx.fill();
        ctx.restore();
      });
    }

    function setAngle(a) {
      angle = ((a % 360) + 360) % 360;
      range.value = Math.round(angle);
      label.textContent = Math.round(angle) + '°';
    }

    function loop() {
      if (auto && !dragging) setAngle(angle + 0.4);
      draw();
      requestAnimationFrame(loop);
    }

    // Drag to rotate
    viewer.addEventListener('pointerdown', function (e) {
      dragging = true; lastX = e.clientX;
      viewer.setPointerCapture(e.pointerId);
    });
    viewer.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX; lastX = e.clientX;
      setAngle(angle + dx * 0.6);
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      viewer.addEventListener(ev, function () { dragging = false; });
    });

    range.addEventListener('input', function () {
      auto = false; toggleBtn.textContent = '▶';
      setAngle(parseInt(range.value, 10));
    });

    toggleBtn.addEventListener('click', function () {
      auto = !auto;
      toggleBtn.textContent = auto ? '⏸' : '▶';
    });
    toggleBtn.textContent = auto ? '⏸' : '▶';

    setAngle(0);
    draw();
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
      before.style.width = pct + '%';
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

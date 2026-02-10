/* =========================
   Bouquet Logic (unchanged)
   ========================= */
function addFlower(emoji, msg) {
  if ($('#bouquet-display').children().length < 8) {
    $('#bouquet-display').append($('<span>' + emoji + '</span>').hide().fadeIn());
    $('#flower-msg').text(msg).css('color', '#ff4d6d');
  } else {
    $('#flower-msg').text("The bouquet is full of love!");
  }
}

/* =========================
   Love Meter + Formspree
   (unchanged functionality)
   ========================= */
const FORM_ENDPOINT = "https://formspree.io/f/xykdzqaj";

async function sendToFormspree(payload) {
  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

async function sendToFormspreeFormEncoded(payload) {
  try {
    const formData = new FormData();
    Object.entries(payload).forEach(([k, v]) => formData.append(k, String(v)));
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Accept": "application/json" },
      body: formData,
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

function makeScore(name1, name2) {
  const s = (name1 + "|" + name2).toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return 97 + (hash % 4); // 97–100
}

function runMeter() {
  const n1 = (document.getElementById("herName").value || "").trim();
  const n2 = (document.getElementById("hisName").value || "").trim();
  const resEl = document.getElementById("meter-result");
  const statusEl = document.getElementById("meter-status");
  const btn = document.getElementById("meter-btn");

  if (!n1 || !n2) {
    statusEl.textContent = "Please enter both names 💗";
    return;
  }

  statusEl.textContent = "";
  btn.disabled = true;
  btn.style.opacity = "0.7";
  resEl.innerHTML = `<span class="meter-heart">❤️</span>`;

  setTimeout(async () => {
    const score = makeScore(n1, n2);
    resEl.textContent = score + "%";

    if (typeof window.confettiBurst === "function") window.confettiBurst();
    else {
      // small fallback confetti
      for (let i = 0; i < 30; i++) {
        const c = $('<div style="position:fixed; width:10px; height:10px; z-index:999"></div>');
        c.css({ top: '60%', left: '50%', background: ['#ff4d6d', '#d4af37', '#fff'][Math.floor(Math.random()*3)] });
        $('body').append(c);
        c.animate({ top: Math.random()*100+'%', left: Math.random()*100+'%', opacity: 0 }, 1600, function(){ $(this).remove(); });
      }
    }

    const payload = { herName: n1, hisName: n2, score: score, timestamp: new Date().toISOString() };
    let ok = await sendToFormspree(payload);
    if (!ok) ok = await sendToFormspreeFormEncoded(payload);

    statusEl.textContent = ok ? "✨" : "";
    btn.disabled = false;
    btn.style.opacity = "1";
  }, 1200);
}

/* =========================
   Main Page Logic
   ========================= */
$(document).ready(function () {
  /* --- Background Canvas Animation --- */
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');

  function resizeBg() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeBg();
  $(window).on('resize', resizeBg);

  let particles = [];
  for (let i = 0; i < 110; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2,
    });
  }

  function drawBg() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    for (let p of particles) {
      ctx.moveTo(p.x, p.y);
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
    }
    ctx.fill();

    for (let p of particles) {
      p.y -= 0.5;
      if (p.y < 0) p.y = canvas.height;
    }
  }
  setInterval(drawBg, 33);

  /* --- Scroll Progress --- */
  $(window).on('scroll', function () {
    let s = $(window).scrollTop(),
      d = $(document).height() - $(window).height();
    $('#progress').css('width', (s / d * 100) + '%');
  }).trigger('scroll');

  /* --- Confetti (shared) --- */
  function confettiBurst() {
    for (let i = 0; i < 50; i++) {
      const c = $('<div style="position:fixed; width:10px; height:10px; z-index:999"></div>');
      c.css({
        top: '50%',
        left: '50%',
        borderRadius: '3px',
        background: ['#ff4d6d', '#d4af37', '#fff'][Math.floor(Math.random() * 3)]
      });
      $('body').append(c);
      c.animate(
        { top: Math.random() * 100 + '%', left: Math.random() * 100 + '%', opacity: 0 },
        2000,
        function () { $(this).remove(); }
      );
    }
  }
  window.confettiBurst = confettiBurst; // allow reuse from runMeter

  /* --- Candle Blow --- */
  $('#blow-btn').click(function () {
    $('.flame').fadeOut(1000);
    $(this).text("Wish Sent! ✨").prop('disabled', true);
    confettiBurst();
  });

  /* --- Gallery modal --- */
  const $modal = $('#img-modal');
  const $modalImg = $('#modal-img');

  $('.gallery-item img').on('click', function () {
    $modalImg.attr('src', $(this).attr('src'));
    $modal.fadeIn(150).css('display', 'flex');
    $modal.attr('aria-hidden', 'false');
  });

  function closeModal() {
    $modal.fadeOut(150, function () {
      $modal.css('display', 'none');
      $modalImg.attr('src', '');
      $modal.attr('aria-hidden', 'true');
    });
  }

  $('#img-modal .close').on('click', closeModal);
  $('#img-modal').on('click', function (e) {
    if (e.target === this) closeModal();
  });

  $(document).on('keydown', function (e) {
    if (e.key === 'Escape' && $modal.is(':visible')) closeModal();
  });

  /* --- Music --- */
  const audio = document.getElementById('bg-music');
  const $btn = $('#music-btn');
  const $tip = $('#music-tooltip');

  let tipShown = false;
  function showTipOnce() {
    if (tipShown) return;
    tipShown = true;
    $tip.addClass('show');
    setTimeout(() => $tip.removeClass('show'), 2800);
  }
  setTimeout(showTipOnce, 800);

  function setMusicUI(isPlaying) {
    $btn.html(isPlaying ? '❚❚ <span class="dot"></span>' : '♪ <span class="dot"></span>');
    $btn.find('.dot').css('background', isPlaying ? 'var(--primary-gold)' : 'var(--romantic-pink)');
  }

  async function toggleMusic() {
    try {
      if (audio.paused) {
        await audio.play();
        setMusicUI(true);
      } else {
        audio.pause();
        setMusicUI(false);
      }
    } catch (e) {
      showTipOnce();
    }
  }
  $btn.on('click', toggleMusic);

  /* =========================
     Scratch Card (MOBILE FIX)
     ========================= */
  const sCanvas = document.getElementById('scratch-canvas');
  const sCtx = sCanvas.getContext('2d');

  function resizeScratchCanvas() {
    const box = document.querySelector('.scratch-container');
    const w = box.clientWidth;
    const h = box.clientHeight;

    sCanvas.width = w;
    sCanvas.height = h;

    sCtx.globalCompositeOperation = 'source-over';
    sCtx.fillStyle = '#888';
    sCtx.fillRect(0, 0, w, h);
    sCtx.font = "20px Arial";
    sCtx.fillStyle = "#fff";
    sCtx.fillText("Scratch Here!", Math.max(18, w * 0.28), h / 2);
  }

  resizeScratchCanvas();
  $(window).on('resize', resizeScratchCanvas);

  let isScratching = false;

  function getPos(e) {
    const rect = sCanvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function scratchAt(x, y) {
    sCtx.globalCompositeOperation = 'destination-out';
    sCtx.beginPath();
    sCtx.arc(x, y, 22, 0, Math.PI * 2); // bigger radius for mobile
    sCtx.fill();
  }

  // Mouse
  sCanvas.addEventListener('mousedown', () => { isScratching = true; });
  window.addEventListener('mouseup', () => { isScratching = false; });
  sCanvas.addEventListener('mousemove', (e) => {
    if (!isScratching) return;
    const { x, y } = getPos(e);
    scratchAt(x, y);
  });

  // Touch (IMPORTANT: passive:false + preventDefault)
  sCanvas.addEventListener('touchstart', (e) => {
    isScratching = true;
    e.preventDefault();
    const { x, y } = getPos(e);
    scratchAt(x, y);
  }, { passive: false });

  sCanvas.addEventListener('touchmove', (e) => {
    if (!isScratching) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    scratchAt(x, y);
  }, { passive: false });

  sCanvas.addEventListener('touchend', () => { isScratching = false; });
  sCanvas.addEventListener('touchcancel', () => { isScratching = false; });

  /* --- Love meter bindings --- */
  $("#meter-btn").on("click", runMeter);
  $("#herName, #hisName").on("keydown", function (e) {
    if (e.key === "Enter") runMeter();
  });




/* =========================
   Secret Quest Mini Game 🎮
   ========================= */
const found = new Set();
const totalNeeded = 4;

function updateQuestUI(){
  $('#quest-count').text(found.size);
}

function openQuestModal(){
  const $m = $('#quest-modal');
  $m.fadeIn(150).css('display','flex').attr('aria-hidden','false');

  // celebrate
  if (typeof window.confettiBurst === "function") window.confettiBurst();
  else {
    for (let i = 0; i < 30; i++) {
      const c = $('<div style="position:fixed; width:10px; height:10px; z-index:999"></div>');
      c.css({ top: '50%', left: '50%', background: ['#ff4d6d', '#d4af37', '#fff'][Math.floor(Math.random()*3)] });
      $('body').append(c);
      c.animate({ top: Math.random()*100+'%', left: Math.random()*100+'%', opacity: 0 }, 1600, function(){ $(this).remove(); });
    }
  }
}

function closeQuestModal(){
  const $m = $('#quest-modal');
  $m.fadeOut(150, function(){
    $m.css('display','none').attr('aria-hidden','true');
  });
}

$(document).on('click touchstart', '.quest-token', function(e){
  if (e.type === 'touchstart') e.preventDefault();

  const token = $(this).data('token');
  if (!token || found.has(token)) return;

  found.add(token);
  $(this).addClass('found');

  updateQuestUI();

  // tiny feedback
  $(this).text('✅');

  if (found.size >= totalNeeded) {
    setTimeout(openQuestModal, 300);
  }
});

$('#quest-modal').on('click', function(e){
  if (e.target === this) closeQuestModal();
});
$('#quest-modal .quest-close').on('click', closeQuestModal);

updateQuestUI();



// Mobile hint toggle
const $questBadge = $('#quest-badge');

$questBadge.on('click touchstart', function(e){
  if (e.type === 'touchstart') e.preventDefault();
  $(this).toggleClass('show-hint');
  if ($(this).hasClass('show-hint')) {
    setTimeout(() => $(this).removeClass('show-hint'), 3000);
  }
});

});

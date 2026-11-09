// ---------- Revelar ao rolar ----------
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('#trabalhos, #sobre, .metrics .wrap, #contato').forEach((el) => {
    el.classList.add('reveal');
    io.observe(el);
  });
}

// ---------- Slider antes & depois ----------
const ba = document.getElementById('ba');
if (ba) {
  const range = ba.querySelector('.ba__range');
  const setPos = () => ba.style.setProperty('--pos', range.value + '%');
  range.addEventListener('input', setPos);
  setPos();
  // dica: ao entrar na tela, o slider balança uma vez para mostrar que dá para arrastar
  let touched = false;
  range.addEventListener('pointerdown', () => { touched = true; ba.classList.add('used'); });
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const hint = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      hint.disconnect();
      const t0 = performance.now();
      const step = (t) => {
        if (touched) return;
        const k = Math.min((t - t0) / 1800, 1);
        range.value = 50 + Math.sin(k * Math.PI * 2) * 22;
        setPos();
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    hint.observe(ba);
  }
}

// ---------- Barra de progresso, menu e parallax ----------
const root = document.documentElement;
const bar = document.querySelector('.bar');
let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const max = root.scrollHeight - innerHeight;
    root.style.setProperty('--p', max > 0 ? scrollY / max : 0);
    root.style.setProperty('--sy', scrollY);
    bar.classList.toggle('bar--on', scrollY > 24);
    ticking = false;
  });
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------- Métricas do Instagram ----------
// Troque pela URL da sua função se o front-end estiver em outro domínio
const API_URL = '/api/instagram';
const REFRESH_MS = 5 * 60 * 1000;

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

const formatters = {
  followers: (v) => compact.format(v),
  reach: (v) => compact.format(v),
  posts: (v) => new Intl.NumberFormat('pt-BR').format(v),
  engagement: (v) => percent.format(v), // v é uma fração (0.043 = 4,3%)
};

async function loadMetrics() {
  const status = document.getElementById('ig-status');
  try {
    const res = await fetch(API_URL, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    document.querySelectorAll('[data-metric]').forEach((el) => {
      const key = el.dataset.metric;
      if (data[key] != null) el.textContent = formatters[key](data[key]);
    });
    status.textContent = 'Ao vivo · Instagram';
  } catch (err) {
    console.error('Instagram:', err);
    status.textContent = 'Instagram · indisponível agora';
  }
}

loadMetrics();
setInterval(loadMetrics, REFRESH_MS);


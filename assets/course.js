/* Shared helpers for lecture reports (vanilla JS, works from file://, no network). */
(function(){
  const $ = (s, r=document) => r.querySelector(s), $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const C = { get: n => css('--'+n) };
  window.CourseUI = { $, $$, css, color: n => css('--'+n) };

  /* ---------- math ---------- */
  function renderMath(root){
    if (!window.renderMathInElement) return;
    renderMathInElement(root || document.body, { delimiters:[
      {left:'$$', right:'$$', display:true}, {left:'\\[', right:'\\]', display:true},
      {left:'$', right:'$', display:false}, {left:'\\(', right:'\\)', display:false}], throwOnError:false });
  }
  window.CourseUI.renderMath = renderMath;

  /* ---------- plotly theme ---------- */
  const redraws = [];
  window.CourseUI.layout = function(extra){
    const base = { paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'rgba(0,0,0,0)', font:{color:css('--text'), family:'system-ui,sans-serif', size:13},
      margin:{l:52,r:18,t:30,b:48}, legend:{orientation:'h', y:-0.22}, colorway:[css('--c1'),css('--c2'),css('--c3'),css('--c4'),css('--c5'),css('--c6')],
      xaxis:{gridcolor:css('--line'), zerolinecolor:css('--line')}, yaxis:{gridcolor:css('--line'), zerolinecolor:css('--line')} };
    const m = JSON.parse(JSON.stringify(base));
    for (const k in (extra||{})) { if (typeof extra[k]==='object' && !Array.isArray(extra[k]) && m[k]) Object.assign(m[k], extra[k]); else m[k]=extra[k]; }
    return m;
  };
  /* plot(id, fn): fn() must return {data, layout}; re-run on theme change */
  window.CourseUI.plot = function(id, fn){
    const draw = () => { const o = fn(); Plotly.react(id, o.data, window.CourseUI.layout(o.layout), {displayModeBar:false, responsive:true}); };
    redraws.push(draw); draw(); return draw;
  };
  const redrawAll = () => redraws.forEach(f => { try{f()}catch(e){} });

  /* ---------- theme ---------- */
  function applyTheme(t){ if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); setTimeout(redrawAll, 30); }
  try { const s = localStorage.getItem('course-theme'); if (s) document.documentElement.setAttribute('data-theme', s); } catch(e){}
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-theme-toggle]'); if (!b) return;
    const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light');
    const next = cur === 'dark' ? 'light' : 'dark'; applyTheme(next); try{ localStorage.setItem('course-theme', next);}catch(e){}
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => setTimeout(redrawAll, 30));

  /* ---------- reveal buttons (click, works with touch) ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-reveal]'); if (!b) return;
    const body = document.getElementById(b.dataset.reveal) || b.nextElementSibling;
    const open = body.classList.toggle('open'); b.setAttribute('aria-expanded', open);
    if (b.dataset.show) b.textContent = open ? b.dataset.hide : b.dataset.show;
  });

  /* ---------- quiz ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('.quiz .opts button'); if (!b) return;
    const q = b.closest('.q'); if (q.dataset.done) return; q.dataset.done = 1;
    $$('.opts button', q).forEach(x => { if (x.dataset.ok !== undefined) x.classList.add('right'); });
    if (b.dataset.ok === undefined) b.classList.add('wrong');
    $('.why', q).classList.add('open'); updateScore();
  });
  function updateScore(){
    const qs = $$('.quiz .q'); const done = qs.filter(q => q.dataset.done).length;
    const ok = qs.filter(q => q.dataset.done && $('.opts button.wrong', q) === null).length;
    const s = $('#quiz-score'); if (s) s.textContent = `${ok} / ${qs.length} correct (${done} answered)`;
  }

  /* ---------- glossary filter ---------- */
  document.addEventListener('input', e => {
    if (!e.target.matches('#gloss-filter')) return; const v = e.target.value.toLowerCase();
    $$('.glossary .term').forEach(t => { t.style.display = t.textContent.toLowerCase().includes(v) ? '' : 'none'; });
  });

  /* ---------- toc scroll-spy ---------- */
  window.addEventListener('DOMContentLoaded', () => {
    const links = $$('nav.toc a[href^="#"]'); const secs = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
    const spy = () => { let cur = secs[0]; secs.forEach(s => { if (s.getBoundingClientRect().top < 140) cur = s; });
      links.forEach(a => a.classList.toggle('active', cur && a.getAttribute('href') === '#'+cur.id)); };
    addEventListener('scroll', spy, {passive:true}); spy();
  });
})();

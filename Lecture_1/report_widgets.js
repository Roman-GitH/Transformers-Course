/* Interactive widgets for the Lecture 1 report. Reads window.L1_RESULTS (outputs/results.js). Vanilla JS + Plotly. */
(function(){
'use strict';
const R = window.L1_RESULTS, U = window.CourseUI, $ = U.$, $$ = U.$$;
if (!R) { document.body.insertAdjacentHTML('afterbegin', '<div class="callout warn" style="margin:12px"><b>outputs/results.js not found.</b> Run <code>python3 mini_model.py</code> in Lecture_1 first.</div>'); return; }
const col = n => U.color(n);
const fmt = (x, d=3) => (Math.abs(x) < 1e-3 && x !== 0 ? x.toExponential(1) : x.toFixed(d));
const softmax = r => { const m = Math.max(...r), e = r.map(v => Math.exp(v - m)), s = e.reduce((a,b)=>a+b,0); return e.map(v => v/s); };
const matmul = (A,B) => A.map(r => B[0].map((_,j) => r.reduce((s,v,k) => s + v*B[k][j], 0)));
const T = M => M[0].map((_,j) => M.map(r => r[j]));
const groupColor = g => ({soft:col('c1'), books:col('c2'), water:col('c3'), money:col('c4'), func:col('c6'), ambiguous:col('c5'), special:col('c6')})[g];
const groupName = {soft:'soft toys', books:'books', water:'water', money:'money', func:'function words', ambiguous:'ambiguous (bank)', special:'<bos>/<eos>'};
const btnGroup = (box, items, onPick, cur) => { box.innerHTML = ''; items.forEach((it,i) => { const b = document.createElement('button'); b.textContent = it; if (i===cur) b.className = 'on'; b.addEventListener('click', () => onPick(i)); box.appendChild(b); }); };

/* ============================================================ B0 metrics */
(function(){
  let mode = 'maj'; const N = 10000;
  const pFrom = v => 0.001 * Math.pow(500, v/100);
  const n0 = x => Math.abs(x-Math.round(x)) < 0.05 ? Math.round(x).toLocaleString('en-US') : x.toFixed(1);
  const pc = x => (x*100).toFixed(1)+' %';
  function calc(){
    const p = pFrom(+$('#m-p').value), P = p*N, Neg = N-P;
    const rec = mode==='maj' ? 0 : (+$('#m-rc').value)/100, fpr = mode==='maj' ? 0 : (+$('#m-fpr').value)/100;
    const tp = rec*P, fn = P-tp, fp = fpr*Neg, tn = Neg-fp;
    const acc = (tp+tn)/N, pr = tp+fp>0 ? tp/(tp+fp) : 0, rc = P>0 ? tp/P : 0, f1 = pr+rc>0 ? 2*pr*rc/(pr+rc) : 0;
    return {p, P, Neg, rec, fpr, tp, fp, fn, tn, acc, pr, rc, f1};
  }
  function render(){
    const c = calc(), det = mode==='det';
    $('#m-rc').disabled = $('#m-fpr').disabled = !det;
    $('#m-p-out').textContent = (c.p*100).toFixed(c.p<0.01?2:1) + ' %  (P = ' + n0(c.P) + ' positives, ' + n0(c.Neg) + ' negatives)';
    $('#m-rc-out').textContent = det ? (c.rec*100).toFixed(0)+' %' : '0 % (fixed: it never says positive)';
    $('#m-fpr-out').textContent = det ? (c.fpr*100).toFixed(0)+' %' : '0 % (fixed)';
    $('#m-calc').innerHTML = `<table class="cm tbl-small"><tr><th></th><th>predicted positive</th><th>predicted negative</th><th>total</th></tr>
      <tr><th>actually positive</th><td class="tp"><b>TP</b> = recall × P = ${(c.rec*100).toFixed(0)} % × ${n0(c.P)} = <b>${n0(c.tp)}</b></td><td class="fn"><b>FN</b> = P − TP = <b>${n0(c.fn)}</b></td><td>P = π·N = ${n0(c.P)}</td></tr>
      <tr><th>actually negative</th><td class="fp"><b>FP</b> = false-alarm rate × (N−P) = ${(c.fpr*100).toFixed(0)} % × ${n0(c.Neg)} = <b>${n0(c.fp)}</b></td><td class="tn"><b>TN</b> = (N−P) − FP = <b>${n0(c.tn)}</b></td><td>N−P = ${n0(c.Neg)}</td></tr></table>
      <ul style="font-size:.9rem"><li>accuracy = (TP+TN)/N = (${n0(c.tp)}+${n0(c.tn)})/${N.toLocaleString('en-US')} = <b>${pc(c.acc)}</b></li>
      <li>precision = TP/(TP+FP) = ${n0(c.tp)}/${n0(c.tp+c.fp)} = <b>${c.tp+c.fp>0 ? pc(c.pr) : 'undefined (0/0), shown as 0'}</b> &nbsp;·&nbsp; recall = TP/(TP+FN) = ${n0(c.tp)}/${n0(c.P)} = <b>${pc(c.rc)}</b> &nbsp;·&nbsp; F₁ = <b>${pc(c.f1)}</b></li>
      <li>for comparison, “always negative” would score <b>${pc(1-c.p)}</b> accuracy (= 1 − π).</li></ul>`;
    $('#m-grid').innerHTML = [['accuracy',c.acc],['precision',c.pr],['recall',c.rc],['F1',c.f1]].map(([n,v]) => `<div class="metric"><b>${(v*100).toFixed(1)}%</b><span>${n}</span></div>`).join('');
    $('#m-note').textContent = mode==='maj'
      ? `“Always negative” is right on ${(c.acc*100).toFixed(1)} % of cases, yet it finds none of the ${Math.round(c.P)} positives: recall = 0, F1 = 0.`
      : `The detector catches ${(c.rc*100).toFixed(0)} % of positives, but with ${(c.p*100).toFixed(1)} % prevalence its ${Math.round(c.fp)} false alarms against ${Math.round(c.tp)} true catches give precision ${(c.pr*100).toFixed(0)} %. Compare its accuracy (${(c.acc*100).toFixed(1)} %) with the ${((1-c.p)*100).toFixed(1)} % of the useless “always negative”. Tip: set the prevalence to about 1 % and watch the useless model win on accuracy.`;
    U.plot('m-plot', () => ({ data:[{type:'bar', x:['accuracy','precision','recall','F1'], y:[c.acc,c.pr,c.rc,c.f1], marker:{color:[col('c6'),col('c2'),col('c3'),col('c1')]}, text:[c.acc,c.pr,c.rc,c.f1].map(v => (v*100).toFixed(1)+'%'), textposition:'outside'}],
      layout:{yaxis:{range:[0,1.15], title:'score'}, margin:{t:10}} }));
  }
  ['#m-p','#m-rc','#m-fpr'].forEach(id => $(id).addEventListener('input', render));
  $('#m-maj').addEventListener('click', () => { mode='maj'; $('#m-maj').className='on'; $('#m-det').className=''; render(); });
  $('#m-det').addEventListener('click', () => { mode='det'; $('#m-det').className='on'; $('#m-maj').className=''; render(); });
  render();
})();

/* ============================================================ B1 tokenizer */
(function(){
  const Tk = R.tokenization, merges = Tk.merges, vocabW = new Set(Object.keys(Tk.train_words));
  $('#tk-nmerge').textContent = merges.length;
  function bpe(word){
    let t = word.split('').concat(['_']);
    for (const [a,b] of merges) { let i = 0; while (i < t.length-1) { if (t[i]===a && t[i+1]===b) t.splice(i,2,a+b); else i++; } }
    return t;
  }
  const chips = (arr, unkFn) => arr.map(t => `<span class="tok ${unkFn && unkFn(t) ? 'unk' : ''}">${t.replace(/</g,'&lt;')}</span>`).join('');
  function run(){
    const words = $('#tk-in').value.toLowerCase().replace(/[^a-z\s]/g,' ').split(/\s+/).filter(Boolean);
    const w = words.map(x => vocabW.has(x) ? x : '<unk>'), b = words.flatMap(bpe), c = words.flatMap(x => x.split(''));
    $('#tk-word').innerHTML = chips(w, t => t==='<unk>') || '—'; $('#tk-bpe').innerHTML = chips(b) || '—'; $('#tk-char').innerHTML = chips(c) || '—';
    const unk = w.filter(x => x==='<unk>').length, n = Math.max(words.length,1);
    $('#tk-stats').innerHTML = [['word tokens', w.length], ['BPE tokens', b.length], ['char tokens', c.length], ['word-level OOV', unk + ' / ' + words.length]]
      .map(([n_,v]) => `<div class="metric"><b>${v}</b><span>${n_}</span></div>`).join('');
  }
  $('#tk-in').addEventListener('input', run);
  $$('#w-token [data-preset]').forEach(b => b.addEventListener('click', () => { $('#tk-in').value = b.dataset.preset; run(); }));
  run();
})();

/* ============================================================ B2 cosine */
(function(){
  const a = $('#c-a'), b = $('#c-b');
  function draw(){
    const A = +a.value, B = +b.value; $('#c-a-out').textContent = A; $('#c-b-out').textContent = B;
    const rad = d => d*Math.PI/180, va = [Math.cos(rad(A)), Math.sin(rad(A))], vb = [Math.cos(rad(B)), Math.sin(rad(B))];
    const cs = va[0]*vb[0] + va[1]*vb[1];
    U.plot('c-plot', () => ({ data:[
      {x:[0,va[0]], y:[0,va[1]], mode:'lines+markers+text', text:['','a'], textposition:'top right', line:{width:4,color:col('c1')}, marker:{size:[0,10]}, name:'a', showlegend:false},
      {x:[0,vb[0]], y:[0,vb[1]], mode:'lines+markers+text', text:['','b'], textposition:'top right', line:{width:4,color:col('c2')}, marker:{size:[0,10]}, name:'b', showlegend:false}],
      layout:{xaxis:{range:[-1.3,1.3],zeroline:true}, yaxis:{range:[-1.3,1.3],scaleanchor:'x'}, margin:{t:10}, shapes:[{type:'circle',x0:-1,x1:1,y0:-1,y1:1,line:{color:col('line'),dash:'dot'}}]} }));
    const d = Math.abs(((A-B+540)%360)-180);
    $('#c-read').innerHTML = `Angle between them: <b>${Math.round(d)}°</b> → cosine = <b>${cs.toFixed(3)}</b>. ` + (Math.abs(cs)<0.02 ? 'Orthogonal: “unrelated” – exactly what every pair of one-hot vectors looks like.' : cs>0.9 ? 'Nearly the same direction: very similar.' : cs<-0.9 ? 'Opposite directions.' : '');
  }
  a.addEventListener('input', draw); b.addEventListener('input', draw);
  $('#c-onehot').addEventListener('click', () => { a.value=0; b.value=90; draw(); });
  $('#c-same').addEventListener('click', () => { a.value=30; b.value=30; draw(); });
  $('#c-opp').addEventListener('click', () => { a.value=30; b.value=-150; draw(); });
  draw();
})();

/* ============================================================ B2 embeddings */
(function(){
  const Em = R.embeddings, V = Em.vocab.length;
  const mean = [0,1].map(j => Em.E.reduce((s,r) => s + r[j], 0)/V), E = Em.E.map(r => [r[0]-mean[0], r[1]-mean[1]]);
  const gOrder = ['special','func','soft','books','water','money','ambiguous'];
  const order = gOrder.flatMap(g => Em.vocab.map((w,i) => i).filter(i => Em.group[i]===g));
  const sel = $('#e-word'); Em.vocab.forEach((w,i) => { const o = document.createElement('option'); o.value = i; o.textContent = w; sel.appendChild(o); });
  sel.value = Em.vocab.indexOf('bank');
  $('#e-legend').innerHTML = gOrder.filter(g => g!=='special').map(g => `<i style="background:${groupColor(g)}"></i>${groupName[g]}`).join('');
  let view = 'sc';
  const cosine = (i,j) => { const a=E[i], b=E[j]; return (a[0]*b[0]+a[1]*b[1])/(Math.hypot(...a)*Math.hypot(...b)+1e-12); };
  function draw(){
    const w = +sel.value;
    const nn = Em.vocab.map((_,j) => [j, cosine(w,j)]).filter(x => x[0]!==w).sort((x,y) => y[1]-x[1]).slice(0,5);
    $('#e-read').innerHTML = `Nearest neighbours of <b>${Em.vocab[w]}</b> (cosine, centered): ` + nn.map(([j,c]) => `<span class="chip t">${Em.vocab[j].replace(/</g,'&lt;')} ${c.toFixed(2)}</span>`).join('') +
      `<br>Within-topic cosine ≈ <b>${Em.within_cos.toFixed(2)}</b>, between topics ≈ <b>${Em.between_cos.toFixed(2)}</b>; one-hot vectors: 0 between all pairs. Proxy-task perplexity <b>${Em.perplexity.toFixed(1)}</b> vs ${Em.uniform_perplexity} for a uniform guess.`;
    U.plot('e-plot', () => {
      if (view === 'sc') {
        const near = new Set([w, ...nn.map(x => x[0])]);
        const traces = gOrder.map(g => { const ix = Em.vocab.map((_,i) => i).filter(i => Em.group[i]===g);
          return {type:'scatter', mode:'markers+text', name:groupName[g], x:ix.map(i => E[i][0]), y:ix.map(i => E[i][1]), text:ix.map(i => near.has(i) ? Em.vocab[i] : ''), textposition:'top center', textfont:{size:11},
            marker:{size:ix.map(i => i===w?18:10), color:groupColor(g), line:{width:ix.map(i => i===w?3:0), color:col('text')}}, customdata:ix.map(i => Em.vocab[i]), hovertemplate:'%{customdata}<extra>'+groupName[g]+'</extra>'}; });
        const ann = gOrder.filter(g => g!=='special').map(g => { const ix = Em.vocab.map((_,i) => i).filter(i => Em.group[i]===g); if (ix.length < 2) return null;
          return {x:ix.reduce((s,i)=>s+E[i][0],0)/ix.length, y:ix.reduce((s,i)=>s+E[i][1],0)/ix.length, text:'<b>'+groupName[g]+'</b>', showarrow:true, arrowcolor:groupColor(g), ax:30, ay:-30, font:{size:12, color:groupColor(g)}}; }).filter(Boolean);
        return {data:traces, layout:{xaxis:{title:'embedding dim 1', zeroline:true}, yaxis:{title:'embedding dim 2'}, showlegend:false, annotations:ann, margin:{t:10}}};
      }
      const labels = order.map(i => Em.vocab[i]);
      const z = order.map(i => order.map(j => view==='oh' ? (i===j?1:0) : Em.cos[i][j]));
      return {data:[{type:'heatmap', z, x:labels, y:labels, zmin:-1, zmax:1, colorscale:'RdBu', reversescale:false, colorbar:{title:'cos'}, hovertemplate:'%{y} · %{x}: %{z:.2f}<extra></extra>'}],
        layout:{yaxis:{autorange:'reversed', tickfont:{size:9}}, xaxis:{tickfont:{size:9}, tickangle:-60}, margin:{t:10,b:80,l:70}}};
    });
  }
  const set = v => { view = v; ['sc','cos','oh'].forEach(k => $('#e-view-'+k).className = k===v?'on':''); draw(); };
  $('#e-view-sc').addEventListener('click', () => set('sc')); $('#e-view-cos').addEventListener('click', () => set('cos')); $('#e-view-oh').addEventListener('click', () => set('oh'));
  sel.addEventListener('change', draw); draw();
})();

/* ============================================================ B3 gradients */
(function(){
  const G = R.gradients, rho = $('#g-rho');
  function draw(){
    const r = rho.value/100; $('#g-rho-out').textContent = r.toFixed(2);
    const n = G.attention.length, xs = [...Array(n).keys()];
    U.plot('g-plot', () => ({ data:[
      ...Object.keys(G).filter(k => k.startsWith('rnn')).map((k,i) => ({x:xs, y:G[k], mode:'lines', name:'RNN, ρ = '+k.split('_')[2], line:{width:2.4, color:[col('c1'),col('c4'),col('c5')][i]}})),
      {x:xs, y:G.attention, mode:'lines', name:'self-attention', line:{width:3, color:col('c3')}},
      {x:xs, y:xs.map(d => Math.pow(r,d)), mode:'lines', name:'ρ^distance (ρ = '+r.toFixed(2)+')', line:{dash:'dash', color:col('c6'), width:2}}],
      layout:{yaxis:{type:'log', title:'gradient norm', tickformat:'.0e', range:[-14,1.5]}, xaxis:{title:'distance in tokens'}, legend:{orientation:'h', y:-0.3}, margin:{t:10,b:90,l:70}} }));
    const d20 = Math.pow(r,20);
    $('#g-read').innerHTML = `Measured at distance 20: RNN ρ=0.8 → <b>${fmt(G['rnn_rho_0.8'][20])}</b>, ρ=1.0 → <b>${fmt(G['rnn_rho_1.0'][20])}</b>, ρ=1.2 → <b>${fmt(G['rnn_rho_1.2'][20])}</b>, attention → <b>${fmt(G.attention[20])}</b>.<br>Idealised ρ<sup>20</sup> for your ρ = ${r.toFixed(2)}: <b>${fmt(d20)}</b>. ` +
      `Even for ρ ≥ 1 the tanh saturates (its derivative is below 1), so the real RNN still vanishes; above 1 without saturation it would explode instead.`;
  }
  rho.addEventListener('input', draw); draw();
})();

/* ============================================================ B4 attention explorer */
(function(){
  const D = R.attention_example, n = D.tokens.length;
  const state = {q: 3, pe: false, mask: false, order: [...Array(n).keys()]};
  function compute(order, pe, mask){
    const X = order.map((b,i) => D.E[b].map((v,j) => v + (pe ? D.PE[i][j] : 0)));
    const Q = matmul(X, D.Wq), K = matmul(X, D.Wk), Vv = matmul(X, D.Wv), s = 1/Math.sqrt(2);
    const A = Q.map((q,i) => softmax(K.map((k,j) => (mask && j>i) ? -1e9 : (q[0]*k[0]+q[1]*k[1])*s)));
    return {Q, K, V:Vv, A, out: matmul(A, Vv)};
  }
  function render(){
    const {order, pe, mask} = state, c = compute(order, pe, mask), toks = order.map(b => D.tokens[b]);
    const qpos = order.indexOf(state.q);
    btnGroup($('#a-tokbtns'), toks, i => { state.q = order[i]; render(); }, qpos);
    $('#a-pe').textContent = '+ positions: ' + (pe?'ON':'off'); $('#a-pe').className = pe?'on':'';
    $('#a-mask').textContent = 'causal mask: ' + (mask?'ON':'off'); $('#a-mask').className = mask?'on':'';
    U.plot('a-heat', () => ({data:[{type:'heatmap', z:c.A, x:toks.map((t,i)=>t+' '+(i+1)), y:toks.map((t,i)=>t+' '+(i+1)), zmin:0, zmax:1, colorscale:'Blues', hovertemplate:'query %{y} → key %{x}: %{z:.3f}<extra></extra>', colorbar:{title:'weight'}}],
      layout:{title:{text:'Attention weights A = softmax(QKᵀ/√d)', font:{size:13}}, yaxis:{autorange:'reversed', title:'query'}, xaxis:{title:'key (attended to)', side:'bottom'}, margin:{t:36,l:90,b:70},
        shapes:[{type:'rect', xref:'paper', x0:0, x1:1, yref:'y', y0:qpos-0.5, y1:qpos+0.5, line:{color:col('c1'), width:2.5}}]} }));
    const a = c.A[qpos];
    U.plot('a-qk', () => ({data:[
      {type:'scatter', mode:'markers+text', x:c.K.map(k=>k[0]), y:c.K.map(k=>k[1]), text:toks.map((t,j) => t+' '+a[j].toFixed(2)), textposition:'top center', name:'keys',
       marker:{size:a.map(w => 8+34*w), color:col('c2'), opacity:.75}, hovertemplate:'key of %{text}<extra></extra>'},
      {type:'scatter', mode:'lines+markers', x:[0,c.Q[qpos][0]], y:[0,c.Q[qpos][1]], line:{color:col('c1'), width:4}, marker:{size:[0,12], color:col('c1')}, name:'query', hovertemplate:'query<extra></extra>'}],
      layout:{title:{text:`Query “${D.tokens[state.q]}” (arrow) vs keys (disc size = weight)`, font:{size:13}}, xaxis:{zeroline:true, title:'dim 1'}, yaxis:{scaleanchor:'x', zeroline:true, title:'dim 2'}, showlegend:false, margin:{t:36}} }));
    // compare with Python
    let chk = '';
    const identity = order.every((b,i) => b===i);
    const key = !identity ? null : (!pe && !mask ? 'plain' : (pe && !mask ? 'pos' : (pe && mask ? 'causal' : null)));
    if (key) { const ref = D.results[key], dA = Math.max(...c.A.flatMap((r,i) => r.map((v,j) => Math.abs(v-ref.A[i][j])))), dO = Math.max(...c.out.flatMap((r,i) => r.map((v,j) => Math.abs(v-ref.out[i][j]))));
      chk = `<br><span class="${dA<2e-3&&dO<2e-3?'pass':'fail'}">${dA<2e-3&&dO<2e-3?'✓':'✗'} matches the NumPy result (max |ΔA| = ${dA.toExponential(1)}, max |Δout| = ${dO.toExponential(1)})</span>`; }
    // permutation test
    const base = compute([...Array(n).keys()], pe, mask).out; let dmax = 0;
    order.forEach((b,i) => { dmax = Math.max(dmax, Math.hypot(c.out[i][0]-base[b][0], c.out[i][1]-base[b][1])); });
    const shuffled = !identity;
    let perm = `Word order: <b>${toks.join(' ')}</b>. `;
    if (shuffled) perm += `Largest change of any token's output compared with the original order: <b>${dmax.toExponential(1)}</b> → ` + (dmax<1e-9 ? '<b>none</b>: without positions and mask the layer cannot tell the sentences apart (it is permutation-equivariant).' : 'the outputs changed – positions/mask give the layer a notion of order.');
    $('#a-read').innerHTML = `Row of “${D.tokens[state.q]}”: ` + toks.map((t,j) => `<span class="chip ${a[j]>.25?'t':''}">${t} ${a[j].toFixed(2)}</span>`).join('') + `<br>Output = Σ weight × value = [${c.out[qpos].map(v=>v.toFixed(3)).join(', ')}]. ${perm}${chk}`;
  }
  $('#a-pe').addEventListener('click', () => { state.pe = !state.pe; render(); });
  $('#a-mask').addEventListener('click', () => { state.mask = !state.mask; render(); });
  $('#a-shuf').addEventListener('click', () => { const o = state.order.slice(); for (let i=o.length-1;i>0;i--) { const j = Math.floor(Math.random()*(i+1)); [o[i],o[j]] = [o[j],o[i]]; } state.order = o; render(); });
  $('#a-reset').addEventListener('click', () => { state.order = [...Array(n).keys()]; render(); });
  render();
})();

/* ============================================================ B4 sense */
(function(){
  const S = R.task_sense; let cur = 0;
  btnGroup($('#s-btns'), S.examples.map((e,i) => `#${i+1} (${e.label?'money':'river'} bank)`), i => { cur = i; draw(); }, 0);
  function draw(){
    btnGroup($('#s-btns'), S.examples.map((e,i) => `#${i+1} (${e.label?'money':'river'} bank)`), i => { cur = i; draw(); }, cur);
    const ex = S.examples[cur], P = S.pca, lab = S.pca_labels;
    U.plot('s-pca', () => ({data:[
      ...[[0,'river context',col('c3')],[1,'money context',col('c4')]].map(([l,n,c]) => ({type:'scatter', mode:'markers', name:n, x:P.filter((_,i)=>lab[i]===l).map(p=>p[0]), y:P.filter((_,i)=>lab[i]===l).map(p=>p[1]), marker:{color:c, size:6, opacity:.7}})),
      {type:'scatter', mode:'markers+text', name:'selected sentence', x:[S.pca_examples[cur][0]], y:[S.pca_examples[cur][1]], text:['#'+(cur+1)], textposition:'top center',
         marker:{symbol:'diamond', size:17, color:col('c1'), line:{width:2.5, color:col('text')}}}],
      layout:{title:{text:`‘bank’ output vector, PCA (PC1 = ${(S.pca_var[0]*100).toFixed(0)} % of variance)`, font:{size:13}}, xaxis:{title:'PC 1'}, yaxis:{title:'PC 2'}, legend:{orientation:'h', y:-0.25}, margin:{t:36}} }));
    const t = ex.tokens;
    U.plot('s-att', () => ({data:[{type:'heatmap', z:ex.attn, x:t.map((w,i)=>w+' '+(i+1)), y:t.map((w,i)=>w+' '+(i+1)), colorscale:'Blues', zmin:0, zmax:1, colorbar:{title:'weight'}, hovertemplate:'query %{y} → key %{x}: %{z:.2f}<extra></extra>'}],
      layout:{title:{text:'Attention in the block (heads averaged)', font:{size:13}}, yaxis:{autorange:'reversed'}, xaxis:{tickangle:-45}, margin:{t:36,b:70,l:70},
        shapes:[{type:'rect', xref:'paper', x0:0, x1:1, yref:'y', y0:ex.bank_pos-0.5, y1:ex.bank_pos+0.5, line:{color:col('c1'), width:2.5}}]} }));
    const row = ex.attn[ex.bank_pos], top = row.map((w,i) => [i,w]).sort((a,b) => b[1]-a[1]).slice(0,2);
    $('#s-read').innerHTML = `Sentence: ${t.map(w => `<span class="chip ${w==='bank'?'t':''}">${w}</span>`).join('')}<br>The <b>bank</b> query puts most weight on ` + top.map(([i,w]) => `<b>${t[i]}</b> (${w.toFixed(2)})`).join(' and ') +
      `. Its output vector (◆ #${cur+1}) lies in the <b>${ex.label?'money':'river'}</b> cluster. Averaged over the test set the bank query puts <b>${(S.attn_mass_on_clues*100).toFixed(0)} %</b> of its attention on the clue words (they are only ${(S.attn_mass_chance*100).toFixed(0)} % of the tokens). ` +
      `Accuracy reading the output at ‘bank’: Transformer <b>${(Object.values(S.acc)[1]*100).toFixed(0)} %</b> vs static embedding <b>${(Object.values(S.acc)[0]*100).toFixed(0)} %</b> (chance 50 %).`;
  }
  draw();
})();

/* ============================================================ B5 scaling */
(function(){
  const Sc = R.scaling, sl = $('#sc-dk'); let seed = 1;
  sl.max = Sc.dk.length-1; sl.value = 6;
  const gauss = () => Math.sqrt(-2*Math.log(1-Math.random())) * Math.cos(2*Math.PI*Math.random());
  let samp = null;
  function resample(){ samp = {q: Array.from({length:1024}, gauss), k: Array.from({length:10}, () => Array.from({length:1024}, gauss))}; }
  function draw(){
    const i = +sl.value, dk = Sc.dk[i]; $('#sc-out').textContent = dk;
    const s = samp.k.map(k => { let t = 0; for (let d=0; d<dk; d++) t += samp.q[d]*k[d]; return t; });
    const w1 = softmax(s), w2 = softmax(s.map(v => v/Math.sqrt(dk)));
    U.plot('sc-bars', () => ({data:[{type:'bar', name:'unscaled', x:s.map((_,j)=>'key '+(j+1)), y:w1, marker:{color:col('c1')}}, {type:'bar', name:'÷√d_k', x:s.map((_,j)=>'key '+(j+1)), y:w2, marker:{color:col('c3')}}],
      layout:{barmode:'group', yaxis:{title:'attention weight', range:[0,1]}, title:{text:`One query, 10 keys, d_k = ${dk}`, font:{size:13}}, margin:{t:36}} }));
    U.plot('sc-curve', () => ({data:[{x:Sc.dk, y:Sc.maxw_unscaled, mode:'lines+markers', name:'unscaled', line:{color:col('c1')}}, {x:Sc.dk, y:Sc.maxw_scaled, mode:'lines+markers', name:'÷√d_k', line:{color:col('c3')}},
      {x:[dk,dk], y:[0,1], mode:'lines', showlegend:false, line:{color:col('c6'), dash:'dot'}}],
      layout:{xaxis:{type:'log', title:'d_k'}, yaxis:{title:'mean largest weight (of 10)', range:[0,1.05]}, title:{text:'Average over 300 random draws (Python)', font:{size:13}}, margin:{t:36}} }));
    const sd = Sc.std_dot[i];
    $('#sc-read').innerHTML = `Std of q·k at d_k=${dk} (Python): <b>${sd.toFixed(2)}</b> (≈ √d_k = ${Math.sqrt(dk).toFixed(2)}). Largest weight, this draw: unscaled <b>${Math.max(...w1).toFixed(2)}</b>, scaled <b>${Math.max(...w2).toFixed(2)}</b>. ` +
      (Math.max(...w1) > 0.95 ? 'The unscaled softmax is saturated – nearly one-hot, so gradients to all other keys vanish.' : 'At small d_k the two are similar; the problem appears for large d_k.');
  }
  sl.addEventListener('input', draw); $('#sc-new').addEventListener('click', () => { resample(); draw(); });
  resample(); draw();
})();

/* ============================================================ B5 PE */
(function(){
  const n = $('#pe-n'), d = $('#pe-d');
  function draw(){
    const N = +n.value, Dm = +d.value; $('#pe-n-out').textContent = N; $('#pe-d-out').textContent = Dm;
    const z = Array.from({length:N}, (_,p) => Array.from({length:Dm}, (_,j) => { const i = Math.floor(j/2), ang = p/Math.pow(10000, 2*i/Dm); return j%2===0 ? Math.sin(ang) : Math.cos(ang); }));
    U.plot('pe-plot', () => ({data:[{type:'heatmap', z, colorscale:'RdBu', zmin:-1, zmax:1, colorbar:{title:'value'}, hovertemplate:'position %{y}, dim %{x}: %{z:.2f}<extra></extra>'}],
      layout:{title:{text:'PE (rows = positions, columns = dimensions)', font:{size:13}}, xaxis:{title:'embedding dimension'}, yaxis:{title:'position', autorange:'reversed'}, margin:{t:36}} }));
    const nrm = z.map(r => Math.hypot(...r)), sim = z.map((a,i) => z.map((b,j) => a.reduce((s,v,k) => s + v*b[k], 0)/(nrm[i]*nrm[j])));
    U.plot('pe-sim', () => ({data:[{type:'heatmap', z:sim, colorscale:'Viridis', zmin:-0.3, zmax:1, colorbar:{title:'cos'}, hovertemplate:'positions %{y} vs %{x}: cos %{z:.2f}<extra></extra>'}],
      layout:{title:{text:'cosine similarity of PE(i) and PE(j)', font:{size:13}}, xaxis:{title:'position j'}, yaxis:{title:'position i', autorange:'reversed'}, margin:{t:36}} }));
    const nPairs = Dm/2, wl = i => 2*Math.PI*Math.pow(10000, 2*i/Dm);
    $('#pe-read').innerHTML = `$n=${N}$ positions, $d=${Dm}$ → ${nPairs} sine/cosine pairs. Fastest pair: wavelength ${wl(0).toFixed(1)} positions; slowest pair: ${Math.round(wl(nPairs-1)).toLocaleString('en-US')} positions (≫ $n$, so over these ${N} positions its columns hardly move). Similarity between neighbouring positions: <b>${(sim[1] ? sim[1][0] : 1).toFixed(2)}</b> (1 vs 0), between the first and last position: <b>${sim[N-1][0].toFixed(2)}</b>.`;
    U.renderMath($('#pe-read'));
  }
  n.addEventListener('input', draw); d.addEventListener('input', draw); draw();
})();

/* ============================================================ B5 order experiment */
(function(){
  const A = R.task_order.acc, names = Object.keys(A);
  U.plot('o-plot', () => ({data:[{type:'bar', orientation:'h', y:names, x:names.map(k=>A[k]), marker:{color:names.map(k => A[k]>.9?col('c3'):col('c1'))}, text:names.map(k => (A[k]*100).toFixed(1)+' %'), textposition:'outside'}],
    layout:{xaxis:{range:[0,1.12], title:'test accuracy'}, yaxis:{autorange:'reversed'}, margin:{t:10,l:230}, shapes:[{type:'line', x0:.5, x1:.5, yref:'paper', y0:0, y1:1, line:{color:col('c6'), dash:'dash'}}]} }));
  $('#o-read').innerHTML = `Dashed line = chance (50 %). Models that treat the sentence as a bag/set of vectors — word2vec-style averaging and a Transformer <i>without</i> positions — cannot beat chance. Adding position encodings or reading tokens sequentially (GRU) solves it. Self-attention itself is order-blind; order is injected.`;
})();

/* ============================================================ B6 label smoothing */
(function(){
  const eps = $('#ls-eps'), V = 6, k = 2, L = R.label_smoothing;
  function draw(){
    const e = eps.value/100; $('#ls-out').textContent = e.toFixed(2);
    const t = Array.from({length:V}, (_,j) => j===k ? 1-e : e/(V-1));
    U.plot('ls-plot', () => ({data:[{type:'bar', x:t.map((_,j)=>'word '+(j+1)+(j===k?' (true)':'')), y:t, marker:{color:t.map((_,j)=>j===k?col('c2'):col('c6'))}, text:t.map(v=>v.toFixed(3)), textposition:'outside'}],
      layout:{yaxis:{range:[0,1.15], title:'target probability'}, margin:{t:10}} }));
    $('#ls-read').innerHTML = `Target: true word <b>${(1-e).toFixed(2)}</b>, each of the other ${V-1} words <b>${(e/(V-1)).toFixed(3)}</b> (sums to 1). In the mini model's next-word task (ε = ${L.eps}) the average largest predicted probability fell from <b>${L.mean_max_prob_hard.toFixed(3)}</b> to <b>${L.mean_max_prob_smooth.toFixed(3)}</b> (the model is less sure), and perplexity against hard labels moved from ${L.ppl_hard.toFixed(1)} to ${L.ppl_smooth.toFixed(1)}.`;
  }
  eps.addEventListener('input', draw); draw();
})();

/* ============================================================ B7 walkthrough */
(function(){
  const D = R.attention_example, toks = D.tokens, n = toks.length, d = 2;
  const X = D.E.map((r,i) => r.map((v,j) => v + D.PE[i][j]));
  const Q = matmul(X, D.Wq), K = matmul(X, D.Wk), V = matmul(X, D.Wv), sc = 1/Math.sqrt(d);
  const S = matmul(Q, T(K)).map(r => r.map(v => v*sc)), A = S.map(softmax), Z = matmul(A, V);
  const ref = D.results.pos, dev = Math.max(...Z.flatMap((r,i) => r.map((v,j) => Math.abs(v - ref.out[i][j]))));
  const f = v => (v<0?'−':'') + Math.abs(v).toFixed(2);
  const mat = (M, rows, cols) => `<table class="mat">${cols ? '<tr><th></th>'+cols.map(c=>`<th>${c}</th>`).join('')+'</tr>' : ''}${M.map((r,i) => `<tr>${rows ? `<th>${rows[i]}</th>` : ''}${r.map(v => `<td>${f(v)}</td>`).join('')}</tr>`).join('')}</table>`;
  const row = (...parts) => `<div class="matrow">${parts.join('')}</div>`;
  const op = t => `<span style="font-size:1.2rem;margin:0 2px">${t}</span>`;
  const cap = t => `<p class="matcap">${t}</p>`;
  const dims = ['dim 1','dim 2'], qk = ['q/k 1','q/k 2'], vd = ['v 1','v 2'], idx = toks.map((t,i) => (i+1)+' '+t);
  const steps = [
   ['1 · Tokenize', 'Cut the text into tokens. Here the unit is the word and the sentence has $n=6$ tokens: <span class="chip t">a</span><span class="chip t">cute</span><span class="chip t">teddy</span><span class="chip t">bear</span><span class="chip t">is</span><span class="chip t">reading</span>. (The lecture treats “teddy bear” as one token and adds <code>&lt;bos&gt;</code>/<code>&lt;eos&gt;</code>; to keep the matrices small we use six words and no special tokens.) Each token is replaced by its integer id in the vocabulary of $V=31$ words.'],
   ['2 · Embed + position', () => 'Look up each token\'s row in the embedding table (the 2-D vectors learned in B2, $d=2$), then <b>add</b> the sinusoidal position vector of its slot. The sentence becomes the matrix $X$ ($n\\times d=6\\times2$), one row per token:' + row(mat(D.E, idx, dims), op('+'), mat(D.PE, idx, ['PE 1','PE 2']), op('='), mat(X, idx, dims)) + cap('left: embeddings $E$ (the same row whenever the word recurs) · middle: position encodings $PE$ (slot 1 is $(\\sin0,\\cos0)=(0,1)$) · right: $X=E+PE$. In a real model $d$ is hundreds, so each row would be that long.')],
   ['3 · Project to Q, K, V', () => 'Multiply $X$ by three learned $2\\times2$ matrices ($d\\times d_k$, $d\\times d_k$, $d\\times d_v$ with $d_k=d_v=2$ here). Row $i$ of each result belongs to token $i$:' +
      cap('Learned weights $W_Q$, $W_K$, $W_V$ (shared by all tokens):') + row(mat(D.Wq,['in 1','in 2'],qk), mat(D.Wk,['in 1','in 2'],qk), mat(D.Wv,['in 1','in 2'],vd)) +
      cap('Resulting matrices, $Q=XW_Q$, $K=XW_K$, $V=XW_V$, each $6\\times2$:') + row(mat(Q, idx, qk), mat(K, idx, qk), mat(V, idx, vd)) + cap('left: queries $Q$ · middle: keys $K$ · right: values $V$. Example: query of “teddy” = row 3 of $X$ times $W_Q$.')],
   ['4 · Scores and weights', () => 'Score of token $i$ for token $j$: $S_{ij}=\\mathbf q_i\\cdot\\mathbf k_j/\\sqrt{d_k}$ with $\\sqrt{d_k}=\\sqrt2$, i.e. $S=QK^\\top/\\sqrt{2}$ ($6\\times6$); then a softmax <i>within each row</i> gives the weights $A$ (each row sums to 1):' +
      row(mat(S, idx, idx.map(t=>t))) + cap('scores $S$ (row = query token, column = key token)') + row(mat(A, idx, idx.map(t=>t))) + cap('weights $A=\\mathrm{softmax}(S)$; row sums: ' + A.map(r => r.reduce((a,b)=>a+b,0).toFixed(2)).join(', '))],
   ['5 · Weighted sum', () => '$Z=AV$ ($6\\times6$ times $6\\times2$ gives $6\\times2$): row $i$ of $Z$ is the average of all value vectors, weighted by row $i$ of $A$. Example for “teddy” (row 3): $\\mathbf z_3=\\sum_j A_{3j}\\mathbf v_j$ = ' + A[2].map((w,j) => `${w.toFixed(2)}·(${f(V[j][0])}, ${f(V[j][1])})`).join(' + ') + ' = <b>(' + f(Z[2][0]) + ', ' + f(Z[2][1]) + ')</b>.' + row(mat(Z, idx, vd)) + cap('$Z$: the context-aware vectors. ' + (dev < 2e-3 ? '✓ equals the NumPy result of the explorer (max difference ' + dev.toExponential(1) + ').' : '✗ differs from NumPy by ' + dev.toExponential(1)))],
   ['6 · Many heads', 'Do steps 3–5 $h$ times with different matrices (each head works with $d_k=d_v=d/h$ columns), concatenate the $h$ outputs side by side ($n\\times d$ again) and multiply by $W_O$ ($d\\times d$). Our toy uses one head; the original paper uses $h=8$ with $d=512$, so each head has 64 columns.'],
   ['7 · Feed-forward and stacking', 'Residual connection + layer norm: $X+Z$ is normalised; then the feed-forward network (applied to each row separately, $d\\to d_{ff}\\to d$) and again residual + norm. Repeat the whole block $N$ times (own weights each time). Output: context-aware embeddings of all source tokens, a matrix $H$ of the same shape $n\\times d$ as $X$.'],
   ['8 · Decoder: start', 'Feed <code>&lt;bos&gt;</code> to the decoder. Masked self-attention (position $i$ sees only $\\le i$; scores $m\\times m$ with the upper triangle at $-\\infty$); then cross-attention: queries from the decoder ($m\\times d_k$), keys and values from the encoder output $H$ ($n\\times d_k$, $n\\times d_v$), scores $m\\times n$; then the feed-forward network. Repeat $N$ times.'],
   ['9 · Predict, append, repeat', 'Linear layer ($d\\to V$) + softmax → a probability for each of the $V$ vocabulary words. Pick the next token, append it to the decoder input, run again. Stop when <code>&lt;eos&gt;</code> is generated.']
  ];
  let i = 0;
  function show(){ const body = typeof steps[i][1] === 'function' ? steps[i][1]() : steps[i][1];
    $('#wk-box').innerHTML = `<div class="cardtitle">${steps[i][0]}</div><p>${body}</p>`; $('#wk-count').textContent = `step ${i+1} of ${steps.length}`;
    $('#wk-prev').disabled = i===0; $('#wk-next').disabled = i===steps.length-1; U.renderMath($('#wk-box')); }
  $('#wk-prev').addEventListener('click', () => { if (i>0) { i--; show(); } }); $('#wk-next').addEventListener('click', () => { if (i<steps.length-1) { i++; show(); } });
  show();
})();

/* ============================================================ E checks + dashboard */
(function(){
  $('#checks').innerHTML = `<p><b class="${R.all_checks_passed?'pass':'fail'}">${R.checks.filter(c=>c.ok).length} / ${R.checks.length} checks passed</b> · seed ${R.seed} · runtime ${R.runtime_s} s</p>` +
    `<table class="tbl-small"><tr><th></th><th>Check</th><th>Measured</th></tr>` + R.checks.map(c => `<tr><td class="${c.ok?'pass':'fail'}">${c.ok?'PASS':'FAIL'}</td><td>${c.name}</td><td>${(c.detail||'').replace(/</g,'&lt;')}</td></tr>`).join('') + `</table>`;
  let view = 'proxy';
  function draw(){
    ['proxy','order','sense'].forEach(k => $('#d-'+k).className = k===view?'on':'');
    U.plot('d-plot', () => {
      if (view==='proxy') return {data:[{x:R.embeddings.losses.map((_,i)=>i*10), y:R.embeddings.losses, mode:'lines', name:'cross-entropy', line:{color:col('c2'), width:3}}],
        layout:{xaxis:{title:'training step'}, yaxis:{title:'proxy-task loss'}, margin:{t:10}}};
      if (view==='order') return {data:Object.entries(R.task_order.curves).map(([k,v],i) => ({x:v.map(p=>p[0]), y:v.map(p=>p[1]), mode:'lines', name:k, line:{width:2.4}})),
        layout:{xaxis:{title:'training step'}, yaxis:{title:'loss', rangemode:'tozero'}, legend:{orientation:'h', y:-.35}, margin:{t:10}}};
      return {data:[{x:R.task_sense.curve.map(p=>p[0]), y:R.task_sense.curve.map(p=>p[1]), mode:'lines', name:'Transformer', line:{color:col('c3'), width:3}}], layout:{xaxis:{title:'training step'}, yaxis:{title:'loss', rangemode:'tozero'}, margin:{t:10}}};
    });
    $('#d-read').innerHTML = view==='proxy' ? `Proxy loss (mean cross-entropy, see the box below) falls from ln(31) ≈ 3.4 (uniform guess) to ≈ ${R.embeddings.losses[R.embeddings.losses.length-1].toFixed(2)}. It cannot reach 0: the next word is random inside a topic. The floor ≈ ${R.embeddings.loss_example.bigram_floor.toFixed(2)} is the entropy of the corpus's next-word frequencies (best any model could do). Perplexity ${R.embeddings.perplexity.toFixed(1)}.`
      : view==='order' ? 'Models without access to order stay near ln 2 ≈ 0.69 (chance); the ones with positions or recurrence go to ≈ 0.' : 'The Transformer has to learn to look at the clue token; the loss collapses after a short plateau.';
  }
  ['proxy','order','sense'].forEach(k => $('#d-'+k).addEventListener('click', () => { view = k; draw(); }));
  draw();
})();

/* ---- loss worked example */
(function(){
  const E = R.embeddings, L = E.loss_example, box = $('#loss-ex-body'); if (!box) return;
  const f = (x,k=3) => x.toFixed(k);
  box.innerHTML = `<ol>
   <li>Pair: current word <b>${L.cur}</b>, true next word <b>${L.next}</b>. Feed the one-hot of “${L.cur}” through $W_1$ (a 2-D embedding), then $W_2$: 31 raw scores (logits).</li>
   <li>Softmax turns them into 31 probabilities. The five largest: ${L.top.map(([w,p]) => `<span class="chip ${w===L.next?'t':''}">${w.replace(/</g,'&lt;')} ${f(p)}</span>`).join(' ')}. (After “${L.cur}” any soft-toy word, a function word or the end of the sentence may follow, so no single word is likely; the data-based frequency of “${L.next}” after “${L.cur}” is ${f(L.emp_p_true)}.)</li>
   <li>The true word gets $\\hat y_{\\text{next}}=${f(L.p_true,4)}$, so this pair's loss is $-\\ln${f(L.p_true,4)}=\\mathbf{${f(L.loss)}}$ (a uniform guess, $1/31$, would give 3.434).</li>
   <li>Repeat for all $N=${L.n_pairs.toLocaleString('en-US')}$ pairs and average: the loss is ${f(L.loss_first)} at step 0 and ${f(L.loss_last)} after training; $\\exp(${f(L.loss_last)})=${f(Math.exp(L.loss_last),1)}$ is the training perplexity of B0 (the reported ${f(E.perplexity,1)} is measured after the last update).</li></ol>`;
  U.renderMath(box);
})();
})();

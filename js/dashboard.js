(function () {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
  const fmtDate = (iso) => new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  let results = loadResults();
  let role = 'admin';
  let selectedId = WORKERS[0].id; // pekerja yang sedang di-preview admin
  let pekerjaId = WORKERS[0].id;  // pekerja yang sedang dipilih di tab Pekerja
  let run = null;                 // state tes waktu reaksi yang sedang berjalan

  // ---------- DATA ----------
  function loadResults() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* abaikan, pakai seed */ }
    const seed = seedResults();
    saveResults(seed);
    return seed;
  }

  function saveResults(data = results) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* storage tidak tersedia */ }
  }

  function latestResult(workerId) {
    let best = null;
    for (const r of results) {
      if (r.workerId === workerId && (!best || r.tanggal > best.tanggal)) best = r;
    }
    return best;
  }

  // ---------- ROLE ----------
  function setRole(next, updateHash = true) {
    role = next;
    document.querySelectorAll('.role-btn').forEach((b) => b.classList.toggle('active', b.dataset.role === role));
    $('#view-admin').hidden = role !== 'admin';
    $('#view-pekerja').hidden = role !== 'pekerja';
    $('#resetBtn').hidden = role !== 'admin';
    if (updateHash && location.hash !== '#' + role) history.replaceState(null, '', '#' + role);
    renderAll();
  }

  // ---------- ADMIN ----------
  function renderStats() {
    const tested = WORKERS.map((w) => latestResult(w.id)).filter(Boolean);
    const teamAvg = tested.length ? Math.round(mean(tested.map((r) => r.avg))) : null;
    const attention = tested.filter((r) => r.kategori === 'Kelelahan Sedang' || r.kategori === 'Kelelahan Berat').length;
    const cards = [
      ['Total pekerja', WORKERS.length, 'ri-team-line'],
      ['Sudah tes', `${tested.length}/${WORKERS.length}`, 'ri-checkbox-circle-line'],
      ['Rata-rata tim', teamAvg === null ? '-' : `${teamAvg} ms`, 'ri-timer-line'],
      ['Perlu perhatian', attention, 'ri-alarm-warning-line'],
    ];
    $('#stats').innerHTML = cards.map(([label, val, icon]) =>
      `<div class="stat"><i class="${icon}"></i><div><span>${label}</span><strong>${val}</strong></div></div>`
    ).join('');
  }

  function renderTable() {
    $('#workerRows').innerHTML = WORKERS.map((w) => {
      const r = latestResult(w.id);
      return `<tr data-id="${w.id}" class="${w.id === selectedId ? 'selected' : ''}">
        <td><strong>${esc(w.nama)}</strong></td>
        <td>${esc(w.divisi)}</td>
        <td>${esc(w.shift)}</td>
        <td>${r ? fmtDate(r.tanggal) : '<span class="muted">Belum tes</span>'}</td>
        <td>${r ? r.avg + ' ms' : '-'}</td>
        <td>${r ? `<span class="badge ${CATEGORIES[r.kategori].cls}">${esc(r.kategori)}</span>` : '-'}</td>
      </tr>`;
    }).join('');
  }

  function renderPreview() {
    const w = WORKERS.find((x) => x.id === selectedId);
    const r = latestResult(w.id);
    const el = $('#preview');

    if (!r) {
      el.innerHTML = `<h2>${esc(w.nama)}</h2>
        <p class="muted">Belum ada hasil tes. Pekerja dapat mengerjakan tes di tab Pekerja.</p>`;
      return;
    }

    const c = CATEGORIES[r.kategori];
    const scaleMax = 700;
    const bars = r.trials.map((t, i) =>
      `<div class="bar ${c.cls} ${i < PRACTICE_TRIALS ? 'practice' : ''}"
            style="height:${Math.min((t / scaleMax) * 100, 100)}%"
            title="Percobaan ${i + 1}: ${t} ms"></div>`
    ).join('');
    const limitBottom = (MAX_REACTION_MS / scaleMax) * 100;

    const history = results
      .filter((x) => x.workerId === w.id)
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      .map((x) => `<li>
        <span>${fmtDate(x.tanggal)}</span>
        <span>${x.avg} ms</span>
        <span class="badge ${CATEGORIES[x.kategori].cls}">${esc(x.kategori)}</span>
      </li>`).join('');

    el.innerHTML = `
      <div class="preview-head">
        <div>
          <h2>${esc(w.nama)}</h2>
          <p class="muted">${esc(w.divisi)} · Shift ${esc(w.shift)}</p>
        </div>
        <span class="badge ${c.cls}">${esc(r.kategori)}</span>
      </div>

      <div class="big-score"><strong>${r.avg}</strong><span>ms rata-rata (15 percobaan terhitung)</span></div>

      <div class="conclusion">
        <h3>Kesimpulan</h3>
        <p>${esc(c.arti)}</p>
        <p><strong>Saran:</strong> ${esc(c.saran)}</p>
      </div>

      <h3>Waktu reaksi per percobaan</h3>
      <div class="chart">
        <div class="limit" style="bottom:${limitBottom}%"><span>${MAX_REACTION_MS} ms</span></div>
        ${bars}
      </div>
      <p class="legend muted"><span class="sw practice"></span> latihan (tidak dihitung) &nbsp; <span class="sw"></span> dihitung</p>

      <h3>Riwayat tes</h3>
      <ul class="history">${history}</ul>`;
  }

  function renderAdmin() {
    renderStats();
    renderTable();
    renderPreview();
  }

  // ---------- PEKERJA ----------
  function setArena(state, msg, note) {
    $('#arena').className = 'arena state-' + state;
    $('#msg').textContent = msg;
    $('#note').textContent = note || '';
  }

  function renderPekerja() {
    const sel = $('#workerSelect');
    if (!sel.options.length) {
      sel.innerHTML = WORKERS.map((w) =>
        `<option value="${w.id}">${esc(w.nama)} — ${esc(w.divisi)}</option>`).join('');
    }
    sel.value = pekerjaId;
    sel.disabled = !!run && !run.done;

    const count = run ? run.trials.length : 0;
    $('#bar').style.width = (count / TOTAL_TRIALS) * 100 + '%';
    $('#progressText').textContent = `${count} dari ${TOTAL_TRIALS} percobaan`;

    const r = latestResult(pekerjaId);
    const box = $('#myResult');
    if (!r) {
      box.innerHTML = `<h3>Hasil terakhir</h3><p class="muted">Belum ada hasil. Selesaikan tes di sebelah kiri.</p>`;
      return;
    }
    const c = CATEGORIES[r.kategori];
    box.innerHTML = `
      <h3>Hasil terakhir</h3>
      <div class="big-score"><strong>${r.avg}</strong><span>ms rata-rata</span></div>
      <span class="badge ${c.cls}">${esc(r.kategori)}</span>
      <p class="conclusion-text">${esc(c.saran)}</p>
      <p class="muted small">${fmtDate(r.tanggal)} · Data sudah masuk ke dashboard admin.</p>`;
  }

  // ---------- TES WAKTU REAKSI ----------
  function startRun() {
    run = { workerId: pekerjaId, trials: [], phase: 'idle', timer: null, greenAt: 0, done: false };
    setArena('idle', 'Klik untuk mulai', `Tunggu warna hijau, lalu klik secepat mungkin. ${PRACTICE_TRIALS} percobaan pertama adalah latihan.`);
    renderPekerja();
  }

  function startWait() {
    run.phase = 'wait';
    setArena('wait', 'Tunggu warna hijau...', 'Jangan klik dulu.');
    run.timer = setTimeout(() => {
      run.phase = 'go';
      run.greenAt = performance.now();
      setArena('go', 'Klik!', '');
    }, 2000 + Math.random() * 2000);
  }

  function onArenaClick(e) {
    e.preventDefault();

    if (!run || run.done) {
      startRun();
      startWait();
      return;
    }
    if (run.phase === 'idle') {
      startWait();
      return;
    }
    if (run.phase === 'wait') {
      clearTimeout(run.timer);
      run.phase = 'idle';
      setArena('idle', 'Terlalu cepat!', 'Klik untuk mencoba lagi.');
      return;
    }

    // phase 'go': hitung waktu reaksi dari saat warna hijau muncul
    const rt = Math.round(performance.now() - run.greenAt);
    run.phase = 'idle';

    if (rt > MAX_REACTION_MS) {
      setArena('idle', `Terlalu lambat (${rt} ms)`, 'Klik untuk mengulang percobaan ini.');
      return;
    }

    run.trials.push(rt);
    if (run.trials.length >= TOTAL_TRIALS) {
      finishRun();
      return;
    }
    setArena('idle', `${rt} ms`, `Klik untuk lanjut · percobaan ${run.trials.length} dari ${TOTAL_TRIALS}`);
    renderPekerja();
  }

  function finishRun() {
    run.done = true;
    const counted = run.trials.slice(PRACTICE_TRIALS);
    const avg = mean(counted);
    const kategori = getCategory(avg);

    results.push({
      id: 'r' + Date.now(),
      workerId: run.workerId,
      avg: Math.round(avg),
      kategori,
      trials: run.trials,
      tanggal: new Date().toISOString(),
    });
    saveResults();

    selectedId = run.workerId; // admin preview langsung ke pekerja yang baru tes
    setArena('done', `Selesai · rata-rata ${Math.round(avg)} ms`, `${kategori}. Klik untuk tes ulang.`);
    playAudio(kategori);
    renderAll();
  }

  function playAudio(kategori) {
    const id = CATEGORIES[kategori].audioId;
    const audio = id && document.getElementById(id);
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => { /* autoplay bisa diblokir browser */ });
  }

  // ---------- RENDER ----------
  function renderAll() {
    if (role === 'admin') renderAdmin();
    else renderPekerja();
  }

  // ---------- EVENTS ----------
  document.querySelectorAll('.role-btn').forEach((b) =>
    b.addEventListener('click', () => setRole(b.dataset.role)));

  $('#workerRows').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    selectedId = tr.dataset.id;
    renderAll();
  });

  $('#workerSelect').addEventListener('change', (e) => {
    if (run && !run.done) return;
    pekerjaId = e.target.value;
    run = null;
    setArena('idle', 'Klik untuk mulai', `Tes berisi ${TOTAL_TRIALS} percobaan. ${PRACTICE_TRIALS} pertama adalah latihan.`);
    renderPekerja();
  });

  $('#arena').addEventListener('pointerdown', onArenaClick);

  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('Kembalikan semua data dummy ke kondisi awal?')) return;
    results = seedResults();
    saveResults();
    renderAll();
  });

  // Sinkron antar tab: tes dari tab Pekerja langsung terlihat di tab Admin tanpa reload.
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    results = loadResults();
    renderAll();
  });

  window.addEventListener('hashchange', () => {
    const h = location.hash.slice(1);
    if (['admin', 'pekerja'].includes(h) && h !== role) setRole(h, false);
  });

  // ---------- INIT ----------
  setArena('idle', 'Klik untuk mulai', `Tes berisi ${TOTAL_TRIALS} percobaan. ${PRACTICE_TRIALS} pertama adalah latihan.`);
  const initial = location.hash.slice(1);
  setRole(['admin', 'pekerja'].includes(initial) ? initial : 'admin', false);
})();

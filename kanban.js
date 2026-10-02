// Live demo board for kanban.html: pointer-event drag and drop (mouse, touch, pen) plus keyboard moves.
(function () {
  var board = document.getElementById('kb-board');
  if (!board) return;
  var live = document.getElementById('kb-live');
  var KEY = 'guide-kanban-demo';

  var DEFAULT = [
    { id: 'todo', title: 'To do', cards: [
      { id: 'c1', text: 'Measure the desk space', tag: 'Plan' },
      { id: 'c2', text: 'Order a monitor arm', tag: 'Buy' },
      { id: 'c3', text: 'Book an electrician for an extra socket', tag: 'Book' },
      { id: 'c4', text: 'Choose a chair', tag: 'Buy' }
    ] },
    { id: 'doing', title: 'Doing', limit: 3, cards: [
      { id: 'c5', text: 'Clear out the spare room', tag: 'Setup' },
      { id: 'c6', text: 'Compare internet plans', tag: 'Plan' }
    ] },
    { id: 'done', title: 'Done', cards: [
      { id: 'c7', text: 'Set a budget', tag: 'Plan' }
    ] }
  ];

  var cols = load();

  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(s) && s.length === 3) return s; } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT));
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cols)); } catch (e) {} }
  function say(msg) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30); }
  function find(id) {
    for (var c = 0; c < cols.length; c++)
      for (var i = 0; i < cols[c].cards.length; i++)
        if (cols[c].cards[i].id === id) return { c: c, i: i, card: cols[c].cards[i] };
  }

  function render(focusId) {
    board.textContent = '';
    cols.forEach(function (col) {
      var sec = document.createElement('section');
      sec.className = 'kb-col';
      sec.dataset.col = col.id;
      var over = col.limit && col.cards.length > col.limit;
      if (over) sec.classList.add('over');

      var h = document.createElement('h3');
      h.className = 'kb-col-title';
      h.textContent = col.title;
      var n = document.createElement('span');
      n.className = 'kb-count';
      n.textContent = col.limit ? col.cards.length + ' / ' + col.limit : col.cards.length;
      if (col.limit) n.title = 'Work-in-progress limit: ' + col.limit;
      h.append(n);

      var ul = document.createElement('ul');
      ul.className = 'kb-list';
      ul.setAttribute('aria-label', col.title);
      col.cards.forEach(function (card, i) {
        var li = document.createElement('li');
        li.className = 'kb-card';
        li.tabIndex = 0;
        li.dataset.id = card.id;
        li.setAttribute('aria-label', card.text + ', ' + col.title + ', ' + (i + 1) + ' of ' + col.cards.length);
        var handle = document.createElement('span');
        handle.className = 'kb-handle'; handle.setAttribute('aria-hidden', 'true'); handle.textContent = '⠿';
        var body = document.createElement('span');
        body.className = 'kb-text'; body.textContent = card.text;
        if (card.tag) { var t = document.createElement('span'); t.className = 'kb-tag'; t.textContent = card.tag; body.append(t); }
        var del = document.createElement('button');
        del.type = 'button'; del.className = 'kb-del'; del.textContent = '×';
        del.setAttribute('aria-label', 'Delete ' + card.text);
        li.append(handle, body, del);
        ul.append(li);
      });

      var form = document.createElement('form');
      form.className = 'kb-add';
      form.innerHTML = '<input type="text" maxlength="80" placeholder="Add a card…" aria-label="Add a card to ' + col.title + '"><button type="submit" class="copy-btn">Add</button>';
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('input');
        var text = input.value.trim();
        if (!text) return;
        col.cards.push({ id: 'c' + Date.now().toString(36), text: text });
        save(); render(); say('Added "' + text + '" to ' + col.title);
        board.querySelector('[data-col="' + col.id + '"] .kb-add input').focus();
      });

      sec.append(h, ul, form);
      board.append(sec);
    });
    if (focusId) { var f = board.querySelector('[data-id="' + focusId + '"]'); if (f) f.focus(); }
  }

  // Rebuild the data from the order of cards on screen after a drop
  function syncFromDom() {
    var all = {};
    cols.forEach(function (col) { col.cards.forEach(function (c) { all[c.id] = c; }); });
    cols.forEach(function (col) {
      var list = board.querySelector('[data-col="' + col.id + '"] .kb-list');
      col.cards = Array.prototype.map.call(list.querySelectorAll('.kb-card'), function (li) { return all[li.dataset.id]; });
    });
  }

  function describe(id) {
    var f = find(id);
    return 'Moved "' + f.card.text + '" to ' + cols[f.c].title + ', position ' + (f.i + 1) + ' of ' + cols[f.c].cards.length;
  }

  // ---- Delete ----
  board.addEventListener('click', function (e) {
    var del = e.target.closest('.kb-del');
    if (!del) return;
    var f = find(del.closest('.kb-card').dataset.id);
    cols[f.c].cards.splice(f.i, 1);
    save(); render(); say('Deleted "' + f.card.text + '"');
  });

  // ---- Keyboard ----
  board.addEventListener('keydown', function (e) {
    var li = e.target.closest('.kb-card');
    if (!li || e.target !== li) return;
    var f = find(li.dataset.id), c = f.c, i = f.i;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      var nc = c + (e.key === 'ArrowLeft' ? -1 : 1);
      if (nc < 0 || nc >= cols.length) return;
      cols[c].cards.splice(i, 1);
      cols[nc].cards.splice(Math.min(i, cols[nc].cards.length), 0, f.card);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      var ni = i + (e.key === 'ArrowUp' ? -1 : 1);
      if (ni < 0 || ni >= cols[c].cards.length) return;
      cols[c].cards.splice(i, 1);
      cols[c].cards.splice(ni, 0, f.card);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      cols[c].cards.splice(i, 1);
      e.preventDefault(); save(); render(); say('Deleted "' + f.card.text + '"');
      return;
    } else return;
    e.preventDefault();
    save(); render(f.card.id); say(describe(f.card.id));
  });

  // ---- Pointer drag (mouse drags the whole card, touch drags by the handle) ----
  var drag = null;

  board.addEventListener('pointerdown', function (e) {
    var li = e.target.closest('.kb-card');
    if (!li || e.button !== 0 || e.target.closest('button')) return;
    if (e.pointerType !== 'mouse' && !e.target.closest('.kb-handle')) return;
    if (e.pointerType === 'mouse') e.preventDefault(); // no text selection
    drag = { li: li, id: e.pointerId, x: e.clientX, y: e.clientY, started: false };
  });

  function start(e) {
    var li = drag.li, r = li.getBoundingClientRect();
    drag.started = true;
    drag.dx = e.clientX - r.left; drag.dy = e.clientY - r.top;
    drag.home = { parent: li.parentNode, next: li.nextSibling };
    var ph = document.createElement('li');
    ph.className = 'kb-placeholder';
    ph.style.height = r.height + 'px';
    li.parentNode.insertBefore(ph, li);
    drag.ph = ph;
    li.classList.add('kb-dragging');
    li.style.width = r.width + 'px';
    document.body.append(li);
    move(e);
  }

  function move(e) {
    var li = drag.li;
    li.style.left = (e.clientX - drag.dx) + 'px';
    li.style.top = (e.clientY - drag.dy) + 'px';
    var under = document.elementFromPoint(e.clientX, e.clientY);
    var col = under && under.closest('.kb-col');
    board.querySelectorAll('.kb-col.target').forEach(function (c) { if (c !== col) c.classList.remove('target'); });
    if (col) {
      col.classList.add('target');
      var list = col.querySelector('.kb-list');
      var before = null;
      list.querySelectorAll('.kb-card').forEach(function (c) {
        if (before) return;
        var r = c.getBoundingClientRect();
        if (e.clientY < r.top + r.height / 2) before = c;
      });
      if (before) { if (drag.ph.nextSibling !== before) list.insertBefore(drag.ph, before); }
      else if (list.lastChild !== drag.ph) list.append(drag.ph);
    }
    // Auto-scroll near the top or bottom of the window
    if (e.clientY < 60) window.scrollBy(0, -14);
    else if (e.clientY > innerHeight - 60) window.scrollBy(0, 14);
  }

  function finish(cancel) {
    var li = drag.li;
    li.classList.remove('kb-dragging');
    li.style.left = li.style.top = li.style.width = '';
    if (cancel) drag.home.parent.insertBefore(li, drag.home.next);
    else drag.ph.parentNode.insertBefore(li, drag.ph);
    drag.ph.remove();
    board.querySelectorAll('.kb-col.target').forEach(function (c) { c.classList.remove('target'); });
    var id = li.dataset.id;
    drag = null;
    syncFromDom(); save(); render();
    say(cancel ? 'Move cancelled' : describe(id));
  }

  document.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.started) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 5) return;
      start(e);
    } else move(e);
  });
  document.addEventListener('pointerup', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.started) finish(false); else drag = null;
  });
  document.addEventListener('pointercancel', function (e) {
    if (drag && e.pointerId === drag.id) { if (drag.started) finish(true); else drag = null; }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drag && drag.started) finish(true);
  });

  document.getElementById('kb-reset').addEventListener('click', function () {
    cols = JSON.parse(JSON.stringify(DEFAULT));
    try { localStorage.removeItem(KEY); } catch (e) {}
    render(); say('Demo board reset');
  });

  render();
})();

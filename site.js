// Shared navigation, theme toggle and copy buttons for every page of the guide.
(function () {
  var PAGES = [
    { href: 'index.html', title: 'Overview' },
    { href: 'build.html', title: 'Build the app in Claude' },
    { href: 'features.html', title: 'Must-have features' },
    { href: 'github.html', title: 'GitHub token for Claude' },
    { href: 'publish.html', title: 'Claude publishes the repo' },
    { href: 'netlify.html', title: 'Go live on Netlify' },
    { href: 'data.html', title: 'Move & protect your data' },
    { href: 'updates.html', title: 'Making changes later' },
    { href: 'simple.html', title: 'Quick path: simple sites', mark: '⚡' },
    { href: 'troubleshooting.html', title: 'Troubleshooting', mark: '?' },
  ];

  var here = location.pathname.split('/').pop() || 'index.html';
  var idx = PAGES.findIndex(function (p) { return p.href === here; });

  // Theme: follow the system unless the reader picked one
  var root = document.documentElement;
  try { var saved = localStorage.getItem('guide-theme'); if (saved) root.dataset.theme = saved; } catch (e) {}

  // Top bar
  var bar = document.createElement('header');
  bar.className = 'topbar';
  bar.innerHTML =
    '<button class="icon-btn menu-btn" aria-label="Open the list of steps" aria-expanded="false">☰ Steps</button>' +
    '<a class="brand" href="index.html">Deploy apps with <span>Claude</span></a>' +
    '<span class="spacer"></span>' +
    '<button class="icon-btn theme-btn" aria-label="Switch light or dark theme">◐</button>';
  document.body.prepend(bar);

  // Sidebar
  var sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    var ol = document.createElement('ol');
    PAGES.forEach(function (p, i) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = p.href;
      if (i === idx) a.setAttribute('aria-current', 'page');
      var num = document.createElement('span'); num.className = 'num'; num.textContent = p.mark || (i === 0 ? '★' : String(i));
      var t = document.createElement('span'); t.textContent = p.title;
      a.append(num, t); li.append(a); ol.append(li);
    });
    sidebar.append(ol);
  }

  var menuBtn = bar.querySelector('.menu-btn');
  menuBtn.addEventListener('click', function () {
    var open = document.body.classList.toggle('nav-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', function (e) {
    if (document.body.classList.contains('nav-open') && !e.target.closest('.sidebar') && !e.target.closest('.menu-btn')) {
      document.body.classList.remove('nav-open'); menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  bar.querySelector('.theme-btn').addEventListener('click', function () {
    var dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('guide-theme', root.dataset.theme); } catch (e) {}
  });

  // Previous / next
  var content = document.querySelector('.content');
  if (content && idx >= 0) {
    var pager = document.createElement('nav');
    pager.className = 'pager';
    pager.setAttribute('aria-label', 'Previous and next step');
    if (idx > 0) pager.insertAdjacentHTML('beforeend', '<a class="prev" href="' + PAGES[idx - 1].href + '"><small>← Previous</small>' + PAGES[idx - 1].title + '</a>');
    if (idx < PAGES.length - 1) pager.insertAdjacentHTML('beforeend', '<a class="next" href="' + PAGES[idx + 1].href + '"><small>Next →</small>' + PAGES[idx + 1].title + '</a>');
    content.append(pager);
  }

  // Copy buttons on every code / prompt block
  document.querySelectorAll('.block').forEach(function (block) {
    var pre = block.querySelector('pre');
    var label = block.querySelector('.label');
    if (!pre || !label) return;
    var btn = document.createElement('button');
    btn.className = 'copy-btn'; btn.type = 'button'; btn.textContent = 'Copy';
    btn.addEventListener('click', function () {
      var text = pre.innerText;
      var done = function () { btn.textContent = 'Copied'; btn.classList.add('done'); setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('done'); }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
      else { var r = document.createRange(); r.selectNodeContents(pre); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    });
    label.append(btn);
  });
})();

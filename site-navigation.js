// Site-level navigation only. Add routes here; feature pages keep their own UI.
(() => {
  const base = document.currentScript.src;
  const pages = [
    {label: 'A', file: 'index.html'},
    {label: 'ライブラリ', file: 'library.html'},
    {label: 'カード', file: 'card-catalog.html'},
    {label: 'リーダー', file: 'leader.html'},
    {label: 'イベント編成探索', file: 'event.html'}
  ];
  const currentPath = location.pathname.endsWith('/')
    ? new URL('index.html', location.href).pathname : location.pathname;
  const header = document.createElement('header');
  header.className = 'siteHeader';
  const inner = document.createElement('div');
  inner.className = 'wrap siteHeaderInner';
  const title = document.createElement('div');
  title.className = 'siteTitle';
  title.textContent = 'ホロドリ';
  const nav = document.createElement('nav');
  nav.className = 'globalNav';
  nav.setAttribute('aria-label', 'サイトの主要機能');
  for(const page of pages){
    const link = document.createElement('a');
    const url = new URL(page.file, base);
    link.href = url.href;
    link.textContent = page.label;
    if(url.pathname === currentPath) link.setAttribute('aria-current', 'page');
    nav.append(link);
  }
  const development = document.createElement('details');
  development.className = 'developmentNav';
  const summary = document.createElement('summary');
  summary.textContent = '開発中';
  const developmentLinks = document.createElement('nav');
  developmentLinks.setAttribute('aria-label', '開発中の機能');
  for(const page of [{label:'次世代 統合シミュレーター',file:'unit-simulator.html'}]){
    const link = document.createElement('a');
    const url = new URL(page.file, base);
    link.href = url.href;
    link.textContent = page.label;
    if(url.pathname === currentPath){
      link.setAttribute('aria-current', 'page');
      development.open = true;
      development.classList.add('isCurrent');
    }
    developmentLinks.append(link);
  }
  development.append(summary, developmentLinks);
  inner.append(title, nav, development);
  header.append(inner);
  document.body.prepend(header);
  // Reveal the active tab without scrolling the page vertically on mobile.
  const active = nav.querySelector('[aria-current="page"]');
  if(active) nav.scrollLeft = active.offsetLeft;
})();

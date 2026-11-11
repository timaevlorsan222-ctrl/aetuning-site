(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var top = document.querySelector('.top'), sheen = document.querySelector('.sheen');

  /* Полоса прокрутки и блик по металлу фона */
  function prog(){
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? window.scrollY / h : 0;
    top.style.setProperty('--p', p.toFixed(4));
    if (!reduce) sheen.style.setProperty('--sx', (-25 + 50 * p).toFixed(2) + '%');
  }
  window.addEventListener('scroll', prog, {passive:true}); prog();

  /* Свет по гравировке: один проход при загрузке, дальше за курсором */
  var mark = document.getElementById('heroMark');
  if (!reduce) {
    var t0 = null;
    function run(ts){
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / 2400), e = 1 - Math.pow(1 - p, 3);
      mark.style.setProperty('--lx', (-70 + 120 * e) + '%');
      if (p < 1) requestAnimationFrame(run);
    }
    setTimeout(function(){ requestAnimationFrame(run); }, 250);
    mark.addEventListener('pointermove', function(ev){
      var r = mark.getBoundingClientRect();
      mark.style.setProperty('--lx', (-50 + (ev.clientX - r.left) / r.width * 80) + '%');
    });
  } else { mark.style.setProperty('--lx', '10%'); }

  /* До/после: ракель */
  document.querySelectorAll('.ba').forEach(function(ba){
    var range = ba.querySelector('input');
    range.addEventListener('input', function(){ ba.style.setProperty('--pos', range.value + '%'); });
  });

  /* Появление при скролле: маска для заголовков, косая шторка для фото.
     Прячем только то, что ниже первого экрана, поэтому без скрипта всё видно. */
  document.querySelectorAll('[data-mask]').forEach(function(h){
    h.classList.add('rv-mask');
    h.innerHTML = '<span class="ri">' + h.innerHTML + '</span>';
  });
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {rootMargin: '0px 0px -12% 0px'});
    document.querySelectorAll('[data-mask],[data-wipe]').forEach(function(el){
      if (el.getBoundingClientRect().top > window.innerHeight * 0.9) { el.classList.add('pre'); io.observe(el); }
    });
  }

  /* След протектора */
  var track = document.getElementById('track');
  var lines = [document.getElementById('t1'), document.getElementById('t2')];
  var len = lines[0].getTotalLength();
  var mask = document.createElementNS('http://www.w3.org/2000/svg','mask'); mask.id = 'tm';
  var mpath = document.createElementNS('http://www.w3.org/2000/svg','path');
  mpath.setAttribute('d','M-20 104 C 260 104, 420 26, 700 38 S 1080 100, 1220 78');
  mpath.setAttribute('fill','none'); mpath.setAttribute('stroke','#fff'); mpath.setAttribute('stroke-width','60');
  mpath.style.strokeDasharray = len; mpath.style.strokeDashoffset = reduce ? 0 : len;
  mask.appendChild(mpath); track.insertBefore(mask, track.firstChild);
  lines.forEach(function(l){ l.setAttribute('mask','url(#tm)'); });
  function onScroll(){
    if (reduce) return;
    var r = track.getBoundingClientRect(), vh = window.innerHeight;
    var p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.7)));
    mpath.style.strokeDashoffset = len * (1 - p);
  }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();


  /* Квиз: класс авто, услуги, контакт */
  var items = [
    ['Полировка кузова', 9000], ['Химчистка салона', 6000], ['Бронеплёнка', 15000], ['Тонировка', 5000],
    ['Антихром', 4000], ['Полировка стёкол', 7000], ['Шумоизоляция', 15000], ['Звёздное небо', 20000],
    ['Удаление вмятин', 2500], ['Цветной полиуретан', 15000], ['Карбон', 40000], ['Локальный ремонт ЛКП', 5000]
  ];
  /* Цены: четырёхзначные без пробела (9000), пятизначные с неразрывным (15 000), знак рубля тише числа */
  var fmt = function(n){ var s = n < 10000 ? String(n) : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); return s + '\u00a0<span class="rub">₽</span>'; };
  var P = function(n){ return '<span class="ot">от</span> ' + fmt(n); };
  var opts = document.getElementById('opts');
  items.forEach(function(it, i){
    var d = document.createElement('div'); d.className = 'opt';
    d.innerHTML = '<input type="checkbox" id="o' + i + '" value="' + it[1] + '"><label for="o' + i + '"><span>' + it[0] + '</span><span>' + P(it[1]) + '</span></label>';
    opts.appendChild(d);
  });
  var sum = document.getElementById('sum'), note = document.getElementById('sumNote');
  function recalc(){
    var s = 0, n = 0;
    opts.querySelectorAll('input:checked').forEach(function(c){ s += +c.value; n++; });
    sum.innerHTML = n ? P(s) : '0\u00a0<span class="rub">₽</span>';
    document.getElementById('sum2').innerHTML = sum.innerHTML;
    note.textContent = n ? 'Ориентир по минимальным ценам. Точную сумму назовём после осмотра.' : 'Отметьте хотя бы одну услугу';
    return n;
  }
  opts.addEventListener('change', recalc); recalc();
  var step = 0, panes = document.querySelectorAll('.qstep'), bars = document.querySelectorAll('.qbar span');
  var back = document.getElementById('qBack'), next = document.getElementById('qNext'), send = document.getElementById('qSend');
  var msg = document.getElementById('qMsg'), label = document.getElementById('qLabel');
  var titles = ['Какая у вас машина', 'Что нужно сделать, можно несколько', 'Куда прислать расчёт'];
  function show(i){
    step = i;
    panes.forEach(function(p, k){ p.classList.toggle('on', k === i); });
    bars.forEach(function(b, k){ b.classList.toggle('on', k <= i); });
    label.textContent = 'Шаг ' + (i + 1) + ' из 3. ' + titles[i];
    back.hidden = i === 0; next.hidden = i !== 1 || !recalc(); send.hidden = i !== 2;
    msg.className = 'qmsg'; msg.textContent = '';
  }
  function warn(t){ msg.className = 'qmsg on'; msg.textContent = t; }
  next.addEventListener('click', function(){
    if (step === 0 && !document.querySelector('input[name=cls]:checked')) return warn('Выберите класс машины.');
    if (step === 1 && !recalc()) return warn('Отметьте хотя бы одну услугу.');
    show(step + 1);
  });
  back.addEventListener('click', function(){ show(step - 1); });
  /* Класс машины: выбрали и сразу дальше. Услуги можно отметить несколько, поэтому там кнопка «Узнать точную цену» */
  document.querySelectorAll('input[name=cls]').forEach(function(r){ r.addEventListener('click', function(){ setTimeout(function(){ if (step === 0) show(1); }, 260); }); });
  opts.addEventListener('change', function(){ if (step === 1) next.hidden = !recalc(); });
  var file = document.getElementById('photo'), files = document.getElementById('files');
  file.addEventListener('change', function(){ files.textContent = file.files.length ? 'Прикреплено фото: ' + file.files.length : ''; });
  document.getElementById('quiz').addEventListener('submit', function(e){
    e.preventDefault();
    var tel = document.getElementById('tel').value.trim(), ok = document.getElementById('ok').checked;
    if (!tel) return warn('Укажите телефон, чтобы мы могли связаться.');
    if (!ok) return warn('Отметьте согласие на обработку персональных данных.');
    msg.className = 'qmsg on done';
    msg.textContent = 'Это прототип: заявка никуда не отправлена. В рабочей версии она сохранится на сервере и придёт уведомлением в Telegram студии.';
  });

  /* Полоса света один раз проходит по первому блоку и исчезает */
  if (!reduce) document.getElementById('first').classList.add('sweep');

  /* Свет проходит по всему листу при загрузке */
  if (!reduce) {
    sheen.style.setProperty('--sx', '-75%');
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      sheen.style.transition = 'transform 2.4s cubic-bezier(.2,.7,.1,1)'; prog();
      setTimeout(function(){ sheen.style.transition = ''; }, 2500);
    }); });
  }

  /* Окно услуги */
  var TODO = '<span class="todo">уточняем</span>';
  var SVC = {
    polirovka: {t:'Полировка', p:P(9000), q:0, l:'Полировка снимает тонкий повреждённый слой лака. Уходят «паутинка», голограммы после моек и мутность, кузов снова глубоко отражает свет. Чтобы результат держался дольше, после полировки лак защищают керамикой или воском.', s:[['Убирает','паутинку, голограммы, мелкие царапины'],['После','защита керамикой или воском'],['На видео','BMW E34 4.6 после глубокой полировки с керамикой']]},
    bronplenka: {t:'Бронеплёнка', p:P(15000), q:2, l:'Прозрачная полиуретановая плёнка принимает удар на себя: сколы от камней, песок и реагенты остаются на ней, а не на лаке. Бывает глянцевая и матовая. Можно защитить только зоны риска или всю машину.', s:[['Защищает от','сколов, песка, реагентов'],['Варианты','зоны риска или вся машина'],['На фото','Porsche Cayenne: клеим прозрачную плёнку на перед']]},
    himchistka: {t:'Химчистка и реставрация', p:P(6000), q:1, l:'Чистим сиденья, потолок, ковры и пластик, выводим пятна и запахи. Если кожа потёрлась или треснула, восстанавливаем её или перешиваем салон целиком. Примеры в блоке «До и после», вкладка «Салон».', s:[['Химчистка',P(6000)],['Перешив салона',P(35000)],['Восстановление пластика',P(10000)]]},
    tonirovka: {t:'Тонировка', p:P(5000), q:3, l:'Плёнка на стёкла: в салоне меньше солнца и бликов, больше приватности. Плёнку подбираем по светопропускаемости. Тонируем и оптику: фары и задние фонари.', s:[['Стёкла','задняя полусфера, боковые, лобовое'],['Оптика','фары и задние фонари'],['На фото','Mercedes S-класс в нашей студии']]},
    poliuretan: {t:'Цветной полиуретан', p:P(15000), q:9, l:'Цветная полиуретановая плёнка меняет цвет машины и защищает лак от сколов и песка так же, как прозрачная бронеплёнка. Заводская краска остаётся под ней нетронутой.', s:[['На фото','BMW G20 целиком в цветном полиуретане VEGA PPF, сверху керамика'],['Ещё пример','Mercedes E-класс на первом экране']]},
    shumka: {t:'Шумоизоляция', p:P(15000), q:6, l:'Снимаем обшивку и сиденья, проклеиваем металл виброизоляцией и сверху шумопоглотителем. Делаем пол, арки, двери и багажник, можно по отдельности. После сборки в салоне заметно тише.', s:[['Зоны','пол, арки, двери, багажник'],['На фото','Mazda 3 в работе, Infiniti QX в «До и после»']]}
  };
  var dlg = document.getElementById('svcDlg'), cur = null;
  function openSvc(row){
    var d = SVC[row.dataset.svc]; if (!d) return; cur = d;
    document.getElementById('dlgTitle').textContent = d.t;
    document.getElementById('dlgPrice').innerHTML = d.p;
    document.getElementById('dlgLong').textContent = d.l;
    var dp = document.getElementById('dlgPic'); dp.innerHTML = row.querySelector('.pic').innerHTML;
    var dv = dp.querySelector('video'); if (dv) { dv.removeAttribute('data-lazyplay'); if (!reduce) { dv.preload = 'auto'; dv.play().catch(function(){}); } }
    document.getElementById('dlgSpec').innerHTML = d.s.map(function(x){ return '<div class="groove-b"><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('');
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }
  function closeSvc(){ if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
  document.querySelectorAll('.svc-row[data-svc]').forEach(function(row){
    row.addEventListener('click', function(){ openSvc(row); });
    row.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSvc(row); } });
  });
  document.getElementById('dlgClose').addEventListener('click', closeSvc);
  dlg.addEventListener('click', function(e){ if (e.target === dlg) closeSvc(); });
  document.getElementById('dlgCalc').addEventListener('click', function(){
    closeSvc();
    if (cur) { var box = document.getElementById('o' + cur.q); if (box) { box.checked = true; recalc(); } }
    document.getElementById('raschet').scrollIntoView({behavior: reduce ? 'auto' : 'smooth'});
  });


  /* Окно машины: галерея и список работ */
  var CARS = {
    e34: {t:'BMW E34 4.6', s:'Эксклюзивный проект клиента. В России такая одна.', q:[0],
      ph:[['e34_34','BMW E34 4.6 в студии под шестигранными лампами'],['e34_hood','Капот после полировки: в лаке отражаются лампы'],['e34_trunk','Крышка багажника после полировки'],['e34_fw','Переднее колесо BBS'],['e34_rw','Заднее крыло и колесо BBS'],['e34_lamp','Задний фонарь и бампер крупно'],['e34_brake','Суппорт Brembo за спицами диска']],
      d:['Глубокая полировка кузова','Керамика по лаку','Химчистка дисков']},
    g20: {t:'BMW 3 серии G20', s:'Целиком в цветном защитном полиуретане, с полным разбором машины.', q:[9,1],
      ph:[['g20_34','BMW G20 в цветном полиуретане, вид спереди сбоку'],['g20_front','BMW G20 спереди'],['g20_side','Заднее крыло и колесо'],['g20_rear','BMW G20 сзади'],['g20_head','Фара крупно'],['g20_wheel','Переднее крыло и колесо']],
      d:['Подготовка кузова и обвесов под оклейку','Полный разбор автомобиля','Оклейка целиком цветным защитным полиуретаном VEGA PPF','Нанесение керамики','Химчистка салона']},
    w213: {t:'Mercedes-Benz E-класс', s:'Целиком в цветном полиуретане, капот из настоящего карбона.', q:[9,10],
      ph:[['w213_34','Mercedes E-класс у ворот студии на закате'],['w213_front','Mercedes E-класс спереди'],['w213_rear','Задняя часть: плёнка меняет оттенок на свету'],['w213_head','Фара и капот из карбона'],['w213_carbon','Карбоновый капот крупно']],
      d:['Оклейка кузова целиком цветным полиуретаном','Капот из настоящего карбона']},
    gts: {t:'Porsche Cayenne GTS', s:'Затонировали фары и задние фонари плёнкой.', q:[3],
      ph:[['gts_rear','Porsche Cayenne GTS сзади: затонированные фонари'],['gts_front','Porsche Cayenne GTS спереди: затонированные фары']],
      d:['Тонировка фар','Тонировка задних фонарей']}
  };
  var carDlg = document.getElementById('carDlg'), gal = document.getElementById('carGal'), curCar = null;
  var cPrev = document.getElementById('carPrev'), cNext = document.getElementById('carNext'), cCnt = document.getElementById('carCnt');
  function galStep(){ var a = gal.children[0]; return a ? a.offsetWidth + 8 : 1; }
  function galState(){
    var n = gal.children.length, i = Math.min(n - 1, Math.round(gal.scrollLeft / galStep()));
    cCnt.textContent = 'Фото ' + (i + 1) + ' из ' + n;
    cPrev.disabled = gal.scrollLeft <= 2;
    cNext.disabled = gal.scrollLeft >= gal.scrollWidth - gal.clientWidth - 2;
  }
  gal.addEventListener('scroll', galState, {passive:true});
  cPrev.addEventListener('click', function(){ gal.scrollBy({left: -galStep(), behavior: reduce ? 'auto' : 'smooth'}); });
  cNext.addEventListener('click', function(){ gal.scrollBy({left: galStep(), behavior: reduce ? 'auto' : 'smooth'}); });
  function openCar(key){
    var c = CARS[key]; if (!c) return; curCar = c;
    document.getElementById('carTitle').textContent = c.t;
    document.getElementById('carSub').textContent = c.s;
    gal.innerHTML = c.ph.map(function(p, i){
      return '<img src="../img/' + p[0] + '.jpg" alt="' + p[1] + '" width="960" height="1280"' + (i > 2 ? ' loading="lazy"' : '') + '>';
    }).join('');
    document.getElementById('carDid').innerHTML = c.d.map(function(x){ return '<li class="groove-b">' + x + '</li>'; }).join('');
    var note = document.getElementById('carNote'); note.hidden = !c.n; note.textContent = c.n || '';
    if (carDlg.showModal) carDlg.showModal(); else carDlg.setAttribute('open', '');
    gal.scrollLeft = 0; galState();
  }
  function closeCar(){ if (carDlg.close) carDlg.close(); else carDlg.removeAttribute('open'); }
  document.querySelectorAll('.car.is-case').forEach(function(card){
    card.addEventListener('click', function(){ openCar(card.dataset.car); });
    card.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCar(card.dataset.car); } });
  });
  window.addEventListener('resize', function(){ if (carDlg.open) galState(); });
  document.getElementById('carClose').addEventListener('click', closeCar);
  carDlg.addEventListener('click', function(e){ if (e.target === carDlg) closeCar(); });

  /* Лента машин: медленно едет вправо до конца, потом обратно. Без копий карточек; пауза, когда её трогают */
  var cars = document.getElementById('cars');
  if (cars && !reduce) {
    (function(){
      var cpos = cars.scrollLeft, clast = null, cdir = 1, pauseUntil = 0, SPEED = 0.04;
      function hold(ms){ pauseUntil = performance.now() + ms; }
      ['pointerdown','touchstart','wheel'].forEach(function(ev){ cars.addEventListener(ev, function(){ hold(4000); }, {passive:true}); });
      cars.addEventListener('pointerenter', function(e){ if (e.pointerType === 'mouse') pauseUntil = Infinity; });
      cars.addEventListener('pointerleave', function(e){ if (e.pointerType === 'mouse' && !carDlg.open) hold(600); });
      cars.addEventListener('click', function(e){ if (e.target.closest('.is-case')) pauseUntil = Infinity; });
      carDlg.addEventListener('close', function(){ hold(1500); });
      (function carTick(ts){
        if (clast !== null) {
          var max = cars.scrollWidth - cars.clientWidth;
          if (ts > pauseUntil && max > 0) {
            cpos += (ts - clast) * SPEED * cdir;
            if (cpos >= max) { cpos = max; cdir = -1; hold(1800); }
            else if (cpos <= 0) { cpos = 0; cdir = 1; hold(1800); }
            cars.scrollLeft = cpos;
          } else { cpos = cars.scrollLeft; }
        }
        clast = ts; requestAnimationFrame(carTick);
      })(performance.now());
    })();
  }

  /* Первый экран: машины сменяют друг друга, в подписи модель и работа */
  (function(){
    var box = document.getElementById('heroShow'); if (!box) return;
    var slides = box.querySelectorAll('.hs'), dots = box.querySelectorAll('.hs-dots button'), cur = 0, timer = null, vis = true, DUR = 6000;
    function plan(){ clearTimeout(timer); if (!reduce && vis && !document.hidden) timer = setTimeout(function(){ go(cur + 1); }, DUR); }
    function go(i){
      slides[cur].classList.remove('on'); dots[cur].classList.remove('on');
      cur = (i + slides.length) % slides.length;
      slides[cur].classList.add('on'); void dots[cur].offsetWidth; dots[cur].classList.add('on');
      slides.forEach(function(s, k){ var v = s.querySelector('video'); if (!v) return; if (k === cur && !reduce) { try { v.currentTime = 0; } catch (e) {} v.play().catch(function(){}); } else v.pause(); });
      var nx = slides[(cur + 1) % slides.length].querySelector('img'); if (nx) nx.loading = 'eager';
      plan();
    }
    dots.forEach(function(d, i){ d.addEventListener('click', function(){ go(i); }); });
    var sx = null;
    box.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, {passive:true});
    box.addEventListener('touchend', function(e){ if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); sx = null; }, {passive:true});
    if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ vis = es[0].isIntersecting; if (vis) plan(); else clearTimeout(timer); }, {threshold: .2}).observe(box);
    document.addEventListener('visibilitychange', function(){ if (document.hidden) clearTimeout(timer); else plan(); });
    var n1 = slides[1] && slides[1].querySelector('img'); if (n1) n1.loading = 'eager';
    dots[0].classList.add('on'); plan();
  })();


  /* Видео: первый экран и полировка. При «уменьшить движение» стоит постер */
  var hv = document.getElementById('heroVid');
  if (hv && reduce) { hv.removeAttribute('autoplay'); hv.pause(); }
  var lazyVids = document.querySelectorAll('video[data-lazyplay]');
  if (!reduce && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function(es){
      es.forEach(function(e){
        var v = e.target;
        if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(function(){}); } else { v.pause(); }
      });
    }, {threshold: .25});
    lazyVids.forEach(function(v){ vio.observe(v); });
  }

  /* Маршрут: на телефоне открываем Яндекс Навигатор, если его нет, то Яндекс Карты */
  var NAVI = 'yandexnavi://build_route_on_map?lat_to=60.067030&lon_to=30.293096';
  var touch = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  document.querySelectorAll('.js-route').forEach(function(a){
    a.addEventListener('click', function(e){
      if (!touch) return;
      e.preventDefault();
      var t0 = Date.now(), fallback = a.href;
      window.location.href = NAVI;
      setTimeout(function(){ if (!document.hidden && Date.now() - t0 < 2600) window.location.href = fallback; }, 1600);
    });
  });

  /* Персональные данные: черновик политики и согласия */
  var pol = document.getElementById('policyDlg');
  document.querySelectorAll('.js-policy').forEach(function(a){
    a.addEventListener('click', function(e){ e.preventDefault(); if (pol.showModal) pol.showModal(); else pol.setAttribute('open', ''); });
  });
  function closePol(){ if (pol.close) pol.close(); else pol.removeAttribute('open'); }
  document.getElementById('polClose').addEventListener('click', closePol);
  pol.addEventListener('click', function(e){ if (e.target === pol) closePol(); });

  /* До и после: вкладки Кузов / Салон / Мотор и шумка */
  var chips = document.querySelectorAll('.wchips button'), cases = document.querySelectorAll('#raboty .case');
  /* ===== Карусель-витрина: главная карточка крупно по центру, соседние меньше и темнее ===== */
  function makeCF(root, cfg){
    var view = root.querySelector('.cf-view'), track = root.querySelector('.cf-track'), act = 0, swiped = false;
    var all = [].slice.call(track.children);
    var ARW = function(d){ return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; };
    var nav = document.createElement('div'); nav.className = 'cf-nav';
    nav.innerHTML = '<button class="cf-arr" type="button" aria-label="Предыдущая">' + ARW('M15 5l-7 7 7 7') + '</button><div class="cf-dots"></div><button class="cf-arr" type="button" aria-label="Следующая">' + ARW('M9 5l7 7-7 7') + '</button>';
    root.appendChild(nav);
    var prev = nav.children[0], dots = nav.children[1], next = nav.children[2];
    if (cfg.cap) root.insertBefore(cfg.cap, nav);
    function vis(){ return all.filter(function(c){ return !c.hidden; }); }
    function buildDots(){
      dots.innerHTML = '';
      var v = vis();
      v.forEach(function(c, k){
        var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', (k + 1) + ' из ' + v.length); b.innerHTML = '<i></i>';
        b.addEventListener('click', function(){ go(k); }); dots.appendChild(b);
      });
    }
    function layout(){
      var v = vis(), W = view.clientWidth, s = cfg.size(W), x = 0;
      v.forEach(function(c, k){
        var on = k === act;
        c.classList.toggle('on', on);
        c.style.width = (on ? s.wa : s.wn) + 'px';
        c.style.height = (on ? s.ha : s.hn) + 'px';
        if (on) c.removeAttribute('inert'); else c.setAttribute('inert', '');
        if (k < act) x += s.wn + s.gap;
      });
      track.style.gap = s.gap + 'px';
      view.style.height = (s.ha + 36) + 'px';
      /* в начале и в конце не оставляем пустоту: первая карточка встаёт к краю колонки */
      var wr = root.closest('.wrap'), pad = wr ? parseFloat(getComputedStyle(wr).paddingLeft) || 0 : 0;
      var T = (v.length - 1) * (s.wn + s.gap) + s.wa, tx = W / 2 - x - s.wa / 2;
      if (T + 2 * pad <= W) tx = (W - T) / 2; else tx = Math.min(pad, Math.max(W - pad - T, tx));
      view.classList.toggle('at-start', tx >= pad - 1);
      view.classList.toggle('at-end', tx <= W - pad - T + 1);
      track.style.transform = 'translateX(' + Math.round(tx) + 'px)';
      prev.disabled = act === 0; next.disabled = act === v.length - 1;
      [].forEach.call(dots.children, function(d, k){ d.classList.toggle('on', k === act); });
      if (cfg.change) cfg.change(v[act], act, v.length);
    }
    function go(k){ act = Math.max(0, Math.min(vis().length - 1, k)); layout(); }
    prev.addEventListener('click', function(){ go(act - 1); });
    next.addEventListener('click', function(){ go(act + 1); });
    /* нажали на соседнюю карточку: она становится главной, ничего не открываем */
    track.addEventListener('click', function(e){
      var c = e.target.closest('.cf-track > *');
      if (swiped) { e.stopPropagation(); e.preventDefault(); swiped = false; return; }
      if (c && !c.classList.contains('on')) { e.stopPropagation(); e.preventDefault(); go(vis().indexOf(c)); }
    }, true);
    /* соседние карточки неактивны (inert), поэтому клики по ним ловим на дорожке */
    view.addEventListener('click', function(e){
      if (e.target.closest('.cf-track > .on')) return;
      var r = e.clientX, v = vis(), best = -1, bd = 1e9;
      v.forEach(function(c, k){ var b = c.getBoundingClientRect(); var d = Math.abs((b.left + b.right) / 2 - r); if (d < bd) { bd = d; best = k; } });
      if (swiped) { swiped = false; return; }
      if (best >= 0 && best !== act) go(best);
    });
    /* свайп пальцем и перетаскивание мышью */
    var sx = null, sy = null;
    view.addEventListener('pointerdown', function(e){ if (e.target.closest('input[type=range], .seg')) { sx = null; return; } sx = e.clientX; sy = e.clientY; });
    view.addEventListener('pointerup', function(e){
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { swiped = true; go(act + (dx < 0 ? 1 : -1)); setTimeout(function(){ swiped = false; }, 60); }
    });
    view.addEventListener('pointercancel', function(){ sx = null; });
    root.addEventListener('keydown', function(e){
      if (e.target.matches('input[type=range]')) return;
      if (e.key === 'ArrowLeft') go(act - 1); else if (e.key === 'ArrowRight') go(act + 1);
    });
    var rw = 0; window.addEventListener('resize', function(){ if (view.clientWidth !== rw) { rw = view.clientWidth; layout(); } });
    buildDots(); layout(); rw = view.clientWidth;
    return { reset: function(){ act = 0; buildDots(); layout(); }, go: go };
  }

  /* Услуги: шесть карточек. На активной играет видео полировки, когда блок на экране */
  var cfSvc = document.querySelector('.cf-svc');
  if (cfSvc) {
    var svcIn = false, svcAct = null;
    var svcVideo = function(){ cfSvc.querySelectorAll('video').forEach(function(v){ if (!reduce && svcIn && v.closest('.svc-row') === svcAct) { v.preload = 'auto'; v.play().catch(function(){}); } else v.pause(); }); };
    makeCF(cfSvc, {
      size: function(W){
        /* высота = фото 4:3 + панель с текстом */
        var wa, ih = W < 600 ? 196 : 206, ha;
        if (W < 600) { wa = Math.round(Math.min(W * .8, 340)); ha = Math.round(wa * .75) + ih; return {wa: wa, ha: ha, wn: Math.round(wa * .42), hn: Math.round(ha * .78), gap: 8}; }
        wa = W < 1000 ? 360 : 400; ha = Math.round(wa * .75) + ih;
        return {wa: wa, ha: ha, wn: W < 1000 ? 150 : 170, hn: Math.round(ha * .78), gap: W < 1000 ? 10 : 12};
      },
      change: function(c){ svcAct = c; svcVideo(); }
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ svcIn = es[0].isIntersecting; svcVideo(); }, {threshold: .2}).observe(cfSvc);
  }

  /* До и после: вкладки Кузов / Салон / Мотор и шумка, внутри карусель */
  var chips = document.querySelectorAll('.wchips button'), cases = document.querySelectorAll('#raboty .case');
  var cfCasesRoot = document.querySelector('.cf-cases'), cfCases = null;
  if (cfCasesRoot) {
    var cap = document.createElement('div'); cap.className = 'cf-cap'; cap.setAttribute('aria-live', 'polite');
    cap.innerHTML = '<span class="cf-num"></span><h3></h3><p></p>';
    cfCases = makeCF(cfCasesRoot, {
      cap: cap,
      size: function(W){
        var wa, r = 8 / 9;
        if (W < 600) { wa = Math.round(W * .84); return {wa: wa, ha: Math.round(wa * r), wn: Math.round(wa * .3), hn: Math.round(wa * r * .8), gap: 8}; }
        wa = Math.min(620, Math.round(W * .56)); return {wa: wa, ha: Math.round(wa * r), wn: Math.round(wa * .28), hn: Math.round(wa * r * .8), gap: 12};
      },
      change: function(c, k, n){
        if (!c) return;
        cap.querySelector('.cf-num').textContent = (k + 1) + ' / ' + n;
        cap.querySelector('h3').textContent = c.querySelector('h3').textContent;
        cap.querySelector('p').textContent = (c.querySelector('.cap') || {textContent: ''}).textContent;
      }
    });
  }
  function setCat(c){
    chips.forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.cat === c ? 'true' : 'false'); });
    cases.forEach(function(el){ el.hidden = el.dataset.cat !== c; });
    if (cfCases) cfCases.reset();
  }

  /* ===== Меню ===== */
  var menu = document.getElementById('menu'), burger = document.querySelector('.burger');
  if (menu && burger) {
    var setMenu = function(open){
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.querySelector('.bt').textContent = open ? 'Закрыть' : 'Меню';
      if (open) {
        menu.hidden = false; document.documentElement.classList.add('menu-open');
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ menu.classList.add('open'); }); });
      } else {
        menu.classList.remove('open'); document.documentElement.classList.remove('menu-open');
        setTimeout(function(){ if (!menu.classList.contains('open')) menu.hidden = true; }, 320);
      }
    };
    burger.addEventListener('click', function(){ setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function(e){ if (e.target.closest('.menu-list a')) setMenu(false); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });
    /* подсвечиваем раздел, который сейчас на экране */
    var mLinks = [].slice.call(menu.querySelectorAll('.menu-list a'));
    var mSecs = mLinks.map(function(a){ return document.getElementById(a.getAttribute('href').slice(1)); });
    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function(es){
        es.forEach(function(e){ if (e.isIntersecting) { var k = mSecs.indexOf(e.target); mLinks.forEach(function(a, n){ a.classList.toggle('cur', n === k); }); } });
      }, {rootMargin: '-45% 0px -50% 0px'});
      mSecs.forEach(function(s){ if (s) spy.observe(s); });
    }
  }
  chips.forEach(function(b){ b.addEventListener('click', function(){ setCat(b.dataset.cat); }); });
  setCat('kuzov');
  document.querySelectorAll('[data-calc]').forEach(function(a){
    a.addEventListener('click', function(){ var b = document.getElementById('o' + a.dataset.calc); if (b && !b.checked) { b.checked = true; recalc(); } });
  });

  /* Было / Стало: переключатель; сам листается, пока карточка на экране и её не трогали */
  document.querySelectorAll('.frame.flip').forEach(function(f){
    var btns = f.querySelectorAll('.seg button'), auto = !reduce, timer = null;
    function show(v){ f.classList.toggle('show-a', v === 'a'); btns.forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'); }); }
    btns.forEach(function(b){ b.addEventListener('click', function(){ auto = false; clearInterval(timer); show(b.dataset.v); }); });
    if (auto && 'IntersectionObserver' in window) {
      new IntersectionObserver(function(es){
        es.forEach(function(e){
          clearInterval(timer);
          if (e.isIntersecting && auto) timer = setInterval(function(){ show(f.classList.contains('show-a') ? 'b' : 'a'); }, 2600);
        });
      }, {threshold: .6}).observe(f);
    }
  });
  /* Звёздное небо: мерцают звёзды, время от времени пролетает падающая звезда (своя область видимости, чтобы не задеть ленту машин) */
  (function(){
  var cv = document.getElementById('skyCv');
  if (cv && cv.getContext) {
    var g2 = cv.getContext('2d'), W = 0, H = 0, stars = [], shots = [], skyOn = false, last = 0, nextShot = 0;
    var sizeSky = function(){
      var r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (!r.width || !r.height) return;
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      g2.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      var n = Math.min(260, Math.round(W * H / 7000));
      for (var i = 0; i < n; i++) stars.push({x: Math.random() * W, y: Math.random() * H, r: .35 + Math.random() * 1.05, p: Math.random() * 6.283, s: .5 + Math.random() * 1.9, b: .3 + Math.random() * .7});
      if (!skyOn) drawSky(0, 0);
    };
    var addShot = function(){
      var dir = Math.random() < .5 ? -1 : 1, ang = (16 + Math.random() * 24) * Math.PI / 180;
      shots.push({x: W * (.2 + Math.random() * .75), y: H * (.04 + Math.random() * .4), vx: Math.cos(ang) * dir, vy: Math.sin(ang),
        sp: Math.max(380, W * .5) * (.8 + Math.random() * .5), len: Math.min(W * .22, 110 + Math.random() * 130), t: 0, life: .8 + Math.random() * .7});
    };
    var drawSky = function(ts, dt){
      g2.clearRect(0, 0, W, H);
      var tt = ts / 1000;
      g2.fillStyle = '#f2f6ff';
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        g2.globalAlpha = s.b * (.5 + .5 * Math.sin(tt * s.s + s.p));
        g2.beginPath(); g2.arc(s.x, s.y, s.r, 0, 6.283); g2.fill();
      }
      g2.globalAlpha = 1;
      for (var j = shots.length - 1; j >= 0; j--) {
        var m = shots[j]; m.t += dt;
        var k = m.t / m.life;
        if (k >= 1) { shots.splice(j, 1); continue; }
        var d = m.sp * m.t, hx = m.x + m.vx * d, hy = m.y + m.vy * d, tl = m.len * Math.min(1, k * 4);
        var tx = hx - m.vx * tl, ty = hy - m.vy * tl, f = k < .12 ? k / .12 : Math.pow(1 - (k - .12) / .88, 1.4);
        var gr = g2.createLinearGradient(hx, hy, tx, ty);
        gr.addColorStop(0, 'rgba(255,255,255,' + (.95 * f) + ')');
        gr.addColorStop(.3, 'rgba(196,216,255,' + (.42 * f) + ')');
        gr.addColorStop(1, 'rgba(196,216,255,0)');
        g2.strokeStyle = gr; g2.lineWidth = 1.7; g2.lineCap = 'round';
        g2.beginPath(); g2.moveTo(hx, hy); g2.lineTo(tx, ty); g2.stroke();
        g2.globalAlpha = f; g2.beginPath(); g2.arc(hx, hy, 1.7, 0, 6.283); g2.fillStyle = '#fff'; g2.fill(); g2.globalAlpha = 1;
      }
    };
    var tick = function(ts){
      if (!skyOn) return;
      var dt = last ? Math.min((ts - last) / 1000, .05) : 0; last = ts;
      if (!nextShot) nextShot = ts + 700;
      if (ts > nextShot) { addShot(); nextShot = ts + 1600 + Math.random() * 3400; }
      drawSky(ts, dt);
      requestAnimationFrame(tick);
    };
    sizeSky();
    if ('ResizeObserver' in window) new ResizeObserver(sizeSky).observe(cv); else window.addEventListener('resize', sizeSky);
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function(es){ es.forEach(function(e){
        if (e.isIntersecting && !skyOn) { skyOn = true; last = 0; requestAnimationFrame(tick); }
        else if (!e.isIntersecting) skyOn = false;
      }); }, {threshold: .05}).observe(cv);
    }
  }

  })();

  /* Не оставляем одно слово на последней строке абзаца */
  document.querySelectorAll('.sec-head p, .lead, .kz-note, .cb-t p, .sky-text p, .xcard p, .foot p, .want').forEach(function(p){
    var w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT), n, lastN = null;
    while ((n = w.nextNode())) if (n.nodeValue.trim()) lastN = n;
    if (lastN) lastN.nodeValue = lastN.nodeValue.replace(/ (\S+\s*)$/, ' $1');
  });

  show(0);
})();

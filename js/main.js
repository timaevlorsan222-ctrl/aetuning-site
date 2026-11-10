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
  var titles = ['Какая у вас машина', 'Что нужно сделать', 'Куда прислать расчёт'];
  function show(i){
    step = i;
    panes.forEach(function(p, k){ p.classList.toggle('on', k === i); });
    bars.forEach(function(b, k){ b.classList.toggle('on', k <= i); });
    label.textContent = 'Шаг ' + (i + 1) + ' из 3. ' + titles[i];
    back.hidden = i === 0; next.hidden = i === 2; send.hidden = i !== 2;
    msg.className = 'qmsg'; msg.textContent = '';
  }
  function warn(t){ msg.className = 'qmsg on'; msg.textContent = t; }
  next.addEventListener('click', function(){
    if (step === 0 && !document.querySelector('input[name=cls]:checked')) return warn('Выберите класс машины.');
    if (step === 1 && !recalc()) return warn('Отметьте хотя бы одну услугу.');
    show(step + 1);
  });
  back.addEventListener('click', function(){ show(step - 1); });
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
    tonirovka: {t:'Тонировка', p:P(5000), q:3, l:'Плёнка на стёкла: в салоне меньше солнца и бликов, больше приватности. Плёнку подбираем по светопропускаемости.', s:[['Стёкла','задняя полусфера, боковые, лобовое'],['Фото','<span class="todo">иллюстрация, заменим на работу студии</span>']]},
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
      d:['Оклейка кузова целиком цветным полиуретаном','Капот из настоящего карбона']}
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
      return '<img src="img/' + p[0] + '.jpg" alt="' + p[1] + '" width="960" height="1280"' + (i > 2 ? ' loading="lazy"' : '') + '>';
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
  document.getElementById('carCalc').addEventListener('click', function(){
    closeCar();
    if (curCar) { curCar.q.forEach(function(q){ var b = document.getElementById('o' + q); if (b) b.checked = true; }); recalc(); }
    document.getElementById('raschet').scrollIntoView({behavior: reduce ? 'auto' : 'smooth'});
  });

  /* Лента машин медленно едет сама; пауза, когда её трогают */
  var cars = document.getElementById('cars');
  if (cars && !reduce) {
    var n = cars.children.length / 2, loop = 0, pos = 0, last = null, pauseUntil = 0;
    function measure(){ loop = cars.children[n].offsetLeft - cars.children[0].offsetLeft; }
    measure(); window.addEventListener('resize', measure);
    function hold(ms){ pauseUntil = performance.now() + ms; }
    ['pointerdown','touchstart','wheel'].forEach(function(ev){ cars.addEventListener(ev, function(){ hold(4000); }, {passive:true}); });
    cars.addEventListener('mouseenter', function(){ pauseUntil = Infinity; });
    cars.addEventListener('mouseleave', function(){ if (!carDlg.open) hold(600); });
    cars.addEventListener('click', function(e){ if (e.target.closest('.is-case')) pauseUntil = Infinity; });
    carDlg.addEventListener('close', function(){ hold(1500); });
    (function tick(ts){
      if (last !== null) {
        if (ts > pauseUntil) {
          pos += (ts - last) * 0.03;
          if (loop > 0 && pos >= loop) pos -= loop;
          cars.scrollLeft = pos;
        } else { pos = cars.scrollLeft; }
      }
      last = ts; requestAnimationFrame(tick);
    })(performance.now());
  }

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
  function setCat(c){
    chips.forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.cat === c ? 'true' : 'false'); });
    cases.forEach(function(el){ el.hidden = el.dataset.cat !== c; });
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
  var sv = document.getElementById('skyVid');
  if (sv && !reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { sv.preload = 'auto'; sv.play().catch(function(){}); } else sv.pause(); }); }, {threshold: .15}).observe(sv);
  }

  show(0);
})();

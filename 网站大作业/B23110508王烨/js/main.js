/* ================================================
   野趣营地 —— 公共脚本
   各模块先判断页面上是否存在对应元素，再进行初始化，
   因此所有页面共用这一个文件。
   ================================================ */
document.addEventListener('DOMContentLoaded', function () {
  initMenu();
  initBackTop();
  initSlider();
  initImageMap();
  initCampFilter();
  initGearList();
  initFaq();
  initToc();
  initSignupForm();
});

/* ---------- 1. 窄屏下的折叠菜单 ---------- */
function initMenu() {
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.nav');
  if (!toggle || !nav) return;
  toggle.onclick = function () { nav.classList.toggle('open'); };
}

/* ---------- 2. 回到顶部按钮 ---------- */
function initBackTop() {
  var btn = document.querySelector('.back-top');
  if (!btn) return;
  window.addEventListener('scroll', function () {
    btn.classList.toggle('show', window.scrollY > 400);
  });
  btn.onclick = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); };
}

/* ---------- 3. 首页图片轮播 ---------- */
function initSlider() {
  var slider = document.querySelector('.slider');
  if (!slider) return;
  var track = slider.querySelector('.slides');
  var count = slider.querySelectorAll('.slide').length;
  var dotsBox = slider.querySelector('.dots');
  var index = 0, timer = null;

  // 根据图片数量动态生成指示圆点
  for (var i = 0; i < count; i++) {
    var dot = document.createElement('span');
    dot.setAttribute('data-i', i);
    dotsBox.appendChild(dot);
  }
  var dots = dotsBox.querySelectorAll('span');

  function go(n) {
    index = (n + count) % count;                       // 首尾循环
    track.style.transform = 'translateX(' + (-index * 100 / count) + '%)';
    dots.forEach(function (d, k) { d.classList.toggle('on', k === index); });
  }
  function start() { stop(); timer = setInterval(function () { go(index + 1); }, 4000); }
  function stop() { clearInterval(timer); }

  slider.querySelector('.prev').onclick = function () { go(index - 1); };
  slider.querySelector('.next').onclick = function () { go(index + 1); };
  dotsBox.onclick = function (e) {
    if (e.target.tagName === 'SPAN') go(+e.target.getAttribute('data-i'));
  };
  slider.onmouseenter = stop;                          // 鼠标悬停暂停
  slider.onmouseleave = start;
  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();                // 页面不可见时停止计时
  });
  go(0);
  start();
}

/* ---------- 4. 全景图热点：坐标随图片缩放 + 悬浮提示 ---------- */
function initImageMap() {
  var img = document.querySelector('img[usemap]');
  if (!img) return;
  var areas = document.querySelectorAll('map area');
  var tip = document.querySelector('.map-tip');
  var natural = 1200;                                   // 设计坐标所基于的图片原始宽度

  // 保存原始坐标，窗口缩放时按比例重新计算
  areas.forEach(function (a) { a.dataset.origin = a.coords; });
  function resize() {
    var scale = img.clientWidth / natural;
    areas.forEach(function (a) {
      a.coords = a.dataset.origin.split(',').map(function (v) {
        return Math.round(v * scale);
      }).join(',');
    });
  }
  window.addEventListener('resize', resize);
  if (img.complete) resize(); else img.onload = resize;

  // 鼠标移入热点时显示提示框
  var box = img.parentNode;
  areas.forEach(function (a) {
    a.addEventListener('mousemove', function (e) {
      var r = box.getBoundingClientRect();
      tip.textContent = a.dataset.tip;
      tip.style.left = (e.clientX - r.left + 14) + 'px';
      tip.style.top = (e.clientY - r.top + 14) + 'px';
      tip.style.display = 'block';
    });
    a.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
  });
}

/* ---------- 5. 营地推荐：分类筛选 ---------- */
function initCampFilter() {
  var filter = document.querySelector('.filter');
  if (!filter) return;
  var camps = document.querySelectorAll('.camp');
  var counter = document.querySelector('#campCount');
  filter.addEventListener('click', function (e) {
    if (e.target.tagName !== 'BUTTON') return;
    filter.querySelectorAll('button').forEach(function (b) { b.classList.remove('on'); });
    e.target.classList.add('on');
    var type = e.target.dataset.type, shown = 0;
    camps.forEach(function (c) {
      var match = type === 'all' || c.dataset.type.indexOf(type) > -1;
      c.classList.toggle('hide', !match);
      if (match) shown++;
    });
    counter.textContent = shown;
  });
}

/* ---------- 6. 装备挑选：清单勾选 + 负重统计 ---------- */
function initGearList() {
  var list = document.querySelector('.checklist');
  if (!list) return;
  var boxes = list.querySelectorAll('input[type=checkbox]');
  var KEY = 'camp-gear-list';

  // 从浏览器本地存储恢复上次勾选结果
  var saved = [];
  try { saved = JSON.parse(localStorage.getItem(KEY)) || []; } catch (err) { saved = []; }
  boxes.forEach(function (b) { b.checked = saved.indexOf(b.value) > -1; });

  function update() {
    var weight = 0, checked = 0, values = [];
    boxes.forEach(function (b) {
      if (b.checked) { weight += +b.dataset.weight; checked++; values.push(b.value); }
    });
    var percent = Math.round(checked / boxes.length * 100);
    document.querySelector('#gearCount').textContent = checked + ' / ' + boxes.length;
    document.querySelector('#gearWeight').textContent = (weight / 1000).toFixed(1);
    document.querySelector('#gearBar').style.width = percent + '%';

    // 根据总负重给出建议
    var level;
    if (checked === 0) level = '还没有选择装备，先从“必备”开始吧！';
    else if (weight <= 8000) level = '轻量级：适合徒步露营，背负轻松 👍';
    else if (weight <= 15000) level = '标准级：适合一晚两天的常规露营。';
    else level = '重装级：建议自驾露营，或与同伴分摊重量。';
    document.querySelector('#gearLevel').textContent = level;
    try { localStorage.setItem(KEY, JSON.stringify(values)); } catch (err) { /* 隐私模式下忽略 */ }
  }
  list.addEventListener('change', update);
  document.querySelector('#gearReset').onclick = function () {
    boxes.forEach(function (b) { b.checked = false; });
    update();
  };
  document.querySelector('#gearBasic').onclick = function () {
    boxes.forEach(function (b) { b.checked = b.dataset.must === '1'; });
    update();
  };
  update();
}

/* ---------- 7. 露营攻略：FAQ 手风琴 ---------- */
function initFaq() {
  var qs = document.querySelectorAll('.faq .q');
  qs.forEach(function (q) {
    q.onclick = function () {
      var isOpen = q.classList.contains('open');
      qs.forEach(function (other) {                     // 同一时间只展开一项
        other.classList.remove('open');
        other.nextElementSibling.classList.remove('open');
      });
      if (!isOpen) { q.classList.add('open'); q.nextElementSibling.classList.add('open'); }
    };
  });
}

/* ---------- 8. 露营攻略：目录随滚动高亮 ---------- */
function initToc() {
  var links = document.querySelectorAll('.toc a');
  if (!links.length) return;
  window.addEventListener('scroll', function () {
    var current = links[0];
    links.forEach(function (a) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target && target.getBoundingClientRect().top < 140) current = a;
    });
    links.forEach(function (a) { a.classList.toggle('on', a === current); });
  });
}

/* ---------- 9. 报名表单：实时校验 + 提交确认 ---------- */
function initSignupForm() {
  var form = document.querySelector('#signupForm');
  if (!form) return;

  var rules = {
    name: function (v) { return /^[一-龥]{2,10}$|^[a-zA-Z ]{2,20}$/.test(v) || '请输入 2~10 个汉字或 2~20 个英文字母'; },
    phone: function (v) { return /^1[3-9]\d{9}$/.test(v) || '请输入 11 位有效手机号'; },
    email: function (v) { return /^[\w.-]+@[\w-]+(\.[\w-]+)+$/.test(v) || '邮箱格式不正确'; },
    camp: function (v) { return v !== '' || '请选择想去的营地'; },
    date: function (v) {
      if (!v) return '请选择出发日期';
      var today = new Date(); today.setHours(0, 0, 0, 0);
      return new Date(v) >= today || '出发日期不能早于今天';
    },
    people: function (v) { return (v >= 1 && v <= 10) || '同行人数应在 1~10 之间'; },
    agree: function (v, el) { return el.checked || '请阅读并同意安全须知'; }
  };

  function check(name) {
    var el = form.elements[name];
    var result = rules[name](el.value.trim(), el);
    var row = el.closest('.half') || el.closest('.form-row');
    var msg = result === true ? '' : result;
    row.querySelector('.err').textContent = msg;
    row.classList.toggle('invalid', msg !== '');
    return msg === '';
  }

  // 失去焦点或修改时即时校验
  Object.keys(rules).forEach(function (name) {
    var el = form.elements[name];
    el.addEventListener('blur', function () { check(name); });
    el.addEventListener('change', function () { check(name); });
  });

  // 留言字数统计
  var msg = form.elements.message, count = document.querySelector('#msgCount');
  msg.addEventListener('input', function () { count.textContent = msg.value.length; });

  // 日期选择框最小值设为今天
  form.elements.date.min = new Date().toISOString().slice(0, 10);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = Object.keys(rules).map(check).every(Boolean);
    if (!ok) { form.querySelector('.invalid input, .invalid select').focus(); return; }

    var level = form.querySelector('input[name=level]:checked').value;
    var likes = Array.prototype.map.call(form.querySelectorAll('input[name=like]:checked'),
      function (c) { return c.value; }).join('、') || '未选择';
    document.querySelector('#result').innerHTML =
      '<li>姓名：' + escapeHtml(form.elements.name.value) + '</li>' +
      '<li>营地：' + form.elements.camp.options[form.elements.camp.selectedIndex].text + '</li>' +
      '<li>日期：' + form.elements.date.value + '（' + form.elements.people.value + ' 人）</li>' +
      '<li>经验：' + level + '</li><li>兴趣：' + likes + '</li>';
    document.querySelector('.mask').style.display = 'block';
  });
  form.addEventListener('reset', function () {
    form.querySelectorAll('.err').forEach(function (s) { s.textContent = ''; });
    form.querySelectorAll('.invalid').forEach(function (r) { r.classList.remove('invalid'); });
    count.textContent = 0;
  });
  document.querySelector('#closeModal').onclick = function () {
    document.querySelector('.mask').style.display = 'none';
    form.reset();
  };
}

// 防止用户输入的内容被当作 HTML 解析（XSS）
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

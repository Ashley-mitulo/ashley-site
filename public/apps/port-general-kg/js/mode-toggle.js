/* mode-toggle.js — 通俗/专家模式切换（T6，面向领导可读性优化）
 * 默认「通俗模式」：隐藏 L3 技术细节（条款号 / source / code），只留人话。
 * 「专家模式」：L3 完整可见（硬要求）。
 * 只控制显示，不改布局、不改交互。选择记忆于 localStorage。
 */
(function () {
  "use strict";
  var KEY = "pkg_read_mode";   // 'plain' | 'expert'
  var MODES = { plain: { label: "👤 通俗模式", title: "隐藏技术细节，只显示人话结论" }, expert: { label: "🎓 专家模式", title: "显示条款号与出处（L3 完整）" } };

  function current() {
    try { return localStorage.getItem(KEY) === "expert" ? "expert" : "plain"; } catch (e) { return "plain"; }
  }
  function apply(mode) {
    var b = document.body;
    b.classList.remove("mode-plain", "mode-expert");
    b.classList.add(mode === "expert" ? "mode-expert" : "mode-plain");
    var btns = document.querySelectorAll(".mode-toggle-btn");
    for (var i = 0; i < btns.length; i++) {
      btns[i].textContent = MODES[mode].label;
      btns[i].setAttribute("title", MODES[mode].title + "（点击切换）");
      btns[i].setAttribute("data-mode", mode);
    }
  }
  function set(mode) { try { localStorage.setItem(KEY, mode); } catch (e) {} apply(mode); }
  function toggle() { set(current() === "expert" ? "plain" : "expert"); }

  // 渲染一个切换按钮（挂到指定容器）
  function mount(container) {
    if (!container) return;
    if (container.querySelector(".mode-toggle-btn")) return;
    var b = document.createElement("button");
    b.className = "mode-toggle-btn";
    b.type = "button";
    b.addEventListener("click", toggle);
    container.appendChild(b);
    apply(current());
  }

  // 页面初始化：给 body 应用模式（尽早），并挂按钮到 [data-mode-toggle] 容器
  function init() {
    apply(current());
    document.querySelectorAll("[data-mode-toggle]").forEach(mount);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

  window.MODE_TOGGLE = { init: init, mount: mount, set: set, current: current };
})();

/* mobile-helpers.js
 * 移动端辅助工具模块
 * 导出到 window.UiUtils.MobileHelpers
 * 提供触摸手势、性能优化等功能
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  /**
   * 检测是否为移动设备
   * @returns {boolean}
   */
  function isMobile() {
    return window.innerWidth < 1280 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * 检测是否为触摸设备
   * @returns {boolean}
   */
  function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * 初始化触摸手势支持
   * @param {Object} options - 选项
   * @param {HTMLElement} options.element - 目标元素
   * @param {Function} [options.onSwipeLeft] - 左滑回调
   * @param {Function} [options.onSwipeRight] - 右滑回调
   * @param {Function} [options.onSwipeUp] - 上滑回调
   * @param {Function} [options.onSwipeDown] - 下滑回调
   * @param {Function} [options.onPinch] - 捏合回调 (scale)
   * @param {number} [options.swipeThreshold] - 滑动阈值（默认50px）
   */
  function initTouchGestures(options) {
    const {
      element,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      onPinch,
      swipeThreshold = 50,
    } = options || {};

    if (!element || !isTouchDevice()) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let initialDistance = 0;
    let isPinching = false;

    // 触摸开始
    element.addEventListener('touchstart', function(e) {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();

      // 检测双指捏合
      if (e.touches.length === 2) {
        isPinching = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      } else {
        isPinching = false;
      }
    }, { passive: true });

    // 触摸移动
    element.addEventListener('touchmove', function(e) {
      if (isPinching && e.touches.length === 2 && onPinch) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const scale = currentDistance / initialDistance;
        onPinch(scale);
      }
    }, { passive: true });

    // 触摸结束
    element.addEventListener('touchend', function(e) {
      if (isPinching) {
        isPinching = false;
        return;
      }

      if (!e.changedTouches || e.changedTouches.length === 0) return;

      const touch = e.changedTouches[0];
      const touchEndX = touch.clientX;
      const touchEndY = touch.clientY;
      const touchEndTime = Date.now();

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const deltaTime = touchEndTime - touchStartTime;

      // 忽略过长的触摸（可能是滚动）
      if (deltaTime > 500) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // 判断滑动方向
      if (absX > swipeThreshold && absX > absY) {
        // 水平滑动
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else if (absY > swipeThreshold && absY > absX) {
        // 垂直滑动
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }, { passive: true });
  }

  /**
   * 初始化宫位网格的滑动切换
   * @param {HTMLElement} gridElement - 紫微网格元素
   * @param {Function} onPalaceChange - 宫位切换回调 (direction: 'next' | 'prev')
   */
  function initPalaceGridSwipe(gridElement, onPalaceChange) {
    if (!gridElement || !isMobile()) return;

    const PALACE_ORDER = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '僕役', '官祿', '田宅', '福德', '父母'];
    let currentPalaceIndex = 0;

    initTouchGestures({
      element: gridElement,
      onSwipeLeft: () => {
        // 左滑：下一个宫位
        currentPalaceIndex = (currentPalaceIndex + 1) % PALACE_ORDER.length;
        if (onPalaceChange) {
          onPalaceChange('next', PALACE_ORDER[currentPalaceIndex]);
        }
      },
      onSwipeRight: () => {
        // 右滑：上一个宫位
        currentPalaceIndex = (currentPalaceIndex - 1 + PALACE_ORDER.length) % PALACE_ORDER.length;
        if (onPalaceChange) {
          onPalaceChange('prev', PALACE_ORDER[currentPalaceIndex]);
        }
      },
      swipeThreshold: 80,
    });
  }

  /**
   * 优化移动端滚动性能
   * @param {HTMLElement} element - 需要优化的元素
   */
  function optimizeScrollPerformance(element) {
    if (!element || !isMobile()) return;

    // 使用 CSS will-change 提示浏览器优化
    element.style.willChange = 'transform';
    
    // 使用 passive 事件监听器
    let ticking = false;
    element.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // 滚动处理逻辑
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /**
   * 防止移动端双击缩放
   * @param {HTMLElement} element - 目标元素
   */
  function preventDoubleTapZoom(element) {
    if (!element || !isTouchDevice()) return;

    let lastTouchEnd = 0;
    element.addEventListener('touchend', function(e) {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
  }

  /**
   * 优化移动端输入框体验
   * @param {HTMLElement} inputElement - 输入框元素
   */
  function optimizeMobileInput(inputElement) {
    if (!inputElement || !isMobile()) return;

    // 防止iOS自动缩放
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      inputElement.addEventListener('focus', function() {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
        }
      });

      inputElement.addEventListener('blur', function() {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover');
        }
      });
    }
  }

  /**
   * 检测并应用移动端优化
   */
  function applyMobileOptimizations() {
    if (!isMobile()) return;

    // 优化滚动性能
    document.querySelectorAll('.overflow-y-auto, .overflow-y-scroll').forEach(optimizeScrollPerformance);

    // 防止双击缩放（在特定元素上）
    document.querySelectorAll('.ziwei-grid, .palace-box').forEach(preventDoubleTapZoom);

    // 优化输入框
    document.querySelectorAll('input, select, textarea').forEach(optimizeMobileInput);

    // 添加移动端类名
    document.body.classList.add('is-mobile');
  }

  // 导出到 window.UiUtils.MobileHelpers
  if (!window.UiUtils) {
    window.UiUtils = {};
  }

  window.UiUtils.MobileHelpers = {
    isMobile,
    isTouchDevice,
    initTouchGestures,
    initPalaceGridSwipe,
    optimizeScrollPerformance,
    preventDoubleTapZoom,
    optimizeMobileInput,
    applyMobileOptimizations,
  };
})();

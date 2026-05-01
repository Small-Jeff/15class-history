// js/main.js
import { initControls, initRandomRead, initSearchTrigger, initPageNav } from './controls.js';
import { initBackToTop, initParallaxHeader } from './animations.js';

function initHistory() {
    if (typeof historyData === 'undefined') {
        console.error('historyData 未定义');
        return;
    }
    initControls();
    initPageNav();
    initBackToTop();
    initRandomRead();
    initSearchTrigger();
    initParallaxHeader();

    // 预加载 modal-extras 模块，减少点击时的延迟
    import('./modal-extras.js').catch(() => {});
}

window.initHistory = initHistory;
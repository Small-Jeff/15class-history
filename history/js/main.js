// js/main.js
import { initControls, initRandomRead, initSearchTrigger, initPageNav, getCurrentDataSource } from './controls.js';
import { initBackToTop, initParallaxHeader } from './animations.js';
import { showSearchModal } from './modal.js';

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

    // 全局键盘快捷键
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K 打开搜索框
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            showSearchModal(getCurrentDataSource());
        }
        // ESC 关闭当前最上层的模态框（按需）
        if (e.key === 'Escape') {
            const visibleModals = document.querySelectorAll('.history-modal:not(.hidden)');
            if (visibleModals.length > 0) {
                const topModal = visibleModals[visibleModals.length - 1];
                const closeBtn = topModal.querySelector('.modal-close-btn');
                if (closeBtn) closeBtn.click();
            }
        }
    });
}

window.initHistory = initHistory;
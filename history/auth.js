// ======================= 前端登录验证 =======================
// 标记 initHistory 尚未执行（由 main.js 调用后设为 true）
window._historyInitialized = false;
// 预置密码的 SHA-256 哈希值（"abcd123456"）
const CORRECT_HASH = "5fae31539e070a690c1b63720c25eb5b86084b5098a942c86c89c1d67157ed6b";

function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return bufferToHex(hashBuffer);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showWelcomeMessage(username, isDev = false) {
    const hero = document.querySelector('.hero');
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'welcome-message';
    welcomeDiv.innerHTML = isDev 
        ? `<span>✨ 开发模式，已跳过验证 ✨</span>`
        : `<span>✨ 欢迎！${escapeHtml(username)} ✨</span>`;
    hero.insertAdjacentElement('afterend', welcomeDiv);
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('authModal');
    const mainContent = document.getElementById('mainContent');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const authBtn = document.getElementById('authBtn');
    const errorDiv = document.getElementById('authError');

    const urlParams = new URLSearchParams(window.location.search);
    const devParam = urlParams.get('dev');

    // 手动关闭 dev 模式（访问 ?dev=off 清除缓存）
    if (devParam === '0' || devParam === 'off') {
        localStorage.removeItem('autoDev');
    }
    // 手动开启 dev 模式（访问 ?dev=true 记住缓存）
    if (devParam === '1' || devParam === 'true') {
        localStorage.setItem('autoDev', 'true');
    }

    // 判断是否跳过登录
    const isDevMode = devParam === 'true' || localStorage.getItem('autoDev') === 'true';

    if (isDevMode) {
        modal.classList.add('hidden');
        mainContent.classList.remove('hidden');
        showWelcomeMessage('', true);
        if (typeof window.initHistory === 'function') {
            window.initHistory();
        }
        return;
    }

    // 正常登录验证
    async function verifyAndEnter() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username) {
            errorDiv.textContent = '请填写姓名';
            return;
        }
        if (!password) {
            errorDiv.textContent = '请填写密码';
            return;
        }

        try {
            const inputHash = await hashPassword(password);
            if (inputHash === CORRECT_HASH) {
                modal.classList.add('hidden');
                mainContent.classList.remove('hidden');
                showWelcomeMessage(username);
                if (typeof window.initHistory === 'function') {
                    window.initHistory();
                }
            } else {
                errorDiv.textContent = '密码错误，不得入史';
                passwordInput.value = '';
                // 抖动反馈
                const authContent = document.querySelector('.auth-modal-content');
                authContent.classList.remove('shake');
                void authContent.offsetWidth; // 强制回流以重新触发动画
                authContent.classList.add('shake');
                setTimeout(() => authContent.classList.remove('shake'), 500);
            }
        } catch (err) {
            console.error('验证出错:', err);
            errorDiv.textContent = '验证失败，请重试';
        }
    }

    authBtn.addEventListener('click', verifyAndEnter);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            verifyAndEnter();
        }
    });
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            verifyAndEnter();
        }
    });
});
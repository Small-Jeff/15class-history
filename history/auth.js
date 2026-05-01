// ======================= 前端登录验证 =======================
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

// 显示欢迎信息
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

    // ========== 🔧 需要修改：IP 白名单列表（填入你自己的公网 IP） ==========
    const WHITELIST_IPS = [
        '180.213.93.123',
        ''    // 可添加多个 IP
    ];

    // 从 URL 获取 dev 参数
    const urlParams = new URLSearchParams(window.location.search);
    const devParam = urlParams.get('dev');

    // 手动关闭 dev 模式（访问 ?dev=off 清除）
    if (devParam === 'off') {
        localStorage.removeItem('autoDev');
        sessionStorage.removeItem('ipDevPassed');
    }
    // 手动开启 dev 模式（访问 ?dev=true 永久记住）
    if (devParam === 'true') {
        localStorage.setItem('autoDev', 'true');
    }

    // 检测 IP 是否在白名单中
    async function checkIpWhitelist() {
        // 如果本次会话已经检查通过，直接返回 true
        if (sessionStorage.getItem('ipDevPassed') === 'true') return true;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000); // 3秒超时
            const resp = await fetch('https://api.ipify.org?format=json', {
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!resp.ok) return false;
            const data = await resp.json();
            const clientIp = data.ip;
            if (WHITELIST_IPS.includes(clientIp)) {
                sessionStorage.setItem('ipDevPassed', 'true'); // 本次会话直接通过
                return true;
            }
        } catch (e) {
            // IP 查询失败时，不影响正常登录，回退到手动输入密码
            console.warn('IP 白名单检查失败，将使用普通登录', e);
        }
        return false;
    }

    // 统一判断是否跳过登录
    async function tryAutoDev() {
        const ipDevPassed = await checkIpWhitelist();
        const isDevMode = devParam === 'true' || localStorage.getItem('autoDev') === 'true' || ipDevPassed;

        if (isDevMode) {
            modal.classList.add('hidden');
            mainContent.classList.remove('hidden');
            showWelcomeMessage('', true);
            if (typeof window.initHistory === 'function') {
                window.initHistory();
            }
            return true; // 已自动进入，无需绑定登录
        }
        return false;
    }

    // 正常登录验证函数
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
                } else {
                    console.error('initHistory 未定义');
                }
            } else {
                errorDiv.textContent = '密码错误，不得入史';
                passwordInput.value = '';
            }
        } catch (err) {
            console.error('验证出错:', err);
            errorDiv.textContent = '验证失败，请重试';
        }
    }

    // 绑定登录事件
    function bindLoginEvents() {
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
    }

    // 执行自动检测，如果未跳过则绑定登录
    tryAutoDev().then(skipped => {
        if (!skipped) {
            bindLoginEvents();
        }
    });
});
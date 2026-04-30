// 纯动画与特效

export function initCardAnimations() {
    const cards = document.querySelectorAll('.timeline-event-copy');
    if (!cards.length) return;
    cards.forEach(card => card.classList.remove('visible'));
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2, rootMargin: '0px 0px -20px 0px' });
        cards.forEach(card => observer.observe(card));
    } else {
        cards.forEach(card => card.classList.add('visible'));
    }
    const checkVisibleNow = () => {
        const winHeight = window.innerHeight || document.documentElement.clientHeight;
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            if (rect.top < winHeight - 100 && !card.classList.contains('visible')) {
                card.classList.add('visible');
            }
        });
    };
    checkVisibleNow();
    window.addEventListener('scroll', checkVisibleNow);
}

export function addHonorificEffects() {
    const honorifics = document.querySelectorAll('.honorific');
    honorifics.forEach(el => {
        el.addEventListener('mouseenter', () => {
            el.style.transition = '0.2s';
            el.style.textShadow = '0 0 5px rgba(212,175,55,0.5)';
        });
        el.addEventListener('mouseleave', () => {
            el.style.textShadow = 'none';
        });
    });
}

export function initParallaxHeader() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY < 300) {
            hero.style.opacity = 1 - scrollY / 500;
            hero.style.transform = `translateY(${scrollY * 0.2}px)`;
        } else {
            hero.style.opacity = '';
            hero.style.transform = '';
        }
    });
}

export function initBackToTop() {
    const backBtn = document.getElementById('backToTop');
    if (!backBtn) return;

    // 滚动事件
    const toggleVisibility = () => {
        if (window.scrollY > 300) {
            backBtn.style.display = 'flex';
        } else {
            backBtn.style.display = 'none';
        }
    };

    // 初始化时检查一次
    toggleVisibility();

    window.addEventListener('scroll', toggleVisibility);
    backBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
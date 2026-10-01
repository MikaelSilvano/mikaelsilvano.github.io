const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const header = document.querySelector('.site-header');
const headerOffset = () => header.offsetHeight + 16;

const threadGrid = document.querySelector('.thread-grid');
if (threadGrid) {
    const size = 8;
    const frag = document.createDocumentFragment();
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const cell = document.createElement('span');
            const wave = row + col;
            cell.style.setProperty('--d', wave);
            cell.style.setProperty('--o', (1 - wave / (size * 2 - 2) * 0.75).toFixed(2));
            frag.appendChild(cell);
        }
    }
    threadGrid.appendChild(frag);
}

let lenis = null;
if (!reduceMotion && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
}

document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    const target = id === 'top' ? document.body : document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) {
        lenis.scrollTo(id === 'top' ? 0 : target, { offset: -headerOffset(), duration: 1.4 });
    } else {
        window.scrollTo({ top: id === 'top' ? 0 : target.getBoundingClientRect().top + window.scrollY - headerOffset(), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    if (id !== 'top') {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
    }
});

const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.getElementById('site-nav');
const setMenu = (open) => {
    menuToggle.setAttribute('aria-expanded', String(open));
    navLinks.classList.toggle('is-open', open);
    if (open) header.classList.remove('is-hidden');
};
menuToggle.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
});
navLinks.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('is-open')) {
        setMenu(false);
        menuToggle.focus();
    }
});

const progressBar = document.querySelector('.scroll-progress');
const timeline = document.querySelector('.timeline');
let lastY = window.scrollY;
let ticking = false;

const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);

    header.classList.toggle('is-scrolled', y > 8);
    const menuOpen = navLinks.classList.contains('is-open');
    if (!menuOpen && y > 480 && y > lastY + 4) header.classList.add('is-hidden');
    else if (y < lastY - 4 || y <= 480) header.classList.remove('is-hidden');
    lastY = y;

    if (timeline) {
        const rect = timeline.getBoundingClientRect();
        const p = (window.innerHeight * 0.65 - rect.top) / rect.height;
        timeline.style.setProperty('--line-progress', Math.min(Math.max(p, 0), 1).toFixed(4));
    }
    ticking = false;
};
window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
    }
}, { passive: true });
onScroll();

document.querySelectorAll('[data-reveal-group]').forEach(group => {
    [...group.children].filter(el => el.hasAttribute('data-reveal'))
        .forEach((el, i) => el.style.setProperty('--d', i));
});

const revealEls = document.querySelectorAll('[data-reveal]');
if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-in'));
} else {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add('is-in');
            revealObserver.unobserve(el);
            const delay = (parseFloat(el.style.getPropertyValue('--d')) || 0) * 90;
            setTimeout(() => el.style.setProperty('--d', 0), delay + 1200);
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(el => revealObserver.observe(el));
}

const counters = document.querySelectorAll('[data-count]');
if (!reduceMotion && 'IntersectionObserver' in window) {
    const format = (n) => n.toLocaleString('en-US');
    const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
    const countObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            countObserver.unobserve(el);
            const target = Number(el.dataset.count);
            el.textContent = format(target);
            el.style.minWidth = `${el.getBoundingClientRect().width}px`;
            const duration = 1800;
            const start = performance.now();
            const tick = (now) => {
                const t = Math.min((now - start) / duration, 1);
                el.textContent = format(Math.round(target * easeOutExpo(t)));
                if (t < 1) requestAnimationFrame(tick);
            };
            el.textContent = '0';
            requestAnimationFrame(tick);
        });
    }, { threshold: 0.6 });
    counters.forEach(el => countObserver.observe(el));
}

const indicator = navLinks.querySelector('.nav-indicator');
const navMap = new Map(
    [...navLinks.querySelectorAll('a')].map(a => [a.getAttribute('href').slice(1), a])
);
let activeLink = null;
const moveIndicator = () => {
    if (!indicator) return;
    if (!activeLink) {
        indicator.classList.remove('is-visible');
        return;
    }
    indicator.style.setProperty('--x', `${activeLink.offsetLeft}px`);
    indicator.style.setProperty('--w', `${activeLink.offsetWidth}px`);
    indicator.classList.add('is-visible');
};
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const link = navMap.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
            navMap.forEach(a => { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
            link.classList.add('is-active');
            link.setAttribute('aria-current', 'true');
            activeLink = link;
        } else if (activeLink === link) {
            link.classList.remove('is-active');
            link.removeAttribute('aria-current');
            activeLink = null;
        }
        moveIndicator();
    });
}, { rootMargin: '-40% 0px -55% 0px' });
navMap.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) sectionObserver.observe(section);
});
window.addEventListener('resize', moveIndicator);

document.querySelectorAll('details.more').forEach(details => {
    const summary = details.querySelector('summary');
    const body = details.querySelector('.more-body');
    const label = details.querySelector('.more-label');
    const closedText = label.textContent;
    const openText = 'Show fewer roles';
    let anim = null;

    summary.addEventListener('click', (e) => {
        if (reduceMotion) {
            requestAnimationFrame(() => { label.textContent = details.open ? openText : closedText; });
            return;
        }
        e.preventDefault();
        if (anim) anim.cancel();
        const opening = !details.open;
        if (opening) details.open = true;
        const full = body.scrollHeight;
        const from = opening ? 0 : body.offsetHeight;
        const to = opening ? full : 0;
        label.textContent = opening ? openText : closedText;
        anim = body.animate(
            [{ height: `${from}px`, opacity: opening ? 0 : 1 }, { height: `${to}px`, opacity: opening ? 1 : 0 }],
            { duration: Math.min(900, 380 + full * 0.35), easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        );
        anim.onfinish = () => {
            if (!opening) details.open = false;
            anim = null;
            if (lenis) lenis.resize();
        };
    });
});

const copyBtn = document.querySelector('.copy-btn');
const copyStatus = document.getElementById('copy-status');
if (copyBtn) {
    const label = copyBtn.querySelector('.copy-label');
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(copyBtn.dataset.copy);
            label.textContent = 'Copied';
            copyStatus.textContent = 'Email address copied to clipboard';
        } catch {
            label.textContent = 'Copy failed';
            copyStatus.textContent = 'Could not copy. Select the email address to copy it.';
        }
        setTimeout(() => {
            label.textContent = 'Copy email';
            copyStatus.textContent = '';
        }, 2000);
    });
}

document.getElementById('year').textContent = new Date().getFullYear();

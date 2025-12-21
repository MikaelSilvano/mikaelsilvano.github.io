// Scroll Progress Bar
window.onscroll = function() {
    let winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    let scrolled = (winScroll / height) * 100;
    document.getElementById("scroll-progress").style.width = scrolled + "%";
};

// Grid Background Creation
const gridContainer = document.getElementById('grid-container');
let cols, rows;
const tileSize = 50;

function createGrid() {
    cols = Math.ceil(window.innerWidth / tileSize);
    rows = Math.ceil(window.innerHeight / tileSize);
    gridContainer.style.gridTemplateColumns = `repeat(${cols}, ${tileSize}px)`;
    gridContainer.style.gridTemplateRows = `repeat(${rows}, ${tileSize}px)`;
    gridContainer.innerHTML = '';
    const totalTiles = cols * rows;
    for (let i = 0; i < totalTiles; i++) {
        const tile = document.createElement('div');
        tile.classList.add('grid-square');
        gridContainer.appendChild(tile);
    }
}
createGrid();
window.addEventListener('resize', createGrid);

// Mouse Tracking
document.addEventListener('mousemove', (e) => {
    // Magic Border
    document.querySelectorAll('.card-hover').forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });

    // Grid Trail
    const col = Math.floor(e.clientX / tileSize);
    const row = Math.floor(e.clientY / tileSize);
    const index = row * cols + col;
    if (gridContainer.children[index]) {
        const tile = gridContainer.children[index];
        tile.style.backgroundColor = 'rgba(56, 189, 248, 0.2)';
        tile.style.borderColor = 'rgba(56, 189, 248, 0.5)';
        tile.style.transition = '0s';
        tile.style.boxShadow = '0 0 15px rgba(56, 189, 248, 0.3)';
        setTimeout(() => {
            tile.style.backgroundColor = '';
            tile.style.borderColor = '';
            tile.style.boxShadow = '';
            tile.style.transition = 'background-color 2s ease, border-color 2s ease, box-shadow 2s ease';
        }, 10);
    }
});

// Animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Stats Counter
const statsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counters = entry.target.querySelectorAll('.stat-number');
            counters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                const duration = 2000;
                const increment = target / (duration / 16);
                let current = 0;
                const updateCounter = () => {
                    current += increment;
                    if(current < target) {
                        counter.innerText = Math.ceil(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.innerText = target;
                    }
                };
                updateCounter();
            });
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });
const statsSection = document.querySelector('.stats-grid');
if(statsSection) statsObserver.observe(statsSection);

// Horizontal Scroll
const stickyContainer = document.getElementById('journey-sticky-container');
const track = document.getElementById('track');

window.addEventListener('scroll', () => {
    if (window.innerWidth > 900 && stickyContainer) {
        const rect = stickyContainer.getBoundingClientRect();
        const offset = -rect.top;
        const maxScroll = stickyContainer.offsetHeight - window.innerHeight;
        
        if (offset > 0 && offset < maxScroll) {
            const percent = offset / maxScroll;
            const moveDistance = (track.scrollWidth - window.innerWidth + 100) * percent;
            track.style.transform = `translateX(-${moveDistance}px)`;
        }
    } 
    else if (track) {
        track.style.transform = 'translateX(0)';
    }
});

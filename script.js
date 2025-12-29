document.addEventListener('DOMContentLoaded', () => {

    if (history.scrollRestoration) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    const title = document.getElementById("hero-title");
    if (title) {
        const letters = "0101010101ABCDEFGHIJKLMNOP";
        const originalText = title.dataset.value.replace('+', '');
        const suffix = '<span class="plus-accent">+</span>';
        let interval = null;
        let iteration = 0;

        interval = setInterval(() => {
            title.innerHTML = originalText
                .split("")
                .map((letter, index) => {
                    if (index < iteration) return originalText[index];
                    return letters[Math.floor(Math.random() * 26)];
                })
                .join("") + suffix;

            if (iteration >= originalText.length) {
                clearInterval(interval);
                title.classList.add('resolved');
            }
            iteration += 1 / 8;
        }, 60);
    }

    const zoomWrapper = document.querySelector('.scroll-zoom-wrapper');
    const stickyHero = document.querySelector('.sticky-hero');
    const heroContent = document.querySelector('.hero-content-center');
    const maxZoom = 25;

    function updateZoom() {
        const scrollTop = window.scrollY;
        const wrapperHeight = zoomWrapper.offsetHeight;
        const windowHeight = window.innerHeight;

        if (scrollTop < 5) {
            stickyHero.style.opacity = 1;
            stickyHero.style.visibility = 'visible';
            heroContent.style.transform = 'scale(1)';
            heroContent.style.opacity = '1';
            requestAnimationFrame(updateZoom);
            return;
        }

        const scrollProgress = scrollTop / (wrapperHeight - windowHeight);

        if (scrollProgress >= 0 && scrollProgress <= 1) {
            stickyHero.style.visibility = 'visible';
            const scale = 1 + (Math.pow(scrollProgress, 3) * maxZoom);
            let opacity = 1;
            if (scrollProgress > 0.5) opacity = 1 - ((scrollProgress - 0.5) * 2.5);

            heroContent.style.transform = `scale(${scale})`;
            heroContent.style.opacity = Math.max(0, opacity);
        } else {
            stickyHero.style.visibility = 'hidden';
        }
        requestAnimationFrame(updateZoom);
    }
    updateZoom();

    // --- TIMELINE FOR DOC 01 ---
    const timelineSection = document.querySelector('.timeline-container');
    const progressLine = document.getElementById('progress-line');
    const nodes = document.querySelectorAll('.timeline-node');

    function updateTimeline() {
        if (!timelineSection) return;
        
        // Only run if the timeline is actually visible/open
        if (timelineSection.closest('.file-item').classList.contains('active')) {
            const rect = timelineSection.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            let percentage = (windowHeight / 2 - rect.top) / rect.height * 100;

            if (percentage < 0) percentage = 0;
            if (percentage > 100) percentage = 100;
            progressLine.style.height = `${percentage}%`;

            nodes.forEach(node => {
                const nodeTop = node.getBoundingClientRect().top;
                if (nodeTop < windowHeight * 0.75) node.classList.add('active');
                else node.classList.remove('active');
            });
        }
    }

    // --- GENERIC SCROLL ANIMATION FOR DOC 02-06 ---
    // Looks for .info-block elements in active articles
    function updateInfoBlocks() {
        const activeBlocks = document.querySelectorAll('.file-item.active .info-block');
        const windowHeight = window.innerHeight;
        
        activeBlocks.forEach(block => {
            const rect = block.getBoundingClientRect();
            // Trigger when top of block is 85% down the viewport
            if (rect.top < windowHeight * 0.85) {
                block.classList.add('visible');
            }
        });
    }

    window.addEventListener('scroll', () => {
        updateTimeline();
        updateInfoBlocks();
    });

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lbCounter = document.getElementById('lb-counter');
    const closeBtn = document.querySelector('.close-lightbox');
    const lbPrev = document.getElementById('lb-prev');
    const lbNext = document.getElementById('lb-next');

    let currentImages = [];
    let currentPath = "";
    let currentIndex = 0;

    window.openLightbox = function(element) {
        const card = element.closest('.h-card');
        if (card && card.dataset.images) {
            currentImages = JSON.parse(card.dataset.images);
            currentPath = card.dataset.path;
            const currentSrc = element.querySelector('.slide-img').getAttribute('src');
            const filename = currentSrc.split('/').pop();
            currentIndex = currentImages.findIndex(img => img.includes(filename));
            if (currentIndex === -1) currentIndex = 0;
            updateLightboxView();
            lightbox.classList.add('active');
        }
    };

    function updateLightboxView() {
        lightboxImg.style.opacity = 0.5;
        setTimeout(() => {
            lightboxImg.src = currentPath + currentImages[currentIndex];
            lbCounter.innerText = `IMG ${String(currentIndex + 1).padStart(2, '0')}/${String(currentImages.length).padStart(2, '0')}`;
            lightboxImg.onload = () => { lightboxImg.style.opacity = 1; };
        }, 150);
    }

    lbPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex--;
        if (currentIndex < 0) currentIndex = currentImages.length - 1;
        updateLightboxView();
    });

    lbNext.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex++;
        if (currentIndex >= currentImages.length) currentIndex = 0;
        updateLightboxView();
    });

    closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.classList.remove('active');
    });

    // --- IMPROVED ACCORDION LOGIC ---
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        const header = item.querySelector('.file-header');
        header.addEventListener('click', (e) => {
            e.preventDefault();
            const isActive = item.classList.contains('active');
            
            // 1. Close all items first
            fileItems.forEach(f => f.classList.remove('active'));

            if (!isActive) {
                // 2. Open the clicked item
                item.classList.add('active');
                
                // 3. Scroll to the header of the opened item after layout shift
                // We use setTimeout to allow the browser to register the class change and CSS transition to start
                setTimeout(() => {
                    const offset = 75; // Offset for sticky nav
                    const bodyRect = document.body.getBoundingClientRect().top;
                    const elementRect = item.getBoundingClientRect().top;
                    const elementPosition = elementRect - bodyRect;
                    const offsetPosition = elementPosition - offset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                    
                    // Trigger animations immediately for initial view
                    setTimeout(() => {
                        updateTimeline();
                        updateInfoBlocks();
                    }, 300);
                    
                }, 550); // Slightly longer than CSS transition (0.5s) to ensure smooth expansion first
            }
        });
    });

    const museumCards = document.querySelectorAll('.h-card');
    museumCards.forEach(card => {
        if (!card.dataset.images) return;
        const images = JSON.parse(card.dataset.images);
        const path = card.dataset.path;
        const imgElement = card.querySelector('.slide-img');
        const prevBtn = card.querySelector('.prev');
        const nextBtn = card.querySelector('.next');
        let cardIndex = 0;

        function updateCardImage() {
            imgElement.style.opacity = 0;
            setTimeout(() => {
                imgElement.src = path + images[cardIndex];
                imgElement.onload = () => { imgElement.style.opacity = 1; };
            }, 150);
        }

        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                cardIndex--;
                if (cardIndex < 0) cardIndex = images.length - 1;
                updateCardImage();
            });
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                cardIndex++;
                if (cardIndex >= images.length) cardIndex = 0;
                updateCardImage();
            });
        }
    });

    const canvas = document.getElementById('tech-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height, particles = [];

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }
            draw() {
                ctx.fillStyle = '#bbb';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < 50; i++) particles.push(new Particle());

        function animate() {
            ctx.clearRect(0, 0, width, height);
            particles.forEach((p, index) => {
                p.update();
                p.draw();
                for (let j = index; j < particles.length; j++) {
                    const dx = particles[j].x - p.x;
                    const dy = particles[j].y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        ctx.strokeStyle = `rgba(180, 180, 180, ${1 - dist / 150})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            });
            requestAnimationFrame(animate);
        }
        animate();
    }
});
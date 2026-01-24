document.addEventListener('DOMContentLoaded', () => {

    if (!sessionStorage.getItem('splashShown')) {
        if (history.scrollRestoration) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
    }

    const splash = document.getElementById('splash-screen');
    const title = document.getElementById("hero-title");
    
    function animateTitle() {
        if (!title) return;
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const originalText = title.dataset.value.replace('+', '');
        const suffix = '<span class="plus-accent">+</span>';
        let iteration = 0;
        
        if (title.dataset.intervalId) clearInterval(title.dataset.intervalId);
        title.classList.remove('resolved');

        const interval = setInterval(() => {
            title.innerHTML = originalText
                .split("")
                .map((letter, index) => {
                    if (index < iteration) return originalText[index];
                    return letters[Math.floor(Math.random() * letters.length)];
                })
                .join("") + suffix;

            if (iteration >= originalText.length) {
                clearInterval(interval);
                title.classList.add('resolved');
            }
            iteration += 1 / 3;
        }, 30);
        title.dataset.intervalId = interval;
    }

    function removeSplash() {
        if (splash) {
            splash.classList.add('hidden');
            setTimeout(() => { splash.style.display = 'none'; }, 800);
        }
        setTimeout(animateTitle, 200);
    }

    if (sessionStorage.getItem('splashShown')) {
        if (splash) splash.style.display = 'none';
        setTimeout(animateTitle, 100);
    } else {
        setTimeout(() => {
            removeSplash();
            sessionStorage.setItem('splashShown', 'true');
        }, 4000);
    }

    if (title) {
        title.addEventListener('mouseenter', () => {
            if (!isScrolling) animateTitle();
        });
        title.addEventListener('touchstart', () => {
            animateTitle();
        }, {passive: true});
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 }); 

    const animatedRows = document.querySelectorAll('.info-row');
    animatedRows.forEach(row => observer.observe(row));

    const timelineSection = document.querySelector('.timeline-container');
    const progressLine = document.getElementById('progress-line');
    const nodes = document.querySelectorAll('.timeline-node');

    function updateTimeline() {
        if (!timelineSection) return;
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

    const zoomWrapper = document.querySelector('.scroll-zoom-wrapper');
    const stickyHero = document.querySelector('.sticky-hero');
    const heroContent = document.querySelector('.hero-content-center');
    let isScrolling = false;
    let scrollTimer = null;

    window.addEventListener('scroll', () => {
        isScrolling = true;
        updateTimeline();
        
        if (zoomWrapper && stickyHero) {
            const scrollTop = window.scrollY;
            const wrapperHeight = zoomWrapper.offsetHeight;
            const windowHeight = window.innerHeight;
            
            if (scrollTop < wrapperHeight - windowHeight) {
                const scrollProgress = scrollTop / (wrapperHeight - windowHeight);
                const scale = 1 + (scrollProgress * 25); 
                const opacity = Math.max(0, 1 - (scrollProgress * 2));
                stickyHero.style.visibility = 'visible';
                heroContent.style.transform = `scale(${scale})`;
                heroContent.style.opacity = opacity;
            } else {
                stickyHero.style.visibility = 'hidden';
            }
        }

        if (scrollTimer !== null) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => { isScrolling = false; }, 150);
        
        highlightMenu();
    });

    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        const header = item.querySelector('.file-header');
        header.addEventListener('click', (e) => {
            e.preventDefault();
            const isActive = item.classList.contains('active');
            
            fileItems.forEach(f => f.classList.remove('active'));

            if (!isActive) {
                item.classList.add('active');
                
                const startTime = performance.now();
                const duration = 600; 
                const headerOffset = 85; 

                function trackScroll() {
                    const elapsed = performance.now() - startTime;
                    if (elapsed < duration) {
                        const elementRect = item.getBoundingClientRect();
                        const absoluteElementTop = elementRect.top + window.scrollY;
                        const targetPosition = absoluteElementTop - headerOffset;
                        
                        window.scrollTo({
                            top: targetPosition,
                            behavior: "auto" 
                        });
                        
                        requestAnimationFrame(trackScroll);
                    } else {
                         const elementRect = item.getBoundingClientRect();
                         const absoluteElementTop = elementRect.top + window.scrollY;
                         window.scrollTo({
                            top: absoluteElementTop - headerOffset,
                            behavior: "smooth"
                         });
                         
                         updateTimeline();
                    }
                }
                
                requestAnimationFrame(trackScroll);
            }
        });
    });

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lbCounter = document.getElementById('lb-counter');
    const closeBtn = document.querySelector('.close-lightbox');
    const lbPrev = document.getElementById('lb-prev');
    const lbNext = document.getElementById('lb-next');
    let currentImages = [], currentPath = "", currentIndex = 0;

    window.openLightbox = function(element) {
        const card = element.closest('.h-card');
        if (card && card.dataset.images) {
            currentImages = JSON.parse(card.dataset.images);
            currentPath = card.dataset.path;
            const currentSrc = element.querySelector('.slide-img').getAttribute('src');
            const filename = currentSrc.split('/').pop();
            currentIndex = currentImages.findIndex(img => img.includes(filename));
            if (currentIndex === -1) currentIndex = 0;
            lightboxImg.style.opacity = 0;
            lightbox.classList.add('active');
            setTimeout(() => {
                lightboxImg.src = currentPath + currentImages[currentIndex];
                lbCounter.innerText = `IMG ${String(currentIndex + 1).padStart(2, '0')}/${String(currentImages.length).padStart(2, '0')}`;
                lightboxImg.onload = () => { lightboxImg.style.opacity = 1; };
            }, 100);
        }
    };
    if(closeBtn) closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));
    if(lbPrev) lbPrev.addEventListener('click', (e) => { e.stopPropagation(); currentIndex--; if(currentIndex < 0) currentIndex = currentImages.length - 1; updateLightboxView(); });
    if(lbNext) lbNext.addEventListener('click', (e) => { e.stopPropagation(); currentIndex++; if(currentIndex >= currentImages.length) currentIndex = 0; updateLightboxView(); });

    function updateLightboxView() {
        lightboxImg.style.opacity = 0.5;
        setTimeout(() => {
            lightboxImg.src = currentPath + currentImages[currentIndex];
            lbCounter.innerText = `IMG ${String(currentIndex + 1).padStart(2, '0')}/${String(currentImages.length).padStart(2, '0')}`;
            lightboxImg.onload = () => { lightboxImg.style.opacity = 1; };
        }, 150);
    }

    const marqueeTrack = document.querySelector('.marquee-track');
    if (marqueeTrack) {
        const cards = Array.from(marqueeTrack.children);
        cards.forEach(card => {
            const clone = card.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true'); 
            marqueeTrack.appendChild(clone);
        });
        marqueeTrack.addEventListener('mouseenter', () => { marqueeTrack.getAnimations().forEach(anim => anim.updatePlaybackRate(0)); });
        marqueeTrack.addEventListener('mouseleave', () => { marqueeTrack.getAnimations().forEach(anim => anim.updatePlaybackRate(1)); });
    }

    const canvas = document.getElementById('tech-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height, particles = [];
        function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }
        window.addEventListener('resize', resize); resize();
        class Particle {
            constructor() { this.x = Math.random() * width; this.y = Math.random() * height; this.vx = (Math.random() - 0.5); this.vy = (Math.random() - 0.5); this.size = Math.random() * 2; }
            update() { this.x += this.vx; this.y += this.vy; if (this.x < 0 || this.x > width) this.vx *= -1; if (this.y < 0 || this.y > height) this.vy *= -1; }
            draw() { ctx.fillStyle = '#bbb'; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
        }
        for (let i = 0; i < 50; i++) particles.push(new Particle());
        function animate() {
            ctx.clearRect(0, 0, width, height);
            particles.forEach((p, index) => {
                p.update(); p.draw();
                for (let j = index; j < particles.length; j++) {
                    const dx = particles[j].x - p.x; const dy = particles[j].y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) { ctx.strokeStyle = `rgba(180, 180, 180, ${1 - dist / 150})`; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke(); }
                }
            });
            requestAnimationFrame(animate);
        }
        animate();
    }

    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".nav-links li a");
    function highlightMenu() {
        let current = "";
        const triggerPoint = window.innerHeight * 0.3;
        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= triggerPoint && rect.bottom > triggerPoint) { current = section.getAttribute("id"); }
        });
        navLinks.forEach((link) => {
            link.classList.remove("nav-active");
            if (current) {
                const href = link.getAttribute("href");
                if (href === `#${current}`) { link.classList.add("nav-active"); }
            }
        });
    }
});
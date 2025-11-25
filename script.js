/* =========================================
   GLOBAL INITIALIZATION
   ========================================= */
document.addEventListener('DOMContentLoaded', function() {
    initSplashScreen();
    initUIInteractions();
    initSearchSystem();
    initScrollObservers();
});

/* =========================================
   1. SPLASH SCREEN
   ========================================= */
function initSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    
    // Se não existir na página, para a execução
    if (!splashScreen) return;

    const hasSeenSplash = sessionStorage.getItem('humanPlusIntroSeen');

    if (hasSeenSplash) {
        splashScreen.style.display = 'none';
    } else {
        const splashText = document.getElementById('splash-text');
        const text = 'human';
        let charIndex = 0;

        function revealText() {
            if (charIndex < text.length) {
                splashText.textContent += text[charIndex];
                charIndex++;
                setTimeout(revealText, 500);
            }
        }

        setTimeout(revealText, 300);

        setTimeout(() => {
            splashScreen.classList.add('fade-out');
        }, 6000);

        setTimeout(() => {
            splashScreen.style.display = 'none';
            sessionStorage.setItem('humanPlusIntroSeen', 'true');
        }, 6800);
    }
}

/* =========================================
   2. UI INTERACTIONS (Navbar, Menu, Scroll)
   ========================================= */
function initUIInteractions() {
    // --- Scroll Suave ---
    window.scrollToSection = function(id) {
        const section = document.getElementById(id);
        if (section) {
            section.scrollIntoView({ behavior: "smooth" });
        }
    };

    // --- Pin / Lock Navbar ---
    const pin = document.querySelector('.pin');
    const navbar = document.querySelector('.navbar');

    if (pin && navbar) {
        pin.addEventListener('click', () => {
            navbar.classList.toggle('locked');
            pin.classList.toggle('active');
        });
    }

    // --- Mobile Menu Toggle ---
    const mobileIcon = document.querySelector(".mobile-menu-icon");
    const mobileMenu = document.querySelector(".mobile-menu");

    if (mobileIcon && mobileMenu) {
        mobileIcon.addEventListener("click", () => {
            mobileIcon.classList.toggle("active");
            mobileMenu.classList.toggle("active");
        });
    }
}

/* =========================================
   3. SEARCH SYSTEM (Expand & Highlight)
   ========================================= */
function initSearchSystem() {
    const search = document.querySelector('.search');
    const searchIcon = document.querySelector('.search-icon');
    const searchInput = document.querySelector('.search-input');
    const contentArea = document.querySelector('.container') || document.body;
    let originalContent = null;

    if (!search || !searchInput) return;

    // --- Funções Auxiliares de Highlight ---
    function saveOriginalContent() {
        if (!originalContent) {
            originalContent = contentArea.cloneNode(true);
        }
    }

    function removeHighlights() {
        if (!originalContent) return;
        
        const highlighted = contentArea.querySelectorAll('.highlight');
        highlighted.forEach(span => {
            const parent = span.parentNode;
            if (parent && parent.tagName === 'SPAN' && !parent.classList.contains('highlight')) {
                const textNodes = [];
                parent.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        textNodes.push(node.textContent);
                    } else if (node.classList && node.classList.contains('highlight')) {
                        textNodes.push(node.textContent);
                    }
                });
                parent.replaceWith(document.createTextNode(textNodes.join('')));
            } else {
                span.replaceWith(document.createTextNode(span.textContent));
            }
        });
        contentArea.normalize();
    }

    function highlightWord(word) {
        if (!word.trim()) return;
        saveOriginalContent();

        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedWord})`, 'gi');
        const textNodes = [];
        
        const walker = document.createTreeWalker(
            contentArea,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    
                    const tagName = parent.tagName;
                    if (tagName === 'SCRIPT' || tagName === 'STYLE') return NodeFilter.FILTER_REJECT;
                    if (parent.classList.contains('highlight')) return NodeFilter.FILTER_REJECT;
                    if (parent.closest('.search') || parent.closest('.side-menu')) return NodeFilter.FILTER_REJECT;
                    if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;

                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            const text = textNode.nodeValue;
            if (regex.test(text)) {
                const fragment = document.createDocumentFragment();
                let lastIndex = 0;
                regex.lastIndex = 0;
                let match;

                while ((match = regex.exec(text)) !== null) {
                    if (match.index > lastIndex) {
                        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                    }
                    const highlight = document.createElement('span');
                    highlight.className = 'highlight';
                    highlight.textContent = match[0];
                    fragment.appendChild(highlight);
                    lastIndex = match.index + match[0].length;
                }

                if (lastIndex < text.length) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                }
                textNode.parentNode.replaceChild(fragment, textNode);
            }
        });
    }

    // --- Event Listeners da Pesquisa ---
    searchInput.addEventListener("input", () => {
        const word = searchInput.value;
        removeHighlights();
        if (word.trim() !== "") {
            highlightWord(word);
        } else {
            originalContent = null;
        }
    });

    if (searchIcon) {
        searchIcon.addEventListener('click', () => {
            search.classList.toggle('active');
            if (search.classList.contains('active')) {
                searchInput.focus();
            } else {
                searchInput.value = "";
                removeHighlights();
                originalContent = null;
            }
        });
    }

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = "";
            removeHighlights();
            originalContent = null;
            search.classList.remove('active');
        }
    });
}

/* =========================================
   4. SCROLL OBSERVERS (Color Changes)
   ========================================= */
function initScrollObservers() {
    const navbar = document.querySelector('.navbar');
    const sideMenu = document.querySelector('.side-menu');
    const homeSection = document.getElementById('home');
    
    // Ícones para troca de cor
    const searchIcon = document.querySelector('.search-icon');
    const pinIcon = document.querySelector('.pin img');

    if (!homeSection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // --- ESTAMOS NA HOME (Modo Light / Texto Branco) ---
                
                if (navbar) navbar.classList.remove('dark-mode');
                if (sideMenu) sideMenu.classList.remove('dark-mode');
                
                // Resetar ícones para branco
                if (searchIcon) searchIcon.src = 'icons/search.png';
                if (pinIcon) pinIcon.src = 'icons/pin.png';

            } else {
                // --- FORA DA HOME (Modo Dark / Texto Preto) ---
                
                if (navbar) navbar.classList.add('dark-mode');
                if (sideMenu) sideMenu.classList.add('dark-mode');
                
                // Trocar ícones para preto
                if (searchIcon) searchIcon.src = 'icons/search_black.png';
                if (pinIcon) pinIcon.src = 'icons/pin_black.png';
            }
        });
    }, {
        threshold: 0.5 // Ativa quando 50% da secção Home está visível/invisível
    });

    observer.observe(homeSection);
}
/* =========================================
   GLOBAL INITIALIZATION
   ========================================= */
document.addEventListener('DOMContentLoaded', function() {
    initSplashScreen();
    initUIInteractions();
    initSearchSystem();
    initScrollObservers();
    initNewArticlesSystem(); 
    initReportSliders();     
    initAudioSystem();
});

/* =========================================
   1. SPLASH SCREEN
   ========================================= */
function initSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    const navbar = document.querySelector('.navbar');
    const indicator = document.querySelector('.section-indicator');
    const scrollBtn = document.querySelector('.scroll-button'); // Opcional: esconder botão de scroll também
    
    // Se não existir na página, para a execução
    if (!splashScreen) return;

    // Função auxiliar para mostrar/esconder UI
    const toggleUI = (show) => {
        const elements = [navbar, indicator, scrollBtn];
        elements.forEach(el => {
            if(el) {
                if(show) {
                    el.classList.remove('ui-hidden');
                } else {
                    el.classList.add('ui-hidden');
                }
            }
        });
    };

    const hasSeenSplash = sessionStorage.getItem('humanPlusIntroSeen');

    if (hasSeenSplash) {
        splashScreen.style.display = 'none';
        toggleUI(true); 
    } else {
        // 1. ESCONDE A UI IMEDIATAMENTE AO INICIAR
        toggleUI(false);

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
            
            setTimeout(() => toggleUI(true), 500); 
            
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
    const contentArea = document.body;    
    
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
   4. SCROLL OBSERVERS (Elevator & Colors)
   ========================================= */
function initScrollObservers() {
    const navbar = document.querySelector('.navbar');
    const indicator = document.querySelector('.section-indicator'); 
    const navLinks = document.querySelectorAll('.indicator-link'); 
    
    // Ícones da navbar
    const searchIcon = document.querySelector('.search-icon');
    const pinIcon = document.querySelector('.pin img');

    const sections = document.querySelectorAll('section');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Alterado: Verifica se está a intersetar E se é a secção dominante
            if (entry.isIntersecting) {
                const id = entry.target.id;

                // 1. ATUALIZAR A BOLINHA ATIVA
                navLinks.forEach(link => link.classList.remove('active'));
                
                const activeLink = document.querySelector(`.indicator-link[href="#${id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }

                // 2. LÓGICA DA LINHA DA NAVBAR (Só na Home)
                if (id === 'home') {
                    navbar.classList.add('on-home');
                } else {
                    navbar.classList.remove('on-home');
                }

                // 3. CORES (Dark Mode vs Light Mode)
                // Home e Reports = Fundo Escuro (Texto/Menu Branco)
                if (id === 'home' || id === 'reports') {
                    
                    if (navbar) navbar.classList.remove('dark-mode');
                    if (indicator) indicator.classList.remove('dark-mode'); 
                    
                    // Ícones Brancos
                    if (searchIcon) searchIcon.src = 'icons/search.png';
                    if (pinIcon) pinIcon.src = 'icons/pin.png';

                } else {
                    // Articles, Critics, Conclusion = Fundo Claro (Texto/Menu Preto)                   
                    if (navbar) navbar.classList.add('dark-mode');
                    if (indicator) indicator.classList.add('dark-mode');
                    
                    // Ícones Pretos
                    if (searchIcon) searchIcon.src = 'icons/search_black.png'; 
                    if (pinIcon) pinIcon.src = 'icons/pin_black.png';
                }
            }
        });
    }, {
        // CORREÇÃO AQUI:
        // threshold 0.15 significa que basta 15% da secção aparecer para ativar.
        // rootMargin ajuda a disparar a troca um pouco antes do centro do ecrã.
        threshold: 0.15, 
        rootMargin: "-20% 0px -50% 0px" 
    });

    sections.forEach(section => {
        observer.observe(section);
    });
}

/* =========================================
   5. NEW ARTICLES SYSTEM (TAB & SCRAMBLE)
   ========================================= */
function initNewArticlesSystem() {
    const navItems = document.querySelectorAll('.nav-item');
    const panels = document.querySelectorAll('.article-panel');
    const refToggles = document.querySelectorAll('.ref-toggle');

    // 1. LÓGICA DAS REFERÊNCIAS (APENAS ABRE/FECHA A LISTA)
    refToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const list = this.nextElementSibling;
            const icon = this.querySelector('.ref-icon');
            
            list.classList.toggle('active');

            if (list.classList.contains('active')) {
                icon.textContent = '[ - ]';
                this.style.background = '#000';
                this.style.color = '#fff';
            } else {
                icon.textContent = '[ + ]';
                this.style.background = 'transparent';
                this.style.color = '#333';
            }
        });
    });

    // Função de Scramble Text
    function scrambleText(element) {
        const originalText = element.textContent;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
        let iterations = 0;
        
        const interval = setInterval(() => {
            element.innerText = originalText
                .split('')
                .map((letter, index) => {
                    if(index < iterations) {
                        return originalText[index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join('');
            
            if(iterations >= originalText.length) {
                clearInterval(interval);
            }
            
            iterations += 1/2; 
        }, 30);
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            
            stopAudio(); 

            navItems.forEach(nav => nav.classList.remove('active'));
            panels.forEach(panel => panel.classList.remove('active'));

            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            const targetPanel = document.getElementById(targetId);
            
            if (targetPanel) {
                targetPanel.classList.add('active');
                
                const title = targetPanel.querySelector('.scramble-text');
                if (title) {
                    scrambleText(title);
                }
            }
        });
    });
}

/* =========================================
   6. REPORTS 3D TILT EFFECT (Melhorado)
   ========================================= */
function initReportsTilt() {
    const cards = document.querySelectorAll('.tilt-effect');

    if (window.innerWidth <= 768) return;

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; 
            const y = e.clientY - rect.top;
            
            const xPct = (x / rect.width) - 0.5;
            const yPct = (y / rect.height) - 0.5;

            const rotateX = yPct * -20; 
            const rotateY = xPct * 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });
}

/* =========================================
   7. REPORT IMAGE SLIDERS
   ========================================= */
function initReportSliders() {
    const sliders = document.querySelectorAll('.slider-container');

    sliders.forEach(container => {
        // Verificar se este container tem dados de imagens
        if (!container.dataset.images) return;

        const imgElement = container.querySelector('.slider-bg');
        const prevBtn = container.querySelector('.prev');
        const nextBtn = container.querySelector('.next');
        
        // Ler configurações do HTML
        const path = container.dataset.path;
        const images = JSON.parse(container.dataset.images);
        let currentIndex = 0;

        function updateSlide() {
            // Efeito visual de "glitch" ou fade rápido na troca
            imgElement.style.opacity = '0.5';
            
            setTimeout(() => {
                imgElement.src = path + images[currentIndex];
                imgElement.onload = () => {
                    imgElement.style.opacity = '1';
                };
            }, 100);
        }

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            currentIndex--;
            if (currentIndex < 0) {
                currentIndex = images.length - 1;
            }
            updateSlide();
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            currentIndex++;
            if (currentIndex >= images.length) {
                currentIndex = 0;
            }
            updateSlide();
        });
    });
}


/* =========================================
   8. TEXT TO SPEECH (CYBER AUDIO)
   ========================================= */
let synth = window.speechSynthesis;
let currentUtterance = null;
let currentBtn = null;

let voices = [];
function loadVoices() {
    voices = synth.getVoices();
}
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
}

function toggleArticleAudio(btn) {
    // 1. Se já estiver a tocar ESTE artigo, pára tudo.
    if (synth.speaking && currentBtn === btn) {
        stopAudio();
        return;
    }

    // 2. Se estiver a tocar OUTRO artigo, pára o anterior primeiro
    if (synth.speaking) {
        stopAudio();
    }

    // 3. Iniciar novo áudio
    const article = btn.closest('.article-panel');
    const content = getCleanText(article);
    
    // Configura a fala
    const utterance = new SpeechSynthesisUtterance(content);
    
    // Tenta encontrar uma voz UK (United Kingdom)
    // Tenta "Google UK English Female", ou qualquer "en-GB"
    const ukVoice = voices.find(v => v.name.includes('Google UK English Male')) || 
                    voices.find(v => v.lang === 'en-GB') ||
                    voices.find(v => v.lang === 'en_GB');

    if (ukVoice) {
        utterance.voice = ukVoice;
    }
    
    // Ajustes "Robóticos/Futuristas"
    utterance.rate = 1.0;  // Velocidade normal
    utterance.pitch = 0.9; // Ligeiramente mais grave para ser mais sério

    // Eventos de estado
    utterance.onstart = () => {
        setButtonState(btn, true);
        currentBtn = btn;
    };

    utterance.onend = () => {
        setButtonState(btn, false);
        currentBtn = null;
    };

    // Tocar
    synth.speak(utterance);
    currentUtterance = utterance;
}

function stopAudio() {
    synth.cancel();
    if (currentBtn) {
        setButtonState(currentBtn, false);
        currentBtn = null;
    }
}

// Muda o visual do botão (Play vs Stop)
function setButtonState(btn, isPlaying) {
    const icon = btn.querySelector('.icon-state');
    const text = btn.querySelector('.text-state');
    
    if (isPlaying) {
        btn.classList.add('playing');
        icon.textContent = '■'; // Stop Icon
        text.textContent = 'TRANSMITTING...';
    } else {
        btn.classList.remove('playing');
        icon.textContent = '▶'; // Play Icon
        text.textContent = 'INIT_AUDIO_LOG';
    }
}

// Função auxiliar para limpar o texto (não ler menus ou botões)
function getCleanText(element) {
    // Clona o elemento para não estragar o original
    let clone = element.cloneNode(true);
    
    // Remove elementos que não queremos ouvir
    const ignoreList = [
        '.references-container', // Não ler a lista de referências
        '.cyber-audio-btn',      // Não ler o texto do próprio botão
        '.panel-meta',           // Opcional: não ler o subtítulo técnico
        'button'                 // Não ler outros botões
    ];

    ignoreList.forEach(selector => {
        const els = clone.querySelectorAll(selector);
        els.forEach(el => el.remove());
    });

    return clone.innerText;
}

// Parar o áudio se o utilizador mudar de aba no menu de artigos
// Adiciona isto ao teu initNewArticlesSystem existente, dentro do evento click do navItem
/*
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            stopAudio(); // <--- ADICIONAR ESTA LINHA NA TUA FUNÇÃO EXISTENTE
            // ... resto do código ...
        });
    });
*/
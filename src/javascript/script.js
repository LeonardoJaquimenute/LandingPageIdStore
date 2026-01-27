class Carousel {
    constructor(element) {
        this.container = element;
        this.track = this.container.querySelector('.carousel-track');
        this.items = Array.from(this.track.children);
        this.prevBtn = this.container.querySelector('.prev');
        this.nextBtn = this.container.querySelector('.next');
        this.indicatorsContainer = document.querySelector('.carousel-indicators');
        this.progressBar = document.querySelector('.autoplay-progress-bar');

        this.currentIndex = 0;
        this.updateItemsPerView();
        this.maxIndex = Math.ceil(this.items.length - this.itemsPerView);
        this.isAutoplay = true;
        this.autoplayInterval = 2500; // 4 segundos
        this.autoplayTimer = null;
        this.progressTimer = null;

        this.init();
    }

    init() {
        this.createIndicators();
        this.updateCarousel();
        this.attachEvents();
        this.startAutoplay();

        // Responsividade
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const oldItemsPerView = this.itemsPerView;
                this.updateItemsPerView();

                // Recalcular índices se mudou o número de itens visíveis
                if (oldItemsPerView !== this.itemsPerView) {
                    this.maxIndex = Math.ceil(this.items.length - this.itemsPerView);
                    this.currentIndex = Math.min(this.currentIndex, this.maxIndex);
                    this.recreateIndicators();
                }

                this.updateCarousel();
            }, 250);
        });
    }

    updateItemsPerView() {
        const width = window.innerWidth;
        if (width <= 768) {
            this.itemsPerView = 1;
        } else if (width <= 1024) {
            this.itemsPerView = 2;
        } else {
            this.itemsPerView = 2;
        }
    }

    recreateIndicators() {
        // Limpar indicadores existentes
        this.indicatorsContainer.innerHTML = '';

        // Criar novos indicadores
        const totalPages = this.maxIndex + 1;
        for (let i = 0; i < totalPages; i++) {
            const indicator = document.createElement('button');
            indicator.classList.add('indicator');
            indicator.setAttribute('aria-label', `Ir para slide ${i + 1}`);
            indicator.addEventListener('click', () => this.goToSlide(i));
            this.indicatorsContainer.appendChild(indicator);
        }
    }

    createIndicators() {
        const totalPages = this.maxIndex + 1;
        for (let i = 0; i < totalPages; i++) {
            const indicator = document.createElement('button');
            indicator.classList.add('indicator');
            indicator.setAttribute('aria-label', `Ir para slide ${i + 1}`);
            indicator.addEventListener('click', () => this.goToSlide(i));
            this.indicatorsContainer.appendChild(indicator);
        }
    }

    updateCarousel() {
        const itemWidth = this.items[0].offsetWidth;
        const gap = 20;
        const offset = -(this.currentIndex * (itemWidth + gap));

        this.track.style.transform = `translateX(${offset}px)`;

        // Atualizar indicadores
        const indicators = this.indicatorsContainer.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentIndex);
        });

        // Atualizar botões
        this.prevBtn.style.opacity = this.currentIndex === 0 ? '0.5' : '1';
        this.prevBtn.style.cursor = this.currentIndex === 0 ? 'not-allowed' : 'pointer';
        this.nextBtn.style.opacity = this.currentIndex >= this.maxIndex ? '0.5' : '1';
        this.nextBtn.style.cursor = this.currentIndex >= this.maxIndex ? 'not-allowed' : 'pointer';
    }

    goToSlide(index) {
        this.currentIndex = Math.max(0, Math.min(index, this.maxIndex));
        this.updateCarousel();
        this.resetAutoplay();
    }

    next() {
        if (this.currentIndex < this.maxIndex) {
            this.currentIndex++;
        } else {
            this.currentIndex = 0; // Voltar ao início
        }
        this.updateCarousel();
        this.resetAutoplay();
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        } else {
            this.currentIndex = this.maxIndex; // Ir para o final
        }
        this.updateCarousel();
        this.resetAutoplay();
    }

    startAutoplay() {
        if (!this.isAutoplay) return;

        this.stopAutoplay();

        let startTime = Date.now();

        this.progressTimer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / this.autoplayInterval) * 100, 100);
            this.progressBar.style.width = `${progress}%`;
        }, 16); // ~60fps para animação suave

        this.autoplayTimer = setTimeout(() => {
            this.progressBar.style.width = '100%';
            setTimeout(() => {
                this.next();
            }, 50);
        }, this.autoplayInterval);
    }

    stopAutoplay() {
        if (this.autoplayTimer) {
            clearTimeout(this.autoplayTimer);
            this.autoplayTimer = null;
        }
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
            this.progressTimer = null;
        }
        this.progressBar.style.width = '0%';
    }

    resetAutoplay() {
        this.stopAutoplay();
        this.startAutoplay();
    }

    attachEvents() {
        this.nextBtn.addEventListener('click', () => this.next());
        this.prevBtn.addEventListener('click', () => this.prev());

        // Pausar autoplay ao passar o mouse (desktop)
        this.container.addEventListener('mouseenter', () => this.stopAutoplay());
        this.container.addEventListener('mouseleave', () => this.startAutoplay());

        // Suporte a toque (swipe) melhorado
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchEndY = 0;
        let isSwiping = false;

        this.track.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            isSwiping = false;
            this.stopAutoplay();
        }, { passive: true });

        this.track.addEventListener('touchmove', (e) => {
            if (!isSwiping) {
                const touchMoveX = e.changedTouches[0].screenX;
                const touchMoveY = e.changedTouches[0].screenY;
                const diffX = Math.abs(touchMoveX - touchStartX);
                const diffY = Math.abs(touchMoveY - touchStartY);

                // Detectar se é swipe horizontal
                if (diffX > diffY && diffX > 10) {
                    isSwiping = true;
                    e.preventDefault();
                }
            }
        }, { passive: false });

        this.track.addEventListener('touchend', (e) => {
            if (isSwiping) {
                touchEndX = e.changedTouches[0].screenX;
                touchEndY = e.changedTouches[0].screenY;
                this.handleSwipe(touchStartX, touchEndX, touchStartY, touchEndY);
            }
            this.startAutoplay();
        }, { passive: true });

        // Suporte a teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });
    }

    handleSwipe(startX, endX, startY, endY) {
        const swipeThreshold = 50;
        const horizontalDiff = startX - endX;
        const verticalDiff = Math.abs(startY - endY);

        // Só considera swipe horizontal se movimento vertical for pequeno
        if (verticalDiff < 50) {
            if (horizontalDiff > swipeThreshold) {
                this.next();
            } else if (horizontalDiff < -swipeThreshold) {
                this.prev();
            }
        }
    }
}

// Inicializar o carrossel
document.addEventListener('DOMContentLoaded', () => {
    const carouselElement = document.querySelector('.carousel-container');
    if (carouselElement) {
        new Carousel(carouselElement);
    }

    const btnMobile = document.querySelector('.btn-mobile');
    const navList = document.querySelector('.navbar ul');

    if (btnMobile && navList) {
        btnMobile.addEventListener('click', () => {
            navList.classList.toggle('show');

            const icon = btnMobile.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-xmark');
            }
        });
    }

    /* --- ANIMAÇÃO AO SCROLL (INTERSECTION OBSERVER) --- */
    const observerOptions = {
        root: null, // Observa a viewport (janela do navegador)
        rootMargin: '0px',
        threshold: 0.1 // A animação dispara quando 10% do elemento estiver visível
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Adiciona a classe que faz o elemento subir e aparecer
                entry.target.classList.add('show-animation');
                
                // (Opcional) Para de observar o elemento depois que animou uma vez
                // Se quiser que anime toda vez que rolar, remova a linha abaixo
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    // Seleciona todos os elementos que tem a classe .animate-on-scroll
    const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
    elementsToAnimate.forEach((el) => observer.observe(el));

});

// ... (seu código do menu mobile está aqui acima) ...

/* --- LÓGICA DE SCROLL DA NAVBAR (NOVO) --- */
const header = document.querySelector('header');
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.navbar ul li a');

window.addEventListener('scroll', () => {
    let currentSection = '';

    // 1. Efeito de Sombra no Header
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    // 2. Identificar qual seção está na tela (Scrollspy)
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        // O valor -150 serve para ativar a seção um pouco antes de chegar nela exata
        if (pageYOffset >= (sectionTop - 150)) {
            currentSection = section.getAttribute('id');
        }
    });

    // 3. Atualizar a classe .active no menu
    navLinks.forEach(link => {
        link.classList.remove('active');
        // Verifica se o href do link contem o ID da seção atual
        if (link.getAttribute('href').includes(currentSection)) {
            link.classList.add('active');
        }
    });
});
// Diva Interiors - Full Interactive Controller

const TOTAL_FRAMES = 300;
const frames = [];
let loadedCount = 0;

// DOM Elements - Preloader & Canvas
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
const preloader = document.getElementById('preloader');
const loaderBar = document.getElementById('loader-bar');
const loaderPercentage = document.getElementById('loader-percentage');
const progressBar = document.getElementById('progress-bar');
const triggerZone = document.getElementById('animation-trigger-zone');
const header = document.getElementById('siteHeader');
const heroOverlay = document.getElementById('hero-overlay');

// Scroll Animation Easing State
const scrollState = {
    targetFrame: 0,
    currentFrame: 0,
    lerpFactor: 0.08, // inertia easing
};

// 1. PRELOAD IMAGES
function getFramePath(index) {
    const frameNum = String(index).padStart(3, '0');
    return `/ezgif-16919eb72f0aade3-jpg/ezgif-frame-${frameNum}.jpg`;
}

function preloadImages() {
    return new Promise((resolve) => {
        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = getFramePath(i);
            img.onload = onImageLoad;
            img.onerror = onImageLoad; // Fallback
            frames.push(img);
        }

        function onImageLoad() {
            loadedCount++;
            const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
            
            // Update loader UI
            if (loaderBar) loaderBar.style.width = `${percent}%`;
            if (loaderPercentage) loaderPercentage.innerText = `${percent}%`;

            if (loadedCount === TOTAL_FRAMES) {
                // Fade out loader
                setTimeout(() => {
                    if (preloader) {
                        preloader.classList.add('fade-out');
                        setTimeout(() => preloader.style.display = 'none', 1000);
                    }
                    initializeCanvas();
                    initializePageAnimations();
                    resolve();
                }, 600);
            }
        }
    });
}

// 2. CANVAS SETUP
function resizeCanvas() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    
    renderFrame(scrollState.currentFrame);
}

let lastWidth = window.innerWidth;
let lastHeight = window.innerHeight;

function initializeCanvas() {
    if (!canvas) return;
    resizeCanvas();
    window.addEventListener('resize', () => {
        const widthChanged = window.innerWidth !== lastWidth;
        const heightChanged = Math.abs(window.innerHeight - lastHeight) > 120;
        
        if (widthChanged || heightChanged) {
            lastWidth = window.innerWidth;
            lastHeight = window.innerHeight;
            resizeCanvas();
        }
    });
    requestAnimationFrame(updateAnimation);
}

function renderFrame(frameIndex) {
    const roundedIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(frameIndex)));
    const img = frames[roundedIndex];
    if (!img || !img.complete) return;

    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    // Aspect-ratio cover calculations
    const imageWidth = img.naturalWidth;
    const imageHeight = img.naturalHeight;
    const scale = Math.max(canvasWidth / imageWidth, canvasHeight / imageHeight);
    
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    const drawX = (canvasWidth - drawWidth) / 2;
    const drawY = (canvasHeight - drawHeight) / 2;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

function updateAnimation() {
    const diff = scrollState.targetFrame - scrollState.currentFrame;
    if (Math.abs(diff) > 0.01) {
        scrollState.currentFrame += diff * scrollState.lerpFactor;
        renderFrame(scrollState.currentFrame);
    }
    requestAnimationFrame(updateAnimation);
}

// 3. FRAME AND SCROLL COORDINATION
window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    
    // Calculate progress *only* within the trigger zone height
    if (triggerZone) {
        const zoneHeight = triggerZone.offsetHeight - window.innerHeight;
        const scrollFraction = zoneHeight > 0 ? Math.min(1, Math.max(0, scrollTop / zoneHeight)) : 0;
        
        scrollState.targetFrame = scrollFraction * (TOTAL_FRAMES - 1);
        if (progressBar) progressBar.style.width = `${scrollFraction * 100}%`;

        // Fade out hero brand and scroll cue as the user scrolls down
        if (heroOverlay) {
            const heroOpacity = Math.max(0, 1 - (scrollFraction / 0.08)); // fade out by 8% scroll depth
            heroOverlay.style.opacity = heroOpacity;
            heroOverlay.style.transform = `translate(-50%, calc(-50% - ${scrollFraction * 250}px))`;
            heroOverlay.style.pointerEvents = heroOpacity > 0.01 ? 'auto' : 'none';
        }

        // Hide navigation header when scroll animation is active, show afterwards
        if (header) {
            if (scrollTop >= zoneHeight + 100) {
                header.classList.add('visible');
            } else {
                header.classList.remove('visible');
            }
        }
    }
});

// Start preloading images immediately
preloadImages();


// 4. HOME PAGE INTERACTIVE PLUGINS (Diva Interiors logic)
function initializePageAnimations() {
    /* ---------------- LENIS SMOOTH SCROLL ---------------- */
    const lenis = new Lenis({ 
        duration: 1.1, 
        easing: t => 1 - Math.pow(1 - t, 4),
        smoothWheel: true 
    });
    function raf(time) { 
        lenis.raf(time); 
        requestAnimationFrame(raf); 
    }
    requestAnimationFrame(raf);
    
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { 
        lenis.raf(time * 1000); 
    });
    gsap.ticker.lagSmoothing(0);
    gsap.registerPlugin(ScrollTrigger);

    /* ---------------- SCROLLING HEADER STATE ---------------- */
    ScrollTrigger.create({ 
        start: () => (triggerZone ? triggerZone.offsetHeight : 80) + 80, 
        end: 99999, 
        onUpdate: self => { 
            if (header) header.classList.toggle('scrolled', self.scroll() > (triggerZone ? triggerZone.offsetHeight : 80) + 80); 
        } 
    });

    /* ---------------- GSAP REVEAL ANIMATIONS ---------------- */
    gsap.utils.toArray('.reveal').forEach(el => {
        gsap.to(el, {
            opacity: 1, 
            y: 0, 
            duration: 1.2, 
            ease: 'power3.out',
            scrollTrigger: { 
                trigger: el, 
                start: 'top 88%' 
            }
        });
    });

    /* ---------------- GSAP COUNTERS ---------------- */
    gsap.utils.toArray('.counter').forEach(el => {
        const to = +el.dataset.to;
        ScrollTrigger.create({
            trigger: el, 
            start: 'top 85%', 
            once: true,
            onEnter: () => { 
                gsap.to({val: 0}, {
                    val: to, 
                    duration: 2.0, 
                    ease: 'power2.out', 
                    onUpdate: function() { 
                        el.textContent = Math.floor(this.targets()[0].val); 
                    }
                }); 
            }
        });
    });

    /* ---------------- CURSOR FOLLOW & MAGNETICS ---------------- */
    const cursor = document.getElementById('cursor');
    if (cursor) {
        window.addEventListener('mousemove', e => { 
            gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.15 }); 
        });
        
        document.querySelectorAll('a, button, .chip, .mcard, .faq-q, .service-card').forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('big'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
        });
    }

    document.querySelectorAll('.magnetic').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const r = btn.getBoundingClientRect();
            const x = e.clientX - r.left - r.width/2;
            const y = e.clientY - r.top - r.height/2;
            gsap.to(btn, { x: x * 0.35, y: y * 0.5, duration: 0.4, ease: 'power3.out' });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
        });
    });

    /* ---------------- SERVICES (Horizontal Scroll) ---------------- */
    const SERVICES = [
        ["01", "Residential Interiors", "Full-home design and execution for apartments and independent homes.", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop"],
        ["02", "Luxury Villas", "End-to-end villa interiors — from façade detailing to the last cushion.", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1000&auto=format&fit=crop"],
        ["03", "Modular Kitchen", "German hardware, stone counters, and layouts built around how you cook.", "https://images.unsplash.com/photo-1556909114-44e3e70034e2?q=80&w=1000&auto=format&fit=crop"],
        ["04", "Wardrobes & Storage", "Walk-ins and shutter wardrobes tailored to every wardrobe inch.", "https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?q=80&w=1000&auto=format&fit=crop"],
        ["05", "Living Room", "Statement living spaces built around light, art and conversation.", "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=1000&auto=format&fit=crop"],
        ["06", "Bedroom Suites", "Calm, hotel-grade bedroom design — from headboards to lighting layers.", "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1000&auto=format&fit=crop"],
        ["07", "Commercial Interiors", "Offices, showrooms and hospitality spaces designed to perform.", "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop"],
        ["08", "Renovation", "Full strip-outs and refreshes of older homes, without the chaos.", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1000&auto=format&fit=crop"],
        ["09", "Turnkey Projects", "One contract, one timeline, one studio responsible for everything.", "https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1000&auto=format&fit=crop"]
    ];
    
    const hTrack = document.getElementById('hscrollTrack');
    if (hTrack) {
        hTrack.innerHTML = SERVICES.map(s => `
            <div class="service-card">
                <img src="${s[3]}" alt="${s[1]} — Diva Interiors Hyderabad" loading="lazy">
                <div class="num">${s[0]}</div>
                <div class="body">
                    <h3>${s[1]}</h3>
                    <p>${s[2]}</p>
                    <div class="arrow">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M5 19L19 5M19 5H8M19 5V16" stroke="#191714" stroke-width="2"/>
                        </svg>
                    </div>
                </div>
            </div>`).join('');
            
        // Only run horizontal scroll pin on desktop (> 780px)
        let mm = gsap.matchMedia();
        mm.add("(min-width: 781px)", () => {
            const getScrollAmount = () => hTrack.scrollWidth - window.innerWidth + 48;
            const tween = gsap.to(hTrack, { x: () => -getScrollAmount(), ease: 'none' });
            
            ScrollTrigger.create({
                trigger: '#services', 
                start: 'top top', 
                end: () => '+=' + getScrollAmount(),
                pin: true, 
                animation: tween, 
                scrub: 1, 
                invalidateOnRefresh: true
            });
        });
    }

    /* ---------------- BEFORE/AFTER SLIDER ---------------- */
    const baWrap = document.getElementById('baWrap');
    const baBefore = document.getElementById('baBeforeWrap');
    const baHandle = document.getElementById('baHandle');
    let dragging = false;
    
    if (baWrap && baBefore && baHandle) {
        const setBA = (clientX) => {
            const r = baWrap.getBoundingClientRect();
            let pct = ((clientX - r.left) / r.width) * 100;
            pct = Math.min(Math.max(pct, 0), 100);
            baBefore.style.width = pct + '%';
            baHandle.style.left = pct + '%';
        };
        
        baWrap.addEventListener('mousedown', () => dragging = true);
        window.addEventListener('mouseup', () => dragging = false);
        window.addEventListener('mousemove', e => { if (dragging) setBA(e.clientX); });
        
        baWrap.addEventListener('touchstart', () => dragging = true);
        window.addEventListener('touchend', () => dragging = false);
        window.addEventListener('touchmove', e => { setBA(e.touches[0].clientX); });
        
        baWrap.addEventListener('click', e => setBA(e.clientX));
    }

    /* ---------------- PORTFOLIO MASONRY ---------------- */
    const PROJECTS = [
        ["villa", "Jubilee Hills Villa", "8400 sq.ft · 2025", "https://images.unsplash.com/photo-1600210492493-0946911123ea?q=80&w=900&auto=format&fit=crop"],
        ["apartment", "Gachibowli Skyline Residence", "2100 sq.ft · 2024", "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=900&auto=format&fit=crop"],
        ["kitchen", "Banjara Hills Modular Kitchen", "320 sq.ft · 2025", "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?q=80&w=900&auto=format&fit=crop"],
        ["commercial", "Hitec City Studio Office", "6000 sq.ft · 2023", "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=900&auto=format&fit=crop"],
        ["villa", "Kokapet Lake Villa", "11200 sq.ft · 2025", "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=900&auto=format&fit=crop"],
        ["apartment", "Financial District Penthouse", "3400 sq.ft · 2024", "https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=900&auto=format&fit=crop"],
        ["commercial", "Madhapur Boutique Showroom", "1800 sq.ft · 2023", "https://images.unsplash.com/photo-1604014237800-1c9102c219da?q=80&w=900&auto=format&fit=crop"],
        ["kitchen", "Manikonda Open Kitchen", "410 sq.ft · 2024", "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=900&auto=format&fit=crop"],
        ["villa", "Shamirpet Farmhouse", "9600 sq.ft · 2022", "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=900&auto=format&fit=crop"]
    ];
    
    const grid = document.getElementById('masonryGrid');
    if (grid) {
        const renderProjects = (filter) => {
            grid.innerHTML = PROJECTS.filter(p => filter === 'all' || p[0] === filter).map(p => `
                <div class="mcard">
                    <img class="lazy-img loaded" src="${p[3]}" alt="${p[1]} — luxury interior design Hyderabad" loading="lazy">
                    <div class="overlay"><div><h4>${p[1]}</h4><p>${p[2]}</p></div></div>
                </div>`).join('');
        };
        
        renderProjects('all');
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderProjects(btn.dataset.filter);
            });
        });
    }

    /* ---------------- TIMELINE PROGRESS ---------------- */
    const tlLine = document.getElementById('tlProgress');
    if (tlLine) {
        gsap.to(tlLine, { 
            width: '100%', 
            ease: 'none', 
            scrollTrigger: { 
                trigger: '.tl', 
                start: 'top 70%', 
                end: 'bottom 80%', 
                scrub: true 
            } 
        });
    }

    /* ---------------- MATERIALS MARQUEE ---------------- */
    const marqueeTrack = document.getElementById('marqueeTrack');
    if (marqueeTrack) {
        const MATERIALS = ["Italian Marble", "Kohler", "Hettich Hardware", "Greenply", "Asian Paints Royale", "Hafele", "Century Ply", "Jaquar", "Duravit", "Crossville Stone"];
        marqueeTrack.innerHTML = [...MATERIALS, ...MATERIALS].map(m => `<span>${m}</span>`).join('');
    }

    /* ---------------- ESTIMATOR ---------------- */
    const areaSlider = document.getElementById('areaSlider');
    const areaVal = document.getElementById('areaVal');
    let spaceMult = 1, finishRate = 2100;
    
    if (areaSlider && areaVal) {
        const calcEstimate = () => {
            const area = +areaSlider.value;
            areaVal.textContent = area;
            const base = area * finishRate * spaceMult;
            const low = (base * 0.92) / 100000;
            const high = (base * 1.12) / 100000;
            document.getElementById('estLow').textContent = low.toFixed(1);
            document.getElementById('estHigh').textContent = high.toFixed(1);
        };
        
        areaSlider.addEventListener('input', calcEstimate);
        
        const spaceChips = document.getElementById('spaceChips');
        if (spaceChips) {
            spaceChips.addEventListener('click', e => {
                if (!e.target.classList.contains('chip')) return;
                [...e.currentTarget.children].forEach(c => c.classList.remove('active'));
                e.target.classList.add('active'); 
                spaceMult = +e.target.dataset.mult; 
                calcEstimate();
            });
        }
        
        const finishChips = document.getElementById('finishChips');
        if (finishChips) {
            finishChips.addEventListener('click', e => {
                if (!e.target.classList.contains('chip')) return;
                [...e.currentTarget.children].forEach(c => c.classList.remove('active'));
                e.target.classList.add('active'); 
                finishRate = +e.target.dataset.rate; 
                calcEstimate();
            });
        }
        
        calcEstimate();
    }

    /* ---------------- TESTIMONIALS ---------------- */
    const testGrid = document.getElementById('testGrid');
    if (testGrid) {
        const TESTIMONIALS = [
            ["Diva designed our Jubilee Hills villa and the attention to material detail was unmatched. Every drawer, every joint — considered.", "Rahul & Priya Menon", "Jubilee Hills Villa, 2025", "https://i.pravatar.cc/80?img=12"],
            ["Our modular kitchen was delivered in exactly the timeline promised. No surprises, no extra costs. Exactly what a turnkey project should feel like.", "Sandhya Reddy", "Manikonda Apartment, 2024", "https://i.pravatar.cc/80?img=32"],
            ["They understood our office needed to feel calm, not corporate. The Hitec City studio gets compliments from every client who visits.", "Arvind Kumar", "Hitec City Office, 2023", "https://i.pravatar.cc/80?img=51"]
        ];
        
        testGrid.innerHTML = TESTIMONIALS.map(t => `
            <div class="test-card reveal">
                <div>
                    <div class="stars">★★★★★</div>
                    <p>"${t[0]}"</p>
                </div>
                <div class="who">
                    <img src="${t[3]}" alt="${t[1]}">
                    <div>
                        <b>${t[1]}</b>
                        <span>${t[2]}</span>
                    </div>
                </div>
            </div>`).join('');
            
        gsap.utils.toArray('.test-card.reveal').forEach(el => {
            gsap.to(el, {
                opacity: 1, 
                y: 0, 
                duration: 0.9, 
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el, 
                    start: 'top 90%'
                }
            });
        });
    }

    /* ---------------- INSTAGRAM ---------------- */
    const instaGrid = document.getElementById('instaGrid');
    if (instaGrid) {
        const INSTA = [
            "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=400&auto=format&fit=crop"
        ];
        instaGrid.innerHTML = INSTA.map(src => `
            <div class="insta-item">
                <img src="${src}" loading="lazy" alt="Diva Interiors Instagram project">
                <div class="ov">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                        <rect x="2" y="2" width="20" height="20" rx="5"/>
                        <circle cx="12" cy="12" r="4"/>
                        <circle cx="17.5" cy="6.5" r="1"/>
                    </svg>
                </div>
            </div>`).join('');
    }

    /* ---------------- FAQ ACCORDION ---------------- */
    const faqList = document.getElementById('faqList');
    if (faqList) {
        const FAQS = [
            ["How long does a full home interior project take?", "A typical 2-3BHK apartment takes 75–90 working days from design freeze to handover. Villas range from 120–180 days depending on scope."],
            ["Do you handle civil and electrical work too?", "Yes — Diva Interiors is a true turnkey studio. Civil, electrical, plumbing coordination, false ceiling, modular furniture and styling are all under one contract."],
            ["What is your minimum project size?", "We take on single-room projects like modular kitchens and wardrobes as well as full 10,000+ sq.ft villas — there's no strict minimum."],
            ["Can I see the 3D design before work begins?", "Always. Every project includes photorealistic 3D walkthroughs at the concept stage, with revisions, before any execution begins."],
            ["Do you offer warranty on the work?", "Yes — a 5-year warranty on modular furniture and a 1-year warranty on civil and electrical work, with an annual maintenance visit."]
        ];
        
        faqList.innerHTML = FAQS.map((f, i) => `
            <div class="faq-item reveal ${i === 0 ? 'open' : ''}">
                <div class="faq-q"><span>${f[0]}</span><div class="plus"></div></div>
                <div class="faq-a" style="${i === 0 ? 'max-height:200px;' : ''}"><p>${f[1]}</p></div>
            </div>`).join('');
            
        document.querySelectorAll('.faq-item').forEach(item => {
            item.querySelector('.faq-q').addEventListener('click', () => {
                const isOpen = item.classList.contains('open');
                document.querySelectorAll('.faq-item').forEach(i => { 
                    i.classList.remove('open'); 
                    i.querySelector('.faq-a').style.maxHeight = null; 
                });
                if (!isOpen) { 
                    item.classList.add('open'); 
                    const a = item.querySelector('.faq-a'); 
                    a.style.maxHeight = a.scrollHeight + 'px'; 
                }
            });
        });
    }

    // Refresh ScrollTrigger after dynamic content loads
    setTimeout(() => ScrollTrigger.refresh(), 600);
}

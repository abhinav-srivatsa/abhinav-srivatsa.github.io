document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selections ---
    const article = document.querySelector('article');
    const html = document.documentElement;
    const scrollFadeTop = document.querySelector('.scroll-fade-top');
    const scrollFadeBottom = document.querySelector('.scroll-fade-bottom');
    const stickyPill = document.getElementById('stickyPill');
    const pillCollapsed = document.querySelector('.pill-collapsed');
    const pillExpanded = document.querySelector('.pill-expanded');
    const currentSectionSpan = document.getElementById('currentSection');
    const readingTimeValueSpan = document.getElementById('readingTimeValue');
    const sectionList = document.getElementById('sectionList');
    const mainHeading = article ? article.querySelector('h1') : null;
    const sections = article ? Array.from(article.querySelectorAll('h2')) : [];
    const closePillButton = document.getElementById('closePillButton');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const articleImages = article ? article.querySelectorAll('img') : [];

    // Exit if essential elements are missing
    if (!article || !mainHeading) {
        console.error("Article content not found. Interactive scripts disabled.");
        if (stickyPill) stickyPill.style.display = 'none';
        return;
    }

    // --- Lightbox Logic ---
    const openLightbox = () => {
        lightbox.classList.add('visible');
        if (typeof motion !== 'undefined') {
            motion.animate(lightboxImg, { scale: [0.95, 1] }, { duration: 0.3 });
        }
    };

    const closeLightbox = () => {
        lightbox.classList.remove('visible');
    };

    articleImages.forEach(img => {
        img.addEventListener('click', (e) => {
            lightboxImg.src = e.target.src;
            openLightbox();
        });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => e.target === lightbox && closeLightbox());
    window.addEventListener('keydown', (e) => e.key === 'Escape' && closeLightbox());

    // --- Pill Logic ---
    let isPillExpanded = false;

    // Function to calculate and set pill width based on content
    const updatePillWidth = () => {
        if (isPillExpanded) return; // Don't resize when expanded
        
        // Create a temporary element to measure text width
        const tempSpan = document.createElement('span');
        tempSpan.style.cssText = `
            position: absolute;
            visibility: hidden;
            white-space: nowrap;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 500;
        `;
        document.body.appendChild(tempSpan);
        
        // Measure the section name width
        tempSpan.textContent = currentSectionSpan.textContent;
        const sectionNameWidth = tempSpan.offsetWidth;
        
        // Remove the temporary element
        document.body.removeChild(tempSpan);
        
        // Calculate total width: section name + divider + reading time + padding
        const dividerWidth = 16; // 1px + 16px margin
        const readingTimeWidth = 65; // Approximate width of "X min left"
        const padding = 48; // 24px on each side
        
        const totalWidth = sectionNameWidth + dividerWidth + readingTimeWidth + padding;
        
        // Animate the width change smoothly
        if (typeof motion !== 'undefined') {
            motion.animate(
                stickyPill,
                { width: totalWidth },
                { duration: 0.4, easing: [0.16, 1, 0.3, 1] }
            );
        } else {
            // Fallback for when Motion is not available
            stickyPill.style.width = totalWidth + 'px';
        }
    };

    const expandPill = () => {
        isPillExpanded = true;
        stickyPill.classList.add('expanded');
    };

    const collapsePill = () => {
        isPillExpanded = false;
        stickyPill.classList.remove('expanded');
        // Update width after collapse animation completes
        setTimeout(updatePillWidth, 400);
    };

    stickyPill.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('.close-button') || isPillExpanded) return;
        expandPill();
    });
    closePillButton.addEventListener('click', collapsePill);

    // --- Scroll & Setup Logic ---
    const wordsPerMinute = 225;
    const text = article.textContent || '';
    const wordCount = text.split(/\s+/).length;
    const totalReadingTime = Math.ceil(wordCount / wordsPerMinute);
    let lastMinute = totalReadingTime;
    readingTimeValueSpan.textContent = totalReadingTime;

    const createLink = (text, target) => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.textContent = text;
        link.href = `#${target}`;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            collapsePill();
            setTimeout(() => {
                const element = target === 'top' ? document.body : document.getElementById(target);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });
        listItem.appendChild(link);
        sectionList.appendChild(listItem);
    };

    const handleScroll = () => {
        const scrollTop = window.scrollY;
        const scrollHeight = html.scrollHeight - html.clientHeight;
        const scrollPercent = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

        if (scrollFadeTop) scrollFadeTop.classList.toggle('visible', scrollTop > 20);
        if (scrollFadeBottom) scrollFadeBottom.classList.toggle('hidden', (scrollHeight - scrollTop) < 20);

        const timeRemaining = Math.max(0, Math.ceil(totalReadingTime * (1 - scrollPercent)));
        if (timeRemaining !== lastMinute) {
            readingTimeValueSpan.classList.add('animate-out');
            setTimeout(() => {
                readingTimeValueSpan.textContent = timeRemaining;
                readingTimeValueSpan.classList.remove('animate-out');
                readingTimeValueSpan.classList.add('animate-in');
                setTimeout(() => readingTimeValueSpan.classList.remove('animate-in'), 300);
            }, 300);
            lastMinute = timeRemaining;
        }

        let activeSection = mainHeading;
        for (let i = sections.length - 1; i >= 0; i--) {
            if (scrollTop >= sections[i].offsetTop - 150) {
                activeSection = sections[i];
                break;
            }
        }
        
        // Update section name and pill width if it changed
        if (currentSectionSpan.textContent !== activeSection.textContent) {
            currentSectionSpan.textContent = activeSection.textContent;
            updatePillWidth(); // This will smoothly animate the width change
        }
    };

    // Initial Population
    createLink(mainHeading.textContent, 'top');
    sections.forEach(section => createLink(section.textContent, section.id));
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // This will set initial content and width

    // Add Motion animations if available
    if (typeof motion !== 'undefined') {
        // Animate pill on page load
        motion.animate(
            stickyPill,
            { opacity: [0, 1], y: [20, 0] },
            { duration: 0.8, delay: 0.5, easing: [0.16, 1, 0.3, 1] }
        );
    }
});

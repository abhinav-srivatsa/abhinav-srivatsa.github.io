// --- Element Selections ---
const article = document.querySelector('article');
const html = document.documentElement;
const scrollFadeTop = document.querySelector('.scroll-fade-top');
const scrollFadeBottom = document.querySelector('.scroll-fade-bottom');
const stickyPill = document.getElementById('stickyPill');
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

// Exit if essential elements are missing to prevent errors
if (!article || !mainHeading) {
    console.error("Article content not found. Interactive scripts disabled.");
    if(stickyPill) stickyPill.style.display = 'none';
    // Still allow lightbox to work if images exist outside an article
    if (articleImages.length === 0) return;
}

// --- Lightbox Logic ---
const openLightbox = (e) => lightbox.classList.add('visible');
const closeLightbox = () => lightbox.classList.remove('visible');

articleImages.forEach(img => {
    img.style.cursor = 'zoom-in'; // Add visual cue to images
    img.addEventListener('click', (e) => {
        lightboxImg.src = e.target.src;
        openLightbox();
    });
});

if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if (lightbox) lightbox.addEventListener('click', (e) => e.target === lightbox && closeLightbox());
window.addEventListener('keydown', (e) => e.key === 'Escape' && closeLightbox());

// --- Pill & Reading Time Logic ---
if (stickyPill) {
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
            stickyPill.classList.remove('expanded');
            setTimeout(() => {
                const element = target === 'top' ? document.body : document.getElementById(target);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 400);
        });
        listItem.appendChild(link);
        sectionList.appendChild(listItem);
    };
    
    createLink(mainHeading.textContent, 'top');
    sections.forEach(section => createLink(section.textContent, section.id));

    const handleScroll = () => {
        const scrollTop = window.scrollY;
        const scrollHeight = html.scrollHeight - html.clientHeight;
        const scrollPercent = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

        // Scroll Fade Effects
        if (scrollFadeTop) scrollFadeTop.classList.toggle('visible', scrollTop > 20);
        if (scrollFadeBottom) scrollFadeBottom.classList.toggle('hidden', (scrollHeight - scrollTop) < 20);

        // Time Animation
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

        // Section Name Update
        let activeSection = mainHeading;
        for (let i = sections.length - 1; i >= 0; i--) {
            if (scrollTop >= sections[i].offsetTop - 150) {
                activeSection = sections[i];
                break;
            }
        }
        currentSectionSpan.textContent = activeSection.textContent;
    };

    stickyPill.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('.close-button')) return;
        stickyPill.classList.add('expanded');
    });
    closePillButton.addEventListener('click', () => stickyPill.classList.remove('expanded'));

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call to set correct state on page load
}

// --- Section List Dynamic Update ---
function updateSectionList() {
    // Remove all current list items
    while (sectionList.firstChild) sectionList.removeChild(sectionList.firstChild);
    // Re-query all h2s
    const newSections = article ? Array.from(article.querySelectorAll('h2')) : [];
    createLink(mainHeading.textContent, 'top');
    newSections.forEach(section => createLink(section.textContent, section.id));
}

// Set up MutationObserver to watch for h2 changes
if (article) {
    const observer = new MutationObserver((mutationsList) => {
        let shouldUpdate = false;
        for (const mutation of mutationsList) {
            if ([...mutation.addedNodes, ...mutation.removedNodes].some(node => node.tagName === 'H2')) {
                shouldUpdate = true;
                break;
            }
        }
        if (shouldUpdate) updateSectionList();
    });
    observer.observe(article, { childList: true, subtree: true });
}

// Initial population of section list
updateSectionList();
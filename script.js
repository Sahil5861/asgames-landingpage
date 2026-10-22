
// const baseUrl = 'https://asgames.in';
const baseUrl = 'http://127.0.0.1:8081';



(function () {
    let loaderShownAt = Date.now();
    let pageHasLoaded = document.readyState === 'complete';
    let initialRequestFinished = false;
    let hideTimer = null;
    const MIN_VISIBLE_MS = 450;
    const loader = () => document.getElementById('pageLoader');

    window.showLoader = function showLoader() {
        const el = loader();
        if (!el) return;
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        loaderShownAt = Date.now();
        el.classList.remove('is-hidden');
        el.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('loader-active');
    };

    window.hideLoader = function hideLoader(force = false) {
        const el = loader();
        if (!el) return;
        const wait = force ? 0 : Math.max(0, MIN_VISIBLE_MS - (Date.now() - loaderShownAt));
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            el.classList.add('is-hidden');
            el.setAttribute('aria-hidden', 'true');
            document.documentElement.classList.remove('loader-active');
            hideTimer = null;
        }, wait);
    };

    window.ASGamesLoader = {
        show: () => window.showLoader(),
        hide: (force = false) => window.hideLoader(force),
        isVisible: () => { const el = loader(); return !!el && !el.classList.contains('is-hidden'); }
    };

    function tryHideInitialLoader() {
        if (pageHasLoaded && initialRequestFinished) window.hideLoader();
    }
    window.addEventListener('load', () => { pageHasLoaded = true; tryHideInitialLoader(); }, { once: true });
    // Called by the API request's .always(). The function is public for alternate API clients too.
    window.ASGamesInitialRequestFinished = function () { initialRequestFinished = true; tryHideInitialLoader(); };
    // Safety net: even if another script errors or the API never completes, release the overlay.
    setTimeout(() => window.hideLoader(true), 9000);
})();

/* API contract: GET /api/getdata -> { status:true, data:{
   categories:[{id:15,category_name:'Activities & Games',image:'uploads/category/example.jpg'}]
} }. API categories populate both the activity cards and footer links.
   If the API is unavailable, built-in fallback content remains visible.
*/
const ASGAMES_DEFAULT_DATA = {
    phoneNumbers: [{ number: '98107 95386', tel: '+919810795386' }, { number: '99589 24192', tel: '+919958924192' }],
    whatsappNumber: '919810795386', email: 'info@asgames.in',
    address: { lines: ['D-1/36, Sharma Colony,', 'Budh Vihar Phase-2,', 'New Delhi – 110086'] },
    categories: [
        { category_name: 'Activities & Games', image: 'https://images.unsplash.com/photo-1564429238817-393bd4286b2d?auto=format&fit=crop&w=700&q=80' },
        { category_name: 'Arcade Games & Fun Rides', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=700&q=80' },
        { category_name: 'Kids Fun Activities', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=80' },
        { category_name: 'Events & Rentals', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=700&q=80' }
    ],
    popularActivities: [
        { title: 'Arcade Games', image: 'https://images.unsplash.com/photo-1564429238817-393bd4286b2d?auto=format&fit=crop&w=700&q=80', alt: 'Arcade gaming' },
        { title: 'Fun Activities', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=700&q=80', alt: 'Outdoor event games' },
        { title: 'Event Rentals', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=80', alt: 'Celebration event' },
        { title: 'Party Experiences', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=700&q=80', alt: 'Festival and celebration' }
    ]
};

function digitsOnly(value) { return String(value || '').replace(/\D/g, ''); }
function safeExternalImage(url) {
    try {
        return `${baseUrl}/${url}`;
    }
    catch (_) {
        return '';
    }
}
function categoryImageUrl(image, index) {
    const fallback = ASGAMES_DEFAULT_DATA.popularActivities[index % ASGAMES_DEFAULT_DATA.popularActivities.length].image;
    if (!image) return fallback;
    const externalImage = safeExternalImage(image);
    if (externalImage) return externalImage;
    return safeExternalImage(`${baseUrl}/${String(image).replace(/^\/+/, '')}`) || fallback;
}
function renderPopularActivities(items) {
    const grid = document.getElementById('popularActivitiesGrid'); if (!grid || !Array.isArray(items)) return;
    grid.replaceChildren();
    items.forEach((item, index) => {
        if (!item || !item.title) return;

        const col = document.createElement('div'); col.className = 'col-6 col-lg-3';
        const card = document.createElement('article'); card.className = 'activity-card reveal-item';
        const img = document.createElement('img');
        img.src =
            item.image ||
            ASGAMES_DEFAULT_DATA.popularActivities[index % 4].image;
        img.alt = item.alt || item.title; img.title = item.title; img.width = 700; img.height = 230; img.loading = 'lazy'; img.decoding = 'async'; installImageFallback(img);
        const heading = document.createElement('h3'); heading.textContent = item.title;
        card.append(img, heading); col.append(card); grid.append(col);
        if (window.ASGamesReveal) window.ASGamesReveal.observe(card); else card.classList.add('is-visible');
    });
}
function renderFooterActivities(categories) {
    const footerActivities = document.getElementById('activities-section');
    if (!footerActivities || !Array.isArray(categories) || !categories.length) return;
    footerActivities.replaceChildren();
    categories.slice(0, 4).forEach((category) => {
        const name = String(category?.category_name || category?.title || '').trim();
        const id = category?.id;
        if (!name) return;

        const base64encoded = btoa(String(id));
        const link = document.createElement('a');
        link.href = `${baseUrl}/products/${base64encoded}`;
        link.textContent = name;
        footerActivities.append(link);
    });
}
function renderCategories(categories) {
    if (!Array.isArray(categories) || !categories.length) return;
    const activityCards = categories.slice(0, 4).map((category, index) => {
        const title = String(category?.category_name || '').trim();
        return title ? {
            title,
            // image: categoryImageUrl(category.image, index),
            image: categoryImageUrl(category.image, index),
            alt: `${title} from AS Games`
        } : null;
    }).filter(Boolean);
    if (activityCards.length) renderPopularActivities(activityCards);
    renderFooterActivities(categories);
}
function renderContactData(data) {
    const phones = Array.isArray(data.phoneNumbers) ? data.phoneNumbers : ASGAMES_DEFAULT_DATA.phoneNumbers;
    const phoneBox = document.getElementById('contactPhones');
    if (phoneBox) { phoneBox.replaceChildren(); phones.forEach((phone, index) => { if (!phone) return; const label = phone.number || phone.label || phone.tel || ''; const tel = phone.tel || ('+' + digitsOnly(label)); if (index) phoneBox.append(document.createElement('br')); const a = document.createElement('a'); a.href = 'tel:' + digitsOnly(tel); a.textContent = label; phoneBox.append(a); }); }
    const email = String(data.email || ASGAMES_DEFAULT_DATA.email).trim();
    const emailBox = document.getElementById('contactEmail'); if (emailBox) { const a = document.createElement('a'); a.href = 'mailto:' + email; a.textContent = email; emailBox.replaceChildren(a); }
    document.querySelectorAll('[data-email-link]').forEach(a => a.href = 'mailto:' + email);
    document.querySelectorAll('[data-email-text]').forEach(el => el.textContent = email);
    const lines = Array.isArray(data.address?.lines) ? data.address.lines : (typeof data.address === 'string' ? data.address.split('\n') : ASGAMES_DEFAULT_DATA.address.lines);
    const addressBox = document.getElementById('contactAddress'); if (addressBox) { addressBox.replaceChildren(); lines.forEach((line, index) => { if (index) addressBox.append(document.createElement('br')); addressBox.append(document.createTextNode(String(line))); }); }
    const primary = phones.find(p => p && p.tel) || phones[0] || ASGAMES_DEFAULT_DATA.phoneNumbers[0];
    const primaryLabel = primary.number || primary.label || primary.tel;
    const primaryTel = '+' + digitsOnly(primary.tel || primary.number || primary.label);
    document.querySelectorAll('[data-primary-phone-link]').forEach(a => a.href = 'tel:' + primaryTel);
    document.querySelectorAll('[data-primary-phone-text]').forEach(el => el.textContent = primaryLabel);
    const wa = digitsOnly(data.whatsappNumber || ASGAMES_DEFAULT_DATA.whatsappNumber);
    document.querySelectorAll('[data-whatsapp-link]').forEach(a => a.href = 'https://wa.me/' + wa);
    const footerPhone = document.querySelector('.footer [data-primary-phone-link]');
    // Update the enquiry destination too, so WhatsApp submissions use the API-provided number.
    window.ASGamesWhatsAppNumber = wa || ASGAMES_DEFAULT_DATA.whatsappNumber;
}
function applyPageData(payload) {
    const data = payload && payload.data ? payload.data : payload;
    if (!data || typeof data !== 'object') return;
    renderContactData(data);
    if (Array.isArray(data.categories)) renderCategories(data.categories);
    if (Array.isArray(data.popularActivities)) renderPopularActivities(data.popularActivities);
}

// Image resilience: if a remote image fails, try a known event image once, then use an inline visual fallback.
function installImageFallback(img) {
    if (!img || img.dataset.fallbackInstalled) return;
    img.dataset.fallbackInstalled = '1';
    img.addEventListener('error', function () {
        if (!this.dataset.fallbackTried) {
            this.dataset.fallbackTried = '1';
            const fallback = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80';
            if (this.src !== fallback) { this.src = fallback; return; }
        }
        this.onerror = null;
        this.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#7961e9"/><stop offset="1" stop-color="#f04470"/></linearGradient></defs><rect width="800" height="520" fill="url(#g)"/><circle cx="400" cy="220" r="78" fill="#ffffff" fill-opacity=".2"/><path d="M360 220h80m-40-40v80" stroke="#fff" stroke-width="12" stroke-linecap="round"/><text x="400" y="360" fill="#fff" font-family="Arial,sans-serif" font-size="30" font-weight="700" text-anchor="middle">AS Games</text></svg>');
    });
}
document.querySelectorAll('img').forEach(installImageFallback);

$(function () {
    $('#year').text(new Date().getFullYear());
    const $sidebar = $('#mobileSidebar'), $backdrop = $('#mobileBackdrop');
    function openSidebar() { $sidebar.addClass('open').attr('aria-hidden', 'false'); $backdrop.addClass('show'); $('body').css('overflow', 'hidden'); }
    function closeSidebar() { $sidebar.removeClass('open').attr('aria-hidden', 'true'); $backdrop.removeClass('show'); $('body').css('overflow', ''); }
    $('#openSidebar').on('click', openSidebar); $('#closeSidebar,#mobileBackdrop').on('click', closeSidebar);
    $sidebar.find('a[href^="#"]').on('click', closeSidebar);
    $(document).on('keydown', function (e) { if (e.key === 'Escape') closeSidebar(); });

    // Smooth scrolling for every same-page link, with sticky-header offset.
    $(document).on('click', 'a[href^="#"]', function (e) {
        const targetId = this.getAttribute('href'); if (!targetId || targetId === '#') return;
        const target = document.querySelector(targetId); if (!target) return;
        e.preventDefault(); closeSidebar();
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
        const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;
        window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
        if (history.replaceState) history.replaceState(null, '', targetId);
    });
    $(window).on('scroll', function () { $('#toTop').prop('hidden', window.scrollY < 450); });
    $('#toTop').on('click', function () { window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });

    // Scroll reveal: observe elements already in the page and any cards rendered later by the API.
    const revealSelector = '.section-heading,.feature-card,.activity-card,.why-item,.contact-card,.contact-form,.intro .row > div,.contact-band .row > div,.hero-content,.intro-list li,.footer .col-lg-3';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let revealObserver = null;
    if ('IntersectionObserver' in window && !reduceMotion) {
        revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
        // Enable reveal styles only after observer is ready, avoiding permanently hidden content.
        document.body.classList.add('reveal-ready');
        window.ASGamesReveal = {
            observe(element) {
                if (!element) return;
                element.classList.add('reveal-item');
                if (revealObserver) revealObserver.observe(element);
                else element.classList.add('is-visible');
            },
            refresh() { document.querySelectorAll(revealSelector).forEach(element => this.observe(element)); }
        };
        document.querySelectorAll(revealSelector).forEach((element, index) => {
            element.classList.add('reveal-item');
            if (element.matches('.intro .row > div')) element.classList.add(index % 2 ? 'reveal-right' : 'reveal-left');
            revealObserver.observe(element);
        });
        // Make sure the hero content appears immediately, rather than waiting for a scroll event.
        document.querySelector('.hero-content')?.classList.add('is-visible');
    } else {
        window.ASGamesReveal = { observe(element) { if (element) element.classList.add('is-visible'); }, refresh() { } };
    }

    // API data is optional during static development. Defaults stay visible if it fails.
    renderContactData(ASGAMES_DEFAULT_DATA);
    renderCategories(ASGAMES_DEFAULT_DATA.categories);
    showLoader();
    $.ajax({ url: `${baseUrl}/api/getdata`, method: 'GET', dataType: 'json', timeout: 7000, cache: false })
        .done(function (response) { applyPageData(response); })
        .fail(function (xhr, status) { console.info('AS Games API unavailable; using default page data.', status); })
        .always(function () { window.ASGamesInitialRequestFinished(); });

    let enquiryStatusTimer;

    $('#enquiryForm').on('submit', function (e) {
        e.preventDefault();

        const form = this;
        if (!form.checkValidity()) { form.reportValidity(); return; }

        const $form = $(form);
        const $button = $('#enquirySubmit');
        const $status = $('#enquiryStatus');
        const formData = new FormData(form);
        function showStatus(type, message) {
            clearTimeout(enquiryStatusTimer);
            $status
                .removeClass('is-success is-error is-visible')
                .addClass(`is-${type}`)
                .text(message)
                .addClass('is-visible');
            enquiryStatusTimer = setTimeout(() => $status.removeClass('is-visible'), 3000);
        }
        const payload = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            city: formData.get('city'),
            event_type: formData.get('eventType'),
            message: formData.get('message')
        };

        $status.removeClass('is-success is-error is-visible').text('');
        $button.prop('disabled', true).html('Submitting... <i class="bi bi-arrow-repeat ms-1"></i>');

        $.ajax({
            // url: $form.data('endpoint'),
            url: `${baseUrl}/api/landing-enquiry`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            dataType: 'json',
            headers: { Accept: 'application/json' }
        }).done(function (response) {
            showStatus('success', response.message || 'Thank you! Your enquiry has been submitted.');
            form.reset();
        }).fail(function (xhr) {
            const errors = xhr.responseJSON?.errors;
            const message = errors
                ? Object.values(errors).flat().join(' ')
                : (xhr.responseJSON?.message || 'We could not submit your enquiry. Please try again.');
            showStatus('error', message);
        }).always(function () {
            $button.prop('disabled', false).html('Submit Enquiry <i class="bi bi-send ms-1"></i>');
        });
    });
});
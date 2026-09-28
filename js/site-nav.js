// Shared behavior for the four core pages: sticky nav shadow, mobile menu, fade-in.
(function () {
    var navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function () {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });

    var toggle = document.querySelector('.mobile-toggle');
    var menu = document.getElementById('nav-menu');
    function setOpen(open) {
        menu.classList.toggle('open', open);
        toggle.classList.toggle('active', open);
        toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('click', function () { setOpen(!menu.classList.contains('open')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('open')) { setOpen(false); toggle.focus(); }
    });

    // IntersectionObserver fade-in; landing.css already disables motion under prefers-reduced-motion.
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.fade-up').forEach(function (el) { el.classList.add('visible'); });
        return;
    }
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.fade-up').forEach(function (el) { io.observe(el); });
})();

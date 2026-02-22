/* Cookie Consent JavaScript */

document.addEventListener('DOMContentLoaded', function() {
    const consent = document.getElementById('cookie-consent');
    const customizePanel = document.getElementById('customize-panel');
    const footerLink = document.querySelector('.footer-link');

    // Check if user has already consented
    if (localStorage.getItem('cookieConsentGiven') === 'true') {
        consent.classList.add('show');
    } else {
        // Show the banner on first visit
        consent.classList.add('show');
    }

    function acceptAll() {
        localStorage.setItem('cookieConsentGiven', 'true');
        loadAnalytics();
        loadThirdParty();
        consent.classList.remove('show');
    }

    function rejectAll() {
        localStorage.setItem('cookieConsentGiven', 'true');
        consent.classList.remove('show');
    }

    function showCustomize() {
        customizePanel.style.display = 'block';
        consent.style.display = 'none';
    }

    function savePreferences() {
        const analytics = document.querySelector('input[name="analytics"]').checked;
        const thirdParty = document.querySelector('input[name="thirdParty"]').checked;
        
        localStorage.setItem('cookiePreferences', JSON.stringify({ analytics, thirdParty }));
        consent.classList.remove('show');
        
        if (analytics) loadAnalytics();
        if (thirdParty) loadThirdParty();
    }

    // Add click handler to footer link
    footerLink.addEventListener('click', showCustomize);
});

// Function placeholders
function loadAnalytics() {
    // Load analytics scripts here
}

function loadThirdParty() {
    // Load third-party scripts here
}
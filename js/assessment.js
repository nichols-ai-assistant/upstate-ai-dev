/* ==========================================
   AI Readiness Assessment
   Scoring, navigation, results, PDF, Sheets
   ========================================== */

(function () {
    'use strict';

    // ---- CONFIG ----
    // Replace this URL after deploying the Google Apps Script web app.
    // See APPS_SCRIPT_DEPLOYMENT.md for deployment instructions.
    // Example: 'https://script.google.com/macros/d/1MHJba5dUWLQhboUI8NYkEELA4VPHK2otxjKD_pDNdIOAUgbKuZv4mjrI/userweb?v=1'
    var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyUOSgJg3Q1bSFYY_mohK7_ENn2DtTBP9jLShoCEJCkK0OJy9O01LqiDRgKZfSbbKYY/exec';

    var TOTAL_STEPS = 7; // 6 question sections + 1 lead capture
    var TOTAL_QUESTIONS = 12;

    var DIMENSIONS = [
        { key: 'data', label: 'Data Maturity', questions: [1, 2], desc: 'How centralized, accessible, and reliable your business data is' },
        { key: 'process', label: 'Process Documentation', questions: [3, 4], desc: 'How well your workflows are captured and transferable' },
        { key: 'tech', label: 'Technology Infrastructure', questions: [5, 6], desc: 'Your cloud readiness, integrations, and automation maturity' },
        { key: 'leadership', label: 'Leadership & Strategy', questions: [7, 8], desc: 'Executive buy-in, budget allocation, and strategic clarity' },
        { key: 'workforce', label: 'Workforce Readiness', questions: [9, 10], desc: 'Your team\'s tech comfort and access to training' },
        { key: 'governance', label: 'Governance & Risk', questions: [11, 12], desc: 'Data privacy practices and AI risk awareness' }
    ];

    var TIERS = {
        explorer: {
            name: 'Explorer',
            min: 12, max: 24,
            icon: '\uD83E\uDDED', // compass
            cssClass: 'tier-explorer',
            service: 'AI Workshop',
            servicePrice: '$2,000',
            serviceSlug: 'index.html#services',
            serviceDesc: 'Cut through the hype. Understand what AI can actually do for your business. An interactive half-day session covering industry-specific use cases, a hands-on AI Opportunity Scorecard exercise, and strategic Q&A with your leadership team.',
            summary: 'You\'re at the starting line, and that\'s exactly where most businesses are right now. AI isn\'t your next move; your next move is building the foundation that makes AI possible. The good news? Every step you take here pays off whether or not you ever touch AI, because better data and documented processes make everything run smoother.',
            actions: [
                'Get your critical data out of spreadsheets and into a proper system',
                'Document your 5 most repetitive workflows',
                'Pick one person to own the "what can technology do for us?" question'
            ]
        },
        builder: {
            name: 'Builder',
            min: 25, max: 36,
            icon: '\uD83D\uDD27', // wrench
            cssClass: 'tier-builder',
            service: 'AI Audit',
            servicePrice: '$5,000',
            serviceSlug: 'index.html#services',
            serviceDesc: 'We look under the hood of your operations and hand you a prioritized roadmap with ROI estimates. A full operational analysis, data maturity evaluation, and a clear, jargon-free executive report with your highest-value AI opportunities ranked.',
            summary: 'You\'ve got pieces in place. Data exists, some processes are documented, and leadership is paying attention. The gap right now is between interest and action. This is the critical moment: the businesses that ones that move from "we should look into AI" to "here\'s our first project" in the next 12 months will create real separation from competitors.',
            actions: [
                'Run a data quality audit on one business area (customer records, production logs, or inventory)',
                'Identify your single highest-ROI AI use case: repetitive process + available data + measurable impact',
                'Start the budget conversation with leadership ($15K-$75K is a realistic range for an SMB pilot)'
            ]
        },
        accelerator: {
            name: 'Accelerator',
            min: 37, max: 48,
            icon: '\uD83D\uDE80', // rocket
            cssClass: 'tier-accelerator',
            service: 'AI Execution',
            servicePrice: '$10,000',
            serviceSlug: 'index.html#services',
            serviceDesc: 'We manage your AI build from spec to launch. Clear technical plan, honest vendor evaluation, project management through delivery. You get a project manager who actually understands the technology, so nothing gets lost in translation.',
            summary: 'Your organization is in strong shape. The data, processes, infrastructure, and leadership alignment are there. Now it\'s about execution: picking the right first project, managing change, and measuring results. You\'re ahead of most businesses in the region, and moving quickly here locks in that advantage.',
            actions: [
                'Pick your first AI project and define success criteria before you build anything',
                'Check what AI features already exist in your current software (ERP, CRM, industry tools) before buying something new',
                'Write a one-page AI governance policy: who approves use cases, who reviews AI outputs'
            ]
        },
        leader: {
            name: 'Leader',
            min: 49, max: 60,
            icon: '\u2B50', // star
            cssClass: 'tier-leader',
            service: 'AI Advisory',
            servicePrice: '$1,000/mo',
            serviceSlug: 'index.html#services',
            serviceDesc: 'Monthly strategic check-ins, on-call guidance for AI decisions, and quarterly reviews to identify your next opportunity. A dedicated AI advisor who knows your business, your stack, and your goals.',
            summary: 'You\'re in the top tier of SMB AI readiness nationally, not just regionally. You have the data infrastructure, documented processes, technology stack, leadership commitment, and governance awareness that most businesses are still working toward. Your play now is strategic: building an AI roadmap that turns this foundation into measurable competitive advantage.',
            actions: [
                'Build a 12-18 month AI roadmap mapping 3-5 initiatives to specific business outcomes',
                'Explore advanced use cases: predictive maintenance, supply chain optimization, dynamic pricing, automated QC',
                'If you have years of proprietary data (production quality, process measurements), explore fine-tuning AI models on it'
            ]
        }
    };

    // ---- DOM ----
    var btnNext = document.getElementById('btnNext');
    var validationMsg = document.getElementById('validationMsg');
    var assessmentApp = document.getElementById('assessmentApp');
    var resultsSection = document.getElementById('resultsSection');

    // ---- NAVIGATION ----
    btnNext.addEventListener('click', function () {
        // Validate all 12 questions are answered
        for (var i = 1; i <= TOTAL_QUESTIONS; i++) {
            if (!document.querySelector('input[name="q' + i + '"]:checked')) {
                validationMsg.style.display = 'block';
                validationMsg.querySelector('p').textContent = 'Please answer all 12 questions before submitting.';
                return;
            }
        }
        // Validate lead capture fields
        var name = document.getElementById('leadName').value.trim();
        var email = document.getElementById('leadEmail').value.trim();
        var company = document.getElementById('leadCompany').value.trim();
        var industry = document.getElementById('leadIndustry').value;
        var size = document.getElementById('leadSize').value;
        if (!name || !email || !company || !industry || !size) {
            validationMsg.style.display = 'block';
            validationMsg.querySelector('p').textContent = 'Please fill in all required fields.';
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            validationMsg.style.display = 'block';
            validationMsg.querySelector('p').textContent = 'Please enter a valid email address.';
            return;
        }
        validationMsg.style.display = 'none';
        submitAssessment();
    });

    // ---- SCORING ----
    function computeScores() {
        var answers = {};
        for (var i = 1; i <= TOTAL_QUESTIONS; i++) {
            var el = document.querySelector('input[name="q' + i + '"]:checked');
            answers[i] = el ? parseInt(el.value, 10) : 0;
        }

        var totalScore = 0;
        var dimensionScores = {};
        DIMENSIONS.forEach(function (dim) {
            var s = 0;
            dim.questions.forEach(function (q) { s += answers[q]; });
            dimensionScores[dim.key] = s;
            totalScore += s;
        });

        var tierKey = 'explorer';
        if (totalScore >= 49) tierKey = 'leader';
        else if (totalScore >= 37) tierKey = 'accelerator';
        else if (totalScore >= 25) tierKey = 'builder';

        // Strongest / weakest
        var strongest = DIMENSIONS[0];
        var weakest = DIMENSIONS[0];
        DIMENSIONS.forEach(function (dim) {
            if (dimensionScores[dim.key] > dimensionScores[strongest.key]) strongest = dim;
            if (dimensionScores[dim.key] < dimensionScores[weakest.key]) weakest = dim;
        });

        return {
            answers: answers,
            totalScore: totalScore,
            dimensionScores: dimensionScores,
            tierKey: tierKey,
            tier: TIERS[tierKey],
            strongest: strongest,
            weakest: weakest
        };
    }

    // ---- RESULTS DISPLAY ----
    function renderResults(scores) {
        var tier = scores.tier;

        // Score ring animation
        document.getElementById('scoreValue').textContent = scores.totalScore;
        var circumference = 2 * Math.PI * 54; // r=54
        var fraction = scores.totalScore / 60;
        setTimeout(function () {
            document.getElementById('scoreRingFill').style.strokeDashoffset = circumference * (1 - fraction);
        }, 100);

        // Tier badge
        var badge = document.getElementById('tierBadge');
        badge.className = 'tier-badge ' + tier.cssClass;
        document.getElementById('tierIcon').textContent = tier.icon;
        document.getElementById('tierName').textContent = tier.name;
        document.getElementById('tierSummary').textContent = tier.summary;

        // Dimensions
        var grid = document.getElementById('dimensionGrid');
        grid.innerHTML = '';
        DIMENSIONS.forEach(function (dim) {
            var s = scores.dimensionScores[dim.key];
            var pct = (s / 10) * 100;
            var row = document.createElement('div');
            row.className = 'dimension-row';
            row.innerHTML = '<span class="dimension-label">' + dim.label + '</span>' +
                '<div class="dimension-bar-track"><div class="dimension-bar-fill" style="width:0%"></div></div>' +
                '<span class="dimension-score">' + s + '/10</span>';
            grid.appendChild(row);
            // Animate
            setTimeout(function () {
                row.querySelector('.dimension-bar-fill').style.width = pct + '%';
            }, 200);
        });

        document.getElementById('dimensionInsight').innerHTML =
            '<strong>Your strongest dimension:</strong> ' + scores.strongest.label +
            '. <strong>Your biggest opportunity:</strong> ' + scores.weakest.label + '.';

        // Actions
        var actionList = document.getElementById('actionList');
        actionList.innerHTML = '';
        tier.actions.forEach(function (a) {
            var li = document.createElement('li');
            li.textContent = a;
            actionList.appendChild(li);
        });

        // Service CTA
        var cta = document.getElementById('serviceCta');
        cta.innerHTML =
            '<span class="service-rec-badge">Recommended for You</span>' +
            '<h3 class="service-rec-title">' + tier.service + '</h3>' +
            '<p class="service-rec-price">Starting at ' + tier.servicePrice + '</p>' +
            '<p class="service-rec-desc">' + tier.serviceDesc + '</p>' +
            '<a href="' + tier.serviceSlug + '" class="service-rec-link">Learn More About ' + tier.service + ' &rarr;</a>';

        // Show results
        assessmentApp.style.display = 'none';
        resultsSection.style.display = 'block';
        resultsSection.querySelector('.results-container').classList.add('visible');
        window.scrollTo({ top: resultsSection.offsetTop - 80, behavior: 'smooth' });
    }

    // ---- SUBMIT ----
    function submitAssessment() {
        var scores = computeScores();
        var lead = {
            name: document.getElementById('leadName').value.trim(),
            email: document.getElementById('leadEmail').value.trim(),
            company: document.getElementById('leadCompany').value.trim(),
            industry: document.getElementById('leadIndustry').value,
            companySize: document.getElementById('leadSize').value
        };

        // Build dimension scores object for submission
        var dimScores = {};
        DIMENSIONS.forEach(function (dim) {
            dimScores[dim.label] = scores.dimensionScores[dim.key];
        });

        var payload = {
            name: lead.name,
            email: lead.email,
            company: lead.company,
            industry: lead.industry,
            companySize: lead.companySize,
            totalScore: scores.totalScore,
            tier: scores.tier.name,
            recommendedService: scores.tier.service,
            servicePrice: scores.tier.servicePrice,
            strongest: scores.strongest.label,
            weakest: scores.weakest.label,
            dimensionScores: dimScores,
            answers: scores.answers,
            timestamp: new Date().toISOString()
        };

        // Render results immediately (don't block on network)
        renderResults(scores);

        // Wire up PDF button
        document.getElementById('btnDownloadPdf').addEventListener('click', function () {
            try {
                generatePdf(scores, lead);
            } catch (err) {
                console.error('PDF generation error:', err);
                alert('Failed to generate PDF: ' + err.message + '. Please try refreshing the page.');
            }
        });

        // Send to Google Sheets (fire and forget, but log errors)
        if (APPS_SCRIPT_URL && APPS_SCRIPT_URL.trim().length > 0) {
            fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(function (err) {
                console.warn('Sheets submission error:', err);
            });
        } else {
            console.info('Apps Script URL not configured. Assessment data (for manual entry):', payload);
        }
    }

    // ---- PDF GENERATION (4 pages exactly) ----
    function generatePdf(scores, lead) {
        // Check if jsPDF is loaded
        if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
            alert('PDF generation failed: jsPDF library not loaded. Please refresh the page and try again.');
            console.error('jsPDF library not found');
            return;
        }

        // jsPDF UMD exposes as window.jspdf.jsPDF or global jsPDF
        var jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        
        if (!jsPDF) {
            alert('PDF generation failed: jsPDF constructor not available. Please refresh the page and try again.');
            console.error('jsPDF constructor not found');
            return;
        }

        var doc = new jsPDF({ unit: 'mm', format: 'letter' });
        var tier = scores.tier;
        var pageW = doc.internal.pageSize.getWidth();
        var pageH = doc.internal.pageSize.getHeight();
        var margin = 20;
        var contentW = pageW - margin * 2;
        var y = 0;

        // Embedded logo (images/logo-white.png, resized to 400px wide)
        var logoDataUrl = 'data:image/png;base64,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nxbg+l1/frBp/99TAOyPPB9HAwI0esDkI8DYA/2JKhfyeh6HHekOt+wjz8oJsMXegb4QgaTv31sADgB6K/M8thrIgIb1AH0UGHtYRCYHlFOw10H7fCCp04/PlSG0+jkZ8hmzvmYJYjCzFbHo3m+mFotO0ti16a9YdLScW+y8rP8BMzPZunVrleJ646D07G62a1+we3jVVX7UNNtmUz/rFvA73KPv4AlftjdudIDANp4a7J2Np9vbs2fb740+tZ6SsKvW+cf5uRrpe65+/nEtp8QeyCL0SjYJsGnaya6Pz8TdXvZABvaC+h++eq5yiXp3M8rZpk2bsGnTJtvXJ0LrfFN2Hl6OJp6FzoAEiov3pBoyCHL8QC7BlQaIjPCd1qZKCmB2Ht4Gj3OQcBwEAcB2ANchYqNciu8sRn6tIc/W4/6MEQPIEzpgLXQAoYVLpmjn4ePYD7+BSWAJV2EBTQA78A25BD89SmVvgGBj9Yw/iL/FGM7AVG7j6tzDJoACjyDhlXIRvrwUSRoJXIVF9AT2KDqI6FWrlZaGIsFXvYbRXAUn66G2Ae/COM7ABHIAoUqHIjAYOohoYD8o/s7ehp/CZuwYtXdD5HgLiObkqyGfAFni14hHBxggWI9kZ2MMwDvRRaqu3/WNPAgEGXIUaOEwFDhDAMNG8JhYYgAhetJaByeAIcPT4bEaaSohJIbMsBgEpwIAbmHvgxhAiChheZX43GbNNWwQAMt5w4gBhOjJ7oSpgPFDRMRq3mNwECl7HwbgB9V7ubiGGECInqxkM5JthMOl+D6Am9CAwIZksK0HsICrAHAIi8BVWERYsCW0CYYIIC5h1arVMNToS7ZvgQiQTPFuKG5EQICimGo41sNay5BhJ66US7GtWsbLZeHEAEK0QJajjYCEsGTrkwyh2rOx38i9kC3QKiDcZBvwq8jwUbRwEFJfzmkAmMTfoYXftI1w2ATDZn7hxABChL2egi59DB3chLxP5Y+l2omuEAB3AwA2j9YVks1Itg5eLsG/2Fn4Opbj9VC8CMByCL4Lwz/JRbimXvorI34uEWGfSui4V7mwiGYtY+uG953MIMasFMQeyBOCAhbrk96GtIoduFN4cbPx7isLTm6ByZb5z1HUw1kAHG6BVau0HG6BiXDOg+iJ0ANZGYtuz0by2OnsgRAReyBUywX4KyCuSFEtYWYPxDlJzjUdkN3Vl2aPiIiIiAhM507Yk+EsP+L3ojw7gYiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIj2Nf8fRXiBRabhtyUAAAAASUVORK5CYII=';

        // Embedded QR code for https://up-state-ai.com
        var qrCodeDataUrl = 'data:image/png;base64,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';

        // Colors
        var forestDark = [26, 58, 46];
        var orange = [255, 105, 0];
        var cream = [247, 244, 234];
        var textMuted = [85, 107, 94];

        function addFooter(pageNum) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor.apply(doc, textMuted);
            doc.text('Upstate AI  |  ben@up-state-ai.com  |  (315) 313-5998  |  up-state-ai.com', margin, pageH - 10);
            doc.text('Page ' + pageNum + ' of 4', pageW - margin, pageH - 10, { align: 'right' });
            doc.setFont('helvetica', 'normal'); // Reset font style
        }

        function getLines(text, maxWidth, fontSize) {
            doc.setFontSize(fontSize || 10);
            return doc.splitTextToSize(text, maxWidth);
        }

        // ============ PAGE 1: COVER ============
        // Full dark header
        doc.setFillColor.apply(doc, forestDark);
        doc.rect(0, 0, pageW, 120, 'F');

        // Orange accent bar
        doc.setFillColor.apply(doc, orange);
        doc.rect(0, 120, pageW, 4, 'F');

        // Branding
        const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACNgAAAWUCAYAAAAZQSkYAAAACXBIWXMAACxLAAAsSwGlPZapAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAfvNJREFUeAHs2kFNA1EYRtH/vYGmrLAADpAAighO6ggsoAAksCChoZl5YIBv1YZ0co6Mm1sFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8x/afwQ5gAAABoElEQVRoQ+3bvz8uAQDAD7uK/N8l+f9hEAf22YAAAAAASUVORK5CYII=';

        doc.addImage(logoBase64, 'PNG', margin, 20, 60, 25, 'logo', 'NONE', 0);

        doc.setFontSize(30);
        doc.setFont('helvetica', 'bold');
        doc.text('AI Readiness Assessment', margin, 60);
        doc.setFontSize(24);
        doc.text('Results', margin, 72);

        // Company and date
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(lead.name, margin, 95);
        doc.text(lead.company, margin, 103);
        doc.setFontSize(11);
        doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin, 113);

        // Tagline below the bar
        y = 145;
        doc.setTextColor.apply(doc, forestDark);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Practical AI consulting for small and mid-sized businesses.', margin, y);
        doc.text('Led by a Syracuse University AI Professor.', margin, y + 7);

        // Contact info
        y = 220;
        doc.setFontSize(10);
        doc.setTextColor.apply(doc, textMuted);
        doc.text('up-state-ai.com', margin, y);
        doc.text('ben@up-state-ai.com', margin, y + 6);

        addFooter(1);

        // ============ PAGE 2: ASSESSMENT RESULTS ============
        doc.addPage();
        y = margin;

        doc.setFillColor.apply(doc, forestDark);
        doc.rect(0, 0, pageW, 18, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('YOUR ASSESSMENT RESULTS', margin, 12);
        y = 30;

        // Overall score
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor.apply(doc, forestDark);
        doc.text('Overall Score', margin, y);
        y += 10;

        doc.setFontSize(42);
        doc.setTextColor.apply(doc, orange);
        doc.text(scores.totalScore + '', margin, y + 2);
        var scoreW = doc.getTextWidth(scores.totalScore + '');
        doc.setFontSize(18);
        doc.setTextColor.apply(doc, textMuted);
        doc.text('/60', margin + scoreW + 2, y + 2);

        // Tier name next to score
        doc.setFontSize(20);
        doc.setTextColor.apply(doc, forestDark);
        doc.setFont('helvetica', 'bold');
        doc.text(tier.name + ' Tier', margin + scoreW + 30, y - 5, { charSpace: 0 });

        // Tier description (condensed)
        y += 14;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor.apply(doc, textMuted);
        var summaryLines = getLines(tier.summary, contentW, 9);
        // Cap at 4 lines for space
        if (summaryLines.length > 4) summaryLines = summaryLines.slice(0, 4);
        doc.text(summaryLines, margin, y);
        y += summaryLines.length * 4.2 + 10;

        // Divider
        doc.setDrawColor.apply(doc, orange);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageW - margin, y);
        y += 10;

        // Dimension breakdown header
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor.apply(doc, forestDark);
        doc.text('Score Breakdown by Dimension', margin, y);
        y += 10;

        // Dimension bars (compact)
        DIMENSIONS.forEach(function (dim) {
            var s = scores.dimensionScores[dim.key];
            var barMaxW = contentW - 70;
            var barW = (s / 10) * barMaxW;

            // Label
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor.apply(doc, forestDark);
            doc.text(dim.label, margin, y);
            y += 2;

            // Background bar
            doc.setFillColor.apply(doc, cream);
            doc.roundedRect(margin, y, barMaxW, 6, 2, 2, 'F');

            // Filled bar
            if (barW > 0) {
                doc.setFillColor.apply(doc, orange);
                doc.roundedRect(margin, y, barW, 6, 2, 2, 'F');
            }

            // Score
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor.apply(doc, orange);
            doc.text(s + '/10', margin + barMaxW + 5, y + 5);

            // Description
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor.apply(doc, textMuted);
            doc.text(dim.desc, margin, y + 12);

            y += 20;
        });

        // Insight box
        y += 2;
        doc.setFillColor.apply(doc, cream);
        doc.roundedRect(margin, y, contentW, 14, 3, 3, 'F');
        doc.setFillColor.apply(doc, orange);
        doc.rect(margin, y, 3, 14, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor.apply(doc, forestDark);
        doc.text('Strongest: ' + scores.strongest.label + '   |   Biggest opportunity: ' + scores.weakest.label, margin + 8, y + 9);

        addFooter(2);

        // ============ PAGE 3: RECOMMENDATIONS ============
        doc.addPage();
        y = margin;

        doc.setFillColor.apply(doc, forestDark);
        doc.rect(0, 0, pageW, 18, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('YOUR NEXT STEPS', margin, 12);
        y = 30;

        // Actions (use the tier actions from config, kept short)
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor.apply(doc, forestDark);
        doc.text('Recommended Actions', margin, y);
        y += 8;

        tier.actions.forEach(function (action, idx) {
            // Numbered action
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor.apply(doc, orange);
            doc.text((idx + 1) + '.', margin, y);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor.apply(doc, forestDark);
            var actionLines = getLines(action, contentW - 10, 10);
            doc.text(actionLines, margin + 8, y);
            y += actionLines.length * 5 + 6;
        });

        // Additional tier-specific tactical steps
        var extraActions = {
            explorer: [
                'Audit where your business data lives today (spreadsheets, paper, disconnected tools)',
                'Pick one department and move its core data into a proper system within 90 days'
            ],
            builder: [
                'Run a data quality check on your customer records or production logs',
                'Start the budget conversation with leadership ($15K-$75K is realistic for an SMB pilot)'
            ],
            accelerator: [
                'Check what AI features already exist in your current software before buying new tools',
                'Write a one-page AI governance policy: who approves use cases, who reviews outputs'
            ],
            leader: [
                'Assess whether your proprietary data could fuel fine-tuned models competitors can\'t replicate',
                'Sequence AI initiatives so early wins fund later, larger projects'
            ]
        };

        var extras = extraActions[scores.tierKey] || [];
        extras.forEach(function (action, idx) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor.apply(doc, orange);
            doc.text((tier.actions.length + idx + 1) + '.', margin, y);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor.apply(doc, forestDark);
            var actionLines = getLines(action, contentW - 10, 10);
            doc.text(actionLines, margin + 8, y);
            y += actionLines.length * 5 + 6;
        });

        // Recommended service box
        y += 8;
        doc.setFillColor.apply(doc, orange);
        doc.roundedRect(margin, y, contentW, 42, 3, 3, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Recommended for ' + lead.company + ':', margin + 8, y + 10);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(tier.service, margin + 8, y + 20);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Starting at ' + tier.servicePrice, margin + 8, y + 28);

        doc.setFontSize(9);
        var svcLines = getLines(tier.serviceDesc, contentW - 16, 9);
        if (svcLines.length > 2) svcLines = svcLines.slice(0, 2);
        doc.text(svcLines, margin + 8, y + 35);

        y += 52;

        // CTA
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor.apply(doc, forestDark);
        doc.text('Ready to get started? Email ben@up-state-ai.com or visit up-state-ai.com', margin, y);

        addFooter(3);

        // ============ PAGE 4: ABOUT UPSTATE AI ============
        doc.addPage();
        y = margin;

        doc.setFillColor.apply(doc, forestDark);
        doc.rect(0, 0, pageW, 18, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ABOUT UPSTATE AI', margin, 12);
        y = 30;

        // Company overview
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor.apply(doc, forestDark);
        var aboutLines = getLines(
            'Upstate AI is an AI consulting firm that helps businesses figure out where AI fits, and where it doesn\'t. We work with manufacturers, logistics companies, and professional services firms.',
            contentW, 10
        );
        doc.text(aboutLines, margin, y);
        y += aboutLines.length * 5 + 8;

        // Ben's credentials
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor.apply(doc, forestDark);
        doc.text('Our Lead', margin, y);
        y += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor.apply(doc, textMuted);
        var credLines = getLines(
            'Led by Ben, a Syracuse University AI Professor who bridges academic AI research with real-world business applications. Years of experience helping organizations cut through the hype and focus on what actually delivers results.',
            contentW, 10
        );
        doc.text(credLines, margin, y);
        y += credLines.length * 5 + 12;

        // Divider
        doc.setDrawColor.apply(doc, orange);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageW - margin, y);
        y += 10;

        // Service tiers overview
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor.apply(doc, forestDark);
        doc.text('Our Services', margin, y);
        y += 8;

        var services = [
            { name: 'AI Workshop', price: '$2,000', desc: 'Half-day session. Industry-specific use cases, AI Opportunity Scorecard, leadership Q&A.' },
            { name: 'AI Audit', price: '$5,000', desc: 'Full operational analysis. Prioritized AI roadmap with ROI estimates.' },
            { name: 'AI Execution', price: '$10,000', desc: 'End-to-end project management from spec to launch. Vendor evaluation included.' },
            { name: 'AI Advisory', price: '$1,000/mo', desc: 'Monthly strategic check-ins, on-call guidance, quarterly opportunity reviews.' }
        ];

        services.forEach(function (svc) {
            doc.setFillColor.apply(doc, cream);
            doc.roundedRect(margin, y, contentW, 18, 2, 2, 'F');

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor.apply(doc, forestDark);
            doc.text(svc.name, margin + 5, y + 7);

            doc.setTextColor.apply(doc, orange);
            doc.text(svc.price, margin + 75, y + 7);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor.apply(doc, textMuted);
            doc.text(svc.desc, margin + 5, y + 14);

            y += 22;
        });

        // CTA box
        y += 8;
        doc.setFillColor.apply(doc, forestDark);
        doc.roundedRect(margin, y, contentW, 30, 3, 3, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Book a Consultation', margin + 8, y + 12);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('ben@up-state-ai.com  |  up-state-ai.com', margin + 8, y + 22);

        const qrBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGMAAABjAQMAAAC19SzWAAAABlBMVEUAAAD///+l2Z/dAAAAAnRSTlP//8i138cAAAAJcEhZcwAACxIAAAsSAdLdfvwAAADtSURBVDiNzdSxrcMgEAbgsyhSsgASa9B5JVggFgs8r0THGpa8AHQUyH/OylP8Gr9zkUi5iq8A/QcnCH+LvliF6D4anWiQVNFDs3PmhaRkPJkpU7igO/WLCuj6itC9W4Yj2am4v5BNOLo9FVfhmzhu8FTFcZCVE2lJ22hrQv3N8p9q6nQDso2SNmeBZYCFpDL2AQppjZKQVEx2oyVIqlhCVmhGFPc3Z9Kws6RCXaf9NSZJXPy8HLxK4h1+XGNWURJv4hkMeE3WufZpJU+qXpB3dm7P1IKmpn6cCaJ4rvfjV0ja57oZcoiSPv/3vEMPrTO48Li5pwoAAAAASUVORK5CYII=';
        doc.addImage(qrBase64, 'PNG', pageW - margin - 30, y - 5, 30, 30, 'qr', 'NONE', 0);

        addFooter(4);

        // Save
        var filename = (lead.company || 'Company').replace(/[^a-zA-Z0-9]/g, '_') + '_AI_Readiness_Report.pdf';
        
        try {
            doc.save(filename);
        } catch (err) {
            console.error('PDF save error:', err);
            alert('PDF was generated but failed to download: ' + err.message);
            throw err; // Re-throw to be caught by outer try-catch
        }
    }

})();

    // ============================================
    // ACCORDION UI CONTROLLER
    // ============================================
    
    function initAccordion() {
        // Mark first section as active and expanded
        const firstPanel = document.querySelector('.accordion-panel[data-section="1"]');
        if (firstPanel) {
            firstPanel.classList.add('active');
            const content = firstPanel.querySelector('.accordion-content');
            if (content) content.classList.add('expanded');
        }
        
        // Add change listeners to all radio inputs
        document.querySelectorAll('input[type="radio"]').forEach(function(radio) {
            radio.addEventListener('change', function() {
                checkSectionCompletion(this);
            });
        });
    }
    
    function checkSectionCompletion(changedInput) {
        // Find which section this input belongs to
        const panel = changedInput.closest('.accordion-panel');
        if (!panel) return;
        
        const sectionNum = parseInt(panel.getAttribute('data-section'));
        
        // Check if all questions in this section are answered
        const allInputs = panel.querySelectorAll('input[type="radio"]');
        const questionNames = new Set();
        allInputs.forEach(function(input) {
            questionNames.add(input.name);
        });
        
        let allAnswered = true;
        questionNames.forEach(function(name) {
            const checked = panel.querySelector('input[name="' + name + '"]:checked');
            if (!checked) allAnswered = false;
        });
        
        if (allAnswered) {
            // Mark section as complete
            panel.classList.add('completed');
            panel.classList.remove('active');
            panel.setAttribute('data-complete', 'true');
            
            // Auto-expand next section
            const nextSection = sectionNum + 1;
            const nextPanel = document.querySelector('.accordion-panel[data-section="' + nextSection + '"]');
            if (nextPanel && !nextPanel.classList.contains('expanded')) {
                expandSection(nextSection);
                
                // Wait for accordion expand animation (400ms CSS transition) to finish,
                // then scroll to the correct position
                setTimeout(function() {
                    var headerOffset = 100;
                    var elementPosition = nextPanel.getBoundingClientRect().top + window.pageYOffset;
                    window.scrollTo({ top: elementPosition - headerOffset, behavior: 'smooth' });
                }, 450);
            }
            
            updateProgressBar();
        }
    }
    
    function expandSection(sectionNum) {
        const panel = document.querySelector('.accordion-panel[data-section="' + sectionNum + '"]');
        if (!panel) return;
        
        // Collapse all other sections
        document.querySelectorAll('.accordion-panel').forEach(function(p) {
            p.classList.remove('active');
            const content = p.querySelector('.accordion-content');
            if (content && p !== panel) {
                content.classList.remove('expanded');
            }
        });
        
        // Expand target section
        panel.classList.add('active');
        const content = panel.querySelector('.accordion-content');
        if (content) {
            content.classList.add('expanded');
        }
    }
    
    function toggleAccordion(sectionNum) {
        const panel = document.querySelector('.accordion-panel[data-section="' + sectionNum + '"]');
        if (!panel) return;
        
        // Don't allow opening locked sections
        if (panel.classList.contains('locked')) return;
        
        const content = panel.querySelector('.accordion-content');
        if (!content) return;
        
        const isExpanded = content.classList.contains('expanded');
        
        if (isExpanded) {
            // Collapse
            panel.classList.remove('active');
            content.classList.remove('expanded');
        } else {
            // Expand (and collapse others)
            expandSection(sectionNum);
        }
    }
    
    function updateProgressBar() {
        const totalSections = document.querySelectorAll('.accordion-panel').length;
        const completedSections = document.querySelectorAll('.accordion-panel[data-complete="true"]').length;
        const progress = (completedSections / totalSections) * 100;
        
        const progressFill = document.getElementById('progressFill');
        const progressLabel = document.getElementById('progressLabel');
        
        if (progressFill) {
            progressFill.style.width = progress + '%';
        }
        
        if (progressLabel) {
            if (completedSections === totalSections) {
                progressLabel.textContent = 'Complete! Review and submit.';
            } else {
                progressLabel.textContent = 'Section ' + (completedSections + 1) + ' of ' + totalSections;
            }
        }
    }
    
    // Initialize accordion on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccordion);
    } else {
        initAccordion();
    }


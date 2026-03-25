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
        var qrCodeDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASIAAAEiCAIAAADS3EjhAAAE90lEQVR4nO3dwW0jRxRFUcmYLBiEA3D8DsBBMI6e7awIwzXX9av7nL0EUeRFCdBD9fd1XV9A6Y/0uwMyg/+D0wxyMoOczCAnM8jJDHIyg5zMICczyMkMcjKDnMwgJzPIyQxyMoOczCAnM8jJDHI/Vr749defX/fy/vuf//x6u6+d+S6svN4TrbxHTjPIyQxyMoOczCAnM8jJDHIyg5zMICczmL0C6f5r3llZJ3SvqNuIzFxyvG/32fjMaQY5mUFOZpCTGeRkBjmZQU5mkJMZ5GQGJ69APnvawqC77WNlybFrffK0z4bTDHIyg5zMICczyMkMcjKDnMwgJzPIyQzuuwI50cynnHS3m8zciJzIaQY5mUFOZpCTGeRkBjmZQU5mkJMZ5GQGOSuQ32bmouLEu0Dux2kGOZlBTmaQkxnkZAY5mUFOZpCTGeRkBvddgTxtYbCyEXnacuV9u8+G0wxyMoOczCAnM8jJDHIyg5zMICczyMkMTl6BzHx+yi4ri4rua3d5jfypOk4zyMkMcjKDnMwgJzPIyQxyMoOczCAnM5i9ArnfnQ1PW0V0t334bPzKaQY5mUFOZpCTGeRkBjmZQU5mkJMZ5GQGs1cgu54YMvNujBPvt1h5j2a+3nf2ila+s9MMcjKDnMwgJzPIyQxyMoOczCAnM8jJDHLf13V97dD9x/3EbUpn11Zj177knT1bZ4XTDHIyg5zMICczyMkMcjKDnMwgJzPIyQyeugLZZeaGYObvatdv8pVtRDpOM8jJDHIyg5zMICczyMkMcjKDnMwgJzOY/USYp91CsWsjMvP+kpnv7+vjT+UuELgtfzRCTmaQkxnkZAY5mUFOZpCTGeRkBrPvAjlxQ/DZrp3HzPstZm5iXiPXJ585zSAnM8jJDHIyg5zMICczyMkMcjKDnMzg5BXIivs9E6Rz4mis++14hNQMByLFJ925eK8fegcAAAAEjElEQVSIiIiIEIP/g9MMcjKDnMwgJzPIyQxyMoOczCAnM8jJDJ66Atl15p2Fddi9oq6JWkz/s+DUdEdxHQP6GHrY/2BoI+e0OxoEr8p5TjaEVnlv+h5Bk3Oaw4+T71Nt7NnYO5dP1UR/Dh4REXnc97/h+U89buJSL+L5KMJD/TU1OD/8kC7MYe6n88hEBERQx50LpG8B1K/2NnI0ECBO0AW8R6ekLa69P9VPKk5jz2I5gCICAOfJcX2XR5+PVp4nYTc7kP7BIi4rUrquzEAAAAk+d5j53LNdJTUYjb+VuvaxbTjI+9YBDn1Wn/djaDLbexu55JzaEpAL4iIg8P+3w7D9XrNuZ+ztbri25OaYx9sT/dhJkdANVXJUmvBOTZlnS1D1lrV4M0Iqk+ZpC7RNxNzuFqIPyriEz2p7xYiLQZ5X/PX4Qkpy3N+lxkuey4bUr6y2FQZD6i2bvcxdJPRY2+6pC8Loy+zRrV6t/q1bNfIzqveVlq2dBVt+6Nax3MIWqoWNGe9VBfx2IFRCwocUv/e3PQwAAAAL9bLwW3Y/R1YqDgTAXeDNAAAAIE8rPe6xc7lmeppKMRt/q3XNYtrxkfcMIrz6rR/O5vBltvYXc+k5tCUAF8REYeH/b8dhuv1mnM/Z+t1xbcnNcc+2J/uwkyOgOqrkqVWgvNsyjpbhqy1q8EbEdSfc8hN4u52C1cD4V9FZPKfukMAgMvx+V89buJSL+L5KMJD/TU1OD/8kC7MYe6n88hEBERQx50LpG8B1K/2NnI0ECBO0AW+R9CkLa69P9VPKk5jz2I5gKICAOfJcX2XR5+PVp4nYbc70P7BIi4rUrquTEAAAAk+d5j53LNdJTUYjb+VuvaxbTjI+9YBDn1Wn/djaDLbexu55JzaEpAL4iIg8P+3w7D9XrNuZ+ztbrjm5OaY19sT/dhJkdANVXJUmvBOTZlnS1D1lrV4M0Iqk+ZpC7RNxNzuFqIPyriEz2p7xYiLQZ5X/PX4QkZyZLLxWRI8Vlg9+TchjkLge5CSb/DO8/KyKPDrqm+n7l+cRzsmxsVYw96xsSMQDOCS4Vl61OmtuAfSDmfBBLutOQzjFzO/veixA8YozF//zPHVtPOumkfJReR9XjgJ2L5yDg9wD8EhrwiFPbFRU2JAgIyl6jr5pxsRrgMvyRXIjP10Nbc/VG6vvS6XSObrVaJ/TdF1Q9kiSC9ziX/UzSPImIG/AZ5nxDUuy928TdWr9v1HI7fciyDvJm9tMpxV8DcJolPcGHZmtot1zzHkRuA+R65+zvRRo39vViOLTFALKkeZLaGrv3+NDab673xNhbl2Wtvx+lUu37/IM09u7z5YM2h2KNSGN6AKg/Z6UW3Xt91hr6oMWi+4OQtY4RETWzFarFOwQ4x/ls1a4LK6Cq/fMeznm/W4czpXiHM/sI/AMXixw6uTdBpH7v5OTDRzaby97vnH81qqZ30hxmNmhYTUTEO9+YKoZJix9B5HLX6V0sy5bda2aurzLyIqIx71zts9bpgy+kQEpprpY6xDUGd2Fit5jsFKtXrFjx4KwVZVWx26kIOBmbIXg3AjL0ABgiAFcFCBmhG1O30j0akGrA7+NIeJdcjIfmCiJmFkQkxtj9He+bfzJsI3rSuTfgO9+c5cHovkSy9tZh5WT38lyclpK924l7Aersq2WZTEOGMp33zkEau25K0htS0vdnWeuzC9XIIQ5h7Y0dAJZr7KYhy5fVh5YHUOzZaAYeAeIKjdGGVBzJh5abI5WGQeQRQA/SWEz/nORDyzmHR8sEeY+9HNALvc+OAxI0drT68f4dx7KrcowGxHo+QnxoHQPgA0hPPbMouheIyDV70trrS9j3886FjzsXDq7ucaqGIJzI8BxLGvNUJmMCfGgcBrj3pjbOjrHzPhG5rD+IVDd6AoCq9iLK8fL+4OBHuF6k2NWZqTyCAPKIDRj8Hxg8zsGhaOAKNPFidGCIUAg8Z57PlJQT72XbAgqDoI03oMCL7Fy8Vi7F120jgmyeMwVLrxzG68YBz7UbtAN9QABNAwJ9WW7N4vB7ujWISDR77BCk5geB8FrnAI1dAwqt/j6pej9u8PhjMqBbl0/vQ+sU58IpGvO/d73iHSPyozpYstoG94EsAV+/RGTGq+//lz3/fFmIzx/4ObveL3mM3beG0L4W8Mdp7ESNuYm4+mcHVhZSciISRMRr7CaN3QjnTwih+TnV3h/2tfZHugd18LCi+0rnss865w7W2I19v8eNkOjP1X+jxtw0dqNzONj71kdUex8SkVQFtrrL7IZ9j/OYLxhwb6fu8dzB42w8HQ3cgAwvRqdqcAj8gpRRgUMHEYJjkWGrnYeXymbEeqXWHKMJw8qfjHhf3HzLbVmpr41mnTVIra/BhddWZUurMheGlclZyqdo7KrGrjqf/VpqNb5WFJ2XlkHKuHKUAYT2YHLdVcNBJ3vf/L8pRWjsJBEXRq0gBlQWQWMnJe2pc433qOZX1K3FuYJIVakns+5xSdyVDiYacxWRsBd/o5TXFIty/iA9bV8ZarWN5eooOxeHo4nPw+ModBEBZAt+fYJQ9UbG4fEvtgE/K/Xk+r41RFwNn02+Bin7PJw7XGMnztXrnE+Q19iJzrlVzmXXxDj5agYRBhDai3U/zrlMY9csJRNxbu8Dk3Nm5jV2C+eyM1Ls/U3ZE9nm5woiImJapEucz5Zpijqs0rCSmlms/jPNMVQkALwBn94XAogBglsg9ga04PGPCDgcOeI8hqsMhlS9bMQg4qFQAG14/IOdi8OxpVoivO+cNRKL7sQveN+8MpkGjd0k4sIs77Hqux+5LIi4oLGXzNSJNK4siolXVUGEqefBORCa/4OL2Xoc1cM4NYHeN/Y868QygExjt/ChdYZWnTtE2u+rHlKdZd5jrQ+t06rhijD4elLyoekA56evwEopxXqeZLfrcc6nVKiP8lXUO7arIGKYmnROZpam96pGvIdpZowwwbD9Kuumeh9/jhaeiw4KCLI5Q0Z57zw8pJpUr3fFGAxaTba7WYNIREQLB0PxVwK81G4Z+vO2APfFBs2B9H3+VO+zXMTROzEld0VSNTMd2qCpPle99wGSyaDFD6oaq+E3GdzI0VSuBml80rrd54rIbdPnx4gBhPY8sCgA+JB5wEt/vaKxZ2aWRhiLDknz6ELzvUXR2Soi18+2+sVBzpoWrGZUHD60XdL8PkP6TzNsF8EKgRxlhuN9aIXy+roKlNdmZsn7ptPYuQPN9nf7Kq96hUC7XLXTbMxcCtob6V5VixkG0GUzlv/W8x4b8LPIcD46iHM+NwaFh0eGgAhAsR2GRyAwGFbC40A0EFAQU5Pvsw1ndRHRxmm2AWfJJfgruwpe1s8I7A0AzodWY09Wp1X3ZdDKMVfV4qF/F4uZNZP2Pul8GC8bEG5Y71N9aHjABY29rkjvO4D9ACaTJrZCIEeY4enldStikSfnZgYiEeeSRg1Ze7n6eLmZnbJlyxY80U+VZAChxztwWLmKqOXLlTS9HSLxTgCPmFlLxK32oXE44HzZ6tc0rKUoIgJLYmZw4i4xs2cCyPsf0uq/q5k1NfZOqVrubnDPo+2S5lucb5wrIg/tvl8gPxFa/KoCZ/nQPsJSgZRiAqRcvQX3lXqoovp91e/HrQAOS6kXLe0aCxdBZoYT5mxtiyBp91YzdGaswhLsWL58+e6r8E4oO304Dx+odo3s6k0MW5bbgkeO+1DgEzB8Bg634l7swP4wKJajhaPRw8sAvBEtHIte1V8Z/rkOBQyCTfYufArrMWnl4SZ9wVvuBvDN8tjaGXMEx4tzLQwZKTIzE+dEY+8uwB4SEfSNKpWrsJLuKP/n/3MiJ8WYT17gs/YzqkUTYXjwaPmkxX2G4s99aF4lIt8b8HPHQYtXK/D2kLUPrHq0MwKSc85r7EYfWj+jRfdN69ev/8iwXjKB+0AWeB/IbT60DivHaQduplIfWj7G3i9nWeuf57kP5Ckae3f4EFZoLGzIoT3VMt7iFJHGjUP2gazQ2Lvdh+ygcmXV7JPjKSULIQgkQ0rF9c7ZR4DGF0Xkvl2/98fjwCE/BcTXqaY3ed9oDntA+641+tAKqr13htD6M9u6NcjatbFv+CJ1Op2jGxluFeezpLrbtZY9jwyq+rD3E8eIHLCjTlExfbe92fb9VMfPF5Hfcy6MadHJfdZuQPMzJTQ/PurSTTNbpbH7Pe99S6ddz7TrkjzvPrPZXPZfc35m3ft4C06FxzbkSHMMOSkyeER8DIL/LR/GfbN+/rswjhy/C8F7qxmS4UHEENFGQBfnyMW4bMSlvQCAWHRu9qF14ixlv/y+8+4bQ7N9+WwLJ8pVcROrk4ZbITJuSYcdUlUGj1Rc3e0W54yPj98zKF1Pf1noWOdpDXUfd77x4mFl1MySuExg+mPnG08H8Nhi53gjTqI/EYJjCqEhyWRCNX+T942fE2leVQcPM3NlYFo1ISI3iWTnq+L5SePXfWj5eshraLlIajBcYPfdtwxr1uj0CfVWy+/vfDYjeOwacvIC0539wUNEtOpNSHV9QWT/R0Jo/EGMvRemFP/bZ+1G0rwL3/jKtDH4qaA97VVP9mfzWOGT9b+3/4Xd5z7qfXhnwc2Z00sR4NHDb8uFeJN8GPfZRgRbB28GMfS9NsLZRgT5ICbkQrwPBdbDI1a/Y/jO9XJf+xsBAJsGzk3JoNc8Gor1/ciG3BcHACm6Dc43llvSNGvw0HyL941XjY+P3/ONb3wjq5dj1+WgrwHlzCxrS/tO5+95edJ8Wxl8Zo67iYizlCfnG6s17766ChycUOcQFo0qpWTOBUlmO1SL0xuNsS9PT0g4bU9HnVfov8xsTdL8Mz60XjKslSciTlOhPrRW64H7/UIQuaIKAlMt3qIoJMuaQ5cIa+wm75tPi7FzpohcPiBpYj3hKwBCeW3bT01p2RfM7BAAd1Q9szQg59Puwy9l720+LdCp9wzdbQ6IrIfaO9BGDz+HCBna4DIoWvDo4g/lEvypnY0Mq6BTPYTpVWyVqdcAwdkIcim22Lloo4mPo6gm3gcPYwkEz7a342gRfK8/ncpsrfBYdOazfHbgfam+JzWzlsbu68rLHzR0acmHhlPNv3PPPfe9oU6oWJUdKfOlDe4omVkmIl0ze3VKxX8H3zhI06AefbWewuENAP5yrmSdxB4I7TYW7JPzzlyKr2k0xr488803N/paddOzy5qIpHr9vIhM7nh04leSFnd4l7kBK5J2r2iBMwb1BDJ1jyQtonNOhlTeoimawH3UrPhDMzus/xrNLFRDIiYixdatW4PI/o/0esUvQ/DBKnAs3RDrxup35zgeHodWe8QHZjBAAx49fE0uwXttIwIuQ+yv2GcZPza5DIWdjUwuxSeQ4wo0MWxMXwAommigwPOW4Pl1ImIoOs/zoXlk0sKGzzc58WYXHHHEEZ2qDMZd5XDzgJfUjZ6iKhP3mxZ/AOcdMLB8OkuFQOSnJycnj5y+2ZTYA6HhvQ8NWdun2PsLn7WvrVpt+YityzqI7CiKzgZx/l8xfOzYASpm9kJ75JH9RWR71Qo1APjhAw/cvXrVwfc6nx2G1JuRvqVsNSYAEoDwnqTFearF55zDlUC4rs7A25d1NVY9jrsAfGiOzLuL1bhKMByPACCv8lUNSD5T/fT7AAAn7sEBUaugZhC8Be9Fjl+FoDE1rT59aXD5DZyEJZovVbg1HoJ6Vd/goavuDT5rf66uY8weWQasbGJy0k0O+OCxsXJhN5AKAB0AE6ExfpHG3gU+NI/UuHsSSBGRlFR9aDUbjc7zAfygPwEkMYDQkNUyzgeXNJ90Rfqjelhhnjt865VNn9fYvd775sChLBGRpDH50DigGEsnAbihTq9dvb+jRefLgKyv814NqnPMzDR2kg/ZSiCcAeCMpMUdqsU/qdpVIvL1vr/B1b2ZfWZ9v+CwKi+kQQasuMrg0MPtOBjX18Ne8/4Vm5EMcHIRvm8bsA1NvBz5kKGsMjQdtjT7KQE4e9YsC3CknFqTqEX3MoicqNpbJWitMOu20XCuVfY+ZbfNqLHeg+Nzkfwxjd3tMHwHMK2Lw7Dr8eJPBnAVawcOYdEIHRDnMjGkL8rY2A/7U2fPt84yMzGkT0zfJDZzw53AOfnJQZWGC/6iufapVSmOvMZoVX6j5Hx2jHPhgizI1zQWX4qx93qz25pzHYa1RFbM9n3AA3D4d9mMiHV79Tw5K6fKvzgVsAZNpFvfNd2yePdqarWU4ahhAaSc4C7gfHOtC803O994offNo5wPB/oQxrz3Ledc23vfql9T/zuEMR+y/ZzPDnO++VMuNNc7nx1tqZh142yCHTVbGSYGEJreCoTcOOQEOsznVETv3U1Jc3XOhTnSSRw+vTIpx6obN6bY/bDzjWBmxQh5rnw9wa6xG5NGOB9O8b7xiZSO+ma03pn1WPk+k6rC5piHKdvOdwIATti7ORspw8adGD77Y0sxK1T3GOz7328Bsv9cf0X9/dYNBo2FaYymqsNfMVr5c3nS2E1Je1FjbrNMg5XXpOkgBhAGEJrXvp10516ue6/e27zPzLbPkr6onnjZb9hGcxda70ia/4MPrazKbaSjJnKECKayrrpwvEfjr1Xj9Wadoeqhsn3gnj86wlPUW8BvOB86RDSVnAY7FyJgzdvy5Q3A2tVUg8z1/fZnhx7dVGqb0ZKEOtditcAAQvNrEXYBYNu2bXv7UYWI9ACZYyOWZEOOUE0AzPnG+pTyD/vQ8vUekzRK7ozdsq6WrVbn/NqUwo3We+wZdU9niW/33bA51oMZnmILt2LswGqi3IY2IQw/XJI7ceDoc3UjJMwkBhBaiiGsIGElAKxZs2avPmznzp1jZmkZkOY4A6QMWEOCSJkKxDffFmPv9JT06z60fMjarqpD4igVSV96+ehcWJ1C47NmE4fWawcW/U7X8wuGW6sTP/zAOYkyTJ4smHOj4aieOWv/pFyu8O2lKX4H5uXqOTfrkJEPmfjQcj4E6cvEXGfgXZAXMHVwMNOYgKuwaB6Spafv3SdscWaWimLySOfDymHpV/p23T0w28azvgy9nzPbeC30PesS3Pk+tH+2LGMJGnMd5XS8Mn13t/ChdaiqXhaCnD7qAVcLaksVDMZwCzr4MTxWQWekMnEoADg8387BodiEewy7b+4bOV08kOxsZDC8vNp+6Gbm8odHjhyGmwbtzcHjN4Fer4zrauw+AuCI4Tm1vKjGh4DiYUAO9aExNj0T8wLXXStZIzCA7POte1kxjzxh5YDC5GQLDdeApUWZAzHgJXtXgawTEbEYuz9X5sGLOqgsWN+cyxwHS1nf8l4FNn8KwKfM8hcD8rqk9os+tA4uV/v3kJINTd1dVVRZ0p5633xFnk++UES+sthnYgtgtg5ePogJOw9fQIbXQWcsVxYkRLQwDsVbRPC7djbCvL+XjfCyGdE24NfRxNHIB2boTQhwKPBluQQ/mL4LfZHO/1BAfgjg5CE9EHMuk6TdHznfeh6Ag4picnWWNQ5WTcs94HSB8o4oYN43xMwe4CQ6A8jj3mivsrzOKVo6ab7LYYFitTffUp07AeLentKWtJfEhefk+cTzReSr861Y682AZpZp7P5mVde5IVuPXUqFeU23DAtY/SlTyiACAcrTCkXkSwC+ZGbvUc1fJYJfN5M1PjRDdQZEGrYGuBz2EvNefgXAV5Z0V7rgMiheNzDRocCjh4QMb7MN+Du5BN+ys5HJZShG+j7WVcHjbDwFHn+MiFRl/J3ZvHEQAJftttFxsRdwWPo2gFcMqrDLFXY9E+dPRp6fIM3mtwDcvZi9JALnQB6HQpWL2OTc98IgsP9VVbJpxFNYTYt4Ksp6UBdlM6EL4n34492D2OiNBhFR1d5bfGgdVx1DOzCnkfMNsZTuQmP81kGHCgFAUXReamU6CSuD2VTSRKuSFXoReTCE5l973zzNezwzpfihlDDhQ8vNMj8i5d8mz1rM4ZrdLmAL1DbCyUW4AQU+jwZ8dRDUtN2SAAQteGyxt+CwOj3JbKcHmkHsbGSypcq31cQWBBwKBQakTNFqw+J34PBPZhBsXvSxf6vOgLmxOoNsSJkzdS6T6NK7q3LSrMpBmP9ra6gSO/r6CN0BLyZSZA/kca1wnYikWHQeAPD0YV3dqvWUfGifFOPkK7Ns/DNVmpBitqGbsiXfO7tKKeUWISh6jV31obXWYnejiGyuHqQ026bCvqSFhdnEc5P6P0ip0FmuOVVnFV4nIr2ZPZ5tDkBy4t6amu4ws7tfJCKT/enX+9PVV7/HRORmAO8y6340pfhJcdmzLBWDeiJVi9cOGZRUcdGPtA14FxT/CQ+HNG1dlsAhR0ITxyJim/0WXid/Uc5TVEHETZ+gF4ECKGwDjkXE5Qh4EXpDD5cyOAgM75QL0bN74WXxJ48TAOwI3a8si/aw99kBqjPnzkQkqPZSCI3XFMXOy0Xk326++ebGSSedlO/hmeuF2VVetff7wIMfEDloJw+RYgBZ9JxGBvsugFPmHCtNak6yPzd7+EsissPMsqpnYX0Vm6srSdPeh3xoHjvXGRsLzGvsqQ/NTRbzroi8v37gBpwQKFVPKQIo8nzieUkbn3FO2qoxzTLk5gATF9zfDDkHJZaHSnWO975xTNKDrzWbeI2I3FNdx1RAqx527Qu8mYjcWhSd3wmh9W+ailk2MUqrGjaPS1FxyObyHHLZjJvtXLwVbVyK3oA0Iw6uGso6Bhm+ZOfjYiRcLJtx+6Dek23AIXA4E4Lfgcd+swQPRRsBE/gzuRTXlicaL/7Ko109TNleFJ2rIf43gGLg3BnMkFIS51p/2+0+emqrteLW+jmaqyHQv0FWROKOHTsOTNr6hPONVwDL/wbAzqm5R2IAWbQ/VOSrAM6aaymppjz50D466fJPm9lrROTHg86eNrMxpPh+uHC+am8xgweqE+O8xm7yofUnWuTPcEHfIyJ3Dn8wb2uqHvFbAvdHzrux6QnqBiTFcxq7X/ehdUN9BvbUD2zZ4sqAkJ/oXHZMit3oQuuUlHCTWXGuiHy2L1jUY/U27f5lQP7gXJvSzKxXB58la3X+GN7OwjjW4qPYhhOQ4S0oBhwu5eAQkSDI0MTb0cM5dh6+DMN/QPBDAArDKjg8E4ZT0MD+KKpEjTIw71VCBo9JXI2deJ9twDK8FQWwgBsX9+RZCv6ilOLrMaT8lClNYvKheXCWta8vis5viMh1fQHC7z4kuk2ANXWafd3V2ChelRI+5Fw4FkBStRcCuI2JExlAFr3rDY/rk+aFOBcsmQ0bwxVxLhadFLL2i1Mq/iPG/BLvcQ0m8rsxnhRoPlVV1qrm53nf+MmkPZUlONCm6ji4ajjrDFV7pWq+JaV0TUrFd1T9o22RDC1/uGo6NSX/au/DCbACswWPvopaDLJxYFqRdevKzKxqp3ofkFJEeR3NwwG5WjW/wkX7gIj815AHvQAALTqvd8HV35EfuO9a5N6q9esWexhr6tS/DJuwDG/ANhQQRMShqd3r+QtDFwkObWQ4DQ6n7dZ/TdUOhi4UAjfrZ5Vh+2SswLeRoYECNwA4Y7FXYU2lsLnqKi/S+LrGzqe9b/3isCNtdw0JN1YB4fOq+Uedyy4Wkf/uP1dmQIOhiRhPTZLeBoRXOAdo7PZ8aDXF5BQAlwPbWHMzgCxaoU9V5XN7zCdv9Fl7jaZuAob3GJxzrswg21wFuN8H4u9r0z+K6JOI7ed9oxxbWNxhqznmRMJyIJzlHM5KCnhnHQWCR5b56go1drUafnNzHmdbdD6TNcauGbLKq+o2yJq+xQReYy/BTHzWfq263qs19q414F+8b3x1586d90xMTHQOOeSQDHl+aAp4oxP/To09G3IPrZpj+tYSrTrqdxACDp2azdARViwJPAyGHGnGrnKpDqeSERoeBiDgCFh15mKBQ5f0gVq3zsxMer3eb2dSvEycb1gafISwiLhY9Mw5J843z1bN36Sx9zUIbjJNt3qRByIQRWQMsEPF8Ayk4mcQsmNdWV7r7zurstm/oOzVlqdach6EAWRRbNtWTviauD8DsHaUgifiXJnMDSoiwYdsRTlFEqGxG6uK2O8jQdJrjFbt5xAR8T74NmzqIUyjXK+ZJe+CT1o85DPb0H/+x7T5j2Rmy1R7z+9fBiwirs5v5Zzz4hqnAzjdrMBYO9s+1t5vUmM3E4eDnGtJ0h6Gr+Yp52AAfHofWOdfICIhISIhg4y8pLgcrpG93vRgACIiPAz5PtAg861W67aYT1zgs7GLNaVi2JHCzjmpGy/OiRfXfAGAF9R9rkEVUFVmpxoWZWKUAiLuOKB7lAjuMKt6esQA8nhbu3ZtrHohn4lx8lrv2z8/rOs981Ck8h5p3DXRO+h9gw7YWeQHW/q+T9OoU63AUVaHlcfkejMR51J8ncj4j4b0PhwALYrOs7Ks9dSqByEz9qukZEjdehLd+5DtD7j9AYNVQ17DAlp9MJHG7n+E0PrSjDmYpdgJIlX/Q5ZkP0rdY1mq3z9zKMu2BpHxS4pi8pkhtN+ssVuISDbrHqZkdZmwAZt1rS9TgZtxNk2K6kM7U82fB+AOzoOA+0CwBGmp8xznpFQ85HwWRskcOy0duQzqqpul5EPLOecW9XCpUS4Xo51ymMQ5ON/wqei+WcqTDsOQSluqluWaanOmzpG+3dcBWGMvacwtpWSzBA8rT0k0+IALlvxoWxpijZqZD6F9TkrFJ6tszHH2YwGmykToy9brp/2bG7ZnF4CJ2Yt47xlAlqTrDWxxY2Njd6Wk68Us9z54s6R7WZFHH9pOY/fbqrpTnMdiZCH13kuVoM727vpTDFnbeR9U8+4bQ3PZX/bv5Ri2oaxaNuMA6IjJEqU/tffQXEoi0ftmiLG3WaS9bbFTmNC8NukmAOJ94/Up9i72oRWqBIrx8WgyARATvKJa1MEywQCy2IV+vZqZz7L29TH1fikZHvOh7c1SNJtfIquUUqqGWkLS/FofZD0AL2VlatMN2J+xV70PVZ30oeWdczJqxttp6bZjmTm1HVLS78fYeVloti+fI3hM1fOa9D1I8Ts+tJpVMJv3PZx+Pc55cb6Zpdj9YJa1N+1B8DAMuf+7voM9CrgGQ6rOSF+a167fbXu4i3yO+zL/z62CiJmZ+Kx1PjQ/K6lt96EV6sbV3jRw+jL5Jh/aWUpqXuQK9kjBOZClH79ddk2v99gpweNjPrSfDRg09nQq69DUtALEDFY9X3Wry4WsXa4/jb2PutA8F+isds6PwQV4JzKjjFvy80jSOGvs8i4TtfyslLrPB8LbfWgEIEJjrK9fBvyeupIQH4IHQkgpxpTixyYmOu9dsWLFgyMEj3oSVRqN8a+aPfgCYOV7k8k5PrRWVBOg9aZB6b+O+mZOu5cGwJxzQVwjpBR3ihbv9ln7I3sQPARABpeJdypDjtGWssjnMs/qt4EMDgUaS9bkMrhqFVZzD96dlT0F7zFghChpzPa0QVktsa6TLf51p7N9W0uWbQTc633IApAQi17qG4qcpUxIHeCrcpp5oFxDmFLxBdX4f3xj7CtcgcUAssRBZG2sCvy3brvtthced/TTzk/izvOhddSun4pIWk9EQ5wPAMLULtmU4jdc0s0+a11dPgSdLKV0v0eRabJBRxAlH+DqPRB70SoDvBeP7H6R7J1m+ZUpFRsc5FU+tA6cGTNkQO8pPgTET8fYu7DZXPbNvmyrcR6VhhORRwH8tnU6l6Dlzkyqv+ZDdiLgw25LiJKibohOu5fVBcUJIH3KFfp+abVu28NhKwXwIFLRHHL/y3NLAkYfYjmx3ouCu1HgdiQU0CV6ZgSKAh6G7+3Bux8GsF01JSC5AZ8dAQR419mL4aw6G/P3AZxpvd6H4eObU7JfDFl71e7BKcJS2r1MOA9I2C3wp1Q85GD/Boe/9L7xhd2zAtM+dEQqnqwn+7m+bLLLAD0dKb0ymT0XsMMhMu6cg6qaQB6FuDuR0r+74P4RyK4rN4Sbr8eCsWPHSqxcCWDHkN+4EgB2Tq+o6xaVma3Q2Lvdh+wgjYMz+5bd+ZYDuj8PtK6byje1c+dTtd1+iYieCuB4S2kVIO3y70sTEHcPEm5xwd/w2GOdLy1fvvy++oFEdUb6Hp6V7fpyXnmgeA6AFyPhBWp2PMxWA1juvfMQqYPyhEHuE5GbnXPXAcVnRdrf25sKotr1vqIs0ztm+cmVAPDovDIYb4TDNjgcvMTLRu+HYA3SvM8bMVtRbtTcgR07HpWV8liVZ2yZYeUKm7ov3/3upPzET/T29pmqOhd1mdgvxt4pwfk1avpcAZ5mZk8B0PahbEQkVZihIyIPOXF3JqRvOue+CIQbROT+vrK2pDnRiAFkzkqwr1J9KpAfkOdFo9EY7wJ4sC7MM89I2Ptr2IMA8nKR9uerHENp+nWYmbvnnntaq1evTiLSHfA5vlprnxbg+l1/frBp/99TAOyPPB9HAwI0esDkI8DYA/2JKhfyeh6HHekOt+wjz8oJsMXegb4QgaTv31sADgB6K/M8thrIgIb1AH0UGHtYRCYHlFOw10H7fCCp04/PlSG0+jkZ8hmzvmYJYjCzFbHo3m+mFotO0ti16a9YdLScW+y8rP8BMzPZunVrleJ646D07G62a1+we3jVVX7UNNtmUz/rFvA73KPv4AlftjdudIDANp4a7J2Np9vbs2fb740+tZ6SsKvW+cf5uRrpe65+/nEtp8QeyCL0SjYJsGnaya6Pz8TdXvZABvaC+h++eq5yiXp3M8rZpk2bsGnTJtvXJ0LrfFN2Hl6OJp6FzoAEiov3pBoyCHL8QC7BlQaIjPCd1qZKCmB2Ht4Gj3OQcBwEAcB2ANchYqNciu8sRn6tIc/W4/6MEQPIEzpgLXQAoYVLpmjn4ePYD7+BSWAJV2EBTQA78A25BD89SmVvgGBj9Yw/iL/FGM7AVG7j6tzDJoACjyDhlXIRvrwUSRoJXIVF9AT2KDqI6FWrlZaGIsFXvYbRXAUn66G2Ae/COM7ABHIAoUqHIjAYOohoYD8o/s7ehp/CZuwYtXdD5HgLiObkqyGfAFni14hHBxggWI9kZ2MMwDvRRaqu3/WNPAgEGXIUaOEwFDhDAMNG8JhYYgAhetJaByeAIcPT4bEaaSohJIbMsBgEpwIAbmHvgxhAiChheZX43GbNNWwQAMt5w4gBhOjJ7oSpgPFDRMRq3mNwECl7HwbgB9V7ubiGGECInqxkM5JthMOl+D6Am9CAwIZksK0HsICrAHAIi8BVWERYsCW0CYYIIC5h1arVMNToS7ZvgQiQTPFuKG5EQICimGo41sNay5BhJ66US7GtWsbLZeHEAEK0QJajjYCEsGTrkwyh2rOx38i9kC3QKiDcZBvwq8jwUbRwEFJfzmkAmMTfoYXftI1w2ATDZn7hxABChL2egi59DB3chLxP5Y+l2omuEAB3AwA2j9YVks1Itg5eLsG/2Fn4Opbj9VC8CMByCL4Lwz/JRbimXvorI34uEWGfSui4V7mwiGYtY+uG953MIMasFMQeyBOCAhbrk96GtIoduFN4cbPx7isLTm6ByZb5z1HUw1kAHG6BVau0HG6BiXDOg+iJ0ANZGYtuz0by2OnsgRAReyBUywX4KyCuSFEtYWYPxDlJzjUdkN3Vl2aPiIiIiAhM507Yk+EsP+L3ojw7gYiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIj2Nf8fRXiBRabhtyUAAAAASUVORK5CYII=';

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
        const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAD8CAYAAABZ/vJZAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAeGVYSWZNTQAqAAAACAAEARoABQAAAAEAAAA+ARsABQAAAAEAAABGASgAAwAAAAEAAgAAh2kABAAAAAEAAABOAAAAAAAAASAAAAABAAABIAAAAAEAA6ABAAMAAAABAAEAAKACAAQAAAABAAABkKADAAQAAAABAAAA/AAAAAAZHkzHAAAACXBIWXMAACxLAAAsSwGlPZapAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNi4wLjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPkZpZ21hPC94bXA6Q3JlYXRvclRvb2w+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgoE/1zIAAAxL0lEQVR4Ae2dCbwkVX3vz6mq7rvMnTsMwwDDDMgAwrCJKIugAooaMRGzqElMXozP93yJW3yfjy/mEzWZJGb76Mdd3PKUl5eXxLig2cAFBDQZjSDLgCL7AIFhGWeY5S7dXXXe9199e6bvvV3dfde+M/d3Zvp2dZ1T55z61qn//6z/45ycCIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIjAwUrAH6wZV75FYCqBEEaOdW6gz7nxqV5Nv/tSfjzkvbfvZeFGRkY2DAwM9LfjMj7uwh133PHQOeecU10WUHST80JACmReMCqSXhMIIURZbfSDUdJ/bAhpaJUf77zPsnQkistvR4HsbBXmUDyXpqN/HkV9JxdxcXDxIa3uG62+Y2hoaPuhyED3JAIiIAKFBFAgMYLyx3zjssJPrTq2L4R9xxRGdAh61Gqj/5Fj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gAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAjMiMD/BzKeEwIkVYn1AAAAAElFTkSuQmCC';

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


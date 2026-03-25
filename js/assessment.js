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
        // Build HTML template with all 4 pages
        var pdfContainer = buildPDFHTML(scores, lead);
        var companyName = (lead.company || lead.name || 'Assessment').replace(/[^a-zA-Z0-9]+/g, '_');

        // Create processing overlay
        var overlay = document.createElement('div');
        overlay.id = 'pdf-overlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(10, 0, 24, 0.85); z-index: 10000; display: flex; align-items: center; justify-content: center; flex-direction: column;';
        overlay.innerHTML = '<div style="text-align: center; color: white; font-family: -apple-system, sans-serif;">' +
            '<div style="width: 48px; height: 48px; border: 3px solid rgba(255,105,0,0.3); border-top-color: #ff6900; border-radius: 50%; animation: pdfspin 0.8s linear infinite; margin: 0 auto 24px;"></div>' +
            '<div style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Generating Your Report</div>' +
            '<div style="font-size: 14px; color: rgba(255,255,255,0.6);">Rendering 4-page PDF...</div>' +
            '</div>' +
            '<style>@keyframes pdfspin { to { transform: rotate(360deg); } }</style>';
        document.body.appendChild(overlay);

        // Give browser time to render the container and overlay
        setTimeout(function() {
            html2canvas(pdfContainer, { scale: 2, useCORS: true, allowTaint: true }).then(function(canvas) {
                var jsPDFLib = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
                if (jsPDFLib) {
                    var pdf = new jsPDFLib({ unit: 'px', format: [816, 1056], orientation: 'portrait' });
                    var pageHeight = 1056;
                    var imgData = canvas.toDataURL('image/jpeg', 0.98);
                    var imgHeight = (canvas.height * 816) / canvas.width;
                    var heightLeft = imgHeight;
                    var position = 0;

                    pdf.addImage(imgData, 'JPEG', 0, position, 816, imgHeight);
                    heightLeft -= pageHeight;

                    while (heightLeft > 0) {
                        position -= pageHeight;
                        pdf.addPage([816, 1056]);
                        pdf.addImage(imgData, 'JPEG', 0, position, 816, imgHeight);
                        heightLeft -= pageHeight;
                    }

                    pdf.save(companyName + '_AI_Readiness_Report.pdf');
                }
                // Clean up
                if (pdfContainer && pdfContainer.parentNode) pdfContainer.parentNode.removeChild(pdfContainer);
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }).catch(function(err) {
                console.error('PDF generation error:', err);
                alert('PDF generation failed: ' + err.message);
                if (pdfContainer && pdfContainer.parentNode) pdfContainer.parentNode.removeChild(pdfContainer);
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
            });
        }, 1500);
        return;
    }

    function buildPDFHTML(scores, lead) {
        var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Create a temporary container in the DOM (hidden)
        var container = document.createElement('div');
        container.id = 'pdf-report';
        container.style.cssText = 'position: absolute; left: 0; top: 0; width: 816px; z-index: 9999;'; // Must be visible for html2canvas to capture

        container.innerHTML = `
        <style>
            @page { margin: 0; }
            * { box-sizing: border-box; }
            .pdf-page {
                width: 816px;
                height: 1056px;
                page-break-after: always;
                page-break-inside: avoid;
                position: relative;
                background: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
                overflow: hidden;
            }
            .pdf-footer {
                position: absolute;
                bottom: 20px;
                left: 40px;
                right: 40px;
                font-size: 11px;
                color: #556b5e;
                border-top: 1px solid #e0e0e0;
                padding-top: 10px;
                overflow: hidden;
            }
            .pdf-footer-left { font-weight: 700; float: left; }
            .pdf-footer-right { font-weight: 500; float: right; }
        </style>

        <!-- PAGE 1: COVER -->
        <div class="pdf-page" style="background: #1a3a2e; color: white; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; padding: 120px 40px 60px 40px;">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAD8CAYAAABZ/vJZAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAeGVYSWZNTQAqAAAACAAEARoABQAAAAEAAAA+ARsABQAAAAEAAABGASgAAwAAAAEAAgAAh2kABAAAAAEAAABOAAAAAAAAASAAAAABAAABIAAAAAEAA6ABAAMAAAABAAEAAKACAAQAAAABAAABkKADAAQAAAABAAAA/AAAAAAZHkzHAAAACXBIWXMAACxLAAAsSwGlPZapAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNi4wLjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPkZpZ21hPC94bXA6Q3JlYXRvclRvb2w+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgoE/1zIAAAxL0lEQVR4Ae2dCbwkVX3vz6mq7rvMnTsMwwDDDMgAwrCJKIugAooaMRGzqElMXozP93yJW3yfjy/mEzWZJGb76Mdd3PKUl5eXxLig2cAFBDQZjSDLgCL7AIFhGWeY5S7dXXXe9199e6bvvV3dfde+M/d3Zvp2dZ1T55z61qn//6z/45ycCIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIiACIjAwUrAH6wZV75FYCqBEEaOdW6gz7nxqV5Nv/tSfjzkvbfvZeFGRkY2DAwM9LfjMj7uwh133PHQOeecU10WUHST80JACmReMCqSXhMIIURZbfSDUdJ/bAhpaJUf77zPsnQkistvR4HsbBXmUDyXpqN/HkV9JxdxcXDxIa3uG62+Y2hoaPuhyED3JAIiIAKFBFAgMYLyx3zjssJPrTq2L4R9xxRGdAh61Gqj/5Fj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gAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAiIgAjMiMD/BzKeEwIkVYn1AAAAAElFTkSuQmCC" alt="Upstate AI" style="width: 180px; margin-bottom: 60px;">
                <h1 style="font-size: 42px; font-weight: 800; margin: 0 0 10px 0; color: white; letter-spacing: -0.02em;">AI Readiness Assessment Results</h1>
                <div style="width: 80px; height: 4px; background: #ff6900; margin: 30px auto;"></div>
                <div style="margin: 50px 0;">
                    <p style="font-size: 24px; font-weight: 600; margin: 12px 0; color: white;">${escapeHtml(lead.name)}</p>
                    <p style="font-size: 20px; margin: 10px 0; color: #f7f4ea;">${escapeHtml(lead.company)}</p>
                    <p style="font-size: 16px; margin: 10px 0; color: rgba(247,244,234,0.8);">${escapeHtml(lead.email)}</p>
                    <p style="font-size: 14px; margin: 16px 0 0 0; color: rgba(247,244,234,0.7);">${date}</p>
                </div>
                <div style="margin-top: 60px; padding-top: 30px; border-top: 1px solid rgba(247,244,234,0.2);">
                    <p style="font-size: 13px; margin: 0 0 8px 0; color: rgba(247,244,234,0.7); text-transform: uppercase; letter-spacing: 0.1em;">Put AI to Work</p>
                    <p style="font-size: 16px; margin: 0; color: #f7f4ea;"><strong>ben@up-state-ai.com</strong> | <strong>(315) 313-5998</strong> | <strong>up-state-ai.com</strong></p>
                </div>
            </div>
            <div class="pdf-footer" style="color: rgba(247,244,234,0.8); border-top-color: rgba(247,244,234,0.2);">
                <div class="pdf-footer-left">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
                <div class="pdf-footer-right">Page 1 of 4</div>
            </div>
        </div>

        <!-- PAGE 2: RESULTS -->
        <div class="pdf-page">
            <div style="padding: 50px 40px;">
                <h2 style="color: #1a3a2e; font-size: 32px; font-weight: 800; margin: 0 0 40px 0; letter-spacing: -0.02em;">YOUR ASSESSMENT RESULTS</h2>

                <div style="background: #f7f4ea; padding: 32px; border-radius: 12px; margin-bottom: 36px; border-left: 6px solid #ff6900;">
                    <div style="margin-bottom: 20px; overflow: hidden;">
                        <div style="float: left; font-size: 72px; font-weight: 900; color: #ff6900; line-height: 1; margin-right: 20px;">${scores.totalScore}</div>
                        <div style="float: left; padding-top: 16px;">
                            <div style="font-size: 20px; font-weight: 700; color: #1a3a2e; margin-bottom: 4px;">${escapeHtml(scores.tier.name)}</div>
                            <div style="font-size: 14px; color: #556b5e;">out of 60 points</div>
                        </div>
                    </div>
                    <p style="font-size: 15px; line-height: 1.7; color: #1a3a2e; margin: 0;">${escapeHtml(scores.tier.summary)}</p>
                </div>

                <h3 style="color: #1a3a2e; font-size: 20px; font-weight: 700; margin: 0 0 20px 0;">Dimension Scores</h3>
                ${buildDimensionBars(scores)}

                <div style="background: #fff; border: 2px solid #f7f4ea; border-radius: 8px; padding: 20px; margin-top: 28px;">
                    <div style="overflow: hidden;">
                        <div style="float: left; width: 48%;">
                            <div style="font-size: 12px; font-weight: 700; color: #ff6900; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">Strongest</div>
                            <div style="font-size: 16px; font-weight: 700; color: #1a3a2e; margin-bottom: 4px;">${escapeHtml(scores.strongest.label)}</div>
                            <div style="font-size: 13px; color: #556b5e; line-height: 1.5;">${escapeHtml(scores.strongest.desc)}</div>
                        </div>
                        <div style="float: right; width: 48%;">
                            <div style="font-size: 12px; font-weight: 700; color: #ff6900; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">Biggest Opportunity</div>
                            <div style="font-size: 16px; font-weight: 700; color: #1a3a2e; margin-bottom: 4px;">${escapeHtml(scores.weakest.label)}</div>
                            <div style="font-size: 13px; color: #556b5e; line-height: 1.5;">${escapeHtml(scores.weakest.desc)}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="pdf-footer">
                <div class="pdf-footer-left">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
                <div class="pdf-footer-right">Page 2 of 4</div>
            </div>
        </div>

        <!-- PAGE 3: RECOMMENDATIONS -->
        <div class="pdf-page">
            <div style="padding: 50px 40px;">
                <h2 style="color: #1a3a2e; font-size: 32px; font-weight: 800; margin: 0 0 40px 0; letter-spacing: -0.02em;">YOUR NEXT STEPS</h2>

                <div style="margin-bottom: 36px;">
                    ${buildActionsList(scores)}
                </div>

                <div style="background: #ff6900; color: white; padding: 28px; border-radius: 12px; margin-top: 40px;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; opacity: 0.9;">Recommended Service</div>
                    <h3 style="font-size: 26px; font-weight: 800; margin: 0 0 8px 0; color: white;">${escapeHtml(scores.tier.service)}</h3>
                    <p style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #f7f4ea;">Starting at ${escapeHtml(scores.tier.servicePrice)}</p>
                    <p style="font-size: 14px; line-height: 1.6; margin: 0; color: rgba(255,255,255,0.95);">${escapeHtml(scores.tier.serviceDesc)}</p>
                </div>

                <div style="margin-top: 36px; text-align: center; padding: 24px; background: #f7f4ea; border-radius: 8px;">
                    <p style="font-size: 16px; font-weight: 600; color: #1a3a2e; margin: 0 0 12px 0;">Ready to take the next step?</p>
                    <p style="font-size: 14px; color: #556b5e; margin: 0;">Schedule a free 30-minute consultation: <strong style="color: #ff6900;">ben@up-state-ai.com</strong> or visit <strong style="color: #ff6900;">up-state-ai.com</strong></p>
                </div>
            </div>
            <div class="pdf-footer">
                <div class="pdf-footer-left">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
                <div class="pdf-footer-right">Page 3 of 4</div>
            </div>
        </div>

        <!-- PAGE 4: ABOUT -->
        <div class="pdf-page">
            <div style="padding: 50px 40px;">
                <h2 style="color: #1a3a2e; font-size: 32px; font-weight: 800; margin: 0 0 24px 0; letter-spacing: -0.02em;">ABOUT UPSTATE AI</h2>

                <p style="font-size: 15px; line-height: 1.8; color: #1a3a2e; margin: 0 0 28px 0;">
                    We help businesses in manufacturing, professional services, and logistics build practical AI systems that solve real problems. No hype, no generic advice. Just honest assessments, clear implementation plans, and hands-on support from people who understand both the technology and your industry.
                </p>

                <div style="background: #f7f4ea; padding: 24px; border-radius: 8px; margin-bottom: 32px; border-left: 4px solid #ff6900;">
                    <h3 style="font-size: 16px; font-weight: 700; color: #1a3a2e; margin: 0 0 12px 0;">Ben Nichols, Founder</h3>
                    <p style="font-size: 13px; line-height: 1.7; color: #556b5e; margin: 0;">
                        AI professor at Syracuse University and consultant to manufacturers, professional services firms, and technology companies. Built and deployed machine learning systems in production environments for over a decade.
                    </p>
                </div>

                <h3 style="color: #1a3a2e; font-size: 20px; font-weight: 700; margin: 0 0 20px 0;">Our Services</h3>
                ${buildServicesGrid()}

                <div style="margin-top: 36px; padding: 24px; background: #1a3a2e; color: white; border-radius: 8px; overflow: hidden;">
                    <div style="float: left; width: 65%;">
                        <h3 style="font-size: 18px; font-weight: 700; margin: 0 0 12px 0; color: white;">Let's Talk</h3>
                        <p style="font-size: 13px; margin: 0 0 16px 0; color: #f7f4ea; line-height: 1.6;">Book a free 30-minute consultation to discuss your AI readiness and next steps.</p>
                        <p style="font-size: 13px; margin: 0; color: #f7f4ea;"><strong>Email:</strong> ben@up-state-ai.com<br><strong>Phone:</strong> (315) 313-5998<br><strong>Web:</strong> up-state-ai.com</p>
                    </div>
                    <div style="float: right; width: 30%; text-align: right;">
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGMAAABjAQMAAAC19SzWAAAABlBMVEUAAAD///+l2Z/dAAAAAnRSTlP//8i138cAAAAJcEhZcwAACxIAAAsSAdLdfvwAAADtSURBVDiNzdSxrcMgEAbgsyhSsgASa9B5JVggFgs8r0THGpa8AHQUyH/OylP8Gr9zkUi5iq8A/QcnCH+LvliF6D4anWiQVNFDs3PmhaRkPJkpU7igO/WLCuj6itC9W4Yj2am4v5BNOLo9FVfhmzhu8FTFcZCVE2lJ22hrQv3N8p9q6nQDso2SNmeBZYCFpDL2AQppjZKQVEx2oyVIqlhCVmhGFPc3Z9Kws6RCXaf9NSZJXPy8HLxK4h1+XGNWURJv4hkMeE3WufZpJU+qXpB3dm7P1IKmpn6cCaJ4rvfjV0ja57oZcoiSPv/3vEMPrTO48Li5pwoAAAAASUVORK5CYII=" alt="Scan to book" style="width: 120px; height: 120px; border-radius: 8px; background: white; padding: 8px;">
                    </div>
                </div>
            </div>
            <div class="pdf-footer">
                <div class="pdf-footer-left">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
                <div class="pdf-footer-right">Page 4 of 4</div>
            </div>
        </div>
        `;

        document.body.appendChild(container);
        return container;
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    function buildDimensionBars(scores) {
        var html = '<div>';
        DIMENSIONS.forEach(function(dim) {
            var score = scores.dimensionScores[dim.key] || 0;
            var percentage = (score / 10) * 100;
            html += `
                <div>
                    <div style="overflow: hidden; margin-bottom: 8px;">
                        <div style="float: left; font-size: 14px; font-weight: 600; color: #1a3a2e;">${escapeHtml(dim.label)}</div>
                        <div style="float: right; font-size: 14px; font-weight: 700; color: #ff6900;">${score}/10</div>
                    </div>
                    <div style="background: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #1a3a2e, #ff6900); height: 100%; width: ${percentage}%; border-radius: 5px;"></div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    function buildActionsList(scores) {
        var actions = scores.tier.actions || [];
        var html = '<div>';
        actions.forEach(function(action, idx) {
            html += `
                <div style="margin-bottom: 20px; overflow: hidden;">
                    <div style="float: left; width: 32px; height: 32px; border-radius: 50%; background: #ff6900; color: white; text-align: center; line-height: 32px; font-weight: 800; font-size: 16px; margin-right: 16px;">${idx + 1}</div>
                    <div style="margin-left: 48px; padding-top: 4px;">
                        <p style="font-size: 15px; line-height: 1.6; color: #1a3a2e; margin: 0;">${escapeHtml(action)}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    function buildServicesGrid() {
        var services = [
            { name: 'AI Workshop', desc: 'Half-day interactive session for leadership teams covering industry-specific use cases and hands-on opportunity scoring.' },
            { name: 'AI Audit', desc: 'Full operational analysis with data maturity evaluation and prioritized roadmap with ROI estimates.' },
            { name: 'AI Execution', desc: 'End-to-end project management from technical planning through vendor evaluation to deployment and training.' },
            { name: 'AI Advisory', desc: 'Monthly strategic check-ins, on-call guidance for AI decisions, and quarterly opportunity reviews.' }
        ];

        var html = '<div style="overflow: hidden;">';
        services.forEach(function(svc, idx) {
            var marginStyle = (idx % 2 === 0) ? 'margin-right: 3%;' : '';
            html += `
                <div style="display: inline-block; vertical-align: top; width: 48%; ${marginStyle} margin-bottom: 16px; background: #f7f4ea; padding: 18px; border-radius: 8px;">
                    <h4 style="font-size: 15px; font-weight: 700; color: #1a3a2e; margin: 0 0 8px 0;">${escapeHtml(svc.name)}</h4>
                    <p style="font-size: 12px; line-height: 1.6; color: #556b5e; margin: 0;">${escapeHtml(svc.desc)}</p>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }



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

})();

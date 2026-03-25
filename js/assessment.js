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

        // html2pdf.js options
        var companyName = (lead.company || lead.name || 'Assessment').replace(/[^a-zA-Z0-9]+/g, '_');
        var opt = {
            margin: 0,
            filename: companyName + '_AI_Readiness_Report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: true, allowTaint: true, foreignObjectRendering: false, removeContainer: false },
            jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
            pagebreak: { mode: 'css', before: '.pdf-page' }
        };

        // Wait for fonts and images to load before capturing
        setTimeout(function() {
            // Debug: test html2canvas directly first
            console.log('PDF container dimensions:', pdfContainer.offsetWidth, 'x', pdfContainer.offsetHeight);
            console.log('PDF container children:', pdfContainer.children.length);
            console.log('First child tag:', pdfContainer.children[0] ? pdfContainer.children[0].tagName : 'none');
            
            html2pdf().set(opt).from(pdfContainer).save().then(function() {
                // Clean up: remove the hidden container after PDF is generated
                if (pdfContainer && pdfContainer.parentNode) {
                    pdfContainer.parentNode.removeChild(pdfContainer);
                }
            }).catch(function(err) {
                console.error('html2pdf error:', err);
                alert('PDF generation failed: ' + err.message);
                if (pdfContainer && pdfContainer.parentNode) {
                    pdfContainer.parentNode.removeChild(pdfContainer);
                }
            });
        }, 1000); // Give browser time to render fonts and images
        return;
    }

    function buildPDFHTML(scores, lead) {
        var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Create a temporary container in the DOM (hidden)
        var container = document.createElement('div');
        container.id = 'pdf-report';
        container.style.cssText = 'position: absolute; left: 0; top: 0; width: 816px; z-index: 9999;'; // Visible temporarily for html2canvas capture

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
                <img src="images/logo-white.png" alt="Upstate AI" style="width: 180px; margin-bottom: 60px;">
                <h1 style="font-size: 42px; font-weight: 800; margin: 0 0 10px 0; color: white; letter-spacing: -0.02em;">AI Readiness Assessment Results</h1>
                <div style="width: 80px; height: 4px; background: #ff6900; margin: 30px auto;"></div>
                <div style="margin: 50px 0;">
                    <p style="font-size: 24px; font-weight: 600; margin: 12px 0; color: white;">${escapeHtml(lead.name)}</p>
                    <p style="font-size: 20px; margin: 10px 0; color: #f7f4ea;">${escapeHtml(lead.company)}</p>
                    <p style="font-size: 16px; margin: 10px 0; color: rgba(247,244,234,0.8);">${escapeHtml(lead.email)}</p>
                    <p style="font-size: 14px; margin: 16px 0 0 0; color: rgba(247,244,234,0.7);">${date}</p>
                </div>
                <div style="margin-top: 60px; padding-top: 30px; border-top: 1px solid rgba(247,244,234,0.2);">
                    <p style="font-size: 13px; margin: 0 0 8px 0; color: rgba(247,244,234,0.7); text-transform: uppercase; letter-spacing: 0.1em;">Putting AI to Work</p>
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
                    <p style="font-size: 14px; color: #556b5e; margin: 0;">Schedule a free 30-minute consultation: <strong style="color: #ff6900;">calendar.app.google/agt6Z3KTJhGXjyNE9</strong></p>
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
                        <img src="images/qr-code-upstate-ai.png" alt="Scan to book" style="width: 120px; height: 120px; border-radius: 8px; background: white; padding: 8px;">
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
            var floatStyle = (idx % 2 === 0) ? 'float: left;' : 'float: right;';
            html += `
                <div style="${floatStyle} width: 48%; margin-bottom: 16px; background: #f7f4ea; padding: 18px; border-radius: 8px;">
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

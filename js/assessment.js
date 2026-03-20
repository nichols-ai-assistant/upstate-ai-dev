/* ==========================================
   AI Readiness Assessment
   Scoring, navigation, results, PDF, Sheets
   ========================================== */

(function () {
    'use strict';

    // ---- CONFIG ----
    // Replace this URL after deploying the Google Apps Script web app.
    var APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL';

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
            summary: 'You\'re at the starting line, and that\'s exactly where most CNY businesses are right now. AI isn\'t your next move; your next move is building the foundation that makes AI possible. The good news? Every step you take here pays off whether or not you ever touch AI, because better data and documented processes make everything run smoother.',
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
            summary: 'You\'ve got pieces in place. Data exists, some processes are documented, and leadership is paying attention. The gap right now is between interest and action. This is the critical moment for CNY businesses: the ones that move from "we should look into AI" to "here\'s our first project" in the next 12 months will create real separation from competitors.',
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

    // ---- STATE ----
    var currentStep = 1;

    // ---- DOM ----
    var progressFill = document.getElementById('progressFill');
    var progressLabel = document.getElementById('progressLabel');
    var btnBack = document.getElementById('btnBack');
    var btnNext = document.getElementById('btnNext');
    var validationMsg = document.getElementById('validationMsg');
    var assessmentApp = document.getElementById('assessmentApp');
    var resultsSection = document.getElementById('resultsSection');

    // ---- NAVIGATION ----
    function showStep(step) {
        document.querySelectorAll('.assess-step').forEach(function (el) {
            el.style.display = 'none';
        });
        var target = document.querySelector('.assess-step[data-step="' + step + '"]');
        if (target) target.style.display = 'block';

        // Progress
        var pct = Math.round((step / TOTAL_STEPS) * 100);
        progressFill.style.width = pct + '%';

        if (step <= 6) {
            progressLabel.textContent = 'Section ' + step + ' of ' + TOTAL_STEPS;
        } else {
            progressLabel.textContent = 'Final step';
        }

        // Back button
        btnBack.style.visibility = step === 1 ? 'hidden' : 'visible';

        // Next button label
        if (step === 7) {
            btnNext.textContent = 'See My Results';
        } else {
            btnNext.textContent = 'Next';
        }

        validationMsg.style.display = 'none';
        window.scrollTo({ top: document.getElementById('assessment').offsetTop - 80, behavior: 'smooth' });
    }

    function validateStep(step) {
        if (step <= 6) {
            var stepEl = document.querySelector('.assess-step[data-step="' + step + '"]');
            var questions = stepEl.querySelectorAll('.question-block');
            for (var i = 0; i < questions.length; i++) {
                var qNum = questions[i].getAttribute('data-question');
                var checked = document.querySelector('input[name="q' + qNum + '"]:checked');
                if (!checked) return false;
            }
            return true;
        }
        // Step 7: lead capture
        var name = document.getElementById('leadName').value.trim();
        var email = document.getElementById('leadEmail').value.trim();
        var company = document.getElementById('leadCompany').value.trim();
        var industry = document.getElementById('leadIndustry').value;
        var size = document.getElementById('leadSize').value;
        if (!name || !email || !company || !industry || !size) return false;
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
        return true;
    }

    btnNext.addEventListener('click', function () {
        if (!validateStep(currentStep)) {
            validationMsg.style.display = 'block';
            return;
        }
        if (currentStep < TOTAL_STEPS) {
            currentStep++;
            showStep(currentStep);
        } else {
            // Submit
            submitAssessment();
        }
    });

    btnBack.addEventListener('click', function () {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
        }
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
            generatePdf(scores, lead);
        });

        // Send to Google Sheets (fire and forget, but log errors)
        if (APPS_SCRIPT_URL && APPS_SCRIPT_URL !== 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
            fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(function (err) {
                console.warn('Sheets submission error:', err);
            });
        } else {
            console.warn('Apps Script URL not configured. Submission data:', payload);
        }
    }

    // ---- PDF GENERATION (4 pages exactly) ----
    function generatePdf(scores, lead) {
        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF({ unit: 'mm', format: 'letter' });
        var tier = scores.tier;
        var pageW = doc.internal.pageSize.getWidth();
        var pageH = doc.internal.pageSize.getHeight();
        var margin = 20;
        var contentW = pageW - margin * 2;
        var y = 0;

        // Colors
        var forestDark = [26, 58, 46];
        var orange = [255, 105, 0];
        var cream = [247, 244, 234];
        var textMuted = [85, 107, 94];

        function addFooter(pageNum) {
            doc.setFontSize(8);
            doc.setTextColor.apply(doc, textMuted);
            doc.text('Upstate AI  |  up-state-ai.com  |  ben@up-state-ai.com', margin, pageH - 10);
            doc.text('Page ' + pageNum + ' of 4', pageW - margin, pageH - 10, { align: 'right' });
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
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('UPSTATE AI', margin, 35);

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
        doc.text('Practical AI consulting for Central New York businesses.', margin, y);
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
        doc.text(tier.icon + '  ' + tier.name + ' Tier', margin + scoreW + 30, y - 5);

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
            'Upstate AI is a Central New York AI consulting firm that helps local businesses figure out where AI fits, and where it doesn\'t. We work with manufacturers, logistics companies, and professional services firms across the region.',
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

        addFooter(4);

        // Save
        var filename = (lead.company || 'Company').replace(/[^a-zA-Z0-9]/g, '_') + '_AI_Readiness_Report.pdf';
        doc.save(filename);
    }

    // ---- INIT ----
    showStep(1);

})();

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

    // ---- PDF GENERATION ----
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
        var white = [255, 255, 255];

        // Helper: add page number footer
        function addFooter(pageNum) {
            doc.setFontSize(8);
            doc.setTextColor.apply(doc, textMuted);
            doc.text('Upstate AI | up-state-ai.com', margin, pageH - 10);
            doc.text('Page ' + pageNum, pageW - margin, pageH - 10, { align: 'right' });
        }

        // Helper: wrap text and return lines
        function getLines(text, maxWidth, fontSize) {
            doc.setFontSize(fontSize || 10);
            return doc.splitTextToSize(text, maxWidth);
        }

        // ============ PAGE 1: COVER ============
        // Dark header block
        doc.setFillColor.apply(doc, forestDark);
        doc.rect(0, 0, pageW, 100, 'F');

        // Orange accent bar
        doc.setFillColor.apply(doc, orange);
        doc.rect(0, 100, pageW, 4, 'F');

        // Title text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('UPSTATE AI', margin, 30);

        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('Your AI Readiness Report', margin, 55);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(lead.company, margin, 70);
        doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin, 78);

        // Score display area
        y = 130;
        doc.setTextColor.apply(doc, forestDark);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Your Score', margin, y);

        doc.setFontSize(48);
        doc.setTextColor.apply(doc, orange);
        doc.text(scores.totalScore + '', margin, y + 25);
        doc.setFontSize(20);
        doc.setTextColor.apply(doc, textMuted);
        doc.text('/60', margin + doc.getTextWidth(scores.totalScore + '') + 2, y + 25);

        // Tier badge
        doc.setFontSize(22);
        doc.setTextColor.apply(doc, forestDark);
        doc.setFont('helvetica', 'bold');
        doc.text(tier.icon + '  ' + tier.name, margin, y + 45);

        // Prepared for
        y = 210;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor.apply(doc, textMuted);
        doc.text('Prepared for: ' + lead.name, margin, y);
        doc.text('Email: ' + lead.email, margin, y + 7);
        doc.text('Industry: ' + (lead.industry || 'N/A') + '  |  Size: ' + (lead.companySize || 'N/A'), margin, y + 14);

        addFooter(1);

        // ============ PAGE 2: SCORE BREAKDOWN ============
        doc.addPage();
        y = margin;

        // Header
        doc.setFillColor.apply(doc, forestDark);
        doc.rect(0, 0, pageW, 18, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('YOUR SCORE BREAKDOWN', margin, 12);
        y = 30;

        // Dimension table
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor.apply(doc, forestDark);
        doc.text('Dimension', margin, y);
        doc.text('Score', margin + 85, y);
        doc.text('Max', margin + 105, y);
        doc.text('What This Measures', margin + 120, y);
        y += 3;
        doc.setDrawColor.apply(doc, orange);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageW - margin, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        DIMENSIONS.forEach(function (dim) {
            var s = scores.dimensionScores[dim.key];
            doc.setTextColor.apply(doc, forestDark);
            doc.setFontSize(10);
            doc.text(dim.label, margin, y);
            doc.setTextColor.apply(doc, orange);
            doc.setFont('helvetica', 'bold');
            doc.text(s + '', margin + 90, y, { align: 'center' });
            doc.setTextColor.apply(doc, textMuted);
            doc.setFont('helvetica', 'normal');
            doc.text('10', margin + 110, y, { align: 'center' });

            var descLines = getLines(dim.desc, contentW - 120, 9);
            doc.setFontSize(9);
            doc.text(descLines, margin + 120, y);
            y += Math.max(descLines.length * 4.5, 7) + 4;
        });

        // Bar chart
        y += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor.apply(doc, forestDark);
        doc.text('Dimension Visualization', margin, y);
        y += 8;

        DIMENSIONS.forEach(function (dim) {
            var s = scores.dimensionScores[dim.key];
            var barMaxW = contentW - 60;
            var barW = (s / 10) * barMaxW;

            doc.setFontSize(8);
            doc.setTextColor.apply(doc, textMuted);
            doc.text(dim.label, margin, y + 4);

            // Background bar
            doc.setFillColor.apply(doc, cream);
            doc.roundedRect(margin + 55, y, barMaxW, 6, 2, 2, 'F');

            // Filled bar
            if (barW > 0) {
                doc.setFillColor.apply(doc, orange);
                doc.roundedRect(margin + 55, y, barW, 6, 2, 2, 'F');
            }

            // Score label
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor.apply(doc, forestDark);
            doc.text(s + '/10', margin + 55 + barMaxW + 3, y + 5);

            y += 12;
        });

        // Insight
        y += 5;
        doc.setFillColor.apply(doc, cream);
        doc.roundedRect(margin, y, contentW, 16, 3, 3, 'F');
        doc.setFillColor.apply(doc, orange);
        doc.rect(margin, y, 3, 16, 'F');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor.apply(doc, forestDark);
        doc.text('Your strongest dimension: ' + scores.strongest.label + '.', margin + 8, y + 6);
        doc.text('Your biggest opportunity: ' + scores.weakest.label + '.', margin + 8, y + 12);

        addFooter(2);

        // ============ PAGE 3: WHAT YOUR TIER MEANS ============
        doc.addPage();
        y = margin;

        doc.setFillColor.apply(doc, forestDark);
        doc.rect(0, 0, pageW, 18, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('WHAT IT MEANS TO BE ' + tier.name.toUpperCase().replace('AN ', ''), margin, 12);
        y = 30;

        var tierDescriptions = {
            explorer: {
                heading: 'What It Means to Be an Explorer',
                body: 'Your organization is in the early stages of digital maturity. That\'s not a criticism; it\'s where roughly 40% of small and mid-size businesses land on assessments like this. AI is a conversation for later. Right now, the highest-value work is building the digital foundation that makes everything else possible.',
                where: ['Business data lives across spreadsheets, paper, and disconnected tools', 'Core processes depend on the people who run them, not documentation', 'Technology is mostly on-premise or standalone', 'Leadership hasn\'t formalized a position on AI'],
                why: 'AI doesn\'t create structure. It amplifies whatever structure already exists. Organizations that invest in data centralization, process documentation, and basic automation first see faster, cheaper, and more successful AI adoption when they\'re ready. Every step you take here makes your business more efficient and resilient, with or without AI.',
                compare: 'Based on research from Accenture and the U.S. Chamber of Commerce, approximately 40% of SMBs fall in this range. Among CNY manufacturers and logistics companies, that number is likely higher. You are not behind; you are where most of your peers are.'
            },
            builder: {
                heading: 'What It Means to Be a Builder',
                body: 'Your organization has foundational digital capabilities in place. You have business data in systems, some documented processes, and leadership awareness. The question isn\'t whether AI is relevant to your business. It\'s whether you\'ll be one of the companies that moves from interest to action in the next 12 months.',
                where: ['Core data exists in business systems but may have gaps in consistency or integration', 'Some processes are well-documented; others still rely on key individuals', 'You use some cloud tools and basic automation', 'Leadership is interested but hasn\'t committed specific budget or timelines'],
                why: 'This is the inflection point. Research from Deloitte shows that organizations scoring above 70% on readiness assessments are 3x more likely to implement AI successfully within 12 months. You\'re building toward that threshold. The businesses that close the gap between interest and action now will be the ones setting the pace in their market within two years.',
                compare: 'About 35% of SMBs land in this tier. You have more infrastructure than most, and less than you probably want. That\'s the Builder position: you\'ve built the floor, now it\'s time to build the walls.'
            },
            accelerator: {
                heading: 'What It Means to Be an Accelerator',
                body: 'Your organization has solid digital infrastructure. Data is reasonably centralized, processes are documented, leadership is engaged, and your team is comfortable with technology. You\'re positioned to implement AI in targeted areas. The challenge now is execution: right project, right scope, right measurement.',
                where: ['Centralized, reasonably clean data with some cross-system integration', 'Well-documented processes with defined performance metrics', 'Cloud or hybrid infrastructure with meaningful automation already in place', 'Leadership actively exploring AI with budget allocated or in discussion', 'Team is generally tech-comfortable; some AI experimentation is happening'],
                why: 'You have what most companies are still building toward. Your risk isn\'t unreadiness; it\'s inertia. Analysis paralysis is the biggest threat at this stage. Companies in your position that pick a project and execute it within 6 months consistently outperform those that spend 18 months evaluating options.',
                compare: 'Roughly 20% of SMBs reach this tier. Among CNY businesses specifically, you\'re in a strong minority. That\'s a competitive advantage if you use it.'
            },
            leader: {
                heading: 'What It Means to Be a Leader',
                body: 'Your organization operates at the highest tier of SMB AI readiness. This isn\'t a regional comparison; this is a national one. You have integrated data systems, comprehensive process documentation, a modern technology stack, committed leadership, a capable team, and governance awareness. You are ready for strategic AI deployment.',
                where: ['Integrated, high-quality data with automated checks and reporting/API access', 'Comprehensive process documentation tied to measurable KPIs', 'Cloud-first, well-integrated technology with extensive automation', 'Leadership has a defined AI strategy with budget, timeline, and success metrics', 'Technology-forward workforce actively experimenting with AI', 'Data governance and AI risk awareness policies in place'],
                why: 'At this level, AI isn\'t an experiment. It\'s a strategic tool. McKinsey research shows companies with high AI readiness scores experience 25% faster revenue growth. You have the foundation to realize that kind of return. Your next moves should be about building a portfolio of AI initiatives mapped to specific business outcomes.',
                compare: 'Roughly 5% of SMBs nationally score at this level. You\'re an outlier in the best sense. In the CNY market specifically, you\'re likely in a class of your own.'
            }
        };

        var td = tierDescriptions[scores.tierKey];

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor.apply(doc, forestDark);

        var bodyLines = getLines(td.body, contentW, 10);
        doc.text(bodyLines, margin, y);
        y += bodyLines.length * 5 + 8;

        // Where you likely stand
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Where you likely stand:', margin, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        td.where.forEach(function (item) {
            var lines = getLines('\u2022  ' + item, contentW - 5, 9);
            doc.text(lines, margin + 5, y);
            y += lines.length * 4.2 + 2;
        });

        // Why this matters
        y += 6;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor.apply(doc, forestDark);
        doc.text('Why this matters:', margin, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        var whyLines = getLines(td.why, contentW, 9);
        doc.setTextColor.apply(doc, textMuted);
        doc.text(whyLines, margin, y);
        y += whyLines.length * 4.2 + 8;

        // How you compare
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor.apply(doc, forestDark);
        doc.text('How you compare:', margin, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        var compLines = getLines(td.compare, contentW, 9);
        doc.setTextColor.apply(doc, textMuted);
        doc.text(compLines, margin, y);

        addFooter(3);

        // ============ PAGE 4: ACTION PLAN ============
        doc.addPage();
        y = margin;

        doc.setFillColor.apply(doc, forestDark);
        doc.rect(0, 0, pageW, 18, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('YOUR ACTION PLAN', margin, 12);
        y = 30;

        var actionPlans = {
            explorer: {
                title: 'Building Your Foundation (Next 6 Months)',
                actions: [
                    { title: 'Centralize your data', body: 'Move critical business data (customers, orders, inventory, financials) out of spreadsheets and into a proper system. If you already use an ERP, audit how consistently it\'s used across departments. Are all departments entering data? Is the data clean? Start with one data category and expand from there.' },
                    { title: 'Document your top 5 workflows', body: 'Pick the five most repetitive, time-consuming processes in your operation. Write each one down: what triggers it, what steps are involved, what decisions get made, and what the output is. A shared Google Doc with numbered steps is a huge improvement over "ask Dave, he knows."' },
                    { title: 'Assign a technology champion', body: 'Identify one person (doesn\'t need to be in IT) who will own the question: "What could technology do better here?" Give them permission to research, attend events, and bring ideas to leadership.' },
                    { title: 'Attend an AI Workshop', body: 'Upstate AI runs workshops designed for CNY businesses at your stage. See real examples of what companies like yours have done, and get a realistic picture of what\'s possible, what it costs, and what to prioritize. Starting at $2,000.' }
                ]
            },
            builder: {
                title: 'From Interest to Action (Next 6 Months)',
                actions: [
                    { title: 'Run a data quality audit', body: 'Pick one area: customer records, production logs, or inventory data. Assess three things: completeness (is everything captured?), accuracy (is it correct?), and accessibility (can the people who need it get to it?). Fix the gaps before you try to build anything on top of this data.' },
                    { title: 'Identify your highest-ROI AI use case', body: 'Look for the intersection of three things: (a) a repetitive, time-consuming process, (b) available data related to that process, and (c) a measurable business outcome you want to improve. Common starting points for CNY businesses: demand forecasting, quality inspection, invoice processing.' },
                    { title: 'Start the budget conversation', body: 'A meaningful AI pilot for a small or mid-size business typically runs $15,000-$75,000 depending on complexity. Get leadership aligned on a range and a timeline.' },
                    { title: 'Get an AI Audit', body: 'A detailed operational analysis identifies specific gaps, ranks your use cases by ROI, and gives you a realistic implementation timeline. Upstate AI offers this for CNY businesses. Starting at $5,000.' }
                ]
            },
            accelerator: {
                title: 'Execute and Measure (Next 6 Months)',
                actions: [
                    { title: 'Select and scope your first AI project', body: 'Define success criteria before you build. What metric will improve? By how much? In what timeframe? If you can\'t answer those questions, you\'re not ready to start; you\'re ready to scope.' },
                    { title: 'Evaluate build vs. buy', body: 'Before commissioning custom AI work, check what AI capabilities already exist in your current tools. Your ERP, CRM, or industry software may have AI features you\'re not using.' },
                    { title: 'Write a one-page AI governance policy', body: 'What types of decisions can AI inform? What requires human review? Who approves new AI use cases? One page is enough to start.' },
                    { title: 'Engage AI Execution support', body: 'The difference between a successful AI pilot and an expensive experiment is scoping and oversight. Upstate AI manages AI builds from spec to launch with clear technical plans and honest vendor evaluation. Starting at $10,000.' }
                ]
            },
            leader: {
                title: 'Scale and Differentiate (Next 6-12 Months)',
                actions: [
                    { title: 'Build a 12-18 month AI roadmap', body: 'Map 3-5 AI initiatives to specific business outcomes. Prioritize by expected ROI and implementation feasibility. Sequence them so early wins fund later, larger projects.' },
                    { title: 'Explore advanced use cases', body: 'With your infrastructure, you\'re ready for: predictive maintenance, supply chain optimization, dynamic pricing, automated quality control, intelligent document processing, and conversational AI.' },
                    { title: 'Assess proprietary model opportunities', body: 'If you have years of unique data (production quality records, proprietary process measurements, customer behavior patterns), you may have the raw material for fine-tuned AI models that competitors can\'t replicate.' },
                    { title: 'Partner on AI Advisory', body: 'Monthly strategic check-ins, on-call guidance for AI decisions, and quarterly reviews to identify your next opportunity. Upstate AI provides dedicated advisory for companies ready to scale. Starting at $1,000/month.' }
                ]
            }
        };

        var plan = actionPlans[scores.tierKey];
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor.apply(doc, forestDark);
        doc.text(plan.title, margin, y);
        y += 10;

        plan.actions.forEach(function (action, idx) {
            // Check if we need a new page
            if (y > pageH - 50) {
                addFooter(4);
                doc.addPage();
                y = margin + 5;
            }

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor.apply(doc, orange);
            doc.text((idx + 1) + '. ' + action.title, margin, y);
            y += 6;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor.apply(doc, textMuted);
            var lines = getLines(action.body, contentW - 5, 9);
            doc.text(lines, margin + 5, y);
            y += lines.length * 4.2 + 8;
        });

        addFooter(4);

        // ============ PAGE 5: ABOUT UPSTATE AI ============
        doc.addPage();
        y = margin;

        doc.setFillColor.apply(doc, forestDark);
        doc.rect(0, 0, pageW, 18, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ABOUT UPSTATE AI', margin, 12);
        y = 30;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor.apply(doc, forestDark);

        var aboutText = [
            'Upstate AI is a Central New York AI consulting firm that helps local businesses figure out where AI fits, and where it doesn\'t.',
            '',
            'We\'re led by a Syracuse University AI professor who has spent years bridging the gap between academic AI research and real-world business applications. We work with manufacturers, logistics companies, and professional services firms across the region.',
            '',
            'What we do:',
        ];
        aboutText.forEach(function (line) {
            if (line === '') { y += 4; return; }
            var lines = getLines(line, contentW, 10);
            doc.text(lines, margin, y);
            y += lines.length * 5 + 2;
        });

        var services = [
            { name: 'AI Workshop ($2,000)', desc: 'Interactive half-day sessions covering AI opportunities specific to your industry.' },
            { name: 'AI Audit ($5,000)', desc: 'Full operational analysis with a prioritized AI roadmap and ROI estimates.' },
            { name: 'AI Execution ($10,000)', desc: 'End-to-end project management from spec to launch with vendor evaluation.' },
            { name: 'AI Advisory ($1,000/mo)', desc: 'Ongoing strategic partnership with monthly check-ins and on-call guidance.' }
        ];

        y += 2;
        services.forEach(function (svc) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor.apply(doc, orange);
            doc.text('\u2022  ' + svc.name, margin + 5, y);
            y += 5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor.apply(doc, textMuted);
            var lines = getLines(svc.desc, contentW - 15, 9);
            doc.text(lines, margin + 10, y);
            y += lines.length * 4.2 + 4;
        });

        // Recommended service highlight
        y += 10;
        doc.setFillColor.apply(doc, orange);
        doc.roundedRect(margin, y, contentW, 28, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Recommended for ' + lead.company + ':', margin + 8, y + 10);
        doc.setFontSize(14);
        doc.text(tier.service + ' (Starting at ' + tier.servicePrice + ')', margin + 8, y + 20);

        y += 38;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor.apply(doc, forestDark);
        doc.text('Ready to take the next step? Visit up-state-ai.com or email ben@up-state-ai.com', margin, y);

        addFooter(5);

        // Save
        var filename = (lead.company || 'Company').replace(/[^a-zA-Z0-9]/g, '_') + '_AI_Readiness_Report.pdf';
        doc.save(filename);
    }

    // ---- INIT ----
    showStep(1);

})();

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
        var html = buildPDFHTML(scores, lead);
        
        // html2pdf.js options
        var opt = {
            margin: [10, 10, 10, 10],
            filename: 'AI-Readiness-Report-' + (lead.name || 'Assessment').replace(/\s+/g, '-') + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        // Generate and download
        html2pdf().set(opt).from(html).save();
        return;
    }

    function buildPDFHTML(scores, lead) {
        var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        return `
    <div id="pdf-report" style="font-family: 'Helvetica', Arial, sans-serif; color: #333; line-height: 1.6;">
        
        <!-- PAGE 1: COVER -->
        <div style="page-break-after: always; height: 260mm; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: linear-gradient(135deg, #00214E 0%, #003366 100%);">
            <div style="color: white; padding: 40px;">
                <h1 style="font-size: 48px; margin: 0 0 20px 0; color: #FF6B00;">AI Readiness Assessment</h1>
                <h2 style="font-size: 32px; margin: 0 0 40px 0; font-weight: 300;">Results Report</h2>
                <div style="margin: 60px 0;">
                    <p style="font-size: 24px; margin: 10px 0;"><strong>${lead.name}</strong></p>
                    <p style="font-size: 20px; margin: 10px 0;">${lead.company}</p>
                    <p style="font-size: 18px; margin: 10px 0; opacity: 0.9;">${date}</p>
                </div>
                <div style="margin-top: 80px;">
                    <p style="font-size: 16px; opacity: 0.8;">Prepared by</p>
                    <p style="font-size: 20px; font-weight: 600;">Upstate AI</p>
                </div>
            </div>
        </div>

        <!-- PAGE 2: RESULTS -->
        <div style="page-break-after: always; padding: 40px;">
            <h2 style="color: #00214E; font-size: 32px; margin-bottom: 30px; border-bottom: 3px solid #FF6B00; padding-bottom: 10px;">Your Results</h2>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 12px; margin-bottom: 30px; border-left: 6px solid #FF6B00;">
                <h3 style="color: #00214E; font-size: 28px; margin: 0 0 10px 0;">Readiness Tier: ${scores.tier.name}</h3>
                <p style="font-size: 48px; font-weight: bold; color: #FF6B00; margin: 10px 0;">Score: ${scores.totalScore}/60</p>
                <p style="font-size: 18px; color: #666; margin: 10px 0 0 0;">${scores.tier.summary}</p>
            </div>

            <h3 style="color: #00214E; font-size: 24px; margin: 30px 0 20px 0;">Dimension Breakdown</h3>
            ${buildDimensionHTML(scores)}
        </div>

        <!-- PAGE 3: RECOMMENDATIONS -->
        <div style="page-break-after: always; padding: 40px;">
            <h2 style="color: #00214E; font-size: 32px; margin-bottom: 30px; border-bottom: 3px solid #FF6B00; padding-bottom: 10px;">Recommendations</h2>
            
            ${buildRecommendationsHTML(scores)}
            
            <div style="background: #fff3e0; padding: 25px; border-radius: 12px; margin-top: 30px; border-left: 6px solid #FF6B00;">
                <h3 style="color: #00214E; font-size: 22px; margin: 0 0 15px 0;">Recommended Next Step</h3>
                <p style="font-size: 24px; font-weight: 600; color: #FF6B00; margin: 10px 0;">${scores.tier.service}</p>
                <p style="font-size: 18px; color: #666; margin: 10px 0;">Investment: ${scores.tier.servicePrice}</p>
            </div>
        </div>

        <!-- PAGE 4: ABOUT UPSTATE AI -->
        <div style="padding: 40px;">
            <h2 style="color: #00214E; font-size: 32px; margin-bottom: 30px; border-bottom: 3px solid #FF6B00; padding-bottom: 10px;">About Upstate AI</h2>
            
            <p style="font-size: 18px; line-height: 1.8; margin-bottom: 25px;">
                Upstate AI helps Central New York businesses turn AI from hype into practical advantage. 
                Led by a Syracuse University AI professor, we deliver education-first consulting that makes 
                sense for manufacturers, professional services, and regional enterprises.
            </p>

            <h3 style="color: #00214E; font-size: 24px; margin: 30px 0 20px 0;">Our Services</h3>
            ${buildServicesHTML()}

            <div style="margin-top: 50px; padding-top: 30px; border-top: 2px solid #e0e0e0;">
                <h3 style="color: #00214E; font-size: 22px; margin-bottom: 20px;">Ready to take the next step?</h3>
                <p style="font-size: 18px; margin: 15px 0;"><strong>Email:</strong> ben@up-state-ai.com</p>
                <p style="font-size: 18px; margin: 15px 0;"><strong>Web:</strong> up-state-ai.com</p>
                <p style="font-size: 18px; margin: 15px 0;"><strong>Schedule:</strong> calendar.app.google/agt6Z3KTJhGXjyNE9</p>
            </div>
        </div>

    </div>
    `;
    }

    function buildDimensionHTML(scores) {
        var html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';
        for (var dim in scores.dimensionScores) {
            var score = scores.dimensionScores[dim];
            var percentage = (score / 10) * 100;
            html += `
            <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #e0e0e0;">
                <h4 style="color: #00214E; font-size: 18px; margin: 0 0 15px 0;">${dim}</h4>
                <div style="background: #e0e0e0; height: 12px; border-radius: 6px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #FF6B00, #FF8C42); height: 100%; width: ${percentage}%;"></div>
                </div>
                <p style="font-size: 16px; font-weight: 600; color: #FF6B00; margin: 8px 0 0 0;">${score}/10</p>
            </div>
        `;
        }
        html += '</div>';
        return html;
    }

    function buildRecommendationsHTML(scores) {
        var recs = scores.tier.actions || [];
        var html = '<div style="margin-bottom: 30px;">';
        recs.forEach(function(rec, idx) {
            html += `
            <div style="margin-bottom: 25px; padding-left: 30px; position: relative;">
                <div style="position: absolute; left: 0; top: 0; width: 24px; height: 24px; background: #FF6B00; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold;">${idx + 1}</div>
                <h4 style="color: #00214E; font-size: 18px; margin: 0 0 10px 0;">${rec}</h4>
            </div>
        `;
        });
        html += '</div>';
        return html;
    }

    function buildServicesHTML() {
        var services = [
            { name: 'AI Readiness Workshop', price: '$2,000', desc: 'Half-day session for leadership teams' },
            { name: 'Fractional AI Strategy', price: '$5,000/month', desc: 'Ongoing guidance and planning' },
            { name: 'Custom AI Implementation', price: '$15,000+', desc: 'Build and deploy AI solutions' },
            { name: 'Advisory Retainer', price: '$8,000/month', desc: 'Continuous optimization support' }
        ];
        
        var html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';
        services.forEach(function(svc) {
            html += `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h4 style="color: #00214E; font-size: 18px; margin: 0 0 8px 0;">${svc.name}</h4>
                <p style="font-size: 20px; font-weight: 600; color: #FF6B00; margin: 8px 0;">${svc.price}</p>
                <p style="font-size: 14px; color: #666; margin: 8px 0 0 0;">${svc.desc}</p>
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

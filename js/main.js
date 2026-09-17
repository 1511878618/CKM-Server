// ========== Navbar Interaction ==========
(function () {
    var navbar = document.getElementById('navbar');
    var navToggle = document.getElementById('navToggle');
    var navMenu = document.getElementById('navMenu');
    var backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', function () {
        var scrollY = window.scrollY;

        if (scrollY > 10) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        if (scrollY > 600) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    navToggle.addEventListener('click', function () {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    var links = document.querySelectorAll('.nav-link');
    for (var i = 0; i < links.length; i++) {
        links[i].addEventListener('click', function () {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    }

    backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

// ========== CKM Risk Calculator ==========
(function () {
    var calcBtn = document.getElementById('calcBtn');
    var resultPlaceholder = document.getElementById('resultPlaceholder');
    var resultContent = document.getElementById('resultContent');
    var scoreNumber = document.getElementById('scoreNumber');
    var scoreArc = document.getElementById('scoreArc');
    var riskTag = document.getElementById('riskTag');
    var riskDesc = document.getElementById('riskDesc');
    var scoreBreakdown = document.getElementById('scoreBreakdown');

    // Arc circumference (r=85)
    var arcLength = 2 * Math.PI * 85;

    // ========== Model Beta Coefficients ==========
    // Logistic regression: P = 1 / (1 + e^(-Z))
    // Z = intercept + beta1*CHARGE_AF + beta2*PREVENT_CVD + beta3*Age + beta4*Sex(M) + beta5*CKM_PRS
    var BETA = {
        intercept:   -10.85506349716549,
        charge_af:    0.7743321446471507,
        prevent_cvd:   0.04304093534997996,
        age:         -0.011240830356378,
        sex_male:     0.206213069280796,
        ckm_prs:      1.0
    };

    calcBtn.addEventListener('click', function () {
        // Read inputs
        var chargeAF  = parseFloat(document.getElementById('charge_af').value);
        var preventCVD = parseFloat(document.getElementById('prevent_cvd').value);
        var age       = parseFloat(document.getElementById('age').value);
        var sexMale   = parseInt(document.querySelector('input[name="sex"]:checked').value);
        var ckmPRS    = parseFloat(document.getElementById('ckm_prs').value);

        // Validation
        var missing = [];
        if (isNaN(chargeAF))  missing.push('CHARGE-AF');
        if (isNaN(preventCVD)) missing.push('PREVENT-CVD');
        if (isNaN(age))       missing.push('Age');
        if (isNaN(ckmPRS))    missing.push('CKM PRS');

        if (missing.length > 0) {
            alert('Please fill in all required fields: ' + missing.join(', '));
            return;
        }

        // Range validation
        if (chargeAF < 0 || chargeAF > 100) {
            alert('CHARGE-AF must be between 0 and 100%.');
            return;
        }
        if (preventCVD < 0 || preventCVD > 100) {
            alert('PREVENT-CVD must be between 0 and 100%.');
            return;
        }

        // ========== Logistic Regression Calculation ==========
        // Z = intercept + beta_CHARGE_AF * CHARGE_AF(%) + beta_PREVENT_CVD * PREVENT_CVD(%)
        //     + beta_Age * Age + beta_Sex * Sex(M) + beta_PRS * CKM_PRS
        var z = BETA.intercept
              + BETA.charge_af  * chargeAF
              + BETA.prevent_cvd * preventCVD
              + BETA.age         * age
              + BETA.sex_male    * sexMale
              + BETA.ckm_prs     * ckmPRS;

        // Probability of progressing to CKM Stage 4
        var probability = 1 / (1 + Math.exp(-z));

        // Convert to percentage, clamp to [0, 100]
        var riskPercent = Math.round(probability * 1000) / 10; // 1 decimal place
        if (riskPercent < 0) riskPercent = 0;
        if (riskPercent > 100) riskPercent = 100;

        // Individual variable contributions to Z
        var contribChargeAF  = BETA.charge_af * chargeAF;
        var contribPrevent   = BETA.prevent_cvd * preventCVD;
        var contribAge       = BETA.age * age;
        var contribSex       = BETA.sex_male * sexMale;
        var contribPRS       = BETA.ckm_prs * ckmPRS;

        var breakdown = [
            { label: 'Intercept',         value: BETA.intercept.toFixed(4),          raw: BETA.intercept },
            { label: 'CHARGE-AF (' + chargeAF + '%)',    value: '+' + contribChargeAF.toFixed(4),  raw: contribChargeAF },
            { label: 'PREVENT-CVD (' + preventCVD + '%)', value: '+' + contribPrevent.toFixed(4),   raw: contribPrevent },
            { label: 'Age (' + age + ' yrs)',             value: contribAge.toFixed(4),              raw: contribAge },
            { label: 'Sex (' + (sexMale ? 'M' : 'F') + ')',          value: '+' + contribSex.toFixed(4),       raw: contribSex },
            { label: 'CKM PRS (' + ckmPRS + ')',          value: '+' + contribPRS.toFixed(4),        raw: contribPRS },
            { label: 'Linear Predictor (Z)',  value: z.toFixed(4),                      raw: z, isTotal: true }
        ];

        // Risk stratification
        var riskLevel, riskClass, riskText;
        if (riskPercent >= 40) {
            riskLevel = 'Very High Risk';
            riskClass = 'risk-very-high';
            riskText = 'Substantially elevated risk of progression to CKM Stage 4. Comprehensive intervention is strongly recommended.';
        } else if (riskPercent >= 20) {
            riskLevel = 'High Risk';
            riskClass = 'risk-high';
            riskText = 'Significantly elevated CKM Stage 4 progression risk. Prompt clinical evaluation and targeted intervention are advised.';
        } else if (riskPercent >= 5) {
            riskLevel = 'Moderate Risk';
            riskClass = 'risk-moderate';
            riskText = 'Moderate risk of CKM Stage 4 progression. Address modifiable factors and schedule regular follow-up.';
        } else {
            riskLevel = 'Low Risk';
            riskClass = 'risk-low';
            riskText = 'Low current risk of CKM Stage 4 progression. Maintain healthy lifestyle and periodic screening.';
        }

        // Show results
        resultPlaceholder.style.display = 'none';
        resultContent.style.display = 'block';

        // Animate number
        animateNumber(scoreNumber, 0, riskPercent, 1000, 1);

        // Animate arc (as percentage of 100)
        var offset = arcLength - (arcLength * riskPercent) / 100;
        scoreArc.style.transition = 'stroke-dashoffset 1s ease, stroke 0.5s ease';
        scoreArc.style.strokeDashoffset = offset;

        // Arc color by risk level
        var arcColor;
        if (riskPercent >= 40) arcColor = '#B91C1C';
        else if (riskPercent >= 20) arcColor = '#EF4444';
        else if (riskPercent >= 5) arcColor = '#F59E0B';
        else arcColor = '#22C55E';
        scoreArc.style.stroke = arcColor;

        // Risk tag
        riskTag.textContent = riskLevel;
        riskTag.className = 'risk-tag ' + riskClass;
        riskDesc.textContent = riskText;

        // Breakdown
        scoreBreakdown.innerHTML = '';
        breakdown.forEach(function (item) {
            var div = document.createElement('div');
            div.className = 'breakdown-item' + (item.isTotal ? ' breakdown-total' : '');
            div.innerHTML =
                '<span class="breakdown-label">' + item.label + '</span>' +
                '<span class="breakdown-value">' + item.value + '</span>';
            scoreBreakdown.appendChild(div);
        });
    });

    // Number animation with decimal support
    function animateNumber(el, from, to, duration, decimals) {
        decimals = decimals || 0;
        var factor = Math.pow(10, decimals);
        var start = performance.now();
        function step(now) {
            var progress = Math.min((now - start) / duration, 1);
            var current = (from + (to - from) * progress) * factor;
            current = Math.round(current) / factor;
            el.textContent = current.toFixed(decimals);
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }
        requestAnimationFrame(step);
    }
})();

// ========== Scroll Reveal Animation ==========
(function () {
    var observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    var sections = document.querySelectorAll('.overview-card, .stage-item, .ref-item, .feature-item, .equation-card');
    sections.forEach(function (el) {
        observer.observe(el);
    });
})();

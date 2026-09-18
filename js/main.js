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
    var formInfoText = document.getElementById('formInfoText');

    // Arc circumference (r=85)
    var arcLength = 2 * Math.PI * 85;

    // ========== Model Beta Coefficients ==========
    var BETA = {
        intercept:   -10.81367515060014,
        charge_af:    0.7742017876300019,
        prevent_cvd:  0.04370703458308663,
        age:         -0.0116590343488802,
        sex_male:     0.20232980122504,
        ckm_prs:      1.0
    };

    // ========== CHARGE-AF Sub-calculator ==========
    // Formula: Risk = 1 - S0^exp(lp - mean)
    // S0(5yr) = 0.9718412736, mean = 12.5815600
    // Source: Alonso A, et al. J Am Heart Assoc. 2013 (ARIC study)
    var CHARGE_AF = {
        S0_5: 0.9718412736,
        mean: 12.5815600,
        betas: {
            age5:           0.5083,    // per 5 years
            white:          0.46491,
            height10:       0.2478,    // per 10 cm
            weight15:       0.1155,    // per 15 kg
            sbp20:          0.1972,    // per 20 mmHg
            dbp10:         -0.1013,    // per 10 mmHg
            smoker:         0.35931,
            antihyp:        0.34889,
            diabetes:       0.23666,
            hf:             0.70127,
            mi:             0.49659
        }
    };

    function calcCHARGE_AF() {
        var age      = parseFloat(document.getElementById('age').value) || 0;
        var white    = parseInt(document.querySelector('input[name="comp_race"]:checked').value);
        var height   = parseFloat(document.getElementById('comp_height').value) || 0;
        var weight   = parseFloat(document.getElementById('comp_weight').value) || 0;
        var sbp      = parseFloat(document.getElementById('comp_sbp').value) || 0;
        var dbp      = parseFloat(document.getElementById('comp_dbp').value) || 0;
        var smoker   = parseInt(document.querySelector('input[name="comp_smoke"]:checked').value);
        var antihyp  = parseInt(document.querySelector('input[name="comp_htnmeds"]:checked').value);
        var dm       = parseInt(document.querySelector('input[name="comp_dm"]:checked').value);
        var hf       = parseInt(document.querySelector('input[name="comp_hf"]:checked').value);
        var mi       = parseInt(document.querySelector('input[name="comp_mi"]:checked').value);

        var b = CHARGE_AF.betas;
        var lp = b.age5      * (age / 5)
               + b.white     * white
               + b.height10  * (height / 10)
               + b.weight15  * (weight / 15)
               + b.sbp20     * (sbp / 20)
               + b.dbp10     * (dbp / 10)
               + b.smoker    * smoker
               + b.antihyp   * antihyp
               + b.diabetes  * dm
               + b.hf        * hf
               + b.mi        * mi;

        var risk = 1 - Math.pow(CHARGE_AF.S0_5, Math.exp(lp - CHARGE_AF.mean));
        var pct = Math.round(risk * 10000) / 100;
        if (pct < 0) pct = 0;
        if (pct > 100) pct = 100;
        return pct;
    }

    // ========== PREVENT-CVD Sub-calculator ==========
    // AHA PREVENT 10-year Total CVD risk equation (Table S24, Khan SS et al. Circulation 2024).
    // TC and HDL must be in mmol/L; HTML inputs are mg/dL so we convert (1 mg/dL = 0.02586 mmol/L).
    var PREVENT_CVD = {
        F: {
            bias: -3.307728,
            coef: {
                age_c: 0.7939329,
                tc_hdl_c: 0.0305239,
                hdl_c: -0.1606857,
                sbp_low: -0.2394003,
                sbp_high: 0.360078,
                diabetes: 0.8667604,
                smoker: 0.5360739,
                egfr_low: 0.6045917,
                egfr_high: 0.0433769,
                anti_htn: 0.3151672,
                statin: -0.1477655,
                anti_htn_x_sbp_high: -0.0663612,
                statin_x_tc_hdl_c: 0.1197879,
                age_x_tc_hdl_c: -0.0819715,
                age_x_hdl_c: 0.0306769,
                age_x_sbp_high: -0.0946348,
                age_x_diabetes: -0.27057,
                age_x_smoker: -0.078715,
                age_x_egfr_low: -0.1637806
            }
        },
        M: {
            bias: -3.031168,
            coef: {
                age_c: 0.7688528,
                tc_hdl_c: 0.0736174,
                hdl_c: -0.0954431,
                sbp_low: -0.4347345,
                sbp_high: 0.3362658,
                diabetes: 0.7692857,
                smoker: 0.4386871,
                egfr_low: 0.5378979,
                egfr_high: 0.0164827,
                anti_htn: 0.288879,
                statin: -0.1337349,
                anti_htn_x_sbp_high: -0.0475924,
                statin_x_tc_hdl_c: 0.150273,
                age_x_tc_hdl_c: -0.0517874,
                age_x_hdl_c: 0.0191169,
                age_x_sbp_high: -0.1049477,
                age_x_diabetes: -0.2251948,
                age_x_smoker: -0.0895067,
                age_x_egfr_low: -0.1543702
            }
        }
    };

    function calcPREVENT_CVD() {
        var age     = parseFloat(document.getElementById('age').value) || 0;
        var sexM    = parseInt(document.querySelector('input[name="sex"]:checked').value);
        var tc      = parseFloat(document.getElementById('comp_tc').value) || 0;
        var hdl     = parseFloat(document.getElementById('comp_hdl').value) || 0;
        var sbp     = parseFloat(document.getElementById('comp_sbp').value) || 0;
        var egfr    = parseFloat(document.getElementById('comp_egfr').value) || 0;
        var dm      = parseInt(document.querySelector('input[name="comp_dm"]:checked').value);
        var smoke   = parseInt(document.querySelector('input[name="comp_smoke"]:checked').value);
        var htnmeds = parseInt(document.querySelector('input[name="comp_htnmeds"]:checked').value);
        var statin  = parseInt(document.querySelector('input[name="comp_statin"]:checked').value);

        // Convert mg/dL -> mmol/L (PREVENT equation uses mmol/L)
        var tc_mmol   = tc * 0.02586;
        var hdl_mmol  = hdl * 0.02586;
        var non_hdl   = tc_mmol - hdl_mmol;

        // Feature engineering (exactly as in Table S24)
        var age_c   = (age - 55) / 10;
        var tc_hdl  = non_hdl - 3.5;
        var hdl_c   = (hdl_mmol - 1.3) / 0.3;
        var sbp_lo  = (Math.min(sbp, 110) - 110) / 20;
        var sbp_hi  = (Math.max(sbp, 110) - 130) / 20;
        var egfr_lo = (Math.min(egfr, 60) - 60) / -15;
        var egfr_hi = (Math.max(egfr, 60) - 90) / -15;

        // Interactions
        var anti_htn_x_sbp_hi = htnmeds * sbp_hi;
        var statin_x_tc_hdl   = statin * tc_hdl;
        var age_x_tc_hdl      = age_c * tc_hdl;
        var age_x_hdl         = age_c * hdl_c;
        var age_x_sbp_hi      = age_c * sbp_hi;
        var age_x_dm          = age_c * dm;
        var age_x_smoke       = age_c * smoke;
        var age_x_egfr_lo     = age_c * egfr_lo;

        var c = PREVENT_CVD[sexM ? 'M' : 'F'].coef;
        var bias = PREVENT_CVD[sexM ? 'M' : 'F'].bias;

        var logOR = bias
            + c.age_c           * age_c
            + c.tc_hdl_c         * tc_hdl
            + c.hdl_c            * hdl_c
            + c.sbp_low          * sbp_lo
            + c.sbp_high         * sbp_hi
            + c.diabetes         * dm
            + c.smoker           * smoke
            + c.egfr_low        * egfr_lo
            + c.egfr_high       * egfr_hi
            + c.anti_htn         * htnmeds
            + c.statin           * statin
            + c.anti_htn_x_sbp_high * anti_htn_x_sbp_hi
            + c.statin_x_tc_hdl_c   * statin_x_tc_hdl
            + c.age_x_tc_hdl_c      * age_x_tc_hdl
            + c.age_x_hdl_c         * age_x_hdl
            + c.age_x_sbp_high       * age_x_sbp_hi
            + c.age_x_diabetes       * age_x_dm
            + c.age_x_smoker         * age_x_smoke
            + c.age_x_egfr_low       * age_x_egfr_lo;

        // logOR -> risk percent
        var riskPct = 100.0 * Math.exp(logOR) / (1.0 + Math.exp(logOR));
        if (riskPct < 0) riskPct = 0;
        if (riskPct > 100) riskPct = 100;
        return Math.round(riskPct * 100) / 100;
    }

    // ========== Tab Switching ==========
    var tabDirect = document.getElementById('tabDirect');
    var tabCalc   = document.getElementById('tabCalc');
    var panelDirect = document.getElementById('panelDirect');
    var panelCalc   = document.getElementById('panelCalc');
    var currentMode = 'direct';

    function switchMode(mode) {
        currentMode = mode;
        if (mode === 'direct') {
            tabDirect.classList.add('active');
            tabCalc.classList.remove('active');
            panelDirect.style.display = 'block';
            panelCalc.style.display = 'none';
            formInfoText.innerHTML = 'CHARGE-AF and PREVENT-CVD are expressed as percentages (0-100). CKM PRS is a continuous score (typically near 1.0). See <a href="#variables" style="color:var(--color-primary);font-weight:600;">Variable Definitions</a> for details.';
        } else {
            tabCalc.classList.add('active');
            tabDirect.classList.remove('active');
            panelCalc.style.display = 'block';
            panelDirect.style.display = 'none';
            formInfoText.innerHTML = 'Enter all clinical variables below. CHARGE-AF and PREVENT-CVD will be auto-calculated from these components using published equations.';
            updateSubCalcResults();
        }
    }

    tabDirect.addEventListener('click', function () { switchMode('direct'); });
    tabCalc.addEventListener('click', function () { switchMode('calc'); });

    // Live-update sub-calculator results when in calc mode
    var cafValueEl = document.getElementById('cafValue');
    var pvValueEl  = document.getElementById('pvValue');

    function updateSubCalcResults() {
        cafValueEl.textContent = calcCHARGE_AF().toFixed(2);
        pvValueEl.textContent  = calcPREVENT_CVD().toFixed(2);
    }

    // Listen for changes in sub-calc inputs + shared age/sex inputs
    var subCalcInputs = document.querySelectorAll('#panelCalc input');
    var sharedAgeEl = document.getElementById('age');
    var sharedSexInputs = document.querySelectorAll('input[name="sex"]');
    subCalcInputs.forEach(function (el) {
        el.addEventListener('input', updateSubCalcResults);
        el.addEventListener('change', updateSubCalcResults);
    });
    sharedAgeEl.addEventListener('input', updateSubCalcResults);
    sharedAgeEl.addEventListener('change', updateSubCalcResults);
    sharedSexInputs.forEach(function (el) {
        el.addEventListener('change', updateSubCalcResults);
    });

    // ========== Main Calculate Button ==========
    calcBtn.addEventListener('click', function () {
        // Get CHARGE-AF and PREVENT-CVD based on mode
        var chargeAF, preventCVD;

        if (currentMode === 'calc') {
            // Recalculate from components
            chargeAF  = calcCHARGE_AF();
            preventCVD = calcPREVENT_CVD();
        } else {
            // Read directly from inputs
            chargeAF  = parseFloat(document.getElementById('charge_af').value);
            preventCVD = parseFloat(document.getElementById('prevent_cvd').value);
        }

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

        if (chargeAF < 0 || chargeAF > 100) {
            alert('CHARGE-AF must be between 0 and 100%.');
            return;
        }
        if (preventCVD < 0 || preventCVD > 100) {
            alert('PREVENT-CVD must be between 0 and 100%.');
            return;
        }

        // ========== Logistic Regression Calculation ==========
        var z = BETA.intercept
              + BETA.charge_af  * chargeAF
              + BETA.prevent_cvd * preventCVD
              + BETA.age         * age
              + BETA.sex_male    * sexMale
              + BETA.ckm_prs     * ckmPRS;

        var probability = 1 / (1 + Math.exp(-z));

        var riskPercent = Math.round(probability * 1000) / 10;
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
            { label: 'CHARGE-AF (' + chargeAF.toFixed(2) + '%)',    value: '+' + contribChargeAF.toFixed(4),  raw: contribChargeAF },
            { label: 'PREVENT-CVD (' + preventCVD.toFixed(2) + '%)', value: '+' + contribPrevent.toFixed(4),   raw: contribPrevent },
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

        animateNumber(scoreNumber, 0, riskPercent, 1000, 1);

        var offset = arcLength - (arcLength * riskPercent) / 100;
        scoreArc.style.transition = 'stroke-dashoffset 1s ease, stroke 0.5s ease';
        scoreArc.style.strokeDashoffset = offset;

        var arcColor;
        if (riskPercent >= 40) arcColor = '#B91C1C';
        else if (riskPercent >= 20) arcColor = '#EF4444';
        else if (riskPercent >= 5) arcColor = '#F59E0B';
        else arcColor = '#22C55E';
        scoreArc.style.stroke = arcColor;

        riskTag.textContent = riskLevel;
        riskTag.className = 'risk-tag ' + riskClass;
        riskDesc.textContent = riskText;

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

    var sections = document.querySelectorAll('.overview-card, .stage-item, .ref-item, .feature-item, .equation-card, .var-card, .validation-card, .threshold-card');
    sections.forEach(function (el) {
        observer.observe(el);
    });
})();

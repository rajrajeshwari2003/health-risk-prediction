const API_URL = "http://localhost:8000/predict/";

// ================================================
// FAMILY PROFILE SYSTEM
// ================================================

const FAMILY_KEY = 'vitalscan_family';
const ACTIVE_KEY = 'vitalscan_active_profile';

function generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function getRelationEmoji(relation) {
    const map = {
        'Father': '👨', 'Mother': '👩', 'Son': '👦', 'Daughter': '👧',
        'Grandpa': '👴', 'Grandma': '👵', 'Self': '🧑', 'Other': '👤'
    };
    return map[relation] || '👤';
}

function loadFamily() {
    let family = JSON.parse(localStorage.getItem(FAMILY_KEY));
    if (!family || family.length === 0) {
        // Default: create a "Self" profile on first load
        family = [{
            id: generateId(),
            name: 'Self',
            relation: 'Self',
            emoji: '🧑',
            history: []
        }];
        saveFamily(family);
    }
    return family;
}

function saveFamily(family) {
    localStorage.setItem(FAMILY_KEY, JSON.stringify(family));
}

function getActiveProfileId() {
    let family = loadFamily();
    let id = localStorage.getItem(ACTIVE_KEY);
    if (!id || !family.find(p => p.id === id)) {
        id = family[0].id;
        localStorage.setItem(ACTIVE_KEY, id);
    }
    return id;
}

function getActiveProfile() {
    let family = loadFamily();
    let id = getActiveProfileId();
    return family.find(p => p.id === id) || family[0];
}

function switchProfile(profileId) {
    localStorage.setItem(ACTIVE_KEY, profileId);
    renderProfileBar();
    // Refresh active pages
    if (document.getElementById('page-history').style.display === 'block') renderHistory();
    if (document.getElementById('page-stats').style.display === 'block') renderCharts();
}

function renderProfileBar() {
    const family = loadFamily();
    const activeId = getActiveProfileId();
    const container = document.getElementById('profile-cards');
    container.innerHTML = '';

    family.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'profile-card' + (profile.id === activeId ? ' active-profile' : '');
        card.title = `Switch to ${profile.name} (${profile.relation})`;
        card.innerHTML = `
            <span class="profile-card-emoji">${profile.emoji}</span>
            <span>${profile.name}</span>
            ${family.length > 1 ? `<button class="profile-card-delete" onclick="deleteProfile(event, '${profile.id}')" title="Remove">✕</button>` : ''}
        `;
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('profile-card-delete')) {
                switchProfile(profile.id);
            }
        });
        container.appendChild(card);
    });
}

// ---- Add Member Modal ----
let selectedEmoji = '👨';

function openAddMemberModal() {
    document.getElementById('m_name').value = '';
    document.getElementById('m_relation').value = 'Father';
    selectedEmoji = '👨';
    document.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
    document.querySelector('.emoji-opt').classList.add('selected');
    document.getElementById('add-member-modal').classList.add('open');
    setTimeout(() => document.getElementById('m_name').focus(), 100);
}

function closeAddMemberModal(event) {
    if (event && event.target !== document.getElementById('add-member-modal')) return;
    document.getElementById('add-member-modal').classList.remove('open');
}

function selectEmoji(el, emoji) {
    selectedEmoji = emoji;
    document.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
}

function addFamilyMember() {
    const name = document.getElementById('m_name').value.trim();
    const relation = document.getElementById('m_relation').value;

    if (!name) {
        document.getElementById('m_name').focus();
        document.getElementById('m_name').style.borderColor = '#f87171';
        setTimeout(() => document.getElementById('m_name').style.borderColor = '', 1500);
        return;
    }

    const family = loadFamily();
    const newProfile = {
        id: generateId(),
        name: name,
        relation: relation,
        emoji: selectedEmoji,
        history: []
    };

    family.push(newProfile);
    saveFamily(family);
    switchProfile(newProfile.id);
    document.getElementById('add-member-modal').classList.remove('open');
}

function deleteProfile(event, profileId) {
    event.stopPropagation();
    let family = loadFamily();
    if (family.length <= 1) return;
    
    const profile = family.find(p => p.id === profileId);
    if (!confirm(`Remove ${profile?.name || 'this member'} from family profiles?`)) return;
    
    family = family.filter(p => p.id !== profileId);
    saveFamily(family);
    
    if (getActiveProfileId() === profileId) {
        localStorage.setItem(ACTIVE_KEY, family[0].id);
    }
    
    renderProfileBar();
    renderHistory();
}

// ================================================
// DEMO HISTORY - scoped to first profile
// ================================================
function injectDemoHistory() {
    let family = loadFamily();
    if (family[0].history.length === 0) {
        family[0].history = [
            {date: new Date().toLocaleDateString(), name: 'Demo Patient A', disease: 'Cardiovascular Profile', riskLevel: 'High Risk', confidence: 85},
            {date: new Date().toLocaleDateString(), name: 'Demo Patient B', disease: 'Diabetes Pathway', riskLevel: 'Moderate Risk', confidence: 45},
            {date: new Date().toLocaleDateString(), name: 'Demo Patient C', disease: 'Renal Function', riskLevel: 'Low Risk', confidence: 12},
            {date: new Date().toLocaleDateString(), name: 'Demo Patient D', disease: 'Cardiovascular Profile', riskLevel: 'Low Risk', confidence: 5},
            {date: new Date().toLocaleDateString(), name: 'Demo Patient E', disease: 'Cardiovascular Profile', riskLevel: 'Moderate Risk', confidence: 60},
            {date: new Date().toLocaleDateString(), name: 'Demo Patient F', disease: 'Diabetes Pathway', riskLevel: 'High Risk', confidence: 92},
        ];
        saveFamily(family);
    }
}

// Run once on load
injectDemoHistory();
renderProfileBar();
// Landing page is default — hide profile bar until user enters app
document.getElementById('profile-bar').style.display = 'none';

// ================================================
// SPA ROUTING
// ================================================
function navigateTo(pageId) {
    const pages = document.getElementsByClassName("page-section");
    for (let i = 0; i < pages.length; i++) {
        pages[i].style.display = "none";
    }
    
    const navs = document.getElementsByClassName("nav-btn");
    for (let i = 0; i < navs.length; i++) {
        navs[i].classList.remove("active");
    }

    document.getElementById(pageId).style.display = "block";
    
    // Hide profile bar and sidebar nav highlight on landing
    const profileBar = document.getElementById('profile-bar');
    if (pageId === 'page-landing') {
        profileBar.style.display = 'none';
    } else {
        profileBar.style.display = 'flex';
        const activeBtn = Array.from(navs).find(btn => btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(pageId));
        if (activeBtn) activeBtn.classList.add("active");
    }

    if (pageId === 'page-history') renderHistory();
    if (pageId === 'page-stats') renderCharts();
}

// Landing page entry — goes to dashboard home
function enterApp() {
    navigateTo('page-home');
    // Activate Home nav button
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const homeBtn = document.getElementById('navbtn-home');
    if (homeBtn) homeBtn.classList.add('active');
}

function scrollToFeatures() {
    document.getElementById('landing-features').scrollIntoView({ behavior: 'smooth' });
}



// ================================================
// FORM TABS
// ================================================
function openFormTab(evt, tabId) {
    const tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    const tablinks = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabId).style.display = "block";
    evt.currentTarget.className += " active";
}

// ================================================
// PROFILE-SCOPED HISTORY STORAGE
// ================================================
function saveToHistory(record) {
    let family = loadFamily();
    const activeId = getActiveProfileId();
    const profile = family.find(p => p.id === activeId);
    if (!profile) return;
    
    if (!profile.history) profile.history = [];
    profile.history.unshift(record);
    saveFamily(family);
}

function clearHistory() {
    const profile = getActiveProfile();
    if (confirm(`Clear all history for ${profile.name}?`)) {
        let family = loadFamily();
        const activeId = getActiveProfileId();
        const p = family.find(f => f.id === activeId);
        if (p) p.history = [];
        saveFamily(family);
        renderHistory();
        renderCharts();
    }
}

function renderHistory() {
    const tbody = document.getElementById('history-body');
    const profile = getActiveProfile();
    const history = profile.history || [];
    
    if (history.length === 0) {
        tbody.innerHTML = `<tr><td colspan='5' style='text-align:center; color:#64879e; padding:30px;'>No history found for <b>${profile.emoji} ${profile.name}</b>. Run a scan first.</td></tr>`;
        return;
    }

    tbody.innerHTML = "";
    history.forEach(item => {
        let riskClass = item.riskLevel === "Low Risk" ? "low" : (item.riskLevel === "Moderate Risk" ? "mod" : "high");
        tbody.innerHTML += `
            <tr>
                <td>${item.date}</td>
                <td>${item.name || 'Anonymous'}</td>
                <td>${item.disease}</td>
                <td><span class="badge ${riskClass}">${item.riskLevel}</span></td>
                <td>${item.confidence}%</td>
            </tr>
        `;
    });
}

// ================================================
// API SUBMISSION
// ================================================
async function submitPrediction(e, type) {
    e.preventDefault();
    
    let payload = {};
    let patientName = document.getElementById(type === 'diabetes' ? 'd_name' : (type === 'heart' ? 'h_name' : 'k_name')).value || "Anonymous Patient";
    let endpoint = API_URL + type;
    let btn = document.getElementById('btn_' + type);
    const origText = btn.innerText;
    btn.innerText = "Analyzing Diagnostics...";
    btn.disabled = true;

    try {
        if (type === 'diabetes') {
            payload = {
                glucose: parseFloat(document.getElementById('d_glucose').value),
                bmi: parseFloat(document.getElementById('d_bmi').value),
                age: parseFloat(document.getElementById('d_age').value),
                insulin: parseFloat(document.getElementById('d_insulin').value)
            };
        } else if (type === 'heart') {
            payload = {
                age: parseFloat(document.getElementById('h_age').value),
                sex: document.getElementById('h_sex').value,
                chest_pain_type: document.getElementById('h_cp').value,
                resting_blood_pressure: parseFloat(document.getElementById('h_trestbps').value),
                cholestoral: parseFloat(document.getElementById('h_chol').value),
                fasting_blood_sugar: document.getElementById('h_fbs').value,
                rest_ecg: document.getElementById('h_restecg').value,
                max_heart_rate: parseFloat(document.getElementById('h_thalach').value),
                exercise_induced_angina: document.getElementById('h_exang').value,
                oldpeak: parseFloat(document.getElementById('h_oldpeak').value),
                slope: document.getElementById('h_slope').value,
                vessels_colored_by_flourosopy: document.getElementById('h_ca').value,
                thalassemia: document.getElementById('h_thal').value
            };
        } else if (type === 'kidney') {
            payload = {
                age: parseFloat(document.getElementById('k_age').value),
                bp: parseFloat(document.getElementById('k_bp').value),
                bgr: parseFloat(document.getElementById('k_bgr').value),
                bu: parseFloat(document.getElementById('k_bu').value),
                sc: parseFloat(document.getElementById('k_sc').value),
                hemo: parseFloat(document.getElementById('k_hemo').value)
            };
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        processResult(type, patientName, data);

    } catch (err) {
        alert("Error connecting to backend server. Make sure the backend is running.");
    } finally {
        btn.innerText = origText;
        btn.disabled = false;
    }
}

// ================================================
// RESULT DASHBOARD POPULATOR
// ================================================
function processResult(type, patientName, data) {
    const prob = (data.ensemble_probability * 100).toFixed(1);
    const lr_prob = (data.lr_probability * 100).toFixed(1);
    const rf_prob = (data.rf_probability * 100).toFixed(1);

    let color = "#4ade80";
    let risk_level = "Low Risk";
    let recommendations = "<li>Maintain current healthy lifestyle routines.</li><li>Schedule regular annual checkups.</li>";
    
    if (prob >= 70) {
        color = "#f87171";
        risk_level = "High Risk";
        recommendations = `
            <li>Schedule an appointment with a specialist immediately.</li>
            <li>Consider comprehensive lab blood panels for deeper insights.</li>
            <li>Implement strict dietary and activity controls based on physician advice.</li>
        `;
    } else if (prob >= 30) {
        color = "#facc15";
        risk_level = "Moderate Risk";
        recommendations = `
            <li>Monitor vital signs regularly over the next month.</li>
            <li>Reduce sodium and saturated fat intake.</li>
            <li>Consult a general practitioner for preventive measures.</li>
        `;
    }

    let properDiseaseName = type === 'diabetes' ? "Diabetes Pathway" : (type === 'heart' ? "Cardiovascular Profile" : "Renal Function");

    document.getElementById("report-date").innerText = new Date().toLocaleString();
    document.getElementById("r-name").innerText = patientName;
    document.getElementById("r-disease").innerText = properDiseaseName;
    
    let assessBox = document.getElementById("r-assessment-box");
    assessBox.style.borderColor = color;
    assessBox.style.boxShadow = `0 4px 30px ${color}33`;
    
    document.getElementById("r-risk-level").innerText = risk_level;
    document.getElementById("r-risk-level").style.color = color;
    document.getElementById("r-confidence").innerText = prob;
    document.getElementById("r-lr").innerText = lr_prob + "%";
    document.getElementById("r-rf").innerText = rf_prob + "%";
    document.getElementById("r-recs").innerHTML = recommendations;

    // Populate personalized risk reduction tips
    populateRiskReduction(type, risk_level);

    // Save to active profile's history
    saveToHistory({
        date: new Date().toLocaleDateString(),
        name: patientName,
        disease: properDiseaseName,
        riskLevel: risk_level,
        confidence: prob
    });

    document.getElementById("nav-result-btn").style.display = "block";
    navigateTo("page-result");
}

// ================================================
// PERSONALIZED RISK REDUCTION
// ================================================
function getRiskReductionTips(type, riskLevel) {
    const isHigh = riskLevel === 'High Risk';

    const tips = {
        diabetes: [
            { icon: '🥗', title: 'Diet', body: 'Focus on low-glycaemic foods: whole grains, legumes, vegetables. Reduce sugary drinks and refined carbs.' },
            { icon: '🚶', title: 'Exercise', body: 'A 30-minute brisk walk daily improves insulin sensitivity significantly within weeks.' },
            { icon: '📏', title: 'Monitor Weight', body: 'Losing 5–7% of body weight can slash diabetes risk by up to 58% (DPP study).' },
            { icon: '💧', title: 'Hydration', body: 'Drink 2–3L of water daily. Avoid fruit juices — opt for whole fruit instead for fibre.' },
            { icon: '🩺', title: 'Regular Tests', body: isHigh ? 'Test HbA1c every 3 months. Consult an endocrinologist immediately.' : 'Get a fasting glucose test every 6 months to track trends early.' },
            { icon: '😴', title: 'Sleep', body: 'Poor sleep raises cortisol and blood sugar. Aim for 7–8 hours of quality sleep nightly.' },
            { icon: '🧘', title: 'Stress Control', body: 'Chronic stress spikes cortisol which raises blood glucose. Practice meditation, yoga, or deep breathing daily.' },
            { icon: '🍱', title: 'Meal Timing', body: 'Eating smaller, balanced meals every 3–4 hours stabilises blood sugar better than large infrequent meals.' },
        ],
        heart: [
            { icon: '🧂', title: 'Reduce Salt', body: 'Limit sodium to under 2,000mg/day to control blood pressure and reduce cardiac strain.' },
            { icon: '🐟', title: 'Omega-3 Diet', body: 'Eat fatty fish (salmon, sardines) 2x/week. Omega-3s reduce triglycerides and inflammation.' },
            { icon: '🚴', title: 'Cardio Exercise', body: 'Aim for 150 min/week of moderate cardio. Even daily 20-min walks measurably improve heart health.' },
            { icon: '🚭', title: 'No Smoking', body: 'Smoking is the single biggest modifiable risk factor for heart disease. Quitting halves risk within a year.' },
            { icon: '🧘', title: 'Manage Stress', body: 'Chronic stress raises blood pressure. Try 10 mins of mindfulness or deep breathing daily.' },
            { icon: '🩺', title: 'Doctor Visit', body: isHigh ? 'Schedule a cardiology appointment urgently. Ask about ECG, stress test, and lipid panel.' : 'Get blood pressure and cholesterol checked every 6 months.' },
            { icon: '🍷', title: 'Limit Alcohol', body: 'Excessive alcohol raises blood pressure and weakens the heart muscle. Limit to 1 unit/day or less.' },
            { icon: '🌿', title: 'Healthy Weight', body: 'Each BMI unit above 25 increases heart disease risk. A 10% weight reduction meaningfully lowers BP and cholesterol.' },
        ],
        kidney: [
            { icon: '💧', title: 'Stay Hydrated', body: 'Drink 2–3L of water daily to flush sodium and toxins. Limit alcohol which dehydrates kidneys.' },
            { icon: '💊', title: 'Avoid NSAIDs', body: 'Limit ibuprofen, naproxen, and aspirin — their regular use significantly strains the kidneys.' },
            { icon: '🥩', title: 'Limit Protein', body: 'High-protein diets increase kidney workload. Choose moderate portions of lean protein sources.' },
            { icon: '🩸', title: 'Control BP & Sugar', body: 'High blood pressure and diabetes are the top two causes of CKD. Keep both tightly controlled.' },
            { icon: '🚭', title: 'No Smoking', body: 'Smoking accelerates CKD progression by reducing blood flow to the kidneys — stop immediately.' },
            { icon: '🩺', title: 'Lab Monitoring', body: isHigh ? 'Get eGFR, urine albumin, creatinine, and BUN tested urgently. See a nephrologist.' : 'Annual kidney function panel (eGFR + urine test) is essential for early detection.' },
            { icon: '🧘', title: 'Manage Stress', body: 'Stress hormones constrict blood vessels including those feeding the kidneys. Daily relaxation exercises help.' },
            { icon: '🥦', title: 'Reduce Phosphorus', body: 'Limit processed foods high in phosphate additives. Damaged kidneys struggle to filter excess phosphorus.' },
        ]
    };

    return tips[type] || [];
}

function populateRiskReduction(type, riskLevel) {
    const tips = getRiskReductionTips(type, riskLevel);
    const grid = document.getElementById('risk-reduction-grid');
    const intro = document.getElementById('risk-reduction-intro');
    const diseaseName = type === 'diabetes' ? 'Diabetes' : type === 'heart' ? 'Heart Disease' : 'Kidney Disease';

    const introMessages = {
        'Low Risk': `Great news — your risk is low! These habits will help you stay that way for ${diseaseName}.`,
        'Moderate Risk': `Your ${diseaseName} risk is moderate. The steps below can meaningfully reduce it if adopted consistently.`,
        'High Risk': `Your ${diseaseName} risk is high. Please consult a specialist soon, and start these lifestyle changes immediately.`
    };

    intro.textContent = introMessages[riskLevel] || '';
    grid.innerHTML = '';

    tips.forEach(tip => {
        const card = document.createElement('div');
        card.className = 'rr-tip-card';
        card.innerHTML = `
            <div class="rr-tip-icon">${tip.icon}</div>
            <div class="rr-tip-title">${tip.title}</div>
            <div class="rr-tip-body">${tip.body}</div>
        `;
        grid.appendChild(card);
    });
}

// ================================================
// PDF REPORT GENERATION
// ================================================
function downloadReport() {
    const element = document.getElementById('printable-report');
    element.classList.add("pdf-mode");
    
    let opt = {
      margin: 0.5,
      filename: `Health_Report_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.classList.remove("pdf-mode");
    });
}

// ================================================
// CHARTS (STATS DASHBOARD)
// ================================================
let chartInstances = {};

function configureChartDefaults() {
    const isLight = document.body.classList.contains('light-mode');
    Chart.defaults.color = isLight ? '#4b5563' : '#8fafc8';
    Chart.defaults.borderColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
}

function renderCharts() {
    configureChartDefaults();
    const profile = getActiveProfile();
    const history = profile.history || [];

    // 1. Model Accuracies Chart (Bar)
    const ctxAcc = document.getElementById('accuracyChart').getContext('2d');
    if (chartInstances.acc) chartInstances.acc.destroy();
    
    chartInstances.acc = new Chart(ctxAcc, {
        type: 'bar',
        data: {
            labels: ['Heart Disease', 'Diabetes', 'Kidney Disease'],
            datasets: [
                { label: 'Logistic Regression %', data: [82, 78, 88], backgroundColor: 'rgba(56, 189, 248, 0.7)', borderRadius: 6 },
                { label: 'Random Forest %', data: [87, 85, 95], backgroundColor: 'rgba(129, 140, 248, 0.7)', borderRadius: 6 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 50, max: 100 } } }
    });

    // 2. Risk Distribution Chart (Doughnut)
    const ctxRisk = document.getElementById('riskDistributionChart').getContext('2d');
    if (chartInstances.risk) chartInstances.risk.destroy();

    let counts = {low: 0, mod: 0, high: 0};
    history.forEach(i => {
        if (i.riskLevel === 'Low Risk') counts.low++;
        else if (i.riskLevel === 'Moderate Risk') counts.mod++;
        else counts.high++;
    });

    chartInstances.risk = new Chart(ctxRisk, {
        type: 'doughnut',
        data: {
            labels: ['Low Risk', 'Moderate Risk', 'High Risk'],
            datasets: [{ data: [counts.low || 1, counts.mod, counts.high], backgroundColor: ['#4ade80', '#facc15', '#f87171'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 3. Diagnosis Query Volume (Polar)
    const ctxPolar = document.getElementById('polarVolumeChart').getContext('2d');
    if (chartInstances.polar) chartInstances.polar.destroy();

    let vol = {heart: 0, diab: 0, kid: 0};
    history.forEach(i => {
        if (i.disease === 'Cardiovascular Profile') vol.heart++;
        else if (i.disease === 'Diabetes Pathway') vol.diab++;
        else vol.kid++;
    });

    chartInstances.polar = new Chart(ctxPolar, {
        type: 'polarArea',
        data: {
            labels: ['Heart Scans', 'Diabetes Scans', 'Kidney Scans'],
            datasets: [{ data: [vol.heart || 1, vol.diab || 1, vol.kid || 1], backgroundColor: ['rgba(248, 113, 113, 0.7)', 'rgba(56, 189, 248, 0.7)', 'rgba(250, 204, 21, 0.7)'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 4. Health Metric Distributions (Box Plot simulation with floating bars)
    const ctxBox = document.getElementById('boxPlotChart').getContext('2d');
    if (chartInstances.box) chartInstances.box.destroy();

    const isLightBox = document.body.classList.contains('light-mode');
    const boxLabels = ['Glucose', 'BMI', 'Blood Pressure', 'Heart Rate', 'Hemoglobin'];

    chartInstances.box = new Chart(ctxBox, {
        type: 'bar',
        data: {
            labels: boxLabels,
            datasets: [
                {
                    label: 'Lower Whisker (Min → Q1)',
                    data: [[22, 50], [27, 40], [20, 52], [35, 58], [20, 67]],
                    backgroundColor: 'rgba(56, 189, 248, 0.18)',
                    barPercentage: 0.18,
                    categoryPercentage: 0.9,
                    order: 2,
                },
                {
                    label: 'IQR Box (Q1 – Q3)',
                    data: [[50, 70], [40, 54], [52, 66], [58, 82], [67, 96]],
                    backgroundColor: 'rgba(56, 189, 248, 0.65)',
                    borderColor: 'rgba(56, 189, 248, 0.9)',
                    borderWidth: 1,
                    barPercentage: 0.52,
                    categoryPercentage: 0.9,
                    order: 2,
                },
                {
                    label: 'Upper Whisker (Q3 → Max)',
                    data: [[70, 100], [54, 100], [66, 100], [82, 100], [96, 100]],
                    backgroundColor: 'rgba(56, 189, 248, 0.18)',
                    barPercentage: 0.18,
                    categoryPercentage: 0.9,
                    order: 2,
                },
                {
                    label: 'Median',
                    data: [59, 48, 59, 76, 84],
                    type: 'scatter',
                    backgroundColor: isLightBox ? '#1a2332' : '#f0f4f8',
                    pointStyle: 'line',
                    pointRadius: 14,
                    pointBorderWidth: 2.5,
                    pointBorderColor: isLightBox ? '#1a2332' : '#f0f4f8',
                    showLine: false,
                    order: 1,
                },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => [
                            'Lower Whisker', 'IQR Box (Q1–Q3)', 'Upper Whisker', 'Median'
                        ][ctx.datasetIndex] + ': ' +
                        (Array.isArray(ctx.raw) ? ctx.raw[0] + '–' + ctx.raw[1] + '%' : ctx.raw + '%')
                    }
                }
            },
            scales: {
                y: {
                    min: 0, max: 100,
                    title: { display: true, text: 'Relative Percentile (% of max)' },
                    ticks: { callback: v => v + '%' }
                }
            }
        }
    });

    // 5. 30-Day Risk Trajectory (Line)
    const ctxLine = document.getElementById('lineTrajectoryChart').getContext('2d');
    if (chartInstances.line) chartInstances.line.destroy();
    
    let trendData = history.slice(0, 10).reverse().map(i => parseFloat(i.confidence));
    if (trendData.length < 3) trendData = [10, 15, 12, 30, 45, 60, 50, 70, 85, 90];

    chartInstances.line = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: trendData.map((_, i) => `Scan ${i + 1}`),
            datasets: [{
                label: 'Risk Progression (%)',
                data: trendData,
                fill: true,
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                borderColor: '#ef4444',
                tension: 0.4,
                pointBackgroundColor: '#ef4444',
                pointRadius: 4,
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 6. Age Correlates (Scatter)
    const ctxScatter = document.getElementById('scatterAgeChart').getContext('2d');
    if (chartInstances.scatter) chartInstances.scatter.destroy();

    chartInstances.scatter = new Chart(ctxScatter, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Age vs Risk Score',
                data: [
                    {x: 25, y: 10}, {x: 30, y: 15}, {x: 45, y: 40}, {x: 55, y: 70},
                    {x: 60, y: 65}, {x: 70, y: 85}, {x: 65, y: 90}, {x: 80, y: 95},
                    {x: 35, y: 5}, {x: 40, y: 25}, {x: 50, y: 35}, {x: 75, y: 80}
                ],
                backgroundColor: '#38bdf8',
                pointRadius: 6,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Age (Years)' } },
                y: { title: { display: true, text: 'Risk Score (%)' } }
            }
        }
    });
}

// ================================================
// THEME TOGGLE
// ================================================
function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('vitalscan_theme', isLight ? 'light' : 'dark');
    document.getElementById('theme-icon').innerText = isLight ? '🌙' : '☀️';
    document.getElementById('theme-btn').innerHTML = `<span id="theme-icon">${isLight ? '🌙' : '☀️'}</span> ${isLight ? 'Dark Mode' : 'Light Mode'}`;
    
    if (document.getElementById('page-stats').style.display === 'block') {
        renderCharts();
    }
}

// Apply saved theme on load
if (localStorage.getItem('vitalscan_theme') === 'light') {
    document.body.classList.add('light-mode');
    document.getElementById('theme-btn').innerHTML = `<span id="theme-icon">🌙</span> Dark Mode`;
}

// ================================================
// FLOATING CHATBOT BUBBLE ENGINE
// ================================================
let chatOpen = false;

function openChat() {
    chatOpen = true;
    const panel = document.getElementById('chat-panel');
    const bubble = document.getElementById('chat-bubble-btn');
    
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    // Trigger animation
    panel.classList.remove('chat-panel-closing', 'chat-panel-closed');
    panel.classList.add('chat-panel-open');
    bubble.style.display = 'none';
    
    // Scroll to bottom of messages
    setTimeout(() => {
        const msgs = document.getElementById('chat-messages');
        msgs.scrollTop = msgs.scrollHeight;
    }, 80);
}

function closeChat() {
    chatOpen = false;
    const panel = document.getElementById('chat-panel');
    const bubble = document.getElementById('chat-bubble-btn');
    
    panel.classList.remove('chat-panel-open');
    panel.classList.add('chat-panel-closing');
    
    setTimeout(() => {
        panel.style.display = 'none';
        panel.classList.remove('chat-panel-closing');
        bubble.style.display = 'flex';
    }, 220);
}

function handleChatEnter(e) {
    if (e.key === 'Enter') sendChatMessage();
}

// Send a chip question
function sendChip(question) {
    const inputField = document.getElementById('chat-input');
    inputField.value = question;
    sendChatMessage();
}

function sendChatMessage() {
    const inputField = document.getElementById('chat-input');
    const msg = inputField.value.trim();
    if (!msg) return;

    // Append User Message
    appendUserMessage(msg);
    inputField.value = '';

    // Auto-scroll
    const box = document.getElementById('chat-messages');
    box.scrollTop = box.scrollHeight;

    // Show typing animation
    const typingId = showTypingIndicator();

    // Generate Bot Reply after delay
    setTimeout(() => {
        removeTypingIndicator(typingId);
        const reply = getBotResponse(msg.toLowerCase());
        appendBotMessage(reply);
        box.scrollTop = box.scrollHeight;
    }, 900 + Math.random() * 400);
}

function appendUserMessage(text) {
    const box = document.getElementById('chat-messages');
    const wrap = document.createElement('div');
    wrap.className = 'user-msg-wrap';
    wrap.innerHTML = `
        <div class="user-msg">${escapeHtml(text)}</div>
        <div class="user-avatar-sm">👤</div>
    `;
    box.appendChild(wrap);
}

function appendBotMessage(html) {
    const box = document.getElementById('chat-messages');
    const wrap = document.createElement('div');
    wrap.className = 'bot-msg-wrap';
    wrap.style.animation = 'fadeIn 0.3s ease';
    wrap.innerHTML = `
        <div class="bot-avatar-sm">🤖</div>
        <div class="bot-msg">${html}</div>
    `;
    box.appendChild(wrap);
}

function showTypingIndicator() {
    const box = document.getElementById('chat-messages');
    const id = 'typing-' + Date.now();
    const wrap = document.createElement('div');
    wrap.className = 'typing-wrap';
    wrap.id = id;
    wrap.innerHTML = `
        <div class="bot-avatar-sm">🤖</div>
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    box.appendChild(wrap);
    box.scrollTop = box.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ================================================
// BOT RESPONSE ENGINE
// ================================================
function getBotResponse(input) {
    // --- Medical Term Definitions ---
    if (input.includes('asymptomatic'))
        return "🔹 <b>Asymptomatic</b> means a patient shows <b>no visible symptoms</b> even though a disease may be present — like 'silent' heart disease. It's why regular checkups matter!";
    
    if (input.includes('bmi') || input.includes('body mass index'))
        return "📏 <b>BMI (Body Mass Index)</b> measures if your weight is healthy for your height.<br>Formula: <b>Weight(kg) ÷ Height(m)²</b><br>• Under 18.5 → Underweight<br>• 18.5–24.9 → Normal ✅<br>• 25–29.9 → Overweight<br>• 30+ → Obese";
    
    if (input.includes('cholesterol'))
        return "🧪 <b>Cholesterol</b> is a waxy substance in your blood. <b>High LDL ('bad') cholesterol</b> builds up in arteries and can cause blockages, raising heart disease risk. Aim for total cholesterol below 200 mg/dL.";
    
    if (input.includes('fasting blood sugar') || input.includes('fasting glucose'))
        return "🍬 <b>Fasting Blood Sugar</b> measures blood glucose after not eating for 8+ hours.<br>• Normal: &lt;100 mg/dL ✅<br>• Pre-diabetes: 100–125<br>• Diabetic: 126+ ⚠️";
    
    if (input.includes('creatinine') || input.includes('serum creatinine'))
        return "🫘 <b>Serum Creatinine</b> is a waste product from muscle metabolism. Healthy kidneys filter it out. <b>High levels</b> (above 1.2 mg/dL in women, 1.4 in men) signal the kidneys are struggling.";
    
    if (input.includes('ecg') || input.includes('electrocardiogram') || input.includes('st-t') || input.includes('st wave'))
        return "💓 An <b>ECG (Electrocardiogram)</b> records your heart's electrical activity. <b>Abnormal ST-T waves</b> can indicate the heart muscle isn't receiving enough oxygen — a possible sign of coronary artery disease.";
    
    if (input.includes('thalassemia'))
        return "🩸 <b>Thalassemia</b> is an inherited blood disorder where the body makes less hemoglobin than normal — leading to anemia and extra stress on the heart. A 'Reversible Defect' on a scan suggests reduced blood flow that can be treated.";
    
    if (input.includes('angina') || input.includes('chest pain'))
        return "🫀 <b>Angina</b> is chest pain caused by reduced blood flow to the heart.<br>• <b>Typical Angina</b>: Triggered by exertion, relieved by rest.<br>• <b>Atypical Angina</b>: Not the typical pattern — may feel like indigestion.<br>• <b>Non-anginal pain</b>: Chest pain NOT related to the heart.";
    
    if (input.includes('blood urea') || input.includes(' bun'))
        return "🫘 <b>Blood Urea Nitrogen (BUN)</b> measures how much urea nitrogen is in your blood. High BUN (above 20 mg/dL) may indicate your kidneys aren't filtering waste efficiently or that you're dehydrated.";
    
    if (input.includes('hemoglobin'))
        return "🩸 <b>Hemoglobin</b> is the protein in red blood cells that carries oxygen. Low hemoglobin = <b>Anemia</b>, which is very common in Chronic Kidney Disease (CKD). Normal range: 12–17 g/dL depending on sex and age.";
    
    if (input.includes('insulin'))
        return "💉 <b>Insulin</b> is a hormone made by the pancreas that helps cells absorb glucose for energy. In this model, <b>2-hour serum insulin</b> (normal: &lt;140 mU/L) is measured during a glucose tolerance test. High levels can indicate insulin resistance.";
    
    if (input.includes('oldpeak') || input.includes('st depression'))
        return "📉 <b>ST Depression (Oldpeak)</b> is seen on an ECG during exercise stress tests. It measures how much the ST segment drops below the baseline. Higher values (&gt;2mm) indicate more severe coronary artery disease risk.";
    
    if (input.includes('thalach') || input.includes('max heart rate') || input.includes('maximum heart rate'))
        return "💗 <b>Maximum Heart Rate</b> achieved during a stress test. Your predicted max is roughly <b>220 minus your age</b>. A very low max heart rate during stress can indicate heart problems.";
    
    // --- Health Tips ---
    if ((input.includes('tip') || input.includes('advice') || input.includes('how')) && input.includes('heart'))
        return "🫀 <b>Heart Health Tips:</b><br>• 150 min of moderate exercise weekly<br>• Limit salt to &lt;2,000mg/day<br>• Eat plenty of omega-3s (fish, walnuts)<br>• Don't smoke — it's the #1 risk factor<br>• Manage stress with meditation or yoga";
    
    if ((input.includes('tip') || input.includes('advice') || input.includes('how')) && (input.includes('diabet') || input.includes('glucose') || input.includes('sugar')))
        return "🩸 <b>Diabetes Management Tips:</b><br>• Prioritize whole grains & complex carbs<br>• Walk 30 minutes daily — it reduces insulin resistance<br>• Monitor blood sugar regularly<br>• Stay hydrated and avoid sugary drinks<br>• Consult a dietitian for a personalized plan";
    
    if ((input.includes('tip') || input.includes('advice') || input.includes('how')) && (input.includes('kidney') || input.includes('renal')))
        return "🫘 <b>Kidney Health Tips:</b><br>• Drink 2–3L of water daily<br>• Avoid excessive NSAIDs (ibuprofen strains kidneys)<br>• Limit protein intake if CKD is suspected<br>• Control blood pressure & blood sugar<br>• Quit smoking — it accelerates kidney damage";
    
    if (input.includes('tip') || input.includes('advice'))
        return "💡 <b>General Health Tip:</b> Quality sleep (7–9 hours) is just as critical as diet and exercise. It regulates hormones, lowers blood pressure, and helps cellular repair. Also — stay hydrated! Most adults need 2–3L water daily.";
    
    // --- About the app ---
    if (input.includes('how does') && (input.includes('work') || input.includes('predict')))
        return "🤖 <b>How it works:</b> VitalScan uses an <b>ensemble of two ML models</b>:<br>1. <b>Logistic Regression</b> — a statistical baseline<br>2. <b>Random Forest</b> — a powerful ensemble tree model<br><br>Both models predict a probability (0–100%) and the <b>average</b> is used as the final confidence score.";
    
    if (input.includes('hello') || input.includes('hi') || input.includes('hey'))
        return "👋 Hello! I'm <b>VitalBot</b>, your personal health assistant. Ask me to explain any medical term from the diagnosis forms, or tap a quick suggestion above. I'm here to help! 😊";
    
    // Catch-all
    return "🤔 I'm not sure about that specific query. Try asking about a <b>medical term</b> (like 'What is BMI?' or 'What is Thalassemia?') or ask for a <b>health tip</b> (like 'Give me a heart health tip'). I'm always learning! 🩺";
}

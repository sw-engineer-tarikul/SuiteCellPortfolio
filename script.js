/**
 * SuiteCell Enterprise Business OS - Interactive Engine
 * Handles countdown timer, interactive module tabs, ROI calculator,
 * waitlist validation, confetti celebration, canvas particles, and theme toggling.
 */

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // 1. THEME MANAGEMENT & INITIALIZATION
  // -------------------------------------------------------------------------
  const themeToggleBtn = document.getElementById('theme-toggle');
  const htmlRoot = document.documentElement;

  function initTheme() {
    const savedTheme = localStorage.getItem('suitecell_theme');
    if (savedTheme) {
      htmlRoot.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      htmlRoot.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }

  function toggleTheme() {
    const currentTheme = htmlRoot.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlRoot.setAttribute('data-theme', newTheme);
    localStorage.setItem('suitecell_theme', newTheme);
    showToast(`Switched to ${newTheme} mode`);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // Mobile Navigation Drawer Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
      mobileMenuBtn.setAttribute('aria-expanded', String(!isExpanded));
      if (isExpanded) {
        mobileMenu.setAttribute('hidden', '');
      } else {
        mobileMenu.removeAttribute('hidden');
      }
    });

    const mobileNavLinks = mobileMenu.querySelectorAll('.mobile-nav-item, .mobile-menu-cta');
    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('hidden', '');
      });
    });
  }

  // -------------------------------------------------------------------------
  // 2. COUNTDOWN TIMER
  // Target: 90 days countdown
  // -------------------------------------------------------------------------
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  const bannerDaysLeft = document.getElementById('banner-days-left');

  let launchTarget;
  const storedTarget = localStorage.getItem('suitecell_launch_target_90d');

  if (storedTarget) {
    launchTarget = parseInt(storedTarget, 10);
  } else {
    // 90 days target
    launchTarget = Date.now() + (90 * 24 * 60 * 60 * 1000) + (13 * 60 * 60 * 1000) + (59 * 60 * 1000);
    localStorage.setItem('suitecell_launch_target_90d', launchTarget.toString());
  }

  function updateCountdown() {
    const now = Date.now();
    const diff = Math.max(0, launchTarget - now);

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(d).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(m).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(s).padStart(2, '0');
    if (bannerDaysLeft) bannerDaysLeft.textContent = String(Math.max(1, d));
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  // -------------------------------------------------------------------------
  // 3. WAITLIST SUBMISSION & VIP QUEUE LOGIC
  // -------------------------------------------------------------------------
  const waitlistForm = document.getElementById('waitlist-form');
  const emailInput = document.getElementById('user-email');
  const companySizeSelect = document.getElementById('company-size');
  const submitBtn = document.getElementById('submit-btn');
  const formFeedback = document.getElementById('form-feedback');
  const waitlistSuccess = document.getElementById('waitlist-success');
  const confirmedEmailEl = document.getElementById('confirmed-email');
  const userSpotNumber = document.getElementById('user-spot-number');
  const referralInput = document.getElementById('referral-link');
  const copyRefBtn = document.getElementById('copy-ref-btn');
  const copyFeedback = document.getElementById('copy-feedback');
  const resetFormBtn = document.getElementById('reset-form-btn');

  // Purge any stale mock/subagent test entries so users always start with the clean application form
  try {
    localStorage.removeItem('suitecell_vip_user');
  } catch (e) {}

  // Explicitly ensure initial state: form is visible, success card is strictly hidden
  if (waitlistForm) waitlistForm.classList.remove('hidden');
  if (waitlistSuccess) waitlistSuccess.classList.add('hidden');

  function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  }

  if (waitlistForm) {
    waitlistForm.addEventListener('submit', function (e) {
      e.preventDefault();
      formFeedback.textContent = '';
      formFeedback.className = 'form-feedback';

      const email = emailInput.value.trim();
      const companySize = companySizeSelect.value;

      if (!email) {
        showFeedback('Please enter your company email address.', 'error');
        emailInput.focus();
        return;
      }

      if (!validateEmail(email)) {
        showFeedback('Please provide a valid work email format (e.g. name@company.com).', 'error');
        emailInput.focus();
        return;
      }

      // Check common disposable/generic free domains if desired or encourage corporate
      const isFreeEmail = /@(gmail|yahoo|hotmail|outlook|aol)\.com$/i.test(email);

      // Loading state
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;

        // Generate unique spot
        const randomSpot = Math.floor(1420 + Math.random() * 85);
        const refCode = 'SC-' + Math.floor(1000 + Math.random() * 9000);
        const refUrl = `https://suitecell.io/vip?ref=${refCode}`;

        const userData = {
          email: email,
          companySize: companySize || 'Growth',
          spot: `#${randomSpot.toLocaleString()}`,
          ref: refUrl,
          joinedAt: new Date().toISOString()
        };

        localStorage.setItem('suitecell_vip_user', JSON.stringify(userData));

        showWaitlistSuccess(email, userData.spot, refUrl);
        triggerConfetti();
        showToast('VIP Early Access Reserved!');

        if (isFreeEmail) {
          showFeedback('Note: Corporate domain emails receive expedited beta invites.', 'success');
        }
      }, 900);
    });
  }

  function showFeedback(msg, type) {
    if (!formFeedback) return;
    formFeedback.textContent = msg;
    formFeedback.className = `form-feedback ${type}`;
  }

  function showWaitlistSuccess(email, spot, refUrl) {
    if (waitlistForm) waitlistForm.classList.add('hidden');
    if (waitlistSuccess) {
      waitlistSuccess.classList.remove('hidden');
      if (confirmedEmailEl) confirmedEmailEl.textContent = email;
      if (userSpotNumber) userSpotNumber.textContent = spot;
      if (referralInput) referralInput.value = refUrl;
    }
  }

  if (copyRefBtn && referralInput) {
    copyRefBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(referralInput.value).then(() => {
        copyFeedback.textContent = '✓ Unique invite link copied to clipboard!';
        copyRefBtn.textContent = 'Copied!';
        showToast('Referral link copied!');
        setTimeout(() => {
          copyFeedback.textContent = '';
          copyRefBtn.textContent = 'Copy Link';
        }, 3500);
      }).catch(() => {
        referralInput.select();
        document.execCommand('copy');
        copyFeedback.textContent = '✓ Copied!';
      });
    });
  }

  if (resetFormBtn) {
    resetFormBtn.addEventListener('click', function () {
      if (waitlistSuccess) waitlistSuccess.classList.add('hidden');
      if (waitlistForm) {
        waitlistForm.classList.remove('hidden');
        if (emailInput) {
          emailInput.value = '';
          emailInput.focus();
        }
        if (companySizeSelect) {
          companySizeSelect.selectedIndex = 0;
        }
        if (formFeedback) {
          formFeedback.textContent = '';
          formFeedback.className = 'form-feedback';
        }
      }
    });
  }

  // -------------------------------------------------------------------------
  // 4. INTERACTIVE MODULE PREVIEW DATA & SWITCHER
  // -------------------------------------------------------------------------
  const moduleTabs = document.querySelectorAll('.tab-btn');
  const mockupContainer = document.getElementById('mockup-content');

  const moduleData = {
    flow: {
      title: 'Cell Flow: Omni-Channel CRM & Sales Pipeline',
      badge: 'Real-Time Sync Active',
      stats: [
        { label: 'Active Pipeline', value: '$3,842,500', trend: '+28.4% vs last mo', dir: 'up' },
        { label: 'Deals in Flight', value: '148 Deals', trend: '94% on track', dir: 'up' },
        { label: 'Avg Deal Cycle', value: '18.4 Days', trend: '-4.2 days faster', dir: 'up' },
        { label: 'AI Win Probability', value: '78.2%', trend: 'Calibrated', dir: 'neutral' }
      ],
      tableTitle: 'High-Value Enterprise Opportunities',
      tableHeaders: ['Account / Prospect', 'Cell Owner', 'Stage', 'Deal Value', 'AI Deal Health'],
      tableRows: [
        { col1: 'HyperGrid Technologies', user: 'Sophia Lin', stage: 'Procurement & Legal', val: '$280,000', health: '98% Strong' },
        { col1: 'Veritas Financial Cloud', user: 'Alex Vance', stage: 'Technical Validation', val: '$145,000', health: '91% Healthy' },
        { col1: 'OmniLogistics Global', user: 'Marcus Chen', stage: 'Executive Proposal', val: '$420,000', health: '86% Normal' },
        { col1: 'Nexus BioHealth Systems', user: 'Emma Roy', stage: 'Contract Redlining', val: '$190,000', health: '95% Strong' }
      ],
      aiHeading: 'Cell Brain Sales Actions',
      aiLogs: [
        { name: 'Contract Copilot', text: 'Auto-redlined indemnity clauses in HyperGrid NDA to align with standard legal playbook.', time: '2 mins ago' },
        { name: 'Pipeline Triage', text: 'Detected 3 stalled accounts in Mid-Market. Triggered executive outreach templates.', time: '14 mins ago' }
      ]
    },
    books: {
      title: 'Cell Books: Real-Time Enterprise Ledger & Cash Flow',
      badge: 'Zero-Reconciliation Mode',
      stats: [
        { label: 'Annual Run-Rate', value: '$14,280,000', trend: '+32.1% YoY', dir: 'up' },
        { label: 'Net Cash Runway', value: '29.4 Months', trend: 'Healthy Float', dir: 'up' },
        { label: 'Outstanding DSO', value: '16.2 Days', trend: '-8 days improved', dir: 'up' },
        { label: 'Auto-Reconciled', value: '99.8%', trend: '0 manual errors', dir: 'up' }
      ],
      tableTitle: 'Live Multi-Currency Cash Inflow & Invoices',
      tableHeaders: ['Invoice ID', 'Client / Partner', 'Currency', 'Amount', 'Settlement Status'],
      tableRows: [
        { col1: 'INV-2026-8819', user: 'AeroDynamics Corp', stage: 'USD Settlement', val: '$84,500.00', health: 'Auto-Matched' },
        { col1: 'INV-2026-8820', user: 'Starlight Media UK', stage: 'EUR Clearing', val: '€62,300.00', health: 'Settled' },
        { col1: 'INV-2026-8821', user: 'Tokyo Robotics Labs', stage: 'JPY FX Wire', val: '¥14,800,000', health: 'Auto-Matched' },
        { col1: 'INV-2026-8822', user: 'Nordic CleanEnergy', stage: 'SEK Automated', val: 'kr490,000', health: 'Settled' }
      ],
      aiHeading: 'Cell Brain Audit & Reconciliation',
      aiLogs: [
        { name: 'Ledger Engine', text: 'Matched 1,420 Stripe & bank transactions in 4.2ms. Zero unreconciled variances found.', time: 'Just now' },
        { name: 'Tax Compliance', text: 'Prepared quarterly EU VAT MOSS filings with automatic currency conversions.', time: '18 mins ago' }
      ]
    },
    team: {
      title: 'Cell Team: Global People Operations, Talent & Payroll',
      badge: '48 Countries Supported',
      stats: [
        { label: 'Global Headcount', value: '342 Members', trend: '+14 this quarter', dir: 'up' },
        { label: 'Next Payroll Run', value: '3d 14h', trend: 'Direct Deposit', dir: 'neutral' },
        { label: 'Retention Score', value: '96.4%', trend: 'Top Decile', dir: 'up' },
        { label: 'Avg Time to Hire', value: '17 Days', trend: '3.1x benchmark', dir: 'up' }
      ],
      tableTitle: 'Active People Ops Workflows & Onboarding',
      tableHeaders: ['Employee / Candidate', 'Department', 'Role', 'Location', 'Status'],
      tableRows: [
        { col1: 'Kavita Patel', user: 'Core Systems', stage: 'Staff Distributed Engineer', val: 'London, UK', health: 'Active' },
        { col1: 'Liam Henderson', user: 'Growth & GTM', stage: 'Enterprise Account Exec', val: 'New York, US', health: 'Onboarding (Day 4)' },
        { col1: 'Chen Wei', user: 'Autonomous AI', stage: 'Principal ML Scientist', val: 'Singapore', health: 'Active' },
        { col1: 'Marta Fernandez', user: 'Product & Design', stage: 'Staff Product Designer', val: 'Madrid, ES', health: 'Offer Accepted' }
      ],
      aiHeading: 'People Ops Intelligence',
      aiLogs: [
        { name: 'Payroll Agent', text: 'Simulated cross-border equity withholdings across 12 tax jurisdictions.', time: '8 mins ago' },
        { name: 'Engagement Pulse', text: 'Quarterly team sentiment aggregate processed. Overall satisfaction 4.85/5.', time: '1 hr ago' }
      ]
    },
    ops: {
      title: 'Cell Ops: Multi-Warehouse Supply Chain & Inventory',
      badge: '99.98% Fulfillment Accuracy',
      stats: [
        { label: 'SKU Inventory Units', value: '840,290', trend: 'Across 6 Hubs', dir: 'neutral' },
        { label: 'Order Dispatch Time', value: '42 Mins', trend: '-25% faster', dir: 'up' },
        { label: 'Supplier On-Time', value: '98.7%', trend: '+4.2% stability', dir: 'up' },
        { label: 'Predicted Stockout', value: '0 Items', trend: 'Shielded by AI', dir: 'up' }
      ],
      tableTitle: 'Warehouse Routing & Automated Reorders',
      tableHeaders: ['Product SKU', 'Warehouse Hub', 'Current Stock', 'Safety Threshold', 'Logistics Status'],
      tableRows: [
        { col1: 'SC-KERN-X900', user: 'Hub East (Newark)', stage: '14,200 units', val: 'Min 2,500', health: 'Optimal' },
        { col1: 'SC-NODE-V40', user: 'Hub Central (Chicago)', stage: '8,450 units', val: 'Min 1,800', health: 'Optimal' },
        { col1: 'SC-ARRAY-M2', user: 'Hub West (Reno)', stage: '3,100 units', val: 'Min 2,000', health: 'Reorder In-Flight' },
        { col1: 'SC-FIBER-T1', user: 'Hub EU (Frankfurt)', stage: '19,800 units', val: 'Min 4,000', health: 'Optimal' }
      ],
      aiHeading: 'Supply Chain Autonomous Sentinel',
      aiLogs: [
        { name: 'Demand Forecaster', text: 'Anticipated 28% surge in EU inventory. Auto-routed batch PO to secondary tier-1 supplier.', time: '12 mins ago' },
        { name: 'Fleet Optimizer', text: 'Combined 3 LTL freight shipments into 1 FTL run, saving $4,200 in transit costs.', time: '35 mins ago' }
      ]
    },
    ai: {
      title: 'Cell Brain: Autonomous Business Copilots & Workflows',
      badge: 'Autonomous Kernel 2.0',
      stats: [
        { label: 'Autonomous Actions', value: '18,490 / mo', trend: 'Executed with zero humans', dir: 'up' },
        { label: 'Human Review Rate', value: '0.4%', trend: '99.6% autonomous', dir: 'up' },
        { label: 'Avg Action Latency', value: '185 ms', trend: 'Ultra-responsive', dir: 'up' },
        { label: 'Security Guardrails', value: '100% Passed', trend: 'SOC2 Strict Mode', dir: 'up' }
      ],
      tableTitle: 'Autonomous Multi-Agent Activity Ledger',
      tableHeaders: ['Agent Name', 'Owning Cell', 'Trigger Source', 'Action Performed', 'Verification Result'],
      tableRows: [
        { col1: 'Deal Velocity Bot', user: 'Cell Flow', stage: 'Lead Form Submit', val: 'Enriched company financials & matched ICP', health: 'Verified' },
        { col1: 'Invoice Matcher', user: 'Cell Books', stage: 'Incoming Bank Wire', val: 'Auto-reconciled PO #9941 to invoice ledger', health: 'Verified' },
        { col1: 'Candidate Screener', user: 'Cell Team', stage: 'Resume Ingestion', val: 'Score matched against Staff Engineer rubric', health: 'Verified' },
        { col1: 'Supply Buffer Sentinel', user: 'Cell Ops', stage: 'Port Congestion Alert', val: 'Rerouted 4 container shipments via air expedite', health: 'Verified' }
      ],
      aiHeading: 'Live Autonomous Event Stream',
      aiLogs: [
        { name: 'Executive Briefer', text: 'Generated 1-page Monday operational brief with revenue, runway, and key blockers.', time: '1 min ago' },
        { name: 'Fraud Sentinel', text: 'Intercepted anomalous vendor payment change request. Blocked pending multi-sig signoff.', time: '7 mins ago' }
      ]
    },
    collab: {
      title: 'Cell Sync: Unified Workspace, Comms & Executive Knowledge',
      badge: 'Zero Knowledge Context Switching',
      stats: [
        { label: 'Active Collaborators', value: '280 Members', trend: 'Real-time online', dir: 'up' },
        { label: 'Connected Docs & Records', value: '42,000+', trend: 'Instantly searchable', dir: 'up' },
        { label: 'Search Latency', value: '12 ms', trend: 'Across all 6 cells', dir: 'up' },
        { label: 'End-to-End Encrypted', value: '256-bit AES', trend: 'Zero server eavesdropping', dir: 'up' }
      ],
      tableTitle: 'Active Cross-Functional Workstreams',
      tableHeaders: ['Channel / Initiative', 'Lead', 'Key Artifacts', 'Linked Records', 'Progress Status'],
      tableRows: [
        { col1: '#proj-enterprise-v2', user: 'Elena Rostova', stage: 'Product Specs & PRD', val: 'Linked to Flow & Ops', health: 'On Schedule' },
        { col1: '#exec-q4-strategy', user: 'David Kim', stage: 'Board Financial Deck', val: 'Linked to Books', health: 'Final Review' },
        { col1: '#deal-hypergrid-war-room', user: 'Sophia Lin', stage: 'Master Services Agreement', val: 'Linked to CRM & Legal', health: 'Closing' },
        { col1: '#team-hiring-blitz', user: 'Kavita Patel', stage: 'Engineering Pipeline', val: 'Linked to Team HRM', health: 'Active' }
      ],
      aiHeading: 'Workspace Semantic Graph',
      aiLogs: [
        { name: 'Meeting Summarizer', text: 'Synthesized 45-min leadership sync into 4 actionable tasks linked to CRM & Finance.', time: '5 mins ago' },
        { name: 'Semantic Search', text: 'Indexed 120 new technical documents into enterprise vector knowledge base.', time: '20 mins ago' }
      ]
    }
  };

  function renderMockup(moduleKey) {
    const data = moduleData[moduleKey] || moduleData.flow;
    if (!mockupContainer) return;

    let statsHtml = data.stats.map(s => `
      <div class="m-stat-card">
        <span class="label">${s.label}</span>
        <span class="value">${s.value}</span>
        <span class="trend ${s.dir}">${s.trend}</span>
      </div>
    `).join('');

    let rowsHtml = data.tableRows.map(r => `
      <tr>
        <td>
          <div class="m-user-cell">
            <span class="m-avatar-mini">${r.col1.charAt(0)}</span>
            <span>${r.col1}</span>
          </div>
        </td>
        <td>${r.user}</td>
        <td>${r.stage}</td>
        <td style="font-family: var(--font-mono); font-weight: 600; color: var(--text-main);">${r.val}</td>
        <td><span class="m-badge live">${r.health}</span></td>
      </tr>
    `).join('');

    let aiLogsHtml = data.aiLogs.map(a => `
      <div class="agent-item">
        <div class="agent-avatar">AI</div>
        <div class="agent-text">
          <span class="agent-name">${a.name}</span>
          <span class="agent-desc" style="color: var(--text-muted);">${a.text}</span>
          <span class="agent-time">${a.time}</span>
        </div>
      </div>
    `).join('');

    mockupContainer.innerHTML = `
      <div class="mockup-dashboard">
        <div class="m-panel-header" style="margin-bottom: 4px;">
          <div>
            <h3 class="m-panel-title" style="font-size: 1.15rem;">${data.title}</h3>
            <span style="font-size: 0.8rem; color: var(--text-subtle);">Direct multi-tenant cell connection</span>
          </div>
          <span class="m-badge live">${data.badge}</span>
        </div>

        <div class="mockup-top-stats">
          ${statsHtml}
        </div>

        <div class="mockup-main-view">
          <div class="m-panel">
            <div class="m-panel-header">
              <span class="m-panel-title">${data.tableTitle}</span>
              <span class="m-panel-tag">Live Stream</span>
            </div>
            <div class="m-table-container">
              <div class="mobile-table-hint">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
                <span>Swipe left/right to view all 5 metrics</span>
              </div>
              <table class="m-table">
                <thead>
                  <tr>
                    ${data.tableHeaders.map(h => `<th>${h}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </div>

          <div class="m-panel">
            <div class="m-panel-header">
              <span class="m-panel-title">${data.aiHeading}</span>
              <span class="live-indicator"></span>
            </div>
            <div class="ai-agent-feed">
              ${aiLogsHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Bind tab buttons
  moduleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      moduleTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const mod = tab.getAttribute('data-module');
      renderMockup(mod);
    });
  });

  // Initial render
  renderMockup('flow');

  // -------------------------------------------------------------------------
  // 5. INTERACTIVE ROI CALCULATOR
  // -------------------------------------------------------------------------
  const headcountSlider = document.getElementById('headcount-slider');
  const headcountVal = document.getElementById('headcount-val');
  const toolsSlider = document.getElementById('tools-slider');
  const toolsVal = document.getElementById('tools-val');
  const industryBtns = document.querySelectorAll('.industry-btn');
  const calculatedSavingsEl = document.getElementById('calculated-savings');
  const hoursSavedEl = document.getElementById('hours-saved');
  const speedGainEl = document.getElementById('speed-gain');

  let currentIndustryFactor = 1.0;

  function calculateROI() {
    const headcount = parseInt(headcountSlider.value, 10);
    const tools = parseInt(toolsSlider.value, 10);

    if (headcountVal) {
      headcountVal.textContent = `${headcount} Team Members`;
    }
    if (toolsVal) {
      toolsVal.textContent = `${tools} Separate Tools`;
    }

    // Standard SaaS benchmark calculations:
    // Avg cost per user per tool per month = $26
    // SuiteCell unified cost = $42 / user / month
    // Integration & maintenance cost per tool = $4,000 / year
    const traditionalAnnualSaaS = (headcount * tools * 26 * 12 * currentIndustryFactor) + (tools * 4500);
    const suitecellAnnual = (headcount * 42 * 12);
    const annualSavings = Math.max(12000, Math.round(traditionalAnnualSaaS - suitecellAnnual));

    // Hours wasted in context switching: ~0.8 hrs / employee / week / tool
    const hoursReclaimed = Math.round(headcount * (tools * 0.75) * 50);

    // Speed multiplier: based on reduced handoffs
    const speed = (2.2 + (tools * 0.22) + (headcount > 150 ? 1.0 : 0.4)).toFixed(1);

    animateNumber(calculatedSavingsEl, annualSavings);
    if (hoursSavedEl) hoursSavedEl.textContent = hoursReclaimed.toLocaleString();
    if (speedGainEl) speedGainEl.textContent = speed;
  }

  function animateNumber(element, target) {
    if (!element) return;
    const start = parseInt(element.textContent.replace(/,/g, ''), 10) || 0;
    const duration = 400;
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * easeProgress);
      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = target.toLocaleString();
      }
    }
    requestAnimationFrame(step);
  }

  if (headcountSlider && toolsSlider) {
    headcountSlider.addEventListener('input', calculateROI);
    toolsSlider.addEventListener('input', calculateROI);
  }

  industryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      industryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentIndustryFactor = parseFloat(btn.getAttribute('data-factor')) || 1.0;
      calculateROI();
    });
  });

  calculateROI();

  // -------------------------------------------------------------------------
  // 6. FAQ ACCORDION
  // -------------------------------------------------------------------------
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (!questionBtn || !answer) return;

    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all others
      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          const otherBtn = other.querySelector('.faq-question');
          const otherAns = other.querySelector('.faq-answer');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          if (otherAns) otherAns.setAttribute('hidden', '');
        }
      });

      // Toggle current
      if (isOpen) {
        item.classList.remove('open');
        questionBtn.setAttribute('aria-expanded', 'false');
        answer.setAttribute('hidden', '');
      } else {
        item.classList.add('open');
        questionBtn.setAttribute('aria-expanded', 'true');
        answer.removeAttribute('hidden');
      }
    });
  });

  // -------------------------------------------------------------------------
  // 7. LIVE SOCIAL PROOF TICKER
  // -------------------------------------------------------------------------
  const activityMsg = document.getElementById('activity-msg');
  const activityContainer = document.getElementById('live-activity');

  const simulatedSignups = [
    { name: 'Elena R.', role: 'COO at Apex Logistics', seats: '180 seats', time: '2 minutes ago' },
    { name: 'Marcus K.', role: 'VP Operations at QuantumCloud', seats: '340 seats', time: 'Just now' },
    { name: 'Sarah L.', role: 'CFO at NextGen BioHealth', seats: '95 seats', time: '4 minutes ago' },
    { name: 'David M.', role: 'Founder & CEO at SwiftFleet', seats: '420 seats', time: '6 minutes ago' },
    { name: 'Claire T.', role: 'Head of Engineering at OmniCore', seats: '210 seats', time: '8 minutes ago' },
    { name: 'Jonathan P.', role: 'Managing Director at Sterling Capital', seats: '150 seats', time: '11 minutes ago' }
  ];

  let signupIdx = 0;
  function rotateActivity() {
    if (!activityMsg || !activityContainer) return;
    signupIdx = (signupIdx + 1) % simulatedSignups.length;
    const item = simulatedSignups[signupIdx];

    activityContainer.style.opacity = '0';
    activityContainer.style.transform = 'translateY(6px)';

    setTimeout(() => {
      activityMsg.innerHTML = `<strong>${item.name}</strong> (${item.role}, ${item.seats}) joined the priority queue ${item.time}`;
      activityContainer.style.opacity = '1';
      activityContainer.style.transform = 'translateY(0)';
    }, 350);
  }

  setInterval(rotateActivity, 7500);

  // -------------------------------------------------------------------------
  // 8. AMBIENT PARTICLES CANVAS
  // -------------------------------------------------------------------------
  const canvas = document.getElementById('ambient-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const particleCount = 42;

    function resizeCanvas() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? 'rgba(99, 102, 241, ' : 'rgba(56, 189, 248, '
      });
    }

    function renderParticles() {
      ctx.clearRect(0, 0, width, height);

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.15 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '0.6)';
        ctx.fill();
      }

      requestAnimationFrame(renderParticles);
    }

    renderParticles();
  }

  // -------------------------------------------------------------------------
  // 9. CONFETTI CANNON ANIMATION
  // -------------------------------------------------------------------------
  function triggerConfetti() {
    const cCanvas = document.getElementById('confetti-canvas');
    if (!cCanvas) return;
    const cCtx = cCanvas.getContext('2d');
    cCanvas.width = window.innerWidth;
    cCanvas.height = window.innerHeight;

    const confettiPieces = [];
    const colors = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#ffffff'];

    for (let i = 0; i < 110; i++) {
      confettiPieces.push({
        x: cCanvas.width / 2,
        y: cCanvas.height * 0.45,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 3,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.7) * 15,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rSpeed: (Math.random() - 0.5) * 12,
        opacity: 1
      });
    }

    let frame = 0;
    function renderConfetti() {
      cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
      let alive = false;

      for (let p of confettiPieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // Gravity
        p.vx *= 0.98; // Drag
        p.rotation += p.rSpeed;
        p.opacity -= 0.009;

        if (p.opacity > 0) {
          alive = true;
          cCtx.save();
          cCtx.translate(p.x, p.y);
          cCtx.rotate((p.rotation * Math.PI) / 180);
          cCtx.fillStyle = p.color;
          cCtx.globalAlpha = Math.max(0, p.opacity);
          cCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          cCtx.restore();
        }
      }

      frame++;
      if (alive && frame < 180) {
        requestAnimationFrame(renderConfetti);
      } else {
        cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
      }
    }

    renderConfetti();
  }

  // -------------------------------------------------------------------------
  // 10. REUSABLE TOAST NOTIFICATION
  // -------------------------------------------------------------------------
  let toastTimer;
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // -------------------------------------------------------------------------
  // 11. KEYBOARD SHORTCUTS
  // -------------------------------------------------------------------------
  window.addEventListener('keydown', (e) => {
    // Press '/' or 'w' to quickly jump to waitlist input
    if ((e.key === '/' || e.key.toLowerCase() === 'w') && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (emailInput) {
        emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => emailInput.focus(), 300);
        showToast('Tip: Ready to enter email');
      }
    }

    // Press 't' to toggle theme
    if (e.key.toLowerCase() === 't' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
      e.preventDefault();
      toggleTheme();
    }
  });

  // Dynamic Year in footer
  const yearEl = document.getElementById('year-copy');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Initialize
  initTheme();

})();

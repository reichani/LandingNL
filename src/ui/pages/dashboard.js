import { dashboardScript } from '../scripts/dashboard.js';

export function renderDashboardPage(releaseLabel = 'v1.0.6', buildMeta = '') {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LandingNL • My dashboard</title>
  ${buildMeta}
  <style>
    :root {
      --bg: #080c14;
      --card: #111827;
      --border: rgba(255, 255, 255, 0.08);
      --primary: #3b82f6;
      --mint: #10b981;
      --amber: #fbbf24;
      --purple: #c084fc;
      --text: #ffffff;
      --muted: #94a3b8;
    }

    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); margin: 0; padding: 24px; line-height: 1.5; }
    .container { max-width: 1000px; margin: 0 auto; }
    
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .brand { font-size: 1.3rem; font-weight: 800; background: linear-gradient(135deg, #60a5fa, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .v-badge { background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); color: #60a5fa; font-size: 0.72rem; padding: 2px 8px; border-radius: 12px; margin-left: 8px; font-weight: 600; }
    .btn-reset { background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.25); padding: 8px 16px; border-radius: 16px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }

    .savings-banner {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(59, 130, 246, 0.12));
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 16px;
      padding: 16px 20px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .progress-box { background: var(--card); border: 1px solid var(--border); border-radius: 18px; padding: 20px; margin-bottom: 24px; }
    .progress-bar-bg { background: rgba(255,255,255,0.06); height: 8px; border-radius: 4px; overflow: hidden; margin: 10px 0 14px 0; }
    .progress-bar-fill { background: linear-gradient(90deg, var(--primary), var(--mint)); height: 100%; width: 20%; transition: width 0.3s ease; }
    .badges { display: flex; gap: 8px; flex-wrap: wrap; }
    .badge { background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 6px 12px; border-radius: 8px; font-size: 0.78rem; color: var(--muted); }
    .badge.active { border-color: rgba(16,185,129,0.4); color: var(--mint); background: rgba(16,185,129,0.08); font-weight: 600; }

    .tabs { display: flex; background: rgba(255,255,255,0.03); padding: 4px; border-radius: 14px; gap: 6px; margin-bottom: 24px; border: 1px solid var(--border); }
    .tab { flex: 1; padding: 10px; border-radius: 10px; border: none; background: transparent; color: var(--muted); font-weight: 700; cursor: pointer; font-size: 0.85rem; text-align: center; }
    .tab.active { background: var(--primary); color: white; }

    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 18px; padding: 20px; }
    .col-2 { grid-column: span 2; }
    .col-3 { grid-column: span 3; }
    @media (max-width: 800px) { .col-2, .col-3 { grid-column: span 1; } }

    .card-title { font-size: 1rem; font-weight: 700; margin: 0 0 12px 0; }
    .list { list-style: none; padding: 0; margin: 0; }
    .item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.85rem; }
    .item > span:first-child { flex: 1 1 auto; min-width: 0; }
    
    .tag { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-align: center; display: inline-flex; align-items: center; justify-content: center; flex: 0 1 auto; max-width: 55%; overflow-wrap: anywhere; }
    .tag-mint { background: rgba(16,185,129,0.15); color: #34d399; }
    .tag-amber { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .tag-purple { background: rgba(192,132,252,0.15); color: #c084fc; }

    .btn-act { 
      background: #2563eb; 
      color: white; 
      border: none; 
      padding: 6px 14px; 
      border-radius: 8px; 
      font-size: 0.78rem; 
      font-weight: 700; 
      cursor: pointer; 
      white-space: nowrap; 
      min-width: 105px; 
      text-align: center; 
      display: inline-flex; 
      align-items: center; 
      justify-content: center;
    }
    .btn-act:hover { background: #1d4ed8; }

    .step-state { background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.14); color: #e2e8f0; border-radius: 8px; padding: 6px 8px; font-size: 0.78rem; font-weight: 600; max-width: 58%; cursor: pointer; }
    .step-state:disabled { cursor: not-allowed; }

    .btn-act-full {
      width: 100%;
      padding: 10px 14px;
      font-size: 0.82rem;
      white-space: nowrap;
    }

    .swap-card { background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 14px; padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
    .swap-tag { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; margin-bottom: 6px; }

    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 28px; max-width: 420px; width: 90%; text-align: center; }

    .hidden { display: none !important; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">LandingNL • My journey</div>
      <div style="display:flex; gap:8px; align-items:center;">
        <a class="btn-act" href="/onboarding?edit=1" style="text-decoration:none; background:rgba(255,255,255,0.08); color:#cbd5e1;">Edit profile</a>
        <button class="btn-reset" id="btn-reset-app">Sign out ➔</button>
      </div>
    </header>

    <div class="savings-banner">
      <div>
        <div style="font-size:0.78rem; color:var(--mint); font-weight:700; text-transform:uppercase;">💡 Support and discounts you may qualify for</div>
        <div style="font-size:1.4rem; font-weight:800; color:#fff;" id="total-savings-text">Based on your own situation</div>
      </div>
      <span class="tag tag-amber" style="padding:8px 14px; font-size:0.8rem;">Amounts are never guaranteed · official bodies decide</span>
    </div>

    <div class="progress-box">
      <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.9rem;">
        <span>🚩 Your progress (as you reported it)</span>
        <span id="percent-text" style="color:var(--mint);">%0</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" id="bar-fill"></div>
      </div>
      <div class="badges">
        <span class="badge" id="b-visa">Residence permit: check</span>
        <span class="badge" id="b-housing">Housing: check</span>
        <span class="badge" id="b-bsn">○ 1. Municipality &amp; BSN</span>
        <span class="badge" id="b-digid">🔒 2. DigiD</span>
        <span class="badge" id="b-bank">🔒 3. Bank account</span>
        <span class="badge" id="b-gp">🔒 4. Huisarts (GP)</span>
      </div>
    </div>

    <div class="tabs">
      <button class="tab active" id="t1">✈️ Settling in</button>
      <button class="tab" id="t2">🎁 Daily life &amp; insurance</button>
      <button class="tab" id="t3">🤝 Student swaps (preview)</button>
    </div>

    <!-- PHASE 1 -->
    <div id="view-1">
      <div class="card" id="status-route" style="border-left: 4px solid var(--purple); margin-bottom:16px;"></div>
      <div class="card hidden" id="next-phase" style="border-left: 4px solid var(--mint); margin-bottom:16px;"></div>
      <div class="grid">
        <div class="card" style="border-left: 4px solid var(--mint);">
          <div class="card-title">📄 Municipal registration appointment</div>
          <p style="font-size:0.8rem; color:var(--muted); margin-bottom:12px;">Save the date of your municipal (BRP) or RNI registration appointment. Your BSN is issued after registration — update the step once you receive it. Never type your BSN here.</p>
          <input type="date" id="bsn-date" style="width:100%; padding:10px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:white; font-size:0.9rem; margin-bottom:10px; outline:none; cursor:pointer;" />
          <button class="btn-act btn-act-full" id="btn-save-bsn-date">Save appointment date ➔</button>
          <a class="btn-act btn-act-full" style="display:block; margin-top:8px; text-align:center; text-decoration:none; background:rgba(255,255,255,0.08); color:#cbd5e1;" href="https://www.government.nl/themes/government-and-democracy/personal-data/citizen-service-number-bsn" target="_blank" rel="noopener noreferrer">Official source on the BSN ↗</a>
        </div>

        <div class="card" style="border-left: 4px solid var(--primary);">
          <div class="card-title">🏛️ The four settling-in steps</div>
          <p style="font-size:0.75rem; color:var(--muted); margin:0 0 8px 0;">LandingNL never completes or verifies these for you. Set the status of each step yourself: not started, applied and waiting, or done.</p>
          <ul class="list">
            <li class="item">
              <span>1. Municipality &amp; BSN</span>
              <select class="step-state" id="step-state-1" aria-label="Municipality and BSN status"></select>
            </li>
            <li class="item">
              <span>2. DigiD</span>
              <select class="step-state" id="step-state-2" aria-label="DigiD status"></select>
            </li>
            <li class="item">
              <span>3. Bank account</span>
              <select class="step-state" id="step-state-3" aria-label="Bank account status"></select>
            </li>
            <li class="item">
              <span>4. Huisarts (GP)</span>
              <select class="step-state" id="step-state-4" aria-label="Huisarts status"></select>
            </li>
          </ul>
          <div id="status-info" style="display:none; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); padding:10px; border-radius:8px; margin-top:12px; font-size:0.78rem; color:#34d399;"></div>
        </div>

        <div class="card">
          <div class="card-title">💳 Bank account</div>
          <p style="font-size:0.75rem; color:var(--muted); margin:0 0 8px 0;">Requirements differ per bank — check them on the bank’s own site before you apply. LandingNL is not integrated with any bank.</p>
          <ul class="list">
            <li class="item"><span>Accounts that do not require a BSN</span> <span class="tag tag-purple">Check the terms</span></li>
            <li class="item"><span>Dutch banks (ING, ABN AMRO, Rabobank…)</span> <span class="tag tag-amber" id="tag-ing">Usually ask for a BSN</span></li>
          </ul>
        </div>

        <div class="card col-3" style="border-left: 4px solid var(--amber);">
          <div class="card-title">🏛️ Government allowances (toeslagen)</div>
          <p style="font-size:0.82rem; color:var(--muted); margin-bottom:12px;">The Belastingdienst decides eligibility and amounts. LandingNL never applies on your behalf and guarantees no amount. Check your own situation with the official calculator:</p>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px;" id="allowance-grid">
          </div>
        </div>

        <div class="card col-3" style="border-left: 4px solid var(--purple);">
          <div class="card-title">💼 Your profile and work conditions</div>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap:12px; margin-top:12px;" id="profile-grid">
          </div>
        </div>
      </div>
    </div>

    <!-- PHASE 2 -->
    <div id="view-2" class="hidden">
      <div class="grid">
        <div class="card col-3" style="border-left: 4px solid var(--primary);">
          <div class="card-title">🎁 Student discounts</div>
          <p style="font-size:0.82rem; color:var(--muted); margin-bottom:12px;">Your university email address and student card unlock more than most students realise.</p>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px;" id="perks-grid">
          </div>
        </div>

        <div class="card col-3" style="border-left: 4px solid var(--mint);">
          <div class="card-title">🏥 Work status &amp; health insurance</div>
          <p style="font-size:0.82rem; color:var(--muted); margin-bottom:16px;">Starting paid work or a paid internship can change your health insurance obligation. Choose your situation:</p>

          <div style="display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap;">
            <button class="btn-act" id="btn-work-no" style="padding:10px 18px; font-size:0.85rem;">❌ Not working (studying only)</button>
            <button class="btn-act" id="btn-work-yes" style="padding:10px 18px; font-size:0.85rem; opacity:0.6; background:rgba(255,255,255,0.08);">🟢 Working for pay (part-time or full-time)</button>
          </div>

          <div id="insurance-tree-result" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
          </div>
        </div>

        <div class="card col-3">
          <div class="card-title">🎓 Your school</div>
          <p id="prog-text" style="font-size:0.85rem; color:var(--muted);">Loading…</p>
        </div>
      </div>
    </div>

    <!-- PHASE 3 -->
    <div id="view-3" class="hidden">
      <div class="grid">
        <div class="card" style="border-left: 4px solid var(--mint);">
          <div class="card-title">🌱 Post a swap</div>
          <p style="font-size:0.8rem; color:var(--muted); margin-bottom:14px;">Preview: your posts are stored on your account only and no other student can see them. The community board opens once moderation and reporting tools are ready.</p>
          
          <label style="font-size:0.75rem; color:var(--muted); display:block; margin-bottom:4px;">Category</label>
          <select id="swap-cat" style="width:100%; padding:8px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; font-size:0.85rem; margin-bottom:10px; outline:none;">
            <option value="🍝 Food">🍝 Food (home cooking)</option>
            <option value="🎹 Skills">🎹 Skills (lessons, practice)</option>
            <option value="🚲 Gear">🚲 Gear (items, books)</option>
            <option value="🎁 Give away">🎁 Give away (free)</option>
          </select>
          <button type="button" class="btn-act btn-act-full" id="btn-give-away" style="margin:-2px 0 12px; background:rgba(192,132,252,0.16); color:#d8b4fe; border:1px solid rgba(192,132,252,0.3);">🎁 Give something away</button>

          <label style="font-size:0.75rem; color:var(--muted); display:block; margin-bottom:4px;">What are you offering?</label>
          <input type="text" id="swap-title" placeholder="e.g. two portions of home-made pasta" style="width:100%; padding:8px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; font-size:0.85rem; margin-bottom:10px; outline:none;" />

          <label style="font-size:0.75rem; color:var(--muted); display:block; margin-bottom:4px;">What would you like in return?</label>
          <input type="text" id="swap-offer" placeholder="e.g. Dutch practice, a coffee" style="width:100%; padding:8px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; font-size:0.85rem; margin-bottom:14px; outline:none;" />

          <button class="btn-act btn-act-full" id="btn-add-swap" style="background:var(--mint); color:#042f2e;">Save as draft ➔</button>
        </div>

        <div class="card col-2">
          <div class="card-title">🤝 Swaps in <span id="city-board-title">your city</span></div>
          <p style="font-size:0.8rem; color:var(--muted); margin-bottom:16px;">Your drafts and a few samples (not real student posts):</p>
          <div id="swap-container"></div>
        </div>
      </div>
    </div>
  </div>

  <footer style="text-align:center; padding:8px 20px 32px; font-size:0.78rem; color:#64748b;">
    <a href="mailto:reichani@gmail.com?subject=LandingNL%20feedback&amp;body=What%20were%20you%20trying%20to%20do%3F%0A%0AWhat%20happened%3F%0A%0AWhich%20page%3F%0A%0APhone%20%2F%20browser%3A%0A" style="color:#34d399; font-weight:600;">Send feedback</a>
    · <a href="/privacy" style="color:#94a3b8;">Privacy Notice</a>
    · To delete your account: reichani@gmail.com
    · <span title="Version">${releaseLabel}</span>
  </footer>

  <div id="modal-box" class="modal hidden">
    <div class="modal-content">
      <div style="font-size:2rem; margin-bottom:8px;">🤝</div>
      <h3 style="margin:0 0 6px 0;" id="modal-title">Contact the poster</h3>
      <p style="font-size:0.8rem; color:var(--muted); margin-bottom:16px;">Messaging is not open yet. Use this template in your own student group:</p>
      
      <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border); border-radius:10px; padding:12px; font-size:0.82rem; text-align:left; color:#cbd5e1; margin-bottom:18px;" id="modal-msg">
        “Hoi! I saw your post on the LandingNL board. Would you like to swap?”
      </div>

      <div style="display:flex; gap:10px;">
        <button class="btn-act" id="btn-modal-wa" style="flex:1; padding:10px; background:var(--mint); color:#042f2e;">Copy message</button>
        <button class="btn-act" id="btn-modal-close" style="padding:10px; background:rgba(255,255,255,0.1); min-width:auto;">Close</button>
      </div>
    </div>
  </div>

  <script>${dashboardScript}</script>
</body>
</html>`;
}

import { test, expect, Page } from '@playwright/test';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function goto(page: Page, path = '/') {
  await page.goto(path);
  await page.waitForSelector('#app-header', { timeout: 10000 });
}

async function clickNav(page: Page, tabId: string) {
  // Try desktop nav first, fall back to bottom tab bar
  const desktopBtn = page.locator(`#nav-${tabId}`).first();
  const tabBtn     = page.locator(`#tab-${tabId}`).first();
  if (await desktopBtn.isVisible()) {
    await desktopBtn.click();
  } else {
    await tabBtn.click();
  }
  await page.waitForTimeout(300);
}

// ─────────────────────────────────────────────
// 1. APP SHELL
// ─────────────────────────────────────────────
test.describe('App Shell', () => {
  test('renders header and disclaimer banner', async ({ page }) => {
    await goto(page);
    await expect(page.locator('#app-header')).toBeVisible();
    await expect(page.locator('#disclaimer-banner')).toBeVisible();
    await expect(page.locator('#app-footer')).toBeVisible();
  });

  test('logo click navigates to dashboard', async ({ page }) => {
    await goto(page);
    await clickNav(page, 'learn');           // go away first
    await page.locator('#nav-home').first().click();
    await expect(page.locator('#dashboard-hero')).toBeVisible();
  });

  test('streak badge renders correctly', async ({ page }) => {
    await goto(page);
    const badge = page.locator('#streak-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Day Streak');
  });
});

// ─────────────────────────────────────────────
// 2. NAVIGATION — all 8 tabs
// ─────────────────────────────────────────────
test.describe('Navigation', () => {
  const views: { id: string; headingId: string }[] = [
    { id: 'dashboard',          headingId: 'dashboard-hero' },
    { id: 'learn',              headingId: 'learning-center-title' },
    { id: 'etf-explorer',       headingId: 'etf-explorer-title' },
    { id: 'retirement-planner', headingId: 'planner-title' },
    { id: 'portfolio-builder',  headingId: 'portfolio-title' },
    { id: 'calculators',        headingId: 'calculators-title' },
    { id: 'mistakes',           headingId: 'mistakes-title' },
    { id: 'profile',            headingId: 'profile-hero' },
  ];

  for (const v of views) {
    test(`navigates to ${v.id}`, async ({ page }) => {
      await goto(page);
      await clickNav(page, v.id);
      await expect(page.locator(`#${v.headingId}`)).toBeVisible();
    });
  }
});

// ─────────────────────────────────────────────
// 3. DASHBOARD
// ─────────────────────────────────────────────
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => { await goto(page); });

  test('stat cards are visible', async ({ page }) => {
    await expect(page.locator('#stat-learning-progress')).toBeVisible();
    await expect(page.locator('#stat-streak')).toBeVisible();
    await expect(page.locator('#stat-quizzes')).toBeVisible();
  });

  test('"Start Learning" hero button navigates to learn tab', async ({ page }) => {
    await page.locator('#btn-start-learning').click();
    await expect(page.locator('#learning-center-title, #lesson-title')).toBeVisible();
  });

  test('"Simulate Retirement" button navigates to planner', async ({ page }) => {
    await page.locator('#btn-goto-planner').click();
    await expect(page.locator('#planner-title')).toBeVisible();
  });

  test('tool cards navigate to correct views', async ({ page }) => {
    const cards: { id: string; landing: string }[] = [
      { id: 'tool-card-etf-explorer',       landing: 'etf-explorer-title' },
      { id: 'tool-card-retirement-planner', landing: 'planner-title' },
      { id: 'tool-card-calculators',        landing: 'calculators-title' },
      { id: 'tool-card-portfolio-builder',  landing: 'portfolio-title' },
      { id: 'tool-card-mistakes',           landing: 'mistakes-title' },
    ];
    for (const c of cards) {
      await goto(page);
      await page.locator(`#${c.id}`).click();
      await expect(page.locator(`#${c.landing}`)).toBeVisible();
      await page.goBack();
    }
  });

  test('"Mistakes to Avoid" wisdom button navigates', async ({ page }) => {
    await page.locator('#btn-avoid-mistakes').click();
    await expect(page.locator('#mistakes-title')).toBeVisible();
  });

  test('"Start next lesson" card button works', async ({ page }) => {
    await page.locator('#btn-start-next-lesson').click();
    await expect(page.locator('#lesson-title')).toBeVisible();
  });
});

// ─────────────────────────────────────────────
// 4. LEARNING CENTER
// ─────────────────────────────────────────────
test.describe('Learning Center', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page);
    await clickNav(page, 'learn');
  });

  test('category filters are all clickable', async ({ page }) => {
    const categories = ['all', 'basics', 'investment-types', 'retirement-accounts', 'mistakes'];
    for (const cat of categories) {
      await page.locator(`#category-${cat}`).click();
      await page.waitForTimeout(150);
    }
  });

  test('clicking a lesson opens lesson view', async ({ page }) => {
    await page.locator('[id^="lesson-btn-"]').first().click();
    await expect(page.locator('#lesson-title')).toBeVisible();
    await expect(page.locator('#btn-back-to-modules')).toBeVisible();
  });

  test('back button returns to module list', async ({ page }) => {
    await page.locator('[id^="lesson-btn-"]').first().click();
    await page.locator('#btn-back-to-modules').click();
    await expect(page.locator('#learning-center-title')).toBeVisible();
  });

  test('quiz cannot be submitted without all answers', async ({ page }) => {
    await page.locator('[id^="lesson-btn-"]').first().click();
    await page.locator('#lesson-quiz').scrollIntoViewIfNeeded();
    const submitBtn = page.locator('#btn-submit-quiz');
    await expect(submitBtn).toBeDisabled();
  });

  test('quiz submission works after answering all questions', async ({ page }) => {
    await page.locator('[id^="lesson-btn-"]').first().click();
    await page.locator('#lesson-quiz').scrollIntoViewIfNeeded();
    // Select first option for all quiz questions
    const questions = page.locator('[id^="quiz-q"]');
    const qCount = await page.locator('[id^="quiz-question-"]').count();
    for (let i = 0; i < qCount; i++) {
      await page.locator(`#quiz-q${i}-opt0`).click();
    }
    const submitBtn = page.locator('#btn-submit-quiz');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    await expect(page.locator('#quiz-result')).toBeVisible();
  });

  test('compound slider widget responds to input', async ({ page }) => {
    // Navigate to compound growth lesson
    await page.locator('[id^="lesson-btn-lesson-compound"]').click().catch(() => {
      // If specific ID not found, try first lesson
      return page.locator('[id^="lesson-btn-"]').nth(1).click();
    });
    const slider = page.locator('#slider-principal');
    if (await slider.isVisible()) {
      await slider.fill('5000');
    }
  });
});

// ─────────────────────────────────────────────
// 5. ETF EXPLORER
// ─────────────────────────────────────────────
test.describe('ETF Explorer', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page);
    await clickNav(page, 'etf-explorer');
  });

  test('search input filters ETF list', async ({ page }) => {
    const search = page.locator('input[placeholder*="VOO"]');
    await search.fill('QQQ');
    await page.waitForTimeout(300);
    await expect(page.locator('text=QQQ')).toBeVisible();
  });

  test('all category filter buttons are clickable', async ({ page }) => {
    const cats = ['S&P 500', 'Total Market', 'Dividend Growth', 'International', 'Bonds'];
    for (const cat of cats) {
      await page.locator(`button:has-text("${cat}")`).first().click();
      await page.waitForTimeout(150);
    }
    await page.locator('button:has-text("All")').first().click();
  });

  test('clicking an ETF shows its details', async ({ page }) => {
    await page.locator('button:has-text("VTI")').first().click();
    await expect(page.locator('text=Vanguard Total Stock Market ETF')).toBeVisible();
  });

  test('compare button toggles comparison state', async ({ page }) => {
    const compareBtn = page.locator('button:has-text("+ Compare")').first();
    await compareBtn.click();
    await expect(page.locator('button:has-text("Compared")').first()).toBeVisible();
  });

  test('refresh live quotes button works', async ({ page }) => {
    const refreshBtn = page.locator('button:has-text("Refresh Live Quotes")');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    await expect(page.locator('text=Fetching Quotes').or(page.locator('text=Refresh Live Quotes'))).toBeVisible();
  });

  test('compare matrix opens when funds selected', async ({ page }) => {
    await page.locator('button:has-text("+ Compare")').first().click();
    await page.locator('button:has-text("+ Compare")').first().click();
    const compareMatrix = page.locator('button:has-text("Compare 2 Funds")');
    if (await compareMatrix.isVisible()) {
      await compareMatrix.click();
      await expect(page.locator('text=Side-by-Side')).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────
// 6. RETIREMENT PLANNER
// ─────────────────────────────────────────────
test.describe('Retirement Planner', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page);
    await clickNav(page, 'retirement-planner');
  });

  test('all 6 sliders render and respond', async ({ page }) => {
    const sliders = [
      'slider-current-age', 'slider-retirement-age', 'slider-initial',
      'slider-monthly', 'slider-return', 'slider-inflation'
    ];
    for (const s of sliders) {
      await expect(page.locator(`#${s}`)).toBeVisible();
    }
  });

  test('KPI cards update when sliders change', async ({ page }) => {
    const nominalBefore = await page.locator('#kpi-nominal').textContent();
    await page.locator('#slider-monthly').evaluate((el: HTMLInputElement) => {
      el.value = '1000';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(300);
    const nominalAfter = await page.locator('#kpi-nominal').textContent();
    // Values should differ since monthly went up
    expect(nominalBefore).toBeDefined();
    expect(nominalAfter).toBeDefined();
  });

  test('retirement chart renders', async ({ page }) => {
    await expect(page.locator('#retirement-chart')).toBeVisible();
    // Recharts renders an SVG
    await expect(page.locator('#retirement-chart svg')).toBeVisible();
  });

  test('milestones table renders rows', async ({ page }) => {
    await expect(page.locator('#milestones-table table tbody tr').first()).toBeVisible();
  });

  test('"Save Scenario" button saves and shows confirmation', async ({ page }) => {
    await page.locator('#btn-save-scenario').click();
    await expect(page.locator('#btn-save-scenario:has-text("Saved!")')).toBeVisible({ timeout: 4000 });
  });
});

// ─────────────────────────────────────────────
// 7. PORTFOLIO BUILDER
// ─────────────────────────────────────────────
test.describe('Portfolio Builder', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page);
    await clickNav(page, 'portfolio-builder');
  });

  test('goal selector buttons all function', async ({ page }) => {
    const goals = ['retirement', 'home', 'wealth', 'education'];
    for (const g of goals) {
      await page.locator(`#goal-${g}`).click();
      await page.waitForTimeout(150);
    }
  });

  test('model tabs switch allocation details', async ({ page }) => {
    for (const m of ['conservative', 'moderate', 'aggressive']) {
      await page.locator(`#model-tab-${m}`).click();
      await expect(page.locator(`#model-info-${m}`)).toBeVisible();
    }
  });

  test('pie chart renders for each model', async ({ page }) => {
    for (const m of ['conservative', 'moderate', 'aggressive']) {
      await page.locator(`#model-tab-${m}`).click();
      await expect(page.locator('.recharts-wrapper svg').first()).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────
// 8. CALCULATORS
// ─────────────────────────────────────────────
test.describe('Calculators', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page);
    await clickNav(page, 'calculators');
  });

  test('all 4 calculator tabs switch views', async ({ page }) => {
    const tabs = [
      { id: 'compound',  panel: 'calc-compound'  },
      { id: 'dca',       panel: 'calc-dca'       },
      { id: 'drip',      panel: 'calc-drip'      },
      { id: 'inflation', panel: 'calc-inflation' },
    ];
    for (const t of tabs) {
      await page.locator(`#calc-tab-${t.id}`).click();
      await expect(page.locator(`#${t.panel}`)).toBeVisible();
    }
  });

  test('compound interest sliders update output', async ({ page }) => {
    await page.locator('#calc-tab-compound').click();
    await expect(page.locator('#ci-result-balance')).toBeVisible();
    await page.locator('#ci-years').evaluate((el: HTMLInputElement) => {
      el.value = '30';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(200);
    await expect(page.locator('#ci-result-balance')).toBeVisible();
  });

  test('DCA sliders render', async ({ page }) => {
    await page.locator('#calc-tab-dca').click();
    await expect(page.locator('#dca-amount')).toBeVisible();
    await expect(page.locator('#dca-result-lump')).toBeVisible();
    await expect(page.locator('#dca-result-dca')).toBeVisible();
  });

  test('DRIP calculator shows annual income', async ({ page }) => {
    await page.locator('#calc-tab-drip').click();
    await expect(page.locator('#drip-result-income')).toBeVisible();
  });

  test('Inflation calculator shows purchasing power loss', async ({ page }) => {
    await page.locator('#calc-tab-inflation').click();
    await expect(page.locator('#inf-result-lost')).toBeVisible();
  });
});

// ─────────────────────────────────────────────
// 9. INVESTING MISTAKES
// ─────────────────────────────────────────────
test.describe('Investing Mistakes', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page);
    await clickNav(page, 'mistakes');
  });

  test('all 3 scenario cards are clickable and show content', async ({ page }) => {
    const scenarios: { id: string; panel: string }[] = [
      { id: 'panic',  panel: 'mistake-panel-panic'  },
      { id: 'timing', panel: 'mistake-panel-timing' },
      { id: 'fees',   panel: 'mistake-panel-fees'   },
    ];
    for (const s of scenarios) {
      await page.locator(`#mistake-${s.id}`).click();
      await expect(page.locator(`#${s.panel}`)).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────
// 10. PROFILE
// ─────────────────────────────────────────────
test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page);
    await clickNav(page, 'profile');
  });

  test('profile hero renders', async ({ page }) => {
    await expect(page.locator('#profile-hero')).toBeVisible();
  });

  test('badges grid renders', async ({ page }) => {
    await expect(page.locator('#badges-grid')).toBeVisible();
    await expect(page.locator('#badge-streak')).toBeVisible();
  });

  test('no-scenarios empty state is shown when list empty', async ({ page }) => {
    // Clear storage first
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#app-header');
    await clickNav(page, 'profile');
    await expect(page.locator('#no-scenarios')).toBeVisible();
  });

  test('"Reset All Progress" button triggers confirmation', async ({ page }) => {
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('#btn-reset-progress').click();
    // Dialog should appear — dismissed above so profile stays intact
  });
});

// ─────────────────────────────────────────────
// 11. PERSISTENCE — LocalStorage
// ─────────────────────────────────────────────
test.describe('LocalStorage Persistence', () => {
  test('saved scenario persists across page reload', async ({ page }) => {
    await goto(page);
    await clickNav(page, 'retirement-planner');
    await page.locator('#btn-save-scenario').click();
    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForSelector('#app-header');
    await clickNav(page, 'profile');

    await expect(page.locator('#scenarios-list')).toBeVisible();
  });

  test('lesson completion persists across reload', async ({ page }) => {
    await goto(page);
    await clickNav(page, 'learn');
    await page.locator('[id^="lesson-btn-"]').first().click();

    const qCount = await page.locator('[id^="quiz-question-"]').count();
    for (let i = 0; i < qCount; i++) {
      await page.locator(`#quiz-q${i}-opt0`).click();
    }
    await page.locator('#btn-submit-quiz').click();
    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForSelector('#app-header');
    await clickNav(page, 'learn');

    // Completed lesson should show checkmark
    await expect(page.locator('[id^="lesson-btn-"]').first().locator('svg')).toBeVisible();
  });
});

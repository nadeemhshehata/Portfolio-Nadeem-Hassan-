const { chromium } = require('playwright');
const { execSync } = require('child_process');

(async () => {
    console.log("==========================================");
    console.log("🏁 DragRace.io - Sprint 03 Demo Automation");
    console.log("==========================================\n");

    console.log(">>> Make sure your screen recording captures both THIS TERMINAL and the BROWSER!\n");
    await new Promise(r => setTimeout(r, 6000));

    // 1. Show tests passing in terminal
    console.log("\n[TESTS] Running Integration Tests (Validating INT-01 through INT-05)...");
    try {
        const tests = execSync('python3 -m pytest backend/tests/ -v', { encoding: 'utf-8' });
        console.log(tests);
    } catch (err) {
        console.log("Tests failed or pytest not found. Make sure backend is running its venv.");
    }
    
    console.log("\n[PAUSE] Leaving tests on screen for 10 seconds for the grader to read...");
    await new Promise(r => setTimeout(r, 10000));

    console.log("\n[BROWSER] Launching Browser...");
    const browser = await chromium.launch({
        headless: false,
        slowMo: 600 // Makes hovering, clicking, and typing look incredibly deliberate
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        colorScheme: 'dark' // start in dark mode
    });
    
    // Listen for network responses so we can print the X-Cache Header
    context.on('response', response => {
        if (response.url().includes('/vehicles')) {
            const cacheStatus = response.headers()['x-cache'];
            if (cacheStatus) {
                console.log(`\n☁️ [NETWORK] Fetching ${response.url()}`);
                console.log(`☁️ [CACHE HEADER] X-Cache: ${cacheStatus} ` + (cacheStatus === 'HIT' ? '🟢' : '🔴'));
            }
        }
    });

    const page = await context.newPage();

    // ==========================================
    // ACTION 1: Cache Behavior (MISS) & Page Load
    // ==========================================
    console.log("\n[SCENE 1] Loading Web App (Initial Cache MISS)...");
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(4000);

    // ==========================================
    // ACTION 2: Theme Persistence
    // ==========================================
    console.log("\n[SCENE 2] Testing Theme Toggle & Persistence (UI-08)...");
    
    console.log("  -> Switching to Light Theme");
    await page.click('button:has-text("Light")'); 
    await page.waitForTimeout(4000);

    console.log("  -> Refreshing page to prove persistence...");
    await page.reload();
    await page.waitForTimeout(4000);

    console.log("  -> Switching back to Dark Theme");
    await page.click('button:has-text("Dark")'); 
    await page.waitForTimeout(3000);

    // ==========================================
    // ACTION 2.5: Site Tour (Leaderboard & History)
    // ==========================================
    console.log("\n[SCENE 3] Touring Leaderboard and History modules...");
    
    await page.click('text=🏆 Leaderboard');
    await page.waitForTimeout(4000);
    await page.mouse.wheel(0, 500); // look around
    await page.waitForTimeout(3000);

    await page.click('text=📜 History');
    await page.waitForTimeout(4000);
    await page.mouse.wheel(0, 500); // look around
    await page.waitForTimeout(3000);

    // Go back to home
    await page.click('text=🏠 Home');
    await page.waitForTimeout(3000);

    // ==========================================
    // ACTION 3: Cache Behavior (HIT) & Search
    // ==========================================
    console.log("\n[SCENE 4] Interacting with Filters & Cache HIT (PERF-01)...");
    
    console.log("  -> Entering search term: 'ninja'...");
    await page.fill('input[placeholder="🔍  Search make / model / trim…"]', 'ninja');
    await page.waitForTimeout(5000);

    console.log("  -> Clearing search to trigger full list reload (Cache HIT)...");
    await page.fill('input[placeholder="🔍  Search make / model / trim…"]', '');
    await page.waitForTimeout(4000);

    // Select cars
    console.log("  -> Selecting Vehicle A (Car)...");
    const buttons = await page.$$('button:has-text("Set as A")');
    if (buttons.length > 0) await buttons[0].click(); // Pick first
    await page.waitForTimeout(3000);

    console.log("  -> Selecting Vehicle B (Motorcycle)...");
    const buttonsB = await page.$$('button:has-text("Set as B")');
    if (buttonsB.length > 1) await buttonsB[1].click(); // Pick second
    await page.waitForTimeout(4000);

    // ==========================================
    // ACTION 4: Race & 3D GLB Models
    // ==========================================
    console.log("\n[SCENE 5] Starting Race & Loading 3D GLB Models (RACE-03)...");
    await page.click('button:has-text("🚀 Race!")');
    
    console.log("  -> Navigated to Results screen");
    console.log("  -> Waiting for 3D race animation to complete...");
    // Wait out the animation (around 8.5 seconds) + extra time
    await page.waitForTimeout(12000);

    // ==========================================
    // ACTION 5: Disclaimer Verification
    // ==========================================
    console.log("\n[SCENE 6] Verifying Simulation Disclaimer (LEGAL-01)...");
    
    // Scroll down if needed to ensure disclaimer is visible
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(8000);

    console.log("\n==========================================");
    console.log("🎬 Demo finished! You can stop recording.");
    console.log("==========================================");
    
    await browser.close();
})();

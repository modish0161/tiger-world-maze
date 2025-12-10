/**
 * Tiger World Maze Marketing Capture Script
 * Automated screenshot and video capture using Playwright
 */

import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const MARKETING_DIR = join(ROOT_DIR, 'marketing-pack');

const GAME_URL = 'http://localhost:5173';

// Viewport configurations
const DESKTOP_VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 }
];

const MOBILE_VIEWPORTS = [
  { name: 'iphone', device: 'iPhone 15', width: 393, height: 852 },
  { name: 'pixel', device: 'Pixel 7', width: 412, height: 915 }
];

// Ensure directories exist
function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// Wait helper with better reliability
async function waitFor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Wait for animations to settle
async function waitForAnimations(page, extraDelay = 500) {
  await page.waitForLoadState('networkidle');
  await waitFor(extraDelay);
}

// Take screenshot with proper naming
async function takeScreenshot(page, outputDir, screenName, viewportName, isMobile = false) {
  const prefix = isMobile ? 'mobile' : 'desktop';
  const filename = `tiger-world-maze_${prefix}_${screenName}_${viewportName}.png`;
  const filepath = join(outputDir, filename);
  
  await page.screenshot({ 
    path: filepath,
    fullPage: false,
    animations: 'disabled'
  });
  
  console.log(`📸 Captured: ${filename}`);
  return filepath;
}

// Navigate to home and capture
async function captureHomeScreen(page, outputDir, viewportName, isMobile) {
  await page.goto(GAME_URL);
  await waitForAnimations(page, 1000);
  await takeScreenshot(page, outputDir, 'menu', viewportName, isMobile);
}

// Navigate to level select
async function captureLevelSelect(page, outputDir, viewportName, isMobile) {
  // Click Play Now button
  try {
    const playButton = page.locator('text=PLAY NOW').first();
    if (await playButton.isVisible()) {
      await playButton.click();
      await waitForAnimations(page, 800);
      await takeScreenshot(page, outputDir, 'level_select', viewportName, isMobile);
      return true;
    }
  } catch (e) {
    console.log('Could not find PLAY NOW button, trying alternatives...');
  }
  
  // Try other navigation
  try {
    const playBtn = page.locator('.btn-primary').first();
    if (await playBtn.isVisible()) {
      await playBtn.click();
      await waitForAnimations(page, 800);
      await takeScreenshot(page, outputDir, 'level_select', viewportName, isMobile);
      return true;
    }
  } catch (e) {
    console.log('Level select navigation failed');
  }
  
  return false;
}

// Start a game level
async function captureGameplay(page, outputDir, viewportName, isMobile) {
  try {
    // Look for level 1 button
    const levelButtons = page.locator('[class*="level"], button, .card').filter({ hasText: /^1$|Level 1|Easy/ });
    const firstLevel = levelButtons.first();
    
    if (await firstLevel.isVisible()) {
      await firstLevel.click();
      await waitForAnimations(page, 1500);
      
      // Capture initial gameplay state
      await takeScreenshot(page, outputDir, 'gameplay_start', viewportName, isMobile);
      
      // Wait a bit and capture mid-gameplay
      await waitFor(1000);
      await takeScreenshot(page, outputDir, 'gameplay_mid', viewportName, isMobile);
      
      return true;
    }
  } catch (e) {
    console.log('Gameplay capture failed:', e.message);
  }
  
  return false;
}

// Capture settings screen
async function captureSettings(page, outputDir, viewportName, isMobile) {
  try {
    // Go back to home first
    await page.goto(GAME_URL);
    await waitForAnimations(page, 800);
    
    // Look for settings button
    const settingsBtn = page.locator('text=Settings, text=⚙️, [aria-label*="settings"]').first();
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await waitForAnimations(page, 500);
      await takeScreenshot(page, outputDir, 'settings', viewportName, isMobile);
      return true;
    }
  } catch (e) {
    console.log('Settings capture failed');
  }
  
  return false;
}

// Desktop capture flow
async function captureDesktop(browser) {
  console.log('\n🖥️  Starting Desktop Captures...\n');
  
  for (const viewport of DESKTOP_VIEWPORTS) {
    console.log(`\n📐 Viewport: ${viewport.name}`);
    
    const outputDir = join(MARKETING_DIR, 'desktop', viewport.name);
    ensureDir(outputDir);
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1
    });
    
    const page = await context.newPage();
    
    try {
      // Home/Menu screen
      await captureHomeScreen(page, outputDir, viewport.name, false);
      
      // Level Select
      await captureLevelSelect(page, outputDir, viewport.name, false);
      
      // Gameplay
      await captureGameplay(page, outputDir, viewport.name, false);
      
      // Settings
      await captureSettings(page, outputDir, viewport.name, false);
      
      // Hero shot (clean menu)
      await page.goto(GAME_URL);
      await waitForAnimations(page, 1000);
      await takeScreenshot(page, outputDir, 'hero', viewport.name, false);
      
    } catch (e) {
      console.error(`Error in ${viewport.name}:`, e.message);
    }
    
    await context.close();
  }
}

// Mobile capture flow
async function captureMobile(browser) {
  console.log('\n📱 Starting Mobile Captures...\n');
  
  for (const viewport of MOBILE_VIEWPORTS) {
    // Portrait
    console.log(`\n📐 ${viewport.device} Portrait`);
    
    let outputDir = join(MARKETING_DIR, 'mobile', viewport.name, 'portrait');
    ensureDir(outputDir);
    
    let context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    
    let page = await context.newPage();
    
    try {
      await captureHomeScreen(page, outputDir, `${viewport.name}_portrait`, true);
      await captureLevelSelect(page, outputDir, `${viewport.name}_portrait`, true);
      await captureGameplay(page, outputDir, `${viewport.name}_portrait`, true);
      await captureSettings(page, outputDir, `${viewport.name}_portrait`, true);
    } catch (e) {
      console.error(`Error in ${viewport.device} portrait:`, e.message);
    }
    
    await context.close();
    
    // Landscape
    console.log(`\n📐 ${viewport.device} Landscape`);
    
    outputDir = join(MARKETING_DIR, 'mobile', viewport.name, 'landscape');
    ensureDir(outputDir);
    
    context = await browser.newContext({
      viewport: { width: viewport.height, height: viewport.width },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    
    page = await context.newPage();
    
    try {
      await captureHomeScreen(page, outputDir, `${viewport.name}_landscape`, true);
      await captureLevelSelect(page, outputDir, `${viewport.name}_landscape`, true);
      await captureGameplay(page, outputDir, `${viewport.name}_landscape`, true);
    } catch (e) {
      console.error(`Error in ${viewport.device} landscape:`, e.message);
    }
    
    await context.close();
  }
}

// Video capture function for GIF conversion
async function captureVideos(browser) {
  console.log('\n🎬 Starting Video Captures for GIFs...\n');
  
  const videoDir = join(MARKETING_DIR, 'mp4');
  ensureDir(videoDir);
  
  const viewport = { width: 1280, height: 720 };
  
  // Capture 1: Menu to Start
  console.log('Recording: Menu to Start transition...');
  let context = await browser.newContext({
    viewport,
    recordVideo: { 
      dir: videoDir,
      size: viewport 
    }
  });
  
  let page = await context.newPage();
  await page.goto(GAME_URL);
  await waitFor(1500);
  
  // Click play
  try {
    const playBtn = page.locator('text=PLAY NOW').first();
    if (await playBtn.isVisible()) {
      await playBtn.click();
    }
  } catch(e) {}
  
  await waitFor(2000);
  await page.close();
  await context.close();
  console.log('✅ Menu to start recorded');
  
  // Capture 2: Gameplay loop
  console.log('Recording: Gameplay loop...');
  context = await browser.newContext({
    viewport,
    recordVideo: { 
      dir: videoDir,
      size: viewport 
    }
  });
  
  page = await context.newPage();
  await page.goto(GAME_URL);
  await waitFor(1000);
  
  // Navigate to game
  try {
    const playBtn = page.locator('text=PLAY NOW').first();
    if (await playBtn.isVisible()) await playBtn.click();
    await waitFor(800);
    
    // Start level 1
    const level1 = page.locator('text=/^1$/').first();
    if (await level1.isVisible()) await level1.click();
    await waitFor(500);
  } catch(e) {}
  
  // Record gameplay for a few seconds
  await waitFor(4000);
  await page.close();
  await context.close();
  console.log('✅ Gameplay loop recorded');
  
  console.log('\n📹 Videos saved to:', videoDir);
  console.log('💡 Convert to GIF using: ffmpeg -i input.webm -vf "fps=15,scale=480:-1:flags=lanczos" -loop 0 output.gif');
}

// Main execution
async function main() {
  console.log('🐯 Tiger World Maze Marketing Capture Tool');
  console.log('========================================\n');
  
  // Ensure base directories
  ensureDir(MARKETING_DIR);
  
  const browser = await chromium.launch({ 
    headless: false  // Show browser for debugging
  });
  
  try {
    // Desktop captures
    await captureDesktop(browser);
    
    // Mobile captures
    await captureMobile(browser);
    
    // Video captures
    await captureVideos(browser);
    
    console.log('\n✅ All captures complete!');
    console.log(`📁 Output directory: ${MARKETING_DIR}`);
    
  } catch (error) {
    console.error('❌ Capture failed:', error);
  } finally {
    await browser.close();
  }
}

main();

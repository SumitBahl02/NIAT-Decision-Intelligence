const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SUBMISSIONS_DIR = __dirname;
const RAW_VIDEO_DIR = path.join(SUBMISSIONS_DIR, 'raw_video');

if (!fs.existsSync(RAW_VIDEO_DIR)) {
  fs.mkdirSync(RAW_VIDEO_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function record() {
  console.log('Launching Chrome with Playwright for 3-minute video capture...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--window-size=1280,720', '--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: RAW_VIDEO_DIR,
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();
  console.log('Navigating to homepage...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await sleep(6000);

  // 1. Scene 1: Introduction & Problem Context (0s - 38s)
  console.log('Scene 1: Showcasing landing page and problem statement...');
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await sleep(8000);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await sleep(8000);
  await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
  await sleep(8000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(8000);

  // 2. Scene 2: Component 1 — Multilingual Advisor in Telugu (38s - 85s)
  console.log('Scene 2: Demonstrating Multilingual AI Advisor in Telugu...');
  try {
    const teluguBtn = await page.getByRole('button', { name: /Telugu/i });
    if (await teluguBtn.isVisible()) {
      await teluguBtn.hover();
      await sleep(1500);
      await teluguBtn.click();
      await sleep(2500);
    }
  } catch (e) {
    console.log('Telugu chip select note:', e.message);
  }

  const inputSelector = 'textarea, input[placeholder*="Ask"]';
  await page.fill(inputSelector, 'What is NIAT and how is the degree awarded?');
  await sleep(3000);

  const submitBtn = await page.getByRole('button', { name: /Ask|Submit|Send/i }).first();
  await submitBtn.click();
  console.log('Waiting for Telugu response...');
  await sleep(18000);

  await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'smooth' }));
  await sleep(12000);

  // 3. Scene 2B: Fee Breakdown & Callback Lead Capture (85s - 130s)
  console.log('Scene 2B: Fee breakdown in English & callback...');
  try {
    const englishBtn = await page.getByRole('button', { name: /English/i });
    if (await englishBtn.isVisible()) {
      await englishBtn.click();
      await sleep(2000);
    }
  } catch (e) {}

  await page.fill(inputSelector, 'What is the total 4-year fee structure and hostel accommodation cost?');
  await sleep(3000);
  await submitBtn.click();
  console.log('Waiting for fee response...');
  await sleep(16000);

  await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
  await sleep(6000);

  console.log('Submitting callback request...');
  try {
    const phoneInput = await page.locator('input[type="tel"], input[placeholder*="phone"], input[placeholder*="Phone"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('9876543210');
      await sleep(3000);
      const callBtn = await page.getByRole('button', { name: /Call|Request/i }).first();
      await callBtn.click();
      await sleep(13000);
    }
  } catch (e) {
    console.log('Callback action note:', e.message);
    await sleep(10000);
  }

  // 4. Scene 3: Component 3 — Growth Operations Dashboard (130s - 175s)
  console.log('Scene 3: Transitioning to Growth Dashboard...');
  await page.goto('http://localhost:3000/dashboard/login', { waitUntil: 'networkidle' });
  await sleep(4000);

  const passwordInput = await page.locator('input[type="password"]');
  await passwordInput.fill('NxtWave@NIAT2025!');
  await sleep(2500);

  const loginBtn = await page.getByRole('button', { name: /Sign In/i });
  await loginBtn.click();
  console.log('Logged into dashboard, waiting for data load...');
  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
  await sleep(8000);

  // Scroll down to showcase Priority Queue
  await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
  await sleep(8000);

  // Click Reveal Number eye icon
  try {
    const eyeBtn = await page.locator('button[title*="Reveal"]').first();
    if (await eyeBtn.isVisible()) {
      console.log('Demonstrating phone unmasking...');
      await eyeBtn.click();
      await sleep(7000);
    }
  } catch (e) {}

  // Click Assign Counsellor
  try {
    const assignBtn = await page.getByRole('button', { name: /Assign/i }).first();
    if (await assignBtn.isVisible()) {
      console.log('Assigning lead to regional counsellor...');
      await assignBtn.click();
      await sleep(7000);
    }
  } catch (e) {}

  // Click Export Safe CSV
  try {
    const exportBtn = await page.getByRole('button', { name: /Safe CSV/i }).first();
    if (await exportBtn.isVisible()) {
      console.log('Exporting safe CSV...');
      await exportBtn.click();
      await sleep(7000);
    }
  } catch (e) {}

  // 5. Scene 4: Closing Summary & Live Metrics (175s - 185s)
  console.log('Scene 4: Closing summary & economics...');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(10000);

  console.log('Automation complete. Saving video recording...');
  const videoObj = page.video();
  await context.close();
  await browser.close();

  const videoPath = await videoObj.path();
  console.log('Raw video saved at:', videoPath);
  return videoPath;
}

async function muxVideo(rawVideoPath) {
  const narrationWav = path.join(SUBMISSIONS_DIR, 'full_narration_male.wav');
  const finalMp4 = path.join(SUBMISSIONS_DIR, 'NIAT_Growth_Hack_3Min_Walkthrough.mp4');

  console.log('Muxing video with male narration using FFmpeg...');
  const args = [
    '-y',
    '-i', rawVideoPath,
    '-i', narrationWav,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '19',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    '-movflags', '+faststart',
    finalMp4
  ];

  const res = spawnSync(ffmpegPath, args, { stdio: 'inherit' });
  if (fs.existsSync(finalMp4)) {
    const stats = fs.statSync(finalMp4);
    console.log(`\n========================================`);
    console.log(`SUCCESS! Final Male Voice Walkthrough Video Generated:`);
    console.log(`Path: ${finalMp4}`);
    console.log(`Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`========================================\n`);
  } else {
    console.error('Failed to generate final MP4.');
  }
}

async function main() {
  const rawPath = await record();
  await muxVideo(rawPath);
}

main().catch(console.error);

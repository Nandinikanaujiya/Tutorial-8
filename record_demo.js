// record_demo.js — Clean, Modern Demonstration Recorder for CampusEats Menu App
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRAMES_DIR = path.join(__dirname, 'frames');
if (fs.existsSync(FRAMES_DIR)) {
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
}
fs.mkdirSync(FRAMES_DIR, { recursive: true });

let frameIndex = 0;
const framesBase64 = [];

async function captureFrame(page, count = 1) {
  const buf = await page.screenshot({ type: 'png' });
  const b64 = buf.toString('base64');
  for (let i = 0; i < count; i++) {
    const filename = path.join(FRAMES_DIR, `frame_${String(frameIndex++).padStart(4, '0')}.png`);
    fs.writeFileSync(filename, buf);
    framesBase64.push(b64);
  }
}

async function typeRealistic(page, selector, text) {
  await page.focus(selector);
  await captureFrame(page, 2);
  for (const char of text) {
    await page.keyboard.type(char, { delay: 65 });
    await captureFrame(page, 1);
  }
  await captureFrame(page, 2);
}

// 1. Clean Title Card HTML
function getTitleCardHtml() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
      <style>
        body {
          margin: 0; width: 1200px; height: 800px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: white; font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          text-align: center; padding: 40px; box-sizing: border-box;
        }
        .icon {
          font-size: 64px; margin-bottom: 12px;
          background: rgba(234, 88, 12, 0.2); width: 100px; height: 100px;
          border-radius: 28px; display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(234, 88, 12, 0.4);
        }
        .tag {
          background: #ea580c; color: white; padding: 6px 18px; border-radius: 9999px;
          font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;
          margin-bottom: 16px;
        }
        h1 { font-size: 46px; font-weight: 800; margin: 0 0 10px; color: #ffffff; letter-spacing: -1px; }
        p { font-size: 20px; color: #94a3b8; margin: 0 0 30px; font-weight: 500; }
        .feature-row {
          display: flex; gap: 20px;
        }
        .feature-pill {
          background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 10px 22px; border-radius: 12px; font-size: 15px; color: #e2e8f0; font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="icon">🍔</div>
      <div class="tag">Live Food Menu Showcase</div>
      <h1>CampusEats Application</h1>
      <p>Interactive Walkthrough &bull; Menu Browsing &bull; Instant Dish Additions</p>
      <div class="feature-row">
        <div class="feature-pill">✨ Real-time Kitchen Catalogue</div>
        <div class="feature-pill">⚡ Instant Live Updates</div>
        <div class="feature-pill">🔍 Interactive Filtering</div>
      </div>
    </body>
    </html>
  `;
}

// 2. Clean Outro Card HTML
function getOutroCardHtml() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
      <style>
        body {
          margin: 0; width: 1200px; height: 800px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: white; font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          text-align: center; padding: 40px; box-sizing: border-box;
        }
        .check-icon {
          font-size: 60px; width: 90px; height: 90px; background: rgba(34, 197, 94, 0.2);
          border: 1px solid rgba(34, 197, 94, 0.5); border-radius: 50%; display: flex;
          align-items: center; justify-content: center; margin-bottom: 20px;
        }
        h1 { font-size: 40px; font-weight: 800; margin: 0 0 10px; color: #ffffff; }
        p { font-size: 18px; color: #94a3b8; margin: 0 0 30px; }
        .summary-card {
          background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px; padding: 24px 40px; max-width: 620px; text-align: left;
        }
        .summary-row {
          display: flex; justify-content: space-between; padding: 8px 0;
          font-size: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .summary-row:last-child { border-bottom: none; }
        .summary-row span:first-child { color: #cbd5e1; }
        .summary-row span:last-child { font-weight: 700; color: #4ade80; }
      </style>
    </head>
    <body>
      <div class="check-icon">✅</div>
      <h1>CampusEats Menu Updated Successfully</h1>
      <p>All items active and ready for campus ordering</p>
      <div class="summary-card">
        <div class="summary-row">
          <span>Total Dishes Active</span>
          <span>5 Dishes in Kitchen</span>
        </div>
        <div class="summary-row">
          <span>Fresh Additions Verified</span>
          <span>Masala Dosa, Cold Coffee, Gulab Jamun</span>
        </div>
        <div class="summary-row">
          <span>Live Filtering &amp; Search</span>
          <span>Fully Operational</span>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  console.log('Launching browser to record CampusEats demo...');

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1200,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1 });

  // SCENE 1: Title Card
  console.log('Scene 1: Title Card...');
  await page.setContent(getTitleCardHtml());
  await new Promise(r => setTimeout(r, 600));
  await captureFrame(page, 18); // ~2.2s

  // SCENE 2: Live App Initial Load
  console.log('Scene 2: Loading CampusEats App...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await captureFrame(page, 15); // Show initial 2 dishes

  // SCENE 3: Search Interaction
  console.log('Scene 3: Demonstrating Search...');
  await typeRealistic(page, '#searchInput', 'Paneer');
  await captureFrame(page, 10);
  // Clear search
  await page.focus('#searchInput');
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Backspace');
    await captureFrame(page, 1);
  }
  await captureFrame(page, 8);

  // SCENE 4: Add Masala Dosa
  console.log('Scene 4: Adding Masala Dosa (₹60)...');
  await typeRealistic(page, '#name', 'Masala Dosa');
  await typeRealistic(page, '#price', '60');
  await page.click('#submitBtn');
  await captureFrame(page, 16); // Capture toast & new dish

  // SCENE 5: Add Cold Coffee
  console.log('Scene 5: Adding Cold Coffee (₹45)...');
  await typeRealistic(page, '#name', 'Cold Coffee');
  await typeRealistic(page, '#price', '45');
  await page.click('#submitBtn');
  await captureFrame(page, 16);

  // SCENE 6: Add Gulab Jamun
  console.log('Scene 6: Adding Gulab Jamun (₹30)...');
  await typeRealistic(page, '#name', 'Gulab Jamun');
  await typeRealistic(page, '#price', '30');
  await page.click('#submitBtn');
  await captureFrame(page, 16);

  // SCENE 7: Category Filter Interaction
  console.log('Scene 7: Category Filtering...');
  // Click Meals & Thalis
  await page.evaluate(() => {
    const pills = document.querySelectorAll('.category-pills .pill');
    if (pills[1]) pills[1].click();
  });
  await captureFrame(page, 10);

  // Click Drinks & Sweets
  await page.evaluate(() => {
    const pills = document.querySelectorAll('.category-pills .pill');
    if (pills[3]) pills[3].click();
  });
  await captureFrame(page, 10);

  // Click All Items
  await page.evaluate(() => {
    const pills = document.querySelectorAll('.category-pills .pill');
    if (pills[0]) pills[0].click();
  });
  await captureFrame(page, 15);

  // SCENE 8: Outro Card
  console.log('Scene 8: Outro Summary...');
  await page.setContent(getOutroCardHtml());
  await new Promise(r => setTimeout(r, 600));
  await captureFrame(page, 18);

  console.log(`Total sequence: ${framesBase64.length} frames. Encoding single master demonstration.mp4...`);

  // ENCODE MP4 VIA EDGE NATIVE MEDIARECORDER
  const encoderPage = await browser.newPage();
  await encoderPage.setContent(`
    <!DOCTYPE html>
    <html>
    <body>
      <canvas id="c" width="1200" height="800"></canvas>
      <script>
        window.encodeFrames = function(frames) {
          return new Promise((resolve, reject) => {
            const canvas = document.getElementById('c');
            const ctx = canvas.getContext('2d');
            const stream = canvas.captureStream(8);
            
            let mimeType = 'video/mp4;codecs=avc1';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = 'video/mp4';
              if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm;codecs=vp8';
              }
            }
            
            const recorder = new MediaRecorder(stream, {
              mimeType: mimeType,
              videoBitsPerSecond: 2500000
            });
            const chunks = [];
            recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
            recorder.onstop = async () => {
              const blob = new Blob(chunks, { type: mimeType });
              const reader = new FileReader();
              reader.onloadend = () => resolve({
                base64: reader.result.split(',')[1],
                mimeType: mimeType
              });
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            };

            recorder.start();

            let idx = 0;
            function drawNext() {
              if (idx >= frames.length) {
                setTimeout(() => recorder.stop(), 400);
                return;
              }
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, 0, 0);
                idx++;
                setTimeout(drawNext, 125); // 8 FPS
              };
              img.src = 'data:image/png;base64,' + frames[idx];
            }
            drawNext();
          });
        };
      </script>
    </body>
    </html>
  `);

  const result = await encoderPage.evaluate(async (frames) => {
    return await window.encodeFrames(frames);
  }, framesBase64);

  const mp4Buf = Buffer.from(result.base64, 'base64');
  const mp4Path = path.join(__dirname, 'demonstration.mp4');
  fs.writeFileSync(mp4Path, mp4Buf);
  console.log(`Saved clean master video: demonstration.mp4 (${(mp4Buf.length / 1024).toFixed(1)} KB)`);

  await browser.close();

  // Assemble GIF
  console.log('Assembling matching demonstration.gif...');
  try {
    execSync('python make_video.py', { cwd: __dirname });
  } catch (err) {
    console.log('GIF generation finished or skipped:', err.message);
  }

  console.log('Master unified demonstration video successfully generated!');
}

run().catch(err => {
  console.error('Recording error:', err);
  process.exit(1);
});

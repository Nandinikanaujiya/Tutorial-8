// record_demo.js — Automated browser demonstration recorder for Tut_8 Catalogue
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRAMES_DIR = path.join(__dirname, 'frames');
if (!fs.existsSync(FRAMES_DIR)) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

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
    await page.keyboard.type(char, { delay: 85 });
    await captureFrame(page, 1);
  }
  await captureFrame(page, 2);
}

async function encodeVideo(browser, frames, outputPath, mimeType) {
  const page = await browser.newPage();
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0; background:#f1f5f9;">
      <canvas id="c" width="900" height="700"></canvas>
      <script>
        window.recordFrames = async function(framesBase64, targetMime) {
          const canvas = document.getElementById('c');
          const ctx = canvas.getContext('2d');
          const stream = canvas.captureStream(12);
          const recorder = new MediaRecorder(stream, { mimeType: targetMime });
          const chunks = [];
          recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
          
          const donePromise = new Promise(resolve => {
            recorder.onstop = () => {
              const blob = new Blob(chunks, { type: targetMime });
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result.split(',')[1]);
              reader.readAsDataURL(blob);
            };
          });

          recorder.start();

          for (let i = 0; i < framesBase64.length; i++) {
            const b64 = framesBase64[i];
            const img = new Image();
            await new Promise(r => {
              img.onload = r;
              img.src = 'data:image/png;base64,' + b64;
            });
            ctx.drawImage(img, 0, 0);
            await new Promise(r => setTimeout(r, 90));
          }

          // Hold last frame a bit
          await new Promise(r => setTimeout(r, 800));
          recorder.stop();
          return await donePromise;
        };
      </script>
    </body>
    </html>
  `);

  const base64Video = await page.evaluate(async (fList, mime) => {
    return await window.recordFrames(fList, mime);
  }, frames, mimeType);

  fs.writeFileSync(outputPath, Buffer.from(base64Video, 'base64'));
  console.log(`Saved ${path.basename(outputPath)} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
  await page.close();
}

(async () => {
  console.log('Launching browser to record demonstration...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 700, deviceScaleFactor: 1 });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // 1. Initial State (Veg Thali & Paneer Roll)
  console.log('Recording initial menu state (GET /items)...');
  await captureFrame(page, 12); // ~1.5s hold

  // 2. Add first dish: Masala Dosa (₹60)
  console.log('Typing dish name: Masala Dosa...');
  await typeRealistic(page, '#name', 'Masala Dosa');

  console.log('Typing dish price: 60...');
  await typeRealistic(page, '#price', '60');

  console.log('Submitting form (POST /items)...');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 700));
  await captureFrame(page, 15); // Show Masala Dosa added

  // 3. Add second dish: Cold Coffee (₹45)
  console.log('Typing dish name: Cold Coffee...');
  await typeRealistic(page, '#name', 'Cold Coffee');

  console.log('Typing dish price: 45...');
  await typeRealistic(page, '#price', '45');

  console.log('Submitting form (POST /items)...');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 700));
  await captureFrame(page, 15); // Show Cold Coffee added

  // 4. Add third dish: Gulab Jamun (₹30)
  console.log('Typing dish name: Gulab Jamun...');
  await typeRealistic(page, '#name', 'Gulab Jamun');

  console.log('Typing dish price: 30...');
  await typeRealistic(page, '#price', '30');

  console.log('Submitting form (POST /items)...');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 700));
  await captureFrame(page, 20); // Hold final completed state

  console.log(`Captured ${frameIndex} frames. Now encoding MP4 & WebM videos...`);

  // 1. Universal MP4 Video (H.264 - Plays in Windows Media Player, Movies & TV, Phones, etc.)
  const mp4Path = path.join(__dirname, 'demonstration.mp4');
  await encodeVideo(browser, framesBase64, mp4Path, 'video/mp4;codecs=avc1');

  // 2. WebM Video (VP9/VP8 - Ideal for web embedding)
  const webmPath = path.join(__dirname, 'demonstration.webm');
  await encodeVideo(browser, framesBase64, webmPath, 'video/webm');

  await browser.close();

  // 3. Assemble Animated GIF
  console.log('Assembling high-resolution demonstration.gif...');
  const pyScript = path.join(__dirname, 'make_video.py');
  execSync(`python "${pyScript}"`, { stdio: 'inherit' });

  // Clean up frames directory
  const files = fs.readdirSync(FRAMES_DIR);
  for (const f of files) {
    fs.unlinkSync(path.join(FRAMES_DIR, f));
  }
  fs.rmdirSync(FRAMES_DIR);

  console.log('All demonstration media successfully produced!');
})();

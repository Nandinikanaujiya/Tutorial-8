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
    await page.keyboard.type(char, { delay: 90 });
    await captureFrame(page, 1);
  }
  await captureFrame(page, 2);
}

async function encodeWebm(browser, frames, outputPath) {
  const page = await browser.newPage();
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <body>
      <canvas id="c" width="900" height="650"></canvas>
      <script>
        window.recordFrames = async function(framesBase64) {
          const canvas = document.getElementById('c');
          const ctx = canvas.getContext('2d');
          const stream = canvas.captureStream(12);
          const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
          const chunks = [];
          recorder.ondataavailable = e => chunks.push(e.data);
          
          const donePromise = new Promise(resolve => {
            recorder.onstop = () => {
              const blob = new Blob(chunks, { type: 'video/webm' });
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
            await new Promise(r => setTimeout(r, 100));
          }

          // Hold last frame
          await new Promise(r => setTimeout(r, 600));
          recorder.stop();
          return await donePromise;
        };
      </script>
    </body>
    </html>
  `);

  console.log('Encoding WebM video from frames in browser engine...');
  const base64Video = await page.evaluate(async (fList) => {
    return await window.recordFrames(fList);
  }, frames);

  fs.writeFileSync(outputPath, Buffer.from(base64Video, 'base64'));
  console.log('Saved WebM video to ' + outputPath);
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
  await page.setViewport({ width: 900, height: 650, deviceScaleFactor: 1 });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // 1. Initial State
  console.log('Recording initial menu state (GET /items)...');
  await captureFrame(page, 10); // ~1.5s hold

  // 2. Add first dish: Masala Dosa (₹60)
  console.log('Typing dish name: Masala Dosa...');
  await typeRealistic(page, '#name', 'Masala Dosa');

  console.log('Typing dish price: 60...');
  await typeRealistic(page, '#price', '60');

  console.log('Submitting form (POST /items)...');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 500));
  await captureFrame(page, 14); // Show Masala Dosa in list

  // 3. Add second dish: Cold Coffee (₹45)
  console.log('Typing dish name: Cold Coffee...');
  await typeRealistic(page, '#name', 'Cold Coffee');

  console.log('Typing dish price: 45...');
  await typeRealistic(page, '#price', '45');

  console.log('Submitting form (POST /items)...');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 500));
  await captureFrame(page, 14); // Show Cold Coffee in list

  // 4. Add third dish: Gulab Jamun (₹30)
  console.log('Typing dish name: Gulab Jamun...');
  await typeRealistic(page, '#name', 'Gulab Jamun');

  console.log('Typing dish price: 30...');
  await typeRealistic(page, '#price', '30');

  console.log('Submitting form (POST /items)...');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 500));
  await captureFrame(page, 18); // Hold final completed state

  console.log(`Captured ${frameIndex} frames. Now encoding WebM video...`);
  const webmPath = path.join(__dirname, 'demonstration.webm');
  await encodeWebm(browser, framesBase64, webmPath);

  await browser.close();

  // Call Python script to assemble GIF
  console.log('Assembling high-resolution demonstration.gif...');
  const pyScript = path.join(__dirname, 'make_video.py');
  execSync(`python "${pyScript}"`, { stdio: 'inherit' });

  // Clean up frames directory
  const files = fs.readdirSync(FRAMES_DIR);
  for (const f of files) {
    fs.unlinkSync(path.join(FRAMES_DIR, f));
  }
  fs.rmdirSync(FRAMES_DIR);

  console.log('Demonstration recording successfully completed!');
})();

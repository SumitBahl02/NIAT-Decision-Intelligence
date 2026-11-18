const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const base = __dirname;

const files = [
  { html: 'Layer_1_NIAT_Audit.html', pdf: 'Layer_1_NIAT_60_Min_Audit.pdf' },
  { html: 'Layer_2_Track_B_Pitch.html', pdf: 'Layer_2_Track_B_Pitch.pdf' },
  { html: 'Layer_4_Reflection.html', pdf: 'Layer_4_Reflection.pdf' },
  { html: 'Complete_NIAT_Submission.html', pdf: 'Complete_NIAT_Submission.pdf' }
];

for (const f of files) {
  const inPath = path.join(base, f.html);
  const outPath = path.join(base, f.pdf);
  const cmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${outPath}" "${inPath}"`;
  console.log('Generating:', f.pdf);
  execSync(cmd, { stdio: 'inherit' });
  if (fs.existsSync(outPath)) {
    console.log(`Generated: ${f.pdf} (${fs.statSync(outPath).size} bytes)`);
  }
}
console.log('All PDFs successfully generated!');

const { spawnSync } = require('child_process');
const ffmpeg = require('@ffmpeg-installer/ffmpeg').path;
const res = spawnSync(ffmpeg, ['-i', 'D:\\Hackathon\\niat-app\\submissions\\full_narration.wav'], { encoding: 'utf8' });
const match = (res.stderr || '').match(/Duration: (\d{2}:\d{2}:\d{2}\.\d+)/);
console.log('Audio Duration:', match ? match[1] : 'Unknown');

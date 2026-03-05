const path = require('path');
const { spawn } = require('child_process');

const appDir = path.join(__dirname, 'vertical-video-app', 'apps', 'web');
const isWindows = process.platform === 'win32';

console.log('Lancement de RushVx depuis:', appDir);
console.log('');

const child = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
  cwd: appDir,
  stdio: 'inherit',
  shell: true,
});

child.on('error', (err) => {
  console.error('Erreur:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

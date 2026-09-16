const { spawn } = require('child_process');
const path = require('path');

const electronExe = path.join(__dirname, '../node_modules/electron/dist/electron.exe');
console.log('Testing launch with:', electronExe);

const env = { ...process.env, NODE_ENV: 'production' };
delete env.ELECTRON_RUN_AS_NODE;

const proc = spawn(electronExe, ['.'], {
  cwd: path.join(__dirname, '..'),
  env
});

let stderrOutput = '';
proc.stderr.on('data', (d) => {
  stderrOutput += d.toString();
  console.error('Electron stderr:', d.toString());
});

proc.stdout.on('data', (d) => {
  console.log('Electron stdout:', d.toString());
});

setTimeout(() => {
  if (proc.exitCode !== null) {
    console.error('Process exited prematurely with code:', proc.exitCode);
    process.exit(1);
  } else {
    console.log('Electron launched and stayed running successfully! PID:', proc.pid);
    proc.kill();
    process.exit(0);
  }
}, 3000);

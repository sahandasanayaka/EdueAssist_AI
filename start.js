/**
 * EduAssist AI - Multi-service Runner (No BAT files required)
 * Runs both Express Backend (Port 5000) and Vite Frontend (Port 5173) concurrently.
 */
const { spawn } = require('child_process');
const path = require('path');

console.log('\n=============================================');
console.log('🚀 Launching EduAssist AI from VS Code...');
console.log('=============================================\n');

// 1. Launch Backend Server
const server = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// 2. Launch Vite Frontend Client
const client = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

const cleanExit = () => {
  console.log('\n🛑 Shutting down EduAssist AI services...');
  server.kill('SIGTERM');
  client.kill('SIGTERM');
  process.exit(0);
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);

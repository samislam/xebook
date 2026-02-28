// This file is used by pm2 for deployment
module.exports = {
  apps: [
    {
      name: 'xebook',
      script: 'dist/scripts/start.js',
      interpreter: 'bun',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '4G',
    },
  ],
}

module.exports = {
  apps: [
    {
      name: 'nextjs-dashboard',
      script: 'npm',
      args: 'run start -- --port 3200',
      cwd: '/home/weruby/Dev_AI/web',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/tmp/nextjs-error.log',
      out_file: '/tmp/nextjs-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
        PORT: 3200,
      },
    },
  ],
};

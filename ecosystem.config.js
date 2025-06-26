module.exports = {
  apps: [
    {
      name: 'address-service',
      script: 'dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--require @opentelemetry/auto-instrumentations-node/register'
      },
      env_file: '.env',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: 'address-service-dev',
      script: 'src/index.ts',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        NODE_OPTIONS: '--require @opentelemetry/auto-instrumentations-node/register'
      },
      env_file: '.env',
      watch: ['src'],
      ignore_watch: ['node_modules', 'logs', 'dist', '.git'],
      max_memory_restart: '1G',
      error_file: './logs/err-dev.log',
      out_file: './logs/out-dev.log',
      log_file: './logs/combined-dev.log',
      time: true,
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',
      interpreter: 'node',
      interpreter_args: '-r ts-node/register -r tsconfig-paths/register',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
}; 
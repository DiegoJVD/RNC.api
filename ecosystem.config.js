module.exports = {
  apps: [
    {
      name: 'rnc-api',
      script: './app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 323
      }
    },
    {
      name: 'scheduler de rnc-api',
      script: './scheduler.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PORT: 324 // Ajusta el puerto aquí
      }
    }
  ]
};

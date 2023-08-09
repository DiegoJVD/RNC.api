module.exports = {
  apps: [
    {
      name: 'rnc-api',
      script: './app.js',
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: 'production',
        PORT: 325
      }
    },
    {
      name: 'scheduler de rnc-api',
      script: './scheduler.js',
      instances: 1,
      autorestart: true,
      env: {
        PORT: 326
      }
    }
  ]
};

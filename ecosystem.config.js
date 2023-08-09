module.exports = {
  apps: [
    {
      name: 'rnc-api', // Cambia esto al nombre de tu aplicación
      script: './app.js', // Cambia esto al nombre de tu archivo principal de Sails.js
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000 // Puerto que deseas utilizar (por defecto 1337 para Sails.js)
      }
    },
    {
      name: 'scheduler de rnc-api',
      script: './scheduler.js', // Ajusta esto al nombre de tu archivo scheduler.js
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};

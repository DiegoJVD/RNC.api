module.exports = {
  apps: [
    {
      name: 'rnc-api',
      script: './app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 228
      }
    },
    {
      name: 'scheduler de rnc-api',
      script: './scheduler.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      exec_interpreter: 'node', // Agrega esta línea para ejecutar el script directamente con Node.js
      exec_mode: 'fork', // Cambia a 'fork' para ejecutar en el mismo proceso
      env: {
        NODE_ENV: 'production',
        PORT: 329
      },
      // Asegúrate de que esta tarea se inicie junto con la aplicación principal
      // (puedes ajustar el evento según tus necesidades)
      wait_ready: true,
      listen_timeout: 5000,
      kill_timeout: 5000
    }
  ]
};

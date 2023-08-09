const cron = require('node-cron');
const sails = require('sails');
const path = require('path');
const RncController = require('./api/controllers/RncController'); // Ajusta la ruta según la ubicación de tu controlador


// Configura Sails (opcionalmente)
sails.lift({
  // configuración de Sails (si es necesario)
}, (err) => {
  if (err) {
    return console.error(err);
  }

  // Programa la tarea cron para ejecutar el controlador todos los días a las 3 am
  cron.schedule('*/2 * * * *', async () => {
    try {
      const resultado = await RncController.prueba();

      const ahora = new Date();

      const hora = ahora.getHours().toString().padStart(2, '0');
      const minutos = ahora.getMinutes().toString().padStart(2, '0');
      const segundos = ahora.getSeconds().toString().padStart(2, '0');

      console.log(`La hora local es: ${hora}:${minutos}:${segundos}`);


      console.log(`Tarea programada ejecutada a las: ${hora}:${minutos}:${segundos}`);
    } catch (error) {
      console.error('Error en la tarea programada:', error);
    }
  });
});

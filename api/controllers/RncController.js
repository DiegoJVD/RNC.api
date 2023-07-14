/**
 * RncController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const fs = require('fs');
const AdmZip = require('adm-zip');
const puppeteer = require('puppeteer');

module.exports = {
  importarDesdeZip: async function (req, res) {
    try {
      const url = 'https://www.dgii.gov.do/app/WebApps/Consultas/RNC/DGII_RNC.zip';
      const zipFile = './archivo.zip';
      const txtFile = './archivo.txt';

      const downloadFile = (url, destination) => {
        return new Promise((resolve, reject) => {
          const file = fs.createWriteStream(destination);
          require('https').get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve();
            });
          }).on('error', (err) => {
            fs.unlink(destination);
            reject(err);
          });
        });
      };

      await downloadFile(url, zipFile);

      // Extraer el archivo TXT del ZIP
      const zip = new AdmZip(zipFile);
      const zipEntries = zip.getEntries();
      const txtEntry = zipEntries.find((entry) => entry.entryName === 'TMP/DGII_RNC.TXT');
      if (!txtEntry) {
        return res.status(404).send('No se encontró el archivo deseado en el ZIP.');
      }

      fs.writeFileSync(txtFile, txtEntry.getData().toString('utf8'));

      // Leer y mostrar el contenido del archivo TXT
      // const contenido = fs.readFileSync(txtFile, 'utf8').split('\n').find((linea) => linea.startsWith('101863099'));
      let contenido1 = fs.readFileSync(txtFile, 'utf8').split(/\n|\|/);

      let linea = [];
      let lineaAux = [];
      let contenido = [];

      contenido = contenido1.map((value) => {
        if (linea.length < 11) {
          linea.push(value);
        }
        else if (linea.length === 11) {
          lineaAux = linea;
          linea = [];
          return {
            cedula_RNC: lineaAux[0].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(), //confirmado
            nombre_RazonSocial: lineaAux[1].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(), //confirmado
            nombreComercial: lineaAux[2].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(), //confirmado
            categoria: lineaAux[4].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(),
            regimenPagos: lineaAux[10].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(), //confirmado
            estado: lineaAux[9].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(), //confirmado
            actividadEconomica: lineaAux[3].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(), //confirmado
            administracionLocal: lineaAux[7].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(),
            fecha: lineaAux[8].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(),
            otraFecha: lineaAux[6].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(),
            campo9: lineaAux[5].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(),
          };


        }
        else {
          return undefined;
        }

      })
        .filter((value) => value !== undefined);


      console.log(contenido);

      return res.status(200).send(contenido);
    } catch (error) {
      return res.status(500).send('Error al descargar y descomprimir el archivo: ' + error.message);
    }
  },
  scrapear: async (req, res) => {
    try {
      console.log(req.query.rnc);
      const rnc = req.query.rnc;

      if (!rnc) {
        return res.badRequest('Debe especificar un RNC.');
      }
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      // Navega a la página web
      await page.goto('https://www.dgii.gov.do/app/WebApps/ConsultasWeb/consultas/rnc.aspx#');

      // Espera a que se cargue la página y se muestre el formulario
      await page.waitForSelector('#ctl00_cphMain_txtRNCCedula');

      console.log('Formulario encontrado');

      // Ingresa el código de búsqueda en el campo adecuado
      await page.type('#ctl00_cphMain_txtRNCCedula', rnc);

      console.log('Código de búsqueda ingresado');

      // Haz clic en el botón de búsqueda
      await page.click('#ctl00_cphMain_btnBuscarPorRNC');

      console.log('Botón de búsqueda presionado');

      // Espera un tiempo adicional para que se carguen los resultados
      await page.waitForTimeout(5000);

      // Espera a que se carguen los resultados
      await page.waitForSelector('#ctl00_cphMain_dvDatosContribuyentes');

      console.log('Resultados encontrados');

      const datosEncontrados = await page.evaluate(async () => {
        const tabla = await document.querySelector('#ctl00_cphMain_dvDatosContribuyentes');
        const filas = tabla.querySelectorAll('tr');

        const datos = [];

        for (let i = 1; i < filas.length; i++) {
          const celdas = filas[i].querySelectorAll('td');
          const dato = celdas[1].innerText.trim();
          datos.push(dato);
        }

        return datos;
      }).catch((error) => {
        console.error('Error al evaluar la página:', error);
      });

      console.log('Datos encontrados:', datosEncontrados);

      // Cierra el navegador
      await browser.close();

      return res.ok(datosEncontrados);
    } catch (error) {
      console.error('Error al realizar el scraping:', error);
      return res.serverError('Ocurrió un error al consultar los datos.');
    }
  },
};


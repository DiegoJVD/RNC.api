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

      const zip = new AdmZip(zipFile);
      const zipEntries = zip.getEntries();
      const txtEntry = zipEntries.find((entry) => entry.entryName === 'TMP/DGII_RNC.TXT');
      if (!txtEntry) {
        return res.status(404).send('No se encontró el archivo deseado en el ZIP.');
      }

      fs.writeFileSync(txtFile, txtEntry.getData().toString('utf8'));

      let contenido1 = fs.readFileSync(txtFile, 'utf8').split(/(\|RST|\|NORMAL|\|PST)(\r\n)/).filter((elem) => elem.trim() !== '');
      // let contenido2 = fs.readFileSync(txtFile, 'utf8').split('\r\n');

      // console.log("cantidad1",contenido1);

      const resultadoFinal = [];
      for (let i = 0; i < contenido1.length; i += 2) {
        if (i + 1 < contenido1.length) {
          resultadoFinal.push(contenido1[i] + contenido1[i + 1]);
        } else {
          resultadoFinal.push(contenido1[i]);
        }
      }

      console.log(resultadoFinal.length);
      // console.log(contenido2.length);

      // console.log(resultadoFinal);

      // console.log(contenido1.length);
      let linea = [];
      let lineaAux = [];
      let contenido = [];

      contenido = resultadoFinal.map((value) => {
        let lineaAux = value.split('|');
        return {
          cedula_RNC: lineaAux[0], //confirmado
          nombre_RazonSocial: lineaAux[1], //confirmado
          nombreComercial: lineaAux[2], //confirmado
          regimenPagos: lineaAux[10], //confirmado
          estado: lineaAux[9], //confirmado
          actividadEconomica: lineaAux[3],//confirmado
          fecha: lineaAux[8], //confirmado
          categoria: '',
          administracionLocal: '', //nunca encontrado
          campo4: lineaAux[4], //siempre vacio sin confirmar
          campo5: lineaAux[5], //siempre vacio sin confirmar
          campo6: lineaAux[6], //siempre vacio sin confirmar
          campo7: lineaAux[7], //siempre vacio sin confirmar
        };

      });

      // console.log(contenido.filter((value) => value.cedula_RNC === '02300271943'));
      // console.log(contenido.filter((value) => value.cedula_RNC === '00101483410'));
      // console.log(contenido.filter((value) => value.regimenPagos === '' || value.regimenPagos === ' ' || value.regimenPagos === null || value.regimenPagos === undefined));
      // console.log(contenido.filter((value) => value.categoria !== '' && value.categoria !== ' ' && value.categoria !== null && value.categoria !== undefined));




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


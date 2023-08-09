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

      const resultadoFinal = [];
      for (let i = 0; i < contenido1.length; i += 2) {
        if (i + 1 < contenido1.length) {
          resultadoFinal.push(contenido1[i] + contenido1[i + 1]);
        } else {
          resultadoFinal.push(contenido1[i]);
        }
      }

      let contenido = [];

      contenido = resultadoFinal.map((value) => {
        let lineaAux = value.split('|');
        return {
          cedula_RNC: lineaAux[0].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(), //confirmado
          nombre_RazonSocial: lineaAux[1].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(), //confirmado
          nombreComercial: lineaAux[2].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(), //confirmado
          regimenPagos: lineaAux[10].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(), //confirmado
          estado: lineaAux[9].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(), //confirmado
          actividadEconomica: lineaAux[3].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(),//confirmado
          fecha: lineaAux[8].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(), //confirmado
          categoria: '',
          administracionLocal: '', //nunca encontrado
          campo4: lineaAux[4].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(), //siempre vacio sin confirmar
          campo5: lineaAux[5].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(), //siempre vacio sin confirmar
          campo6: lineaAux[6].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(), //siempre vacio sin confirmar
          campo7: lineaAux[7].replace(/(\w+)\s{2,}(\w+)/g, '$1 $2').trim(),
        };

      });

      //crear rncs pero solo si no existen
      // let rncsCreados = [];
      // for (let i = 0; i < contenido.length; i++) {
      //   let rnc = await Rnc.findOne({ cedula_RNC: contenido[i].cedula_RNC });
      //   if (!rnc) {
      //     rnc = await Rnc.create(contenido[i]).fetch();
      //     rncsCreados.push(rnc);
      //   }
      //   else {
      //     rnc = await Rnc.updateOne({ cedula_RNC: contenido[i].cedula_RNC }).set(contenido[i]);
      //     rncsCreados.push(rnc);
      //   }
      // }
      let rncsEliminados = await Rnc.destroy({}).fetch();

    //  console.log(rncsEliminados);

      let rncsCreados = await Rnc.createEach(contenido).fetch();
      return res.status(200).send("Se han creado " + rncsCreados.length + " RNCs.");



    } catch (error) {
      return res.status(500).send('Error al descargar y descomprimir el archivo: ' + error.message);
    }
  },
  scrapear: async (req, res) => {
    try {
      const rnc = req.query.rnc;

      if (!rnc) {
        return res.badRequest('Debe especificar un RNC.');
      }
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      // Navega a la página web
      await page.goto('https://www.dgii.gov.do/app/WebApps/ConsultasWeb/consultas/rnc.aspx#');

      await page.waitForSelector('#ctl00_cphMain_txtRNCCedula');


      // Ingresa el código de búsqueda en el campo adecuado
      await page.type('#ctl00_cphMain_txtRNCCedula', rnc);

      // Haz clic en el botón de búsqueda
      await page.click('#ctl00_cphMain_btnBuscarPorRNC');

      // Espera un tiempo adicional para que se carguen los resultados
      await page.waitForTimeout(5000);

      // Espera a que se carguen los resultados
      await page.waitForSelector('#ctl00_cphMain_dvDatosContribuyentes');

      const datosEncontrados = await page.evaluate(async () => {
        const tabla = await document.querySelector('#ctl00_cphMain_dvDatosContribuyentes');
        const filas = tabla.querySelectorAll('tr');

        const datos = {};

        for (let i = 0; i < filas.length; i++) {
          const celdas = filas[i].querySelectorAll('td');
          const dato = celdas[0].innerText.trim();
          const valor = celdas[1].innerText.trim();
          datos[dato] = valor;
        }

        return datos;
      }).catch((error) => {
        console.error('Error al evaluar la página:', error);
      });

      if(Object.keys(datosEncontrados).length === 0) {
        return res.badRequest('No se encontraron datos para el RNC especificado.');
      }

      await browser.close();

      return res.ok(datosEncontrados);
    } catch (error) {
      console.error('Error al realizar el scraping:', error);
      return res.serverError('Ocurrió un error al consultar los datos.');
    }
  },
  buscarLocal: async (req, res) => {
    try {
      const filter = req.query.filter;

      if (!filter) {
        const rncs = await Rnc.find().limit(10);
        if (rncs.length > 0) {
          return res.ok(rncs);
        }

        return res.badRequest('No se encontraron RNCs.');
      }

      const rncs = await Rnc.find(
        {
          where: {
            or: [
              { cedula_RNC: { contains: filter } },
              { nombre_RazonSocial: { contains: filter } },
              { nombreComercial: { contains: filter } },
              { actividadEconomica: { contains: filter } },
              { estado: { contains: filter } },
              { regimenPagos: { contains: filter } },
              { fecha: { contains: filter } },
              { categoria: { contains: filter } },
              { administracionLocal: { contains: filter } },
            ]
          }
        }
      )
        .meta({ makeLikeModifierCaseInsensitive: true })
        .limit(20);

      if (rncs.length > 0) {
        return res.ok(rncs);
      }

      return res.notFound('No se encontraron RNCs.');
    }
    catch (error) {
      console.error('Error al realizar el scraping:', error);
      return res.serverError('Ocurrió un error al consultar los datos.');
    }
  },
  buscarLocalPorRnc: async (req, res) => {
    try {
      const filter = req.query.filter;

      if (!filter) {
        const rncs = await Rnc.find().limit(10);
        if (rncs.length > 0) {
          return res.ok(rncs);
        }

        return res.notFound('No se encontraron RNCs.');
      }

      const rncs = await Rnc.findOne({ cedula_RNC: { contains: filter } })
        .meta({ makeLikeModifierCaseInsensitive: true })

      if (rncs) {
        return res.ok(rncs);
      }

      return res.notFound('No se encontraron RNCs.');
    }
    catch (error) {
      console.error('Error al realizar el scraping:', error);
      return res.serverError('Ocurrió un error al consultar los datos.');
    }
  },
  prueba : async (req, res) => {
    console.log("hola");
  }
};

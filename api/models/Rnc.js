/**
 * Rnc.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    cedula_RNC: {
      type: 'string',
      required: false,
    },
    nombre_RazonSocial: {
      type: 'string',
      required: false,
    },
    nombreComercial: {
      type: 'string',
      required: false,
    },
    categoria: {
      type: 'string',
      required: false,
    },
    regimenPagos: {
      type: 'string',
      required: false,
    },
    estado: {
      type: 'string',
      required: false,
    },
    actividadEconomica: {
      type: 'string',
      required: false,
    },
    administracionLocal: {
      type: 'string',
      required: false,
    }
  },

};


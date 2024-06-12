const { format } = require('date-fns');
const Handlebars = require('handlebars');

const helpers = {};

helpers.dateString = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'PP'); // 'PP' es un formato que muestra la fecha en un estilo largo, por ejemplo, "June 22, 2024".
}

Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});



module.exports = helpers;
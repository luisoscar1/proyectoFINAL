const { format } = require('date-fns');
const Handlebars = require('handlebars');

const helpers = {};

helpers.dateString = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'PP'); 
}

Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});



module.exports = helpers;
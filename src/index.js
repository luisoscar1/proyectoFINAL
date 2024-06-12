const express = require('express');
const morgan = require('morgan');
const { engine } = require('express-handlebars');
const flash = require('connect-flash');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const {database} = require('./keys')
const path = require('path');
const passport = require('passport');
const multer = require('multer');

// Inicialización de la aplicación
const app = express();
require('./lib/passport');


// Ajustes
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', engine({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: require('./lib/handlebars')
}));
app.set('view engine', '.hbs');

// Middlewares
app.use(session({
    secret: 'sesiones',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(database)

}));
app.use(flash());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());


//variables globales
app.use((req, res, next) =>{
    app.locals.success = req.flash('success');
    app.locals.success = req.flash('message');
    app.locals.user = req.user;
    next();
});

// Routes
app.use(require('./routes'));
app.use(require('./routes/authentication'));
app.use('/animales', require('./routes/animales'));
app.use('/reportes', require('./routes/reportes'));

//public
app.use(express.static(path.join(__dirname, 'public')));

// Servidor escuchando en el puerto
app.listen(app.get('port'), () => {
    console.log('Servidor en el puerto', app.get('port'));
});

const express = require('express');
const router = express.Router();
const pool = require('../database')
const multer = require('multer');
const path = require('path');
const { isLoggedIn } = require('../lib/auth');
const { log } = require('console');

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../public/uploadsReportes'),
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const uploadImage = multer({
    storage,
    limits: { fileSize: 1000000 }
}).single('image');

router.get('/verAdopciones', isLoggedIn, async (req, res) => {
    const adopciones = await pool.query('SELECT * FROM adopciones WHERE id_sucursal = ?', [req.user.id]);
    console.log('adopciones', adopciones);

    if (adopciones.length > 0) {
        const adopcion = adopciones[0];
        console.log('adopcion seleccionada', adopcion);

        const animales = await pool.query('SELECT * FROM animales WHERE id = ?', [adopcion.id_animal]);
        if (animales.length > 0) {
            const animal = animales[0];
            const usuarios = await pool.query('SELECT * FROM usuarios WHERE id = ?', [adopcion.id_usuario]);

            console.log('animal', animal);
            if (usuarios.length > 0) {
                const usuario = usuarios[0];
                console.log('animal', usuario);

                res.render('reportes/verAdopcionesAdmin', { animal, adopcion, usuario });
            }

        } else {
            console.log('No se encontró ningún animal con ese ID');
        }
    } else {
        console.log('No se encontraron adopciones con ese ID de sucursal');
    }
});

router.get('/add', async (req, res) => {

    const usuarios = await pool.query("SELECT * FROM usuarios WHERE tipo = 'surcusal'");
    console.log(usuarios);
    res.render('reportes/agregarReporte', { usuarios });
});

router.get('/misReportes', async (req, res) => {

    const usuarios = await pool.query('SELECT * FROM reportes WHERE id_usuario = ?', [req.user.id]);
    console.log(usuarios);
    res.render('reportes/verMisReportes', { usuarios });
});

router.post('/add', uploadImage, async (req, res) => {
    const { tipo, ubicacion, surcusal, notas, numeroTelefono, estado } = req.body;
    const image = req.file ? req.file.filename : null;
    const newReporte = {
        tipo,
        image,
        ubicacion,
        surcusal,
        notas,
        numeroTelefono,
        id_usuario: req.user.id,
        estado
    };
    console.log(newReporte);

    try {
        await pool.query('INSERT INTO reportes SET ?', [newReporte]);
        res.redirect('/animales/todos');
    } catch (error) {
        console.error('Error al guardar el reporte:', error);
        res.status(500).send('Error al guardar el reporte');
    }
});


router.get('/add', async (req, res) => {

    const usuarios = await pool.query("SELECT * FROM usuarios WHERE tipo = 'surcusal'");
    console.log(usuarios);
    res.render('reportes/agregarReporte', { usuarios });
});


router.get('/misReportesSurcusal', async (req, res) => {

    const usuarios = await pool.query('SELECT * FROM reportes WHERE surcusal = ?', [req.user.fullname]);
    console.log(usuarios);
    res.render('reportes/verLosReportes', { usuarios });
});

router.get('/edit/:id', async (req, res) => {
    console.log(req.params.id);
    const { id } = req.params;
    const reportes = await pool.query('SELECT * FROM reportes WHERE id = ?', [id]);
    console.log(reportes);
    res.render('reportes/editarReportes', { reportes: reportes[0] });
});

router.post('/edit/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const currentReportResult = await pool.query('SELECT * FROM reportes WHERE id = ?', [id]);
    console.log('xd:', currentReportResult)
    try {
        const currentReportResult = await pool.query('SELECT * FROM reportes WHERE id = ?', [id]);

    
        if (currentReportResult.length === 0) {
            return res.status(404).send('Reporte no encontrado');
        }

        const reporteActual = currentReportResult[0];

        const newReporte = {
            estado: req.body.estado || reporteActual.estado,
        };
        console.log('entro', newReporte)
        
        await pool.query('UPDATE reportes SET ? WHERE id = ?', [newReporte, id]);
        res.redirect('/reportes/misReportesSurcusal');
    } catch (error) {
        console.error('Error al actualizar el reporte:', error);
        res.status(500).send('Error interno del servidor');
    }
});

router.get('/Eliminar/:id', async (req, res) => {
    console.log(req.params.id);
    const { id } = req.params;
    const reportes = await pool.query('SELECT * FROM reportes WHERE id = ?', [id]);
    console.log(reportes);
    await pool.query('DELETE FROM reportes WHERE id = ?', [id]);
    res.redirect('/reportes/misReportesSurcusal');
});




module.exports = router;
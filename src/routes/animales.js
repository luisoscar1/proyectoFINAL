const express = require('express');
const router = express.Router();
const pool = require('../database')
const multer = require('multer');
const path = require('path');
const { isLoggedIn } = require('../lib/auth');
const { log } = require('console');

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../public/uploads'),
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
})

function checkUserType(req, res, next) {
    if (req.user.tipo === 'Adoptante') {
        return res.status(403).send('Acceso Denegado - Los administradores no pueden añadir animales.');
    }
    next();
}


const uploadImage = multer({
    storage,
    limits: { fileSize: 1000000 }
}).single('image');


router.get('/adoptar/:id', isLoggedIn, async (req, res) => {
    console.log('anima id', req.params)
    const animales = await pool.query('SELECT * FROM animales WHERE id = ?', [req.params.id]);
    console.log('asda',animales);
    res.render('animales/adoptar', {  animales: animales[0]  });
});


router.post('/adopciones', isLoggedIn, async (req, res) => {
    const {id_animal,id_sucursal, fecha_adopcion, notas } = req.body; 
    try {
        const nuevaAdopcion = {
            id_animal,
            id_usuario: req.user.id,
            id_sucursal, 
            fecha_adopcion,
            notas
        }
        console.log(nuevaAdopcion)
        await pool.query('INSERT INTO adopciones SET ?', [nuevaAdopcion])
        req.flash('success', 'La adopción ha sido registrada exitosamente');
        res.redirect('/animales/todos');
    } catch (error) {
        console.error('Error al registrar la adopción:', error);
        req.flash('error', 'No se pudo registrar la adopción');
        res.status(500).send('Error interno del servidor');
    }
});

router.get('/add', isLoggedIn, checkUserType, (req, res) => {
    res.render('animales/add');
});

router.post('/add', isLoggedIn, uploadImage, async (req, res) => {
    const { nombre, especie, raza, edad, sexo, fecha_ingreso, fecha_nacimiento, vacunas, esterilizado } = req.body;
    const image = req.file ? req.file.filename : null; 

    const tipo = req.user.tipo;
    const newAnimales = {
        image,
        nombre,
        especie,
        raza,
        edad,
        sexo,
        fecha_ingreso,
        fecha_nacimiento,
        vacunas,
        esterilizado,
        user_id: req.user.id,
        tipo
    };

    try {
        await pool.query('INSERT INTO animales SET ?', [newAnimales]);
        req.flash('success', 'El anuncio de adopcion se ha creado exitosamente');
        res.redirect('/animales/mios');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error inserting data');
    }
});

router.get('/todos', isLoggedIn, async (req, res) => {
    
    const animales = await pool.query('SELECT * FROM animales');

    
    const animalesConAdopcion = await Promise.all(animales.map(async (animal) => {
        const adopcion = await pool.query('SELECT * FROM adopciones WHERE id_animal = ? AND id_usuario = ?', [animal.id, req.user.id]);
        animal.adoptadoPorUsuario = adopcion.length > 0; 
        return animal;
    }));

    console.log(animalesConAdopcion);
    res.render('animales/listaDeAnimalesT', { animales: animalesConAdopcion });
});


router.get('/mios', isLoggedIn, async (req, res) => {
    const animales = await pool.query('SELECT * FROM animales WHERE user_id = ?', [req.user.id]);
    console.log(animales);
    res.render('animales/listaDeAnimales', { animales });
});



router.get('/delete/:id', isLoggedIn, async (req, res) => {
    console.log(req.params.id);
    const { id } = req.params;
    await pool.query('DELETE FROM animales WHERE ID = ?', [id]);
    res.redirect('/animales/mios');
})

router.get('/edit/:id', isLoggedIn, async (req, res) => {
    console.log(req.params.id);
    const { id } = req.params;
    const animales = await pool.query('SELECT * FROM animales WHERE id = ?', [id]);
    res.render('animales/edit', { animales: animales[0] });
});


router.post('/edit/:id', isLoggedIn, uploadImage, async (req, res) => {
    const { id } = req.params;
    try {
        
        const currentAnimalResult = await pool.query('SELECT * FROM animales WHERE id = ?', [id]);
        if (currentAnimalResult.length === 0) {
            return res.status(404).send('Animal no encontrado');
        }

        const animalActual = currentAnimalResult[0];

        
        const image = req.file ? req.file.filename : animalActual.image;

        const newAnimales = {
            image: image,
            nombre: req.body.nombre || animalActual.nombre,
            especie: req.body.especie || animalActual.especie,
            raza: req.body.raza || animalActual.raza,
            edad: req.body.edad || animalActual.edad,
            sexo: req.body.sexo || animalActual.sexo,
            fecha_ingreso: req.body.fecha_ingreso || animalActual.fecha_ingreso,
            fecha_nacimiento: req.body.fecha_nacimiento || animalActual.fecha_nacimiento,
            vacunas: req.body.vacunas || animalActual.vacunas,
            esterilizado: req.body.esterilizado || animalActual.esterilizado
        };

        
        await pool.query('UPDATE animales SET ? WHERE id = ?', [newAnimales, id]);
        res.redirect('/animales/mios');
    } catch (error) {
        console.error('Error al actualizar el animal:', error);
        res.status(500).send('Error interno del servidor');
    }
});








module.exports = router;
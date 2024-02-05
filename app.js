const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const app = express();
const PORT = 3000;

// Conexión a MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/prueba', {})
    .then(() => console.log('Conectado a MongoDB...'))
    .catch(err => console.error('No se pudo conectar a MongoDB...', err));

// modelo de Usuario
const UserSchema = new mongoose.Schema({
    username: String,
    password: String
});

const User = mongoose.model('User', UserSchema);

app.use(express.json());

//cors
const corsOptions = {
    origin: 'http://www.midominio.es',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// IP de cada petición
app.use((req, res, next) => {
    console.log(`Petición recibida desde ${req.ip} hacia ${req.path}`);
    next();
});

app.post('/nuevoUsuario', async (req, res) => {
    try {
        const { username, password } = req.body;
        const encryptPassword = bcrypt.hashSync(password, 10);
        const newUser = new User({ username, password: encryptPassword });
        await newUser.save();
        res.status(201).send({ message: 'Nuevo usuario creado correctamente' });
    } catch (error) {
        res.status(500).send({ message: 'Error al crear nuevo usuario', error });
    }
});

app.get('/todosUsuarios', async (req, res) => {
    try {
        const users = await User.find({});
        res.send(users);
    } catch (error) {
        res.status(500).send({ message: 'Error al obtener los usuarios', error });
    }
});

app.put('/actualizarUsuario/:username', async (req, res) => {
    const { username } = req.params;
    const { newPassword } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        const user = await User.findOneAndUpdate({ username }, { $set: { password: hashedPassword } }, { new: true });
        if (user) {
            res.send({ message: 'Usuario actualizado correctamente' });
        } else {
            res.status(404).send({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Error al actualizar el usuario', error });
    }
});

app.delete('/borrarUsuario/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const result = await User.deleteOne({ username });
        if (result.deletedCount > 0) {
            res.send({ message: 'Usuario eliminado correctamente' });
        } else {
            res.status(404).send({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Error al eliminar el usuario', error });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && bcrypt.compareSync(password, user.password)) {
            res.send({ message: 'Autenticación exitosa' });
        } else {
            res.status(401).send({ message: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Error al autenticar el usuario', error });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
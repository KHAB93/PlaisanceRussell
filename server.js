const express = require('express');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const catwayRoutes = require('./routes/catwayRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('./models/User'); 
const docsRoutes = require('./routes/docsRoutes'); 
const path = require('path');


const app = express();
 

// Middleware pour gérer les sessions
app.use(session({
    secret: 'votre_secret',
    resave: false,
    saveUninitialized: true
}));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); // Utilisez le middleware flash

// Configurer EJS comme moteur de template
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 

// Configuration de la stratégie d'authentification
passport.use(new LocalStrategy(async (username, password, done) => {
    console.log('Tentative de connexion avec:', username); // Log du nom d'utilisateur
    try {
        const user = await User.findOne({ username });
        if (!user) {
            console.log('Utilisateur non trouvé');
            return done(null, false, { message: 'Nom d\'utilisateur incorrect.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Mot de passe incorrect');
            return done(null, false, { message: 'Mot de passe incorrect.' });
        }

        console.log('Connexion réussie pour:', user.username);
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// Sérialiser l'utilisateur dans la session
passport.serializeUser ((user, done) => {
    done(null, user.id);
});

// Désérialiser l'utilisateur de la session
passport.deserializeUser (async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/Databases')
.then(() => console.log('Connecté à MongoDB'))
.catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/catways', catwayRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/docs', docsRoutes);

// Page d'accueil
app.get('/', (req, res) => {
    res.render('layout', { 
        title: 'Accueil - Application de Gestion des Catways', 
        body: '<h1>Bienvenue dans l\'application de gestion des catways</h1><p>Cette application vous permet de gérer les catways et les réservations.</p><form method="POST" action="/api/auth/login"><input type="text" name="username" placeholder="Nom d\'utilisateur" required><input type="password" name="password" placeholder="Mot de passe" required><button type="submit">Connexion</button></form><a href="/docs">Documentation de l\'API</a>'
    });
});

// Démarrer le serveur
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
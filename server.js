const dotenv = require('dotenv'); 
dotenv.config(); // Charger les variables d'environnement AVANT tout le reste
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
const bcrypt = require('bcryptjs');
const User = require('./models/User'); 
const docsRoutes = require('./routes/docsRoutes'); 
const path = require('path');
const fs = require('fs'); 

const uri = 'mongodb+srv://bahaakhatibi:ngsaef4NImmCqFE7@cluster0.qpz56.mongodb.net/mydatabase?retryWrites=true&w=majority';

const filePath = path.join(__dirname, 'data', 'catways.json'); 

console.log('MONGO_URI:', process.env.MONGO_URI); 

const app = express();
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Middleware pour gérer les sessions
app.use(session({
    secret: process.env.SESSION_SECRET || 'votre_secret',
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

// Configuration et connexion à MongoDB
async function connectToDatabase() {
    try {
        const MONGO_URI = process.env.MONGO_URI;
        if (!MONGO_URI) {
            throw new Error('MONGO_URI n\'est pas défini dans les variables d\'environnement.');
        }
        
        console.log('Connexion à MongoDB...');
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('Connecté à MongoDB.');
    } catch (error) {
        console.error('Erreur de connexion à MongoDB:', error.message);
        throw error; // Relancer l'erreur pour qu'elle soit visible dans les logs Vercel
    }
}



connectToDatabase();

// Fonction de migration
async function importData() {
    try {
        // Lire le fichier JSON à partir du chemin spécifié
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Remplacez 'catways' par le nom de votre collection
        const collection = mongoose.connection.collection('catways');

        // Mettre à jour ou insérer les données
        for (const item of data) {
            await collection.updateOne(
                { _id: item._id }, // Critère de recherche
                { $set: item }, // Mettre à jour le document
                { upsert: true } // Créer un nouveau document si aucun document correspondant n'est trouvé
            );
        }
        console.log('Données importées avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'importation des données:', error);
    }
}

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

console.log(`Requête reçue à ${new Date().toISOString()}`);

app.post('/api/ma-fonction', (req, res) => {
    const timeoutDuration = 60000; // 60 secondes
    let isResponseSent = false;

    console.log('Début de la tâche asynchrone.');

    const timeout = setTimeout(() => {
        if (!isResponseSent) {
            console.error('Timeout atteint.');
            isResponseSent = true;
            res.status(500).send(`Timeout de ${timeoutDuration / 1000} secondes dépassé.`);
        }
    }, timeoutDuration);

    someAsyncFunction()
        .then(result => {
            if (!isResponseSent) {
                console.log('Résultat obtenu avant le timeout.');
                isResponseSent = true;
                clearTimeout(timeout);
                res.status(200).send(result);
            }
        })
        .catch(err => {
            if (!isResponseSent) {
                console.error('Erreur pendant la tâche :', err);
                isResponseSent = true;
                clearTimeout(timeout);
                res.status(500).send('Erreur pendant le traitement.');
            }
        });
});



// Exemple de fonction asynchrone
function someAsyncFunction() {
    return new Promise((resolve, reject) => {
        // Simuler une tâche
        setTimeout(() => {
            // Vous pouvez injecter une logique d'échec pour tester
            const isError = false; // Remplacez par une logique réaliste
            if (isError) {
                reject(new Error('Erreur simulée'));
            } else {
                resolve('Résultat de la fonction asynchrone');
            }
        }, 8000); // Temps de traitement de 8 secondes
    });
}


// Exporter l'application pour Vercel
module.exports = app; // Exporter l'application pour Vercel

const PORT = process.env.PORT || 4000; // Utiliser le port fourni par Vercel ou 3000 par défaut

app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
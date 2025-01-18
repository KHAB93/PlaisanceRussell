const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User'); 
const bcrypt = require('bcryptjs');


// Route pour l'inscription
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    console.log('Requête reçue avec les données :', req.body);

    try {
        const existingUser = await User.findOne({ username });
        console.log('Utilisateur existant :', existingUser);

        if (existingUser) {
            return res.status(400).json({ message: 'Nom d\'utilisateur déjà pris.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Mot de passe haché :', hashedPassword);

        const newUser = new User({
            username,
            password: hashedPassword,
        });

        const savedUser = await newUser.save();
        console.log('Utilisateur enregistré :', savedUser);

        res.status(201).json({ message: 'Utilisateur créé avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'inscription :', error);
        res.status(500).json({ message: 'Une erreur est survenue. Veuillez réessayer plus tard.' });
    }
});


module.exports = router;



// Route pour afficher le formulaire d'inscription
router.get('/register', (req, res) => {
    res.render('register'); // Rendre le fichier EJS pour le formulaire d'inscription
});

// Route pour la connexion
router.post('/login', passport.authenticate('local', {
    successRedirect: '/api/users/dashboard', // Redirigez vers le tableau de bord après une connexion réussie
    failureRedirect: '/', // Redirigez vers la page d'accueil en cas d'échec
    failureFlash: true // Activez les messages flash pour les erreurs
}));

// Route pour la déconnexion
router.get('/logout', (req, res) => {
    req.logout(); // Utilisez la méthode logout de Passport
    res.redirect('/'); // Redirigez vers la page d'accueil après la déconnexion
});

// Route pour afficher le formulaire de connexion
router.get('/login', (req, res) => {
    res.send(`
        <form method="post" action="/api/auth/login">
            <input name="username" placeholder="Nom d'utilisateur" required/>
            <input type="password" name="password" placeholder="Mot de passe" required/>
            <button type="submit">Connexion</button>
        </form>
    `);
});

// Route pour afficher le tableau de bord
router.get('/dashboard', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('dashboard', { user: req.user }); // Rendre la vue du tableau de bord
    } else {
        res.redirect('/'); // Redirigez vers la page d'accueil si l'utilisateur n'est pas authentifié
    }
});

module.exports = router;
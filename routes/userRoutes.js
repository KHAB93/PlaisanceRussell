const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const path = require('path');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const fs = require('fs');
const bcrypt = require('bcryptjs');


// Route pour le tableau de bord
router.get('/dashboard', isAuthenticated, (req, res) => {
    res.send(`
        <html>
        <head>
            <title>Tableau de Bord</title>
        </head>
        <body>
            <h1>Tableau de Bord</h1>
            <h2>Créer un Utilisateur</h2>
            <form method="POST" action="/api/users/create">
                <input type="text" name="username" placeholder="Nom d'utilisateur" required>
                <input type="password" name="password" placeholder="Mot de passe" required>
                <button type="submit">Créer Utilisateur</button>
            </form>
            <h2>Modifier un Utilisateur</h2>
            <form method="POST" action="/api/users/update">
                <input type="text" name="id" placeholder="ID de l'utilisateur" required>
                <input type="text" name="username" placeholder="Nouveau Nom d'utilisateur" required>
                <button type="submit">Modifier Utilisateur</button>
            </form>
            <h2>Supprimer un Utilisateur</h2>
            <form method="POST" action="/api/users/delete">
                <input type="text" name="id" placeholder="ID de l'utilisateur" required>
                <button type="submit">Supprimer Utilisateur</button>
            </form>
            <h2>Créer un Catway</h2>
            <form method="POST" action="/api/catways/create">
                <input type="text" name="catwayNumber" placeholder="Numéro du catway" required>
                <input type="text" name="type" placeholder="Type" required>
                <input type="text" name="catwayState" placeholder="État" required>
                <button type="submit">Créer Catway</button>
            </form>
            <h2>Modifier un Catway</h2>
            <form method="POST" action="/api/catways/update">
                <input type="text" name="id" placeholder="ID du catway" required>
                <input type="text" name="catwayState" placeholder="Nouvelle Description de l'état" required>
                <button type="submit">Modifier Catway</button>
            </form>
            <h2>Supprimer un Catway</h2>
            <form method="POST" action="/api/catways/delete">
                <input type="text" name="id" placeholder="ID du catway" required>
                <button type="submit">Supprimer Catway</button>
            </form>
            <h2>Afficher les Détails d'un Catway</h2>
            <form method="GET" action="/api/catways/details">
                <input type="text" name="id" placeholder="ID du catway" required>
                <button type="submit">Afficher Détails</button>
            </form>
            <h2>Enregistrer une Réservation</h2>
            <form method="POST" action="/api/reservations/create">
                <input type="text" name="catwayNumber" placeholder="Numéro du catway" required>
                <input type="text" name="clientName" placeholder="Nom du client" required>
                <input type="text" name="boatName" placeholder="Nom du bateau" required>
                <input type="date" name="checkIn" required>
                <input type="date" name="checkOut" required>
                <button type="submit">Enregistrer Réservation</button>
            </form>
            <h2>Supprimer une Réservation</h2>
            <form method="POST" action="/api/reservations/delete">
                <input type="text" name="id" placeholder="ID de la réservation" required>
                <button type="submit">Supprimer Réservation</button>
            </form>
            <h2>Afficher les Détails d'une Réservation</h2>
            <form method="GET" action="/api/reservations/details">
                <input type="text" name="id" placeholder="ID de la réservation" required>
                <button type="submit">Afficher Détails</button>
            </form>
            <h2><a href="/api/catways">Liste des Catways</a></h2>
            <h2><a href="/api/reservations">Liste des Réservations</a></h2>
            <h2><a href="/api/users">Liste des Utilisateurs</a></h2>
    `)

    });


// Route pour créer un nouvel utilisateur
router.post('/create', async (req, res) => {
    console.log(req.body); // Affiche les données reçues

    // Extraction des champs nécessaires
    const { username, password } = req.body;

    // Vérifiez que les champs sont présents
    if (!username || !password) {
        return res.status(400).send('Tous les champs sont requis.');
    }

    try {
        // Vérifiez si l'utilisateur existe déjà
        const existingUser  = await User.findOne({ username });
        if (existingUser ) {
            return res.status(400).send('L\'utilisateur existe déjà.');
        }

        // Hachez le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créez un nouvel utilisateur
        const newUser  = new User({ username, password: hashedPassword });
        const savedUser  = await newUser .save(); // Sauvegarde de l'utilisateur

        // Chemin vers le fichier JSON des utilisateurs
        const filePath = path.join(__dirname, '../data/users.json');
        console.log('Chemin vers le fichier users.json:', filePath);

        // Lire le fichier JSON existant
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Erreur lors de la lecture du fichier users.json:', err);
                return res.status(500).send('Erreur lors de la mise à jour du fichier des utilisateurs.');
            }

        // Convertir le contenu en tableau d'objets
            let users = JSON.parse(data);
            console.log('Contenu actuel de users.json avant ajout:', users); // Affiche le contenu actuel

        // Ajouter le nouvel utilisateur à la liste
            users.push({ id: savedUser ._id.toString(), username: savedUser .username });

        // Écrire le nouveau tableau dans le fichier JSON
            fs.writeFile(filePath, JSON.stringify(users, null, 2), (err) => {
                if (err) {
                    console.error('Erreur lors de l\'écriture dans le fichier users.json:', err);
                    return res.status(500).send('Erreur lors de la mise à jour du fichier des utilisateurs.');
                }

        // Renvoie un message de succès avec l'utilisateur créé
                res.status(201).json({
                    message: 'Utilisateur créé avec succès!',
                    user: { id: savedUser ._id, username: savedUser .username }
                });
            });
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        if (!res.headersSent) {
            res.status(500).send('Erreur lors de la création de l\'utilisateur.');
        }
    }
});

// Route pour obtenir la liste des utilisateurs
router.get('/', isAuthenticated, (req, res) => {
    const filePath = path.join(__dirname, '../data/users.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier users.json:', err);
            return res.status(500).send('Erreur lors de la lecture des utilisateurs.');
        }

        // Convertir le contenu en tableau d'objets
        const users = JSON.parse(data);

        // Rendre la vue avec la liste des utilisateurs
        res.render('userList', { 
            title: 'Liste des Utilisateurs',
            users 
        });
    });
});


    module.exports = router;
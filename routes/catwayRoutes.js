const express = require('express');
const router = express.Router();
const fs = require('fs').promises; // Utilisez la version promise de fs
const path = require('path');
const Catway = require('../models/Catway');
const mongoose = require('mongoose');
const { isAuthenticated } = require('../middlewares/authMiddleware'); // Middleware d'authentification

// Chemin vers le fichier JSON des catways
const filePath = path.join(__dirname, '../data/catways.json');

// Fonction pour lire le fichier JSON
const readCatwaysFromFile = async () => {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Erreur lors de la lecture du fichier JSON:', err);
        throw new Error('Erreur lors de la lecture du fichier.');
    }
};

// Fonction pour écrire dans le fichier JSON
const writeCatwaysToFile = async (catways) => {
    try {
        await fs.writeFile(filePath, JSON.stringify(catways, null, 2));
    } catch (err) {
        console.error('Erreur lors de l\'écriture dans le fichier JSON:', err);
        throw new Error('Erreur lors de la mise à jour du fichier.');
    }
};

// Route pour obtenir la liste des catways
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const catways = await readCatwaysFromFile();

        const catwayList = catways.map(catway =>
            `<li><a href="/api/catways/${catway.id}">${catway.catwayNumber} - ${catway.type} - ${catway.catwayState}</a></li>`
        ).join('');

        res.send(`
            <html>
            <head>
                <title>Liste des Catways</title>
                <style>
                    body { background-color: white; color: black; }
                    nav { background-color: #f8f9fa; padding: 10px; }
                    nav ul { list-style-type: none; padding: 0; }
                    nav ul li { display: inline; margin-right: 10px; }
                </style>
            </head>
            <body>
                <nav>
                    <ul>
                        <li><a href="/">Accueil</a></li>
                        <li><a href="/api/catways">Catways</a></li>
                        <li><a href="/api/reservations">Réservations</a></li>
                        <li><a href="/docs">Documentation</a></li>
                    </ul>
                </nav>
                <h1>Liste des Catways</h1>
                <ul>${catwayList}</ul>
                <a href="/">Retour à l'accueil</a>
            </body>
            </html>
        `);
    } catch (err) {
        res.status(500).send('Erreur lors de la récupération des catways.');
    }
});

// Route pour obtenir les détails d'un catway
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const catways = await readCatwaysFromFile();
        const catway = catways.find(c => c.id === req.params.id);

        if (!catway) {
            return res.status(404).send('Catway non trouvé.');
        }

        res.render('catwayDetails', {
            title: 'Détails du Catway',
            catway,
        });
    } catch (err) {
        res.status(500).send('Erreur lors de la récupération des détails du catway.');
    }
});

// Route pour créer un catway
router.post('/create', isAuthenticated, async (req, res) => {
    const { catwayNumber, type, catwayState } = req.body;

    if (!catwayNumber || !type || !catwayState) {
        return res.status(400).send('Tous les champs sont requis.');
    }

    try {
        const existingCatway = await Catway.findOne({ catwayNumber });
        if (existingCatway) {
            return res.status(400).send('Le catway existe déjà.');
        }

        const newCatway = new Catway({ catwayNumber, type, catwayState });
        const savedCatway = await newCatway.save();

        const catways = await readCatwaysFromFile();
        catways.push(savedCatway);
        await writeCatwaysToFile(catways);

        res.status(201).json({
            message: 'Catway créé avec succès!',
            catway: savedCatway,
        });
    } catch (err) {
        console.error('Erreur lors de la création du catway:', err);
        res.status(500).send('Erreur lors de la création du catway.');
    }
});

// Route pour supprimer un catway
router.post('/delete', isAuthenticated, async (req, res) => {
    const { id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('ID invalide.');
    }

    try {
        const catwayToDelete = await Catway.findByIdAndDelete(id);

        if (!catwayToDelete) {
            return res.status(404).send('Catway non trouvé.');
        }

        const catways = await readCatwaysFromFile();
        const updatedCatways = catways.filter(catway => catway._id.toString() !== id);
        await writeCatwaysToFile(updatedCatways);

        res.status(200).json({
            message: 'Catway supprimé avec succès!',
            catwayId: id,
        });
    } catch (err) {
        console.error('Erreur lors de la suppression du catway:', err);
        res.status(500).send('Erreur lors de la suppression du catway.');
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Catway = require('../models/Catway');
const mongoose = require('mongoose');
const { isAuthenticated } = require('../middlewares/authMiddleware'); // Importez le middleware

// Middleware pour parser le corps de la requête
router.use(express.json());

// Route pour obtenir la liste des catways
router.get('/', isAuthenticated, (req, res) => {
    const filePath = path.join(__dirname, '../data/catways.json'); // Chemin vers le fichier JSON

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier catways.json:', err);
            return res.status(500).send('Erreur lors de la récupération des catways.');
        }
    
        const catways = JSON.parse(data); // Convertir le JSON en objet JavaScript
        let catwayList = catways.map(catway => 
            `<li><a href="/api/catways/${catway.id}">${catway.catwayNumber} - ${catway.type} - ${catway.catwayState}</a></li>`
        ).join('');
    
        res.send(`
            <html>
            <head>
                <title>Liste des Catways</title>
                <style>
                    body {
                        background-color: white;
                        color: black;
                    }
                    nav {
                        background-color: #f8f9fa;
                        padding: 10px;
                    }
                    nav ul {
                        list-style-type: none;
                        padding: 0;
                    }
                    nav ul li {
                        display: inline;
                        margin-right: 10px;
                    }
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
    });
});

// Route pour obtenir les détails d'un catway
router.get('/:id', isAuthenticated, (req, res) => {
    const filePath = path.join(__dirname, '../data/catways.json'); // Chemin vers le fichier JSON

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier catways.json:', err);
            return res.status(500).send('Erreur lors de la récupération des détails du catway.');
        }

        const catways = JSON.parse(data); // Convertir le JSON en objet JavaScript
        const catway = catways.find(c => c.id === req.params.id); // Trouver le catway par ID

        if (!catway) {
            return res.status(404).send('Catway non trouvé.');
        }

        // Rendre le fichier EJS avec les détails du catway
        res.render('catwayDetails', { 
            title: 'Détails du Catway',
            catway 
        });
    });
});


// Route pour créer un catway
router.post('/create', isAuthenticated, async (req, res) => {
    console.log(req.body); // Affiche les données reçues

    const { catwayNumber, type, catwayState } = req.body;

    // Vérifiez que les champs sont présents
    if (!catwayNumber || !type || !catwayState) {
        return res.status(400).send('Tous les champs sont requis.');
    }

    try {
        // Vérifiez si le catway existe déjà
        const existingCatway = await Catway.findOne({ catwayNumber });
        console.log(existingCatway); // Cela affichera le catway existant, s'il y en a un

        if (existingCatway) {
            return res.status(400).send('Le catway existe déjà.');
        }

        // Mettre à jour le fichier JSON
        const filePath = path.join(__dirname, '../data/catways.json');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Erreur lors de la lecture du fichier catways.json:', err);
                return res.status(500).send('Erreur lors de la mise à jour du fichier catways.');
            }

            const catways = JSON.parse(data);
            catways.push(savedCatway); // Ajoute le nouveau catway à la liste
            fs.writeFile(filePath, JSON.stringify(catways, null, 2), (err) => {
                if (err) {
                    console.error('Erreur lors de l\'écriture dans le fichier catways.json:', err);
                    return res.status(500).send('Erreur lors de la mise à jour du fichier catways.');
                }

                // Renvoie un message de succès avec le catway créé
                res.status(201).json({
                    message: 'Catway créé avec succès!',
                    catway: savedCatway
                });
            });
        });
    } catch (error) {
        console.error('Erreur lors de la création du catway:', error);
        if (!res.headersSent) {
            res.status(500).send('Erreur lors de la création du catway.');
        }
    }
});

// Route pour supprimer un catway
router.post('/delete', isAuthenticated, async (req, res) => {
    const { id } = req.body; // Récupère l'ID du catway à supprimer

    console.log('ID reçu pour suppression:', id); // Log de l'ID reçu

    // Vérifiez si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('ID invalide.');
    }

    try {
        // Convertir l'ID en ObjectId
        const objectId = mongoose.Types.ObjectId(id);

        // Vérifiez si le catway existe
        const catwayToDelete = await Catway.findById(objectId);
        if (!catwayToDelete) {
            return res.status(404).send('Catway non trouvé.');
        }

        // Supprimez le catway de la base de données
        await Catway.findByIdAndDelete(objectId);

       // Mettre à jour le fichier JSON
       const filePath = path.join(__dirname, '../data/catways.json');
       const data = await fs.readFile(filePath, 'utf8');
       const catways = JSON.parse(data);
       const updatedCatways = catways.filter(catway => catway._id.toString() !== id); // Filtrer le catway supprimé

       await fs.writeFile(filePath, JSON.stringify(updatedCatways, null, 2)); // Écriture dans le fichier

        // Renvoie un message de succès
            res.status(200).json({
                message: 'Catway supprimé avec succès!',
                catwayId: id
                });
         
    } catch (error) {
        console.error('Erreur lors de la suppression du catway:', error);
        return res.status(500).send('Erreur lors de la suppression du catway.');
    }
    }
);

module.exports = router;
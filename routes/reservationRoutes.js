const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Reservation = require('../models/Reservation'); 
const { isAuthenticated } = require('../middlewares/authMiddleware'); 

// Middleware pour parser le corps de la requête
router.use(express.json());

router.get('/', isAuthenticated, (req, res) => {
    const filePath = path.join(__dirname, '../data/reservations.json'); // Chemin vers le fichier JSON

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier reservations.json:', err);
            return res.status(500).send('Erreur lors de la récupération des réservations.');
        }

        console.log('Données lues du fichier:', data); 
        const reservations = JSON.parse(data); // Convertir le JSON en objet JavaScript
        let reservationList = reservations.map(reservation => 
            `<li>
                Réservation pour Catway Numéro: ${reservation.catwayNumber} 
                par Client: ${reservation.clientName} 
                (Bateau: ${reservation.boatName}) 
                - Check-in: ${new Date(reservation.checkIn).toLocaleString()} 
                - Check-out: ${new Date(reservation.checkOut).toLocaleString()}
            </li>`
        ).join('');

        res.send(`
            <html>
            <head>
                <title>Liste des Réservations</title>
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
                <h1>Liste des Réservations</h1>
                <ul>${reservationList}</ul>
                <a href="/">Retour à l'accueil</a>
            </body>
            </html>
        `);
    });
});


// Route pour obtenir les détails d'une réservation
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate('userId catwayId'); // Récupérer la réservation par ID et peupler les références

        if (!reservation) {
            return res.status(404).send('Réservation non trouvée.');
        }

        // Rendre le fichier EJS avec les détails de la réservation
        res.render('reservationDetails', { 
            title: 'Détails de la Réservation',
            reservation 
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des détails de la réservation:', error);
        res.status(500).send('Erreur lors de la récupération des détails de la réservation.');
    }
});

// Route pour créer une réservation
router.post('/create', isAuthenticated, async (req, res) => {
    console.log(req.body); // Affiche les données reçues

    // Extraction des champs nécessaires
    const { clientName, boatName, catwayNumber, checkIn, checkOut } = req.body;

    // Vérifiez que les champs sont présents
    if (!clientName || !boatName || !catwayNumber || !checkIn || !checkOut) {
        return res.status(400).send('Tous les champs sont requis.');
    }

    try {
        // Vérifiez si la réservation existe déjà (si nécessaire)
        const existingReservation = await Reservation.findOne({ clientName, boatName, catwayNumber, checkIn, checkOut });
        console.log(existingReservation); // Cela affichera la réservation existante, s'il y en a une

        if (existingReservation) {
            return res.status(400).send('La réservation existe déjà.');
        }

        // Créez une nouvelle réservation
        const newReservation = new Reservation({ clientName, boatName, catwayNumber, checkIn, checkOut });
        const savedReservation = await newReservation.save(); // Sauvegarde de la réservation

        // Mettre à jour le fichier JSON (si nécessaire)
        const filePath = path.join(__dirname, '../data/reservations.json'); // Chemin vers le fichier JSON des réservations
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Erreur lors de la lecture du fichier reservations.json:', err);
                return res.status(500).send('Erreur lors de la mise à jour du fichier des réservations.');
            }

            const reservations = JSON.parse(data);
            reservations.push(savedReservation); // Ajoute la nouvelle réservation à la liste
            fs.writeFile(filePath, JSON.stringify(reservations, null, 2), (err) => {
                if (err) {
                    console.error('Erreur lors de l\'écriture dans le fichier reservations.json:', err);
                    return res.status(500).send('Erreur lors de la mise à jour du fichier des réservations.');
                }

                // Renvoie un message de succès avec la réservation créée
                res.status(201).json({
                    message: 'Réservation créée avec succès!',
                    reservation: savedReservation
                });
            });
        });
    } catch (error) {
        console.error('Erreur lors de la création de la réservation:', error);
        if (!res.headersSent) {
            res.status(500).send('Erreur lors de la création de la réservation.');
        }
    }
});

module.exports = router;

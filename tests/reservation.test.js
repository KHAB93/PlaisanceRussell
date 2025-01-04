// test/reservation.test.js
const chai = require('chai');
const expect = chai.expect;
const mongoose = require('mongoose');
const Reservation = require('../models/reservation'); // Assurez-vous que le chemin est correct
const Catway = require('../models/catway'); // Assurez-vous que le chemin est correct

describe('Reservation Model', () => {
    let catwayId;

    before(async () => {
        // Connexion à la base de données avant les tests
        await mongoose.connect('mongodb://localhost:27017/votre_base_de_donnees', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Créer un catway pour les tests de réservation
        const catway = new Catway({
            catwayNumber: 1,
            type: 'short',
            catwayState: 'bon état',
        });
        const savedCatway = await catway.save();
        catwayId = savedCatway._id; // Stocker l'ID du catway créé
    });

    after(async () => {
        // Déconnexion de la base de données après les tests
        await mongoose.disconnect();
    });

    it('should create a reservation', async () => {
        const reservation = new Reservation({
            catwayId: catwayId,
            userId: mongoose.Types.ObjectId(), // Simuler un ID d'utilisateur
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 1)) // Réservation pour demain
        });

        const savedReservation = await reservation.save();
        expect(savedReservation._id).to.exist;
        expect(savedReservation.catwayId.toString()).to.equal(catwayId.toString());
    });

 
});
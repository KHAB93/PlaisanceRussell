// test/catway.test.js
const chai = require('chai');
const expect = chai.expect;
const mongoose = require('mongoose');
const Catway = require('../models/catway'); // Assurez-vous que le chemin est correct

describe('Catway Model', () => {
    before(async () => {
        // Connexion à la base de données avant les tests
        await mongoose.connect('mongodb://localhost:27017/Databases', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    });

    after(async () => {
        // Déconnexion de la base de données après les tests
        await mongoose.disconnect();
    });

    it('should create a catway', async () => {
        const catway = new Catway({
            catwayNumber: 1,
            type: 'short',
            catwayState: 'bon état',
        });

        const savedCatway = await catway.save();
        expect(savedCatway._id).to.exist;
        expect(savedCatway.catwayNumber).to.equal(1);
    });

    // Ajoutez d'autres tests ici
});
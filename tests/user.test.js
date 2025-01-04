// test/user.test.js
const chai = require('chai');
const expect = chai.expect;
const mongoose = require('mongoose');
const User = require('../models/user'); // Assurez-vous que le chemin est correct

describe('User  Model', () => {
    before(async () => {
        // Connexion à la base de données avant les tests
        await mongoose.connect('mongodb://localhost:27017/votre_base_de_donnees', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    });

    after(async () => {
        // Déconnexion de la base de données après les tests
        await mongoose.disconnect();
    });

    it('should create a user', async () => {
        const user = new User({
            username: 'testuser',
            password: 'password123',
            email: 'testuser@example.com'
        });

        const savedUser  = await user.save();
        expect(savedUser ._id).to.exist;
        expect(savedUser .username).to.equal('testuser');
        expect(savedUser .email).to.equal('testuser@example.com');
    });

    it('should not create a user with duplicate email', async () => {
        const user = new User({
            username: 'anotheruser',
            password: 'password456',
            email: 'testuser@example.com' // Email déjà utilisé
        });

        try {
            await user.save();
        } catch (error) {
            expect(error).to.exist;
            expect(error.name).to.equal('MongoError');
            expect(error.code).to.equal(11000); // Code d'erreur pour les doublons
        }
    });

});
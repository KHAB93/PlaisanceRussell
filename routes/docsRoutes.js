const express = require('express');
const router = express.Router();

// Route pour afficher la documentation de l'API
router.get('/', (req, res) => {
    res.redirect('/docs/overview'); // Redirige vers la vue d'ensemble
});

// Route pour la vue d'ensemble
router.get('/overview', (req, res) => {
    res.render('docs/overview', { title: 'Vue d\'Ensemble' });
});

// Route pour le tutoriel
router.get('/tutorial', (req, res) => {
    res.render('docs/tutorial', { title: 'Tutoriel' });
});

// Route pour les exemples
router.get('/examples', (req, res) => {
    res.render('docs/examples', { title: 'Exemples' });
});

// Route pour le glossaire
router.get('/glossary', (req, res) => {
    res.render('docs/glossary', { title: 'Glossaire' });
});

module.exports = router;
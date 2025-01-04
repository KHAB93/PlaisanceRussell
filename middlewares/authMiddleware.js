
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next(); // L'utilisateur est authentifié, passez à la prochaine fonction middleware
    }
    res.status(401).send('Non autorisé.'); // L'utilisateur n'est pas authentifié
};


module.exports = { isAuthenticated };
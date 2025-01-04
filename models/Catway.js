const mongoose = require('mongoose');

const catwaySchema = new mongoose.Schema({
    catwayNumber: { type: Number, required: true },
    type: { type: String, required: true },
    catwayState: { type: String, required: true }
}, { timestamps: true });

const Catway = mongoose.model('Catway', catwaySchema);


module.exports = Catway;
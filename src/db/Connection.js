const mongoose = require('mongoose');

const Connection = (url) => {
    return mongoose.connect(url);
}

module.exports = Connection;
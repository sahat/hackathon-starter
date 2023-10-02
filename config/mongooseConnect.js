const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/yourOwnDB')
.then(() => {
    console.log(`Mongoose Connected Successfully with MongoDB.`);
})
.catch((err) => {
    console.log(err);
})
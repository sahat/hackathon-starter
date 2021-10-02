const mongoose = require('mongoose')

const DB_URL = process.env.MONGODB_URI

async function createConnection() {
    await mongoose.connect(DB_URL, {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    }).then(() => console.log('MongoDB Connected!'))

    mongoose.connection.on('error', err => {
        console.log(err.message);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('Mongoose connection is disconnected!')
    });

    process.on('SIGINT', () => {
        mongoose.connection.close(() => {
            console.log(
                'Mongoose connection is disconnected due to app termination!'
            );
            process.exit(0);
        });
    });
}

module.exports = createConnection
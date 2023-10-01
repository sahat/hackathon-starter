const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost/your_database_name', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Create a MongoDB Schema and a model
// For Example:
// const ItemSchema = new mongoose.Schema({
//   name: String,
//   description: String
// });

// const Item = mongoose.model('Item', ItemSchema);

// Create API endpoints:
// For Example:
// app.get('/items', async (req, res) => {
// try {
//     const items = await Item.find();
//     res.json(items);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Server Error");
//   }
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
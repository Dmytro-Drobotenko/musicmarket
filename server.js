const express = require("express");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const client = new MongoClient(process.env.MONGO_URI);

app.get("/products", async (req, res) => {
  try {
    await client.connect();
    const collection = client.db("musicmarket").collection("product");
    const products = await collection.find({}).toArray();
    res.json(products);
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  } finally {
    await client.close();
  }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

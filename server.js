const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const client = new MongoClient(process.env.MONGO_URI);
let db;

async function connectToMongo() {
  await client.connect();
  db = client.db("musicmarket");
}
connectToMongo();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/top-products", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store"); // ✨ важливо

    const products = await db.collection("product").find({}).toArray();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).send("Помилка на сервері");
  }
});


app.listen(PORT, () => console.log(`Сервер запущено на порту ${PORT}`));

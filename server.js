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

app.get("/top-products", async (req, res) => {
  try {
    const orderItems = db.collection("orderitem");
    const products = db.collection("product");

    const top = await orderItems.aggregate([
      {
        $group: {
          _id: "$product_id",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 30 },
      {
        $lookup: {
          from: "product",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $replaceRoot: { newRoot: "$product" }
      }
    ]).toArray();

    res.json(top);
  } catch (err) {
    console.error(err);
    res.status(500).send("Помилка на сервері");
  }
});

app.listen(PORT, () => console.log(`Сервер запущено на порту ${PORT}`));

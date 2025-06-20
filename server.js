const express = require('express');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
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

app.get('/categories', async (req, res) => {
  try {
    const categories = await db.collection('category').find({}).toArray();
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка при завантаженні категорій' });
  }
});

app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'search.html'));
});

app.get('/api/search', async (req, res) => {
  const { query, category } = req.query;
  const filter = {};
  
  if (query) {
    filter.name = { $regex: query, $options: 'i' };
  }
  if (category) {
    filter.category_id = Number(category);
  }

  try {
    const products = await db.collection('product').find(filter).toArray();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера при пошуку' });
  }
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body;

  try {
    const existingUser = await db.collection('user').findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        error: existingUser.username === username
          ? 'Цей логін уже зайнятий.'
          : 'Цей email уже зареєстрований.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const creationDate = new Date();

    const newUser = {
      _id: await db.collection('user').countDocuments() + 1,
      name: firstName,
      surname: lastName,
      username,
      email,
      password: hashedPassword,
      role: 'user',
      phone: "", // бо null не дозволено
      creation_date: new Date() // тип: BSON date
    };


    await db.collection('user').insertOne(newUser);
    res.status(201).json({ message: 'Реєстрація успішна!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка на сервері' });
  }
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
  const { login, password } = req.body;

  try {
    const usersCollection = db.collection('user');

    const user = await usersCollection.findOne({
      $or: [
        { username: login },
        { email: login }
      ]
    });

    if (!user) {
      return res.status(400).json({ error: "Користувача не знайдено" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Невірний пароль" });
    }

    res.json({ message: "Вхід успішний", username: user.username });
  } catch (err) {
    console.error("Помилка логіну:", err);
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  }
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

app.get('/product/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});


app.get('/api/product/:id', async (req, res) => {
  const productId = parseInt(req.params.id);

  try {
    const product = await db.collection('product').findOne({ _id: productId, is_visible: true });
    if (!product) {
      return res.status(404).json({ error: 'Товар не знайдено' });
    }
    res.json(product);
  } catch (error) {
    console.error('Помилка при отриманні товару:', error);
    res.status(500).json({ error: 'Серверна помилка' });
  }
});

app.listen(PORT, () => console.log(`Сервер запущено на порту ${PORT}`));

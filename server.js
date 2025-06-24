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

app.get("/api/search", async (req, res) => {
  const { query, category, sort } = req.query;

  const matchStage = {};
  if (query) {
    matchStage.name = { $regex: query, $options: "i" };
  }
  if (category && !isNaN(category)) {
    matchStage.category_id = parseInt(category);
  }
  try {
    if (sort === "popularity") {
      const pipeline = [
        {
          $group: {
            _id: "$product_id",
            salesCount: { $sum: 1 }
          }
        },
        {
          $sort: { salesCount: -1 }
        },
        {
          $lookup: {
            from: "product",
            localField: "_id",
            foreignField: "_id",
            as: "product"
          }
        },
        {
          $unwind: "$product"
        },
        {
          $replaceRoot: { newRoot: "$product" }
        }
      ];

      if (query || category) {
        pipeline.push({ $match: matchStage });
      }

      const popularProducts = await db.collection("orderitem").aggregate(pipeline).toArray();
      return res.json(popularProducts);
    }

    const sortOptions = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      date_new: { creation_date: -1 },
      date_old: { creation_date: 1 }
    };

    const products = await db.collection("product")
      .find(matchStage)
      .sort(sortOptions[sort] || {})
      .toArray();

    res.json(products);
  } catch (err) {
    console.error("Помилка пошуку:", err);
    res.status(500).json({ error: "Помилка пошуку" });
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
    const lastUser = await db.collection('user').find().sort({ _id: -1 }).limit(1).toArray();
    const newId = lastUser.length > 0 ? lastUser[0]._id + 1 : 1;
    const newUser = {
      _id: newId,
      name: firstName,
      surname: lastName,
      username,
      email,
      password: hashedPassword,
      role: 'user',
      phone: "",
      creation_date: new Date()
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

    res.json({ message: "Вхід успішний", username: user.username, role: user.role});
  } catch (err) {
    console.error("Помилка логіну:", err);
    res.status(500).json({ error: "Внутрішня помилка сервера" });
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

app.get('/profile/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/api/profile', async (req, res) => {
  const username = req.headers['x-username'];
  if (!username) {
    return res.status(401).json({ error: 'Необхідна авторизація' });
  }
  try {
    const user = await db.collection('user').findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }
    res.json({
      name: user.name,
      surname: user.surname,
      username: user.username,
      email: user.email,
      phone: user.phone
    });
  } catch (error) {
    console.error('Помилка при отриманні профілю:', error);
    res.status(500).json({ error: 'Серверна помилка' });
  }
});

app.put('/api/profile/phone', async (req, res) => {
  const username = req.headers['x-username'];
  const { phone } = req.body;
  if (!username || !phone) return res.status(400).json({ error: 'Недостатньо даних' });

  try {
    await db.collection('user').updateOne({ username }, { $set: { phone } });
    res.json({ success: true });
  } catch (err) {
    console.error('Помилка оновлення номеру:', err);
    res.status(500).json({ error: 'Серверна помилка' });
  }
});

app.delete('/api/profile/phone', async (req, res) => {
  const username = req.headers['x-username'];
  if (!username) return res.status(401).json({ error: 'Необхідна авторизація' });

  try {
    await db.collection('user').updateOne({ username }, { $unset: { phone: "" } });
    res.json({ success: true });
  } catch (err) {
    console.error('Помилка видалення номеру:', err);
    res.status(500).json({ error: 'Серверна помилка' });
  }
});

app.get('/api/orders', async (req, res) => {
  const username = req.headers['x-username'];
  if (!username) return res.status(401).json({ error: 'Необхідна авторизація' });

  try {
    const user = await db.collection('user').findOne({ username });
    if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });

    const orders = await db.collection('order')
      .find({ user_id: user._id })
      .sort({ creation_date: -1 })
      .toArray();

    res.json(orders);
  } catch (err) {
    console.error('Помилка отримання замовлень:', err);
    res.status(500).json({ error: 'Серверна помилка' });
  }
});

app.post('/api/checkout', async (req, res) => {
  const username = req.headers['x-username'];
  const items = req.body.items;

  if (!username || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Невірні дані' });
  }

  try {
    const user = await db.collection('user').findOne({ username });
    if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });

    const productList = await db.collection('product').find({}).toArray();
    const productMap = Object.fromEntries(productList.map(p => [p._id, p]));

    let totalSum = 0;
    const orderItems = [];
    for (const item of items) {
      const product = productMap[item.productId];
      if (!product) continue;

      const unitPrice = product.price;
      const quantity = item.quantity;
      const subtotal = unitPrice * quantity;

      totalSum += subtotal;

      orderItems.push({
        productId: item.productId,
        quantity,
        unit_price: unitPrice
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ error: 'Жодного дійсного товару не знайдено' });
    }

    const lastOrder = await db.collection('order')
      .find().sort({ _id: -1 }).limit(1).toArray();
    const nextOrderId = lastOrder.length ? lastOrder[0]._id + 1 : 1;

    const orderDoc = {
      _id: nextOrderId,
      user_id: parseInt(user._id),
      received: null,
      sum: parseFloat(totalSum.toFixed(2)),
      creation_date: new Date()
    };

    await db.collection('order').insertOne(orderDoc);

    const orderItemDocs = orderItems.map(item => ({
      order_id: nextOrderId,
      product_id: parseInt(item.productId),
      quantity: parseInt(item.quantity),
      unit_price: parseFloat(item.unit_price.toFixed(2))
    }));

    await db.collection('orderitem').insertMany(orderItemDocs);

    res.json({ success: true, orderId: nextOrderId });
  } catch (err) {
    console.error("Помилка оформлення замовлення:", err);
    res.status(500).json({ error: "Серверна помилка" });
  }
});

app.get('/admin', async (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.redirect('/');
  }

  try {
    const user = await db.collection('user').findOne({ username });

    if (!user || user.role !== 'admin') {
      return res.redirect('/');
    }

    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } catch (error) {
    console.error('Помилка при перевірці ролі адміністратора:', error);
    res.redirect('/');
  }
});


app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await db.collection('order').aggregate([
      {
        $lookup: {
          from: 'user',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          user_id: 1,
          username: '$user.username',
          creation_date: 1,
          received: 1,
          sum: 1
        }
      },
      { $sort: { creation_date: -1 } }
    ]).toArray();

    res.json(orders);
  } catch (error) {
    console.error('Помилка отримання замовлень:', error);
    res.status(500).json({ error: 'Серверна помилка' });
  }
});

app.get('/api/admin/orders/:orderId/items', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const items = await db.collection('orderitem').find({ order_id: orderId }).toArray();
    const order = await db.collection('order').findOne({ _id: orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const user = await db.collection('user').findOne(
      { _id: order.user_id },
      { projection: { name: 1, surname: 1, email: 1 } }
    );
    res.json({
      success: true,
      items: items,
      user: {
        name: user?.name || 'Невідомо',
        surname: user?.surname || 'Невідомо',
        email: user?.email || 'Невідомо'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});
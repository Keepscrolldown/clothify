const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

/* ================= CONFIG ================= */

const PORT = 3000;
const JWT_SECRET = 'clothify-secret-key-2026';

const MONGO_URL = 'mongodb+srv://clothify:clothify123@cluster0.poqm1ah.mongodb.net/?appName=Cluster0ongodb://127.0.0.1:27017';
const DB_NAME = 'clothify_db';

/* ================= MIDDLEWARE ================= */

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static(path.join(__dirname, '../public')));

/* ================= DATABASE ================= */

let db;
let productsCollection;
let adminsCollection;

const client = new MongoClient(MONGO_URL);

async function connectDB() {
  try {
    await client.connect();
    db = client.db(DB_NAME);

    productsCollection = db.collection('products');
    adminsCollection = db.collection('admins');

    console.log('✅ Connected to MongoDB');
    await initializeAdmin();
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

async function initializeAdmin() {
  const adminExists = await adminsCollection.findOne({ username: 'admin' });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await adminsCollection.insertOne({
      username: 'admin',
      password: hashedPassword,
      createdAt: new Date()
    });

    console.log('✅ Default admin created (admin / admin123)');
  }
}

/* ================= AUTH ================= */

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/* ================= ROUTES ================= */

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const admin = await adminsCollection.findOne({ username });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: admin._id.toString(), username: admin.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: { username: admin.username }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  const products = await productsCollection.find({}, { projection: { _id: 0 } }).toArray();
  res.json(products);
});

// Get product by id
app.get('/api/products/:id', async (req, res) => {
  const product = await productsCollection.findOne(
    { id: req.params.id },
    { projection: { _id: 0 } }
  );

  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Create product
app.post('/api/products', authenticateToken, async (req, res) => {
  const { name, price, image, category, description, stock, sizes } = req.body;

  if (!name || !price || !image) {
    return res.status(400).json({ error: 'Name, price & image required' });
  }

  const product = {
    id: 'prod_' + Date.now(),
    name,
    price: Number(price),
    image,
    category: category || 'General',
    description: description || '',
    stock: Number(stock) || 0,
    sizes: sizes || [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await productsCollection.insertOne(product);
  res.status(201).json({ message: 'Product created', product });
});

// Update product
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  const result = await productsCollection.updateOne(
    { id: req.params.id },
    { $set: { ...req.body, updatedAt: new Date() } }
  );

  if (!result.matchedCount) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({ message: 'Product updated' });
});

// Delete product
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  const result = await productsCollection.deleteOne({ id: req.params.id });

  if (!result.deletedCount) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({ message: 'Product deleted' });
});

/* ================= FRONTEND FALLBACK ================= */

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

/* ================= START SERVER ================= */

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Clothify running at http://localhost:${PORT}`);
  });
});

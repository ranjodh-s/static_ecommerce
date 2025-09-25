import express from 'express';
import bodyParser from 'body-parser';
import {pool} from 'pg';
import session from 'express-session'; // Add this line

// PostgreSQL connection setup
// const { Pool } = PG;
// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'Static E-commerce',
//   password: 'postgre',
//   port: 5432,
// });

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_NO2tcbvumYH5@ep-aged-moon-a17x14tx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

async function testDB() {
  const res = await pool.query("SELECT * FROM users;");
  console.log(res.rows);
}
testDB();

const app = express();
const port = 3000;

// Add session middleware
app.use(session({
  secret: 'your_secret_key', // use a strong secret in production
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set to true if using HTTPS
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', async (req, res) => {
  
  
  res.render('home.ejs');
});

app.post('/shop', (req, res) => {
  let product=req.body;
  // console.log(req.body);
  res.render('shop.ejs', {product: product});
});

app.post('/get-now', (req, res) => {
  let product=req.body;
  res.render('shipping-page.ejs', { product: product });
});

app.post('/order', async (req, res) => {
  let order = req.body;
  let { quantity, productName, productPrice, customerName, phone, email, address, city, state, zip } = order;
  console.log(quantity, productName, productPrice, customerName, phone, email, address, city, state, zip);

  try {
    await pool.query(
      'INSERT INTO "orders" (quantity, productName, productPrice, customerName, phone, email, address, city, state, zip) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [quantity, productName, productPrice, customerName, phone, email, address, city, state, zip]
    );
    console.log('Order inserted successfully');
  } catch (err) {
    console.error('Error inserting order:', err);
  }

  res.render('order-placed.ejs');
});

app.get('/contact', (req, res) => {
  res.render('contact.ejs');
});

app.post('/contact', async(req, res) => {
  let user_message=req.body;

  let { name, email, message } = user_message;
  console.log(name, email, message);

  try {
    await pool.query(
      'INSERT INTO "messages" (name, email, message) VALUES ($1,$2,$3)',
      [name, email, message]
    );
    console.log('Contact message inserted successfully');
  } catch (err) {
    console.error('Error inserting contact message:', err);
  }

  res.render('contact.ejs');
});

// Admin authentication middleware
function isAdminLoggedIn(req, res, next) {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.redirect('/admin/login');
  }
}

app.get('/admin/login', (req, res) => {
  res.render('admin-login.ejs');
});

app.post('/admin/login', (req, res) => {
  let { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    req.session.isAdmin = true;
    res.redirect('/admin/dashboard');
  } else {
    res.send('Invalid credentials');
  }
});

app.get('/admin/dashboard', isAdminLoggedIn, async (req, res) => {
    res.render('admin-dashboard.ejs');
  
});

app.get('/admin/orders', isAdminLoggedIn, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "orders"');
    console.log(result.rows);
    res.render('admin-dashboard.ejs', { orders: result.rows });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/admin/messages', isAdminLoggedIn, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "messages"');
    res.render('admin-dashboard.ejs', { messages: result.rows });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Admin logout route
app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

app.listen(port, (req, res) => {
  console.log(`Server is running in port ${port}`)
});
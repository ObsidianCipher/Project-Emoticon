const express    = require('express');
const bodyParser = require('body-parser');
const cors       = require('cors');
const path       = require('path');
const db         = require('./db');
const emtcnGenerator = require('./emtcngenerator');

const app  = express();
const PORT = process.env.PORT || 4000;

/* ── MIDDLEWARE ── */
app.use(cors());
app.use(bodyParser.json());

/* ── STATIC FILES ── */
app.use(express.static(path.join(__dirname, 'public', 'Homepage')));
app.use('/lib', express.static(path.join(__dirname, '..', 'lib')));

/* ── ADMIN ROUTE (protected) ── */
const verifyAdmin = (req, res, next) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || token !== (process.env.ADMIN_TOKEN || 'emoticon-admin')) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
};

app.get('/admin', verifyAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', '.Admin', 'admin.html'));
});

/* ── INIT DB ── */
db.init();

/* ── HEALTH CHECK ── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ── CUSTOMERS ── */
app.post('/api/customers', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  db.createCustomer({ name, email }, (err, customerId) => {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'A customer with this email already exists.' });
      }
      return res.status(500).json({ error: err.message });
    }
    return res.status(201).json({ customerId, name, email });
  });
});

app.get('/api/customers', (req, res) => {
  db.getAllCustomers((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json(rows);
  });
});

/* ── KEYS ── */
app.post('/api/keys', async (req, res) => {
  const { customerId, greetingFile } = req.body;

  if (!customerId)   return res.status(400).json({ error: 'customerId is required.' });
  if (!greetingFile) return res.status(400).json({ error: 'greetingFile is required.' });

  const existsFn = (key) => new Promise((resolve, reject) => {
    db.keyExists(key, (err, exists) => {
      if (err) return reject(err);
      resolve(exists);
    });
  });

  try {
    const key = await emtcnGenerator.generateUniqueEmtcnKey(existsFn);
    db.issueKeyForCustomer({ key, customerId, greetingFile }, (err, keyId) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.status(201).json({ keyId, key, customerId, greetingFile, status: 'active' });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/keys', (req, res) => {
  db.getAllKeys((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json(rows);
  });
});

app.patch('/api/keys/:key/revoke', (req, res) => {
  const key = String(req.params.key).trim().toUpperCase();
  if (!emtcnGenerator.isValidEmtcnKey(key)) {
    return res.status(400).json({ error: 'Invalid EMTCN key format.' });
  }
  db.revokeKey(key, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ success: true, key, status: 'revoked' });
  });
});

/* ── LOOKUP ── */
app.get('/api/lookup/:key', (req, res) => {
  const key = String(req.params.key).trim().toUpperCase();
  if (!emtcnGenerator.isValidEmtcnKey(key)) {
    return res.status(400).json({ error: 'Invalid EMTCN key format.' });
  }

  db.getCustomerByKey(key, (err, row) => {
    if (err)  return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Key not found.' });
    return res.json(row);
  });
});

/* ── SERVE GREETING ── */
app.get('/serve/:key', (req, res) => {
  const key = String(req.params.key).trim().toUpperCase();

  if (!emtcnGenerator.isValidEmtcnKey(key)) {
    return res.status(400).json({ error: 'Invalid EMTCN key format.' });
  }

  db.getCustomerByKey(key, (err, row) => {
    if (err)  return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Key not found.' });

    if (row.status !== 'active') {
      return res.status(403).json({ error: 'Key is inactive or revoked.' });
    }
    if (!row.greeting_file) {
      return res.status(404).json({ error: 'No greeting assigned to this key.' });
    }

    const filePath = path.join(__dirname, '..', 'lib', row.greeting_file);
    res.sendFile(filePath, (sendErr) => {
      if (sendErr) res.status(404).json({ error: 'Greeting file not found on disk.' });
    });
  });
});

/* ── START ── */
app.listen(PORT, () => {
  console.log(`✅  Server listening on http://localhost:${PORT}`);
  console.log(`📁  Admin panel: http://localhost:${PORT}/admin?token=emoticon-admin`);
});
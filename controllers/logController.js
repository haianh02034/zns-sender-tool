const dbPromise = require('../models/db');

exports.getLogs = async (req, res) => {
  const db = await dbPromise;
  const rows = await db.all('SELECT * FROM zns_logs ORDER BY id DESC LIMIT 100');
  res.json(rows);
};

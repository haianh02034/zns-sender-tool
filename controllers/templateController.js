const dbPromise = require('../models/db');

exports.getTemplates = async (req, res) => {
  const db = await dbPromise;
  const rows = await db.all('SELECT * FROM zns_templates ORDER BY id DESC');
  res.json(rows);
};

exports.addTemplate = async (req, res) => {
  const { template_id, name, description } = req.body;
  const db = await dbPromise;
  await db.run('INSERT INTO zns_templates (template_id, name, description) VALUES (?, ?, ?)', [
    template_id, name, description
  ]);
  res.json({ success: true });
};

const { sendZNS, getZNSAllTemplates } = require('../services/znsService');

exports.sendBatch = async (req, res) => {
  const { users, template_id } = req.body;

  try {
    const results = [];

    for (const user of users) {
      const result = await sendZNS(user.id, template_id, user.data, `msg_${user.id}`);
      results.push({ user: user.id, result });
    }

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await getZNSAllTemplates();
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

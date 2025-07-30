const express = require('express');
const router = express.Router();
const controller = require('../controllers/znsController');

router.post('/send-batch', controller.sendBatch);
router.get('/templates', controller.getAllTemplates);

module.exports = router;

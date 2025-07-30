const express = require('express');
const router = express.Router();
const controller = require('../controllers/logController');

router.get('/', controller.getLogs);

module.exports = router;

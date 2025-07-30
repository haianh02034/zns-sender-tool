const express = require('express');
const router = express.Router();
const controller = require('../controllers/templateController');

router.get('/', controller.getTemplates);
router.post('/add', controller.addTemplate);

module.exports = router;

const express = require('express');
const router = express.Router();
const authController = require('authController');

router.post('/registrar', authController.registrar);

module.exports = router;
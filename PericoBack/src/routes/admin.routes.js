const express = require('express');
const adminCtrl = require('../controllers/admin.controller');

const router = express.Router();

router.get('/', adminCtrl.obtenerAdmins);
router.post('/', adminCtrl.registrarAdmin);

module.exports = router;

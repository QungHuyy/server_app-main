const express = require('express');
const multer = require('multer');
const router = express.Router();
const { extractFeature } = require('../controllers/featureController');

const upload = multer({ dest: 'uploads/' });

// POST /api/extract-feature
router.post('/extract-feature', upload.single('image'), extractFeature);

module.exports = router;

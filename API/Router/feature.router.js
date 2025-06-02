const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const { extractFeature } = require('../Controller/featureController');

router.post('/extract-feature', upload.single('image'), extractFeature);

module.exports = router;

const sendMessage = require('../controller/sendMessage');

const express = require('express');
const protectedRoute = require('../middleware/protectedRoute');

const router = express.Router()

router.post("/sent/:id",protectedRoute, sendMessage )

module.exports = router
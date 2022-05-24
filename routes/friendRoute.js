const express = require('express');
const friendController = require('../controllers/friendController');

const router = express.Router();

router.post('/', friendController.requestFriend);

module.exports = router;

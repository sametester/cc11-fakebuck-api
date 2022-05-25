const express = require('express');
const userController = require('../controllers/userController');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/me', userController.getMe);
router.patch(
  '/',
  upload.fields(
    { name: 'profilePic', maxCount: 1 },
    { name: 'coverPhoto', maxCount: 1 }
  ),
  userController.updateProfile
);

module.exports = router;

const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const createError = require('../utils/createError');
const { User } = require('../models');

exports.login = async (req, res, next) => {
  try {
  } catch (err) {}
  next(err);
};

exports.signup = async (req, res, next) => {
  try {
    const { firstName, lastName, emailOrPhone, password, confirmPassword } =
      req.body;
    console.log(req.body);

    if (!emailOrPhone) {
      createError('email or phone number is require', 400);
    }

    if (!password) {
      createError('password is require ', 400);
    }

    if (password !== confirmPassword) {
      createError('password and confirm password did not match ', 400);
    }

    const isMobilePhone = validator.isMobilePhone(emailOrPhone + '');
    const isEmail = validator.isEmail(emailOrPhone + '');
    if (!isMobilePhone && !isEmail) {
      createError('email or phone number is invalid format', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    console.log(isEmail);
    const user = await User.create({
      firstName,
      lastName,
      email: isEmail ? emailOrPhone : null,
      phoneNumber: isMobilePhone ? emailOrPhone : null,
      password: hashedPassword,
    });

    const payload = {
      id: user.id,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: '7d',
    });
    res.status(201).json({ token });
  } catch (err) {
    next(err);
  }
};

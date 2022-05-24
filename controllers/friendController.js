const { Op } = require('sequelize');
const createError = require('../utils/createError');
const { Friend } = require('../models');
const { FRIEND_ACCEPTED, FRIEND_PENDING } = require('../config/constants');

exports.requestFriend = async (req, res, next) => {
  try {
    const { requestToId } = req.body;
    console.log(req.user);
    if (req.user.id === +requestToId) {
      createError('cannot request yourself', 400);
    }

    // req.user.id Phukao, requestToId Toro
    // requestFromId = Phukao AND requestToId =Toro OR
    // requestToId = Phukao AND requestFromId = Toro

    const existFriend = await Friend.findOne({
      where: {
        [Op.or]: [
          { requestFromId: req.user.id, requestToId: requestToId },
          { requestFromId: requestToId, requestToId: req.user.id },
        ],
      },
    });

    if (existFriend) {
      createError('this user has already been requested', 400);
    }

    const friend = await Friend.create({
      requestToId,
      requestFromId: req.user.id,
      status: FRIEND_PENDING,
    });
    res.json({ friend });
  } catch (err) {
    next(err);
  }
};

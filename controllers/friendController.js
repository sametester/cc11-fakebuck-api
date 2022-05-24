const { Op } = require('sequelize');
const createError = require('../utils/createError');
const { Friend } = require('../models');
const { FRIEND_ACCEPTED, FRIEND_PENDING } = require('../config/constants');
const { request } = require('express');

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

exports.updateFriend = async (req, res, next) => {
  try {
    const { friendId } = req.params;
    const friend = await Friend.findOne({
      where: {
        requestFromId,
        status: FRIEND_PENDING,
        requestToId: req.user.id,
      },
    });

    if (!friend) {
      createError('friend request not found', 400);
    }

    friend.status = FRIEND_ACCEPTED;
    await friend.save();
    // await Friend.update({ status : FRIEND_ACCEPTED}, {where: {id: } })
    res.json({ message: 'friend request accepted' });
  } catch (err) {
    next(err);
  }
};

exports.deleteFriend = async (req, res, next) => {
  try {
    const { friendId } = req.params;

    const friend = await Friend.findOne({ where: { id } });

    if (!friend) {
      createError('friend request not found', 400);
    }

    if (
      friend.requestFromId !== request.user.id &&
      friend.requestToId !== req.user.id
    ) {
      createError('you have no permission', 403);
    }

    await friend.destroy();
    res.status(204).json();
  } catch (err) {
    next(err);
  }
};

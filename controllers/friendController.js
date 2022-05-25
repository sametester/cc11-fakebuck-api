const { Op } = require('sequelize');
const createError = require('../utils/createError');
const { Friend, User } = require('../models');
const { FRIEND_ACCEPTED, FRIEND_PENDING } = require('../config/constants');
const FriendService = require('../services/friendService');

const { request } = require('express');

exports.getAllFriend = async (req, res, next) => {
  try {
    const { status } = req.query;
    let users = [];
    if (status.toUpperCase() === 'UNKNOWN') {
      //* FIND UNKNOWN
      users = await FriendService.findUnknown(req.user.id);
    } else if (status.toUpperCase() === 'PENDING') {
      //*** FIND PENDING FRIEND
      users = await FriendService.findPendingFriend(req.user.id);
    } else if (status.toUpperCase() === 'REQUESTED') {
      //*** FIND REQUESTED FRIEND
      users = await FriendService.findRequestFriend(req.user.id);
    } else {
      //*** FIND ACCEPTED FRIEND
      users = await FriendService.findAcceptedFriend(req.user.id);
    }

    // **** FIND ACCEPTED FRIEND
    // const users = await FriendService.friendAcceptedFriend(req.user.id);

    // FIND PENDING FRIEND
    // const users = await FriendService.friendAcceptedFriend(req.user.id);

    //***FIND UNKNOWN
    // const users = await FriendService.friendAcceptedFriend(req.user.id);

    res.json({ users });
  } catch (err) {
    next(err);
  }
};

exports.requestFriend = async (req, res, next) => {
  try {
    const { requestToId } = req.body;
    // console.log(req.user);

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

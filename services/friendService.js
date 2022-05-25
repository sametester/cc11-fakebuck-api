const { Op } = require('sequelize');
const { Friend, User } = require('../models');
const { FRIEND_ACCEPTED } = require('../config/constants');

exports.findAcceptedFriend = async id => {
  // WHERE (requestToId = 1 OR requestFromId = 1) AND status = 'ACCEPTED'
  const friend = await Friend.findAll({
    where: {
      [Op.or]: [{ requestToId: id }, { requestFromId: id }],
      status: FRIEND_ACCEPTED,
    },
  });

  const friendIds = friend.map(el =>
    el.requestToId === id ? el.requestFromId : el.requestToId
  );

  // SELECT * FROM users WHERE id IN (3, 4)
  const users = await User.findAll({
    where: { id: friendIds },
    attributes: { exclude: ['password'] },
  });
  return users;
};

exports.findPendingFriend = async id => {
  const friends = await Friend.findAll({
    where: {
      requestToId: id,
      status: FRIEND_PENDING,
    },
    include: {
      model: User,
      as: 'RequestFrom',
      attributes: {
        exclude: ['password'],
      },
    },
  });
  return friend.map(el => el.requestFrom);
};

// exports.findPendingFriend = async id => {
//     const friends = await Friend.findAll({
//       where: {
//         requestToId: id,
//         status: FRIEND_PENDING,
//       },
//       include: {
//         model: User,
//         as: 'RequestFrom',
//         attributes: {
//           exclude: ['password'],
//         },
//       },
//     });
//     return friend.map(el => el.RequestTo);
//   };

exports.findUnknown = async id => {
  const friend = await Friend.findAll({
    where: {
      [Op.or]: [{ requestToId: id }, { requestFromId: id }],
    },
  });

  const friendIds = friend.map(el =>
    el.requestToId === id ? el.requestFromId : el.requestToId
  );

  const users = await User.findAll({
    where: { id: { [Op.notIn]: friendIds } },
    attributes: { exclude: ['password'] },
  });
  return users;
};

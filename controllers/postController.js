const fs = require('fs');
const createError = require('../utils/createError');
const cloudinary = require('../utils/cloudinary');
const { Comment, Post, Like, User, sequelize } = require('../models');
const FriendService = require('../services/friendService');

exports.createPost = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title && !req.file) {
      createError('title or image is required', 400);
    }

    let image;
    if (req.file) {
      const result = await cloudinary.upload(req.file.path);
      image = result.secure_url;
    }

    const post = await Post.create({ title, image, userId: req.user.id });
    res.json({ post });
  } catch (err) {
    next(err);
  } finally {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
  }
};

exports.createLike = async (req, res, next) => {
  const t = await sequelize.transaction(); // START TRANSACTION
  try {
    const { postId } = req.params;

    const existLike = await Like.findOne({
      where: {
        postId,
        userId: req.user.id,
      },
    });

    if (existLike) {
      createError('you already liked this post', 400);
    }

    const post = await Post.findOne({ where: { id: postId } });
    if (!post) {
      createError('post not found', 400);
    }

    const like = await Like.create(
      {
        postId,
        userId: req.user.id,
      },
      { transaction: t }
    );
    await post.increment({ like: 1 }, { transaction: t });
    await t.commit();

    res.json({ like });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.deleteLike = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { postId } = req.params;

    const like = await Like.findOne({
      where: {
        postId,
        userId: req.user.id,
      },
    });

    if (!like) {
      createError('you never like this post', 400);
    }

    const post = await Post.findOne({ where: { id: postId } });
    if (!post) {
      createError('post not found', 400);
    }

    await like.destroy({ transaction: t });
    await post.decrement({ like: 1 }, { transaction: t });
    await t.commit();

    res.status(204).json();
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (!title && !req.file) {
      createError('title or image is required', 400);
    }

    const post = await Post.findOne({ where: { id } });
    if (!post) {
      createError('post not found', 400);
    }
    if (post.userId !== req.user.id) {
      createError('you have no permission', 403);
    }

    if (req.file) {
      if (post.image) {
        const splited = post.image.split('/');
        const publicId = splited[splited.length - 1].split('.')[0];
        await cloudinary.destroy(publicId);
      }
      const result = await cloudinary.upload(req.file.path);
      post.image = result.secure_url;
    }

    if (title) {
      post.title = title;
    }
    await post.save();

    res.json({ post });
  } catch (err) {
    next(err);
  } finally {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
  }
};

exports.deletePost = async (req, res, next) => {
  let t;
  try {
    t = await sequelize.transaction();
    const { id } = req.params;
    const post = await Post.findOne({ where: { id } });
    if (!post) {
      createError('post not found', 400);
    }
    if (post.userId !== req.user.id) {
      createError('you have no permission', 403);
    }
    await Comment.destroy({ where: { postId: id } }, { transaction: t });
    await Like.destroy({ where: { postId: id } }, { transaction: t });

    if (post.image) {
      const splited = post.image.split('/');
      const publicId = splited[splited.length - 1].split('.')[0];
      await cloudinary.destroy(publicId);
    }
    await Post.destroy({ where: { id } }, { transaction: t });
    await t.commit();
    res.status(204).json();
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.getUserPost = async (req, res, next) => {
  try {
    const userId = await FriendService.findFriendId(req.user.id); // [friendId1, friendId2, friendId3, ...]
    userId.push(req.user.id); // Add myId to userId => [friendId1, friendId2, friendId3, ..., myId]

    // SELECT * FROM posts WHERE userId IN (myId, friendId1, friendId2, friendId3, ...)
    const posts = await Post.findAll({
      where: { userId: userId }, // WHERE userId IN (1,2,3) => WHERE userId = 1 OR userId = 2 OR userId = 3
      attributes: {
        exclude: ['createdAt', 'userId'],
      },
      include: [
        {
          model: User,
          attributes: {
            exclude: [
              'password',
              'email',
              'phoneNumber',
              'coverPhoto',
              'createdAt',
            ],
          },
        },
        {
          model: Comment,
          attributes: {
            exclude: ['createdAt', 'userId'],
          },
          include: {
            model: User,
            attributes: {
              exclude: [
                'password',
                'email',
                'phoneNumber',
                'coverPhoto',
                'createdAt',
              ],
            },
          },
        },
      ],
    });
    res.json({ posts });
  } catch (err) {
    next(err);
  }
};

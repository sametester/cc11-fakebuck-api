const fs = require('fs');
const createError = require('../utils/createError');
const cloudinary = require('../utils/cloudinary');
const { Comment, Post, Like, sequelize } = require('../models');

exports.create = async (req, res, next) => {
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

//! CREATE LIKE

exports.createLike = async (req, res, next) => {
  const t = await sequelize.transaction();
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

//! DELETE LIKE
const t = await sequelize.transaction();
exports.deleteLike = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const like = await Like.findOne({
      where: {
        postId,
        userId: req.user.id,
      },
    });

    if (!like) {
      createError('you already liked this post', 400);
    }

    const post = await Post.findOne({ where: { id: postId } });
    if (!post) {
      createError('post not found', 400);
    }

    // const like = await Like.create(
    //   {
    //     postId,
    //     userId: req.user.id,
    //   },
    //   { transaction: t }
    // );

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
      createError('title or image is requires', 400);
    }

    const post = await Post.findOne({ where: { id } });
    if (!post) {
      createError('post not found', 400);
    }
    if (post.userId !== req) {
      createError('post not found', 400);
    }

    await Comment.destroy({ where: { postId: id } }, { transaction: t });
    await Like.destroy({ where: { postId: id } }, { transaction: t });

    if (post.image) {
      const splitted = post.image.split('/');
      const publicId = splitted[splitted.length - 1].split('.')[0];
      await cloudinary.destroy(publicId);
    }

    await Post.destroy({ where: { id }, transaction: t });
    await t.commit();
    res.status(204).json();
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const post = await Post.findOne({ where: { id } });
    if (!post) {
      createError('post not found', 400);
    }

    if (post.userId !== req.use.id) {
      createError('you have no permission', 400);
    }

    await Comment.destroy({ where: { postId: id } }, { transaction: t });
    await Like.destroy({ where: { postId: id } }, { transaction: t });

    if (post.image) {
      const splitted = post.image.split('/');
      const publicId = splitted[splitted.length - 1].split('.')[0];
      await cloudinary.destroy(publicId);
    }

    await Post.destroy({ where: { id }, transaction: t });
    await t.commit();
    res.status(204).json();
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

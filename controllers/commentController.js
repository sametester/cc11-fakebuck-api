const createError = require('../utils/createError');

exports.createComment = async (req, res, next) => {
  try {
    const { title } = req.body;
    const { postId } = req.params;

    const comment = await Comment.create({ title, postId });
    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
};

exports.updateComment = async (req, res, next) => {
  try {
    const { title } = req.body;
    const { id, postId } = req.params;
    const comment = await Comment.findOne({ id, postId });
    if (!comment) {
      createError('comment not found', 400);
    }

    if (comment.userId !== req.user.id) {
      createError('you have no permission', 400);
    }
    comment.title = title;
    await title.save();
    res.json({ comment });
  } catch (err) {
    next(err);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const { id, postId } = req.params;
    const comment = await Comment.findOne({ id, postId });
    if (!comment) {
      createError('comment not found', 400);
    }
    if (comment.userId !== req.user.id) {
      createError('you have no permission', 403);
    }
    await comment.destroy();
    res.status(204).json();
  } catch (err) {
    next(err);
  }
};

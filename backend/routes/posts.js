const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/permissions');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Ownership check middleware (unchanged)
const checkOwnership = (req, res, next) => {
  if (req.user.role === 'Admin') {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: req.user.userId,
      role: req.user.role,
      action: 'ownership:check',
      outcome: 'bypass_admin'
    }));
    return next();
  }

  const { id } = req.params;
  Post.findById(id)
    .then(post => {
      if (!post) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          userId: req.user.userId,
          role: req.user.role,
          action: 'ownership:check',
          outcome: 'fail_not_found'
        }));
        return res.status(404).json({ message: 'Post not found!' });
      }
      if (post.author.toString() !== req.user.userId) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          userId: req.user.userId,
          role: req.user.role,
          action: 'ownership:check',
          outcome: 'fail_no_ownership'
        }));
        return res.status(403).json({ message: 'You can only edit your own posts!' });
      }
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        userId: req.user.userId,
        role: req.user.role,
        action: 'ownership:check',
        outcome: 'success'
      }));
      next();
    })
    .catch(err => {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        userId: req.user.userId,
        role: req.user.role,
        action: 'ownership:check',
        outcome: 'fail_error',
        error: err.message
      }));
      res.status(500).json({ message: 'Ownership check error', error: err.message });
    });
};

// GET /api/posts - Read all
router.get('/', authMiddleware, checkPermission('posts:read'), async (req, res) => {
  try {
    const query = {};
    // Editors can view all posts by default; use ?mine=true to fetch only own
    if (req.user.role === 'Editor' && req.query.mine === 'true') {
      query.author = req.user.userId;
    }
    const posts = await Post.find(query).sort({ createdAt: -1 }).populate('author', 'username');
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: req.user.userId,
      role: req.user.role,
      action: 'post:read',
      outcome: 'success',
      numPosts: posts.length
    }));
    res.json({ message: 'Posts fetched!', posts });
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: req.user.userId,
      role: req.user.role,
      action: 'post:read',
      outcome: 'fail_error',
      error: error.message
    }));
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
});

// POST /api/posts - Create with validation
router.post(
  '/',
  authMiddleware,
  checkPermission('posts:create'),
  [
    body('title').trim().isLength({ min: 1 }).escape().withMessage('Title is required'),
    body('content').trim().isLength({ min: 1 }).escape().withMessage('Content is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        userId: req.user.userId,
        role: req.user.role,
        action: 'post:create',
        outcome: 'fail_validation',
        error: errors.array()[0].msg
      }));
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { title, content } = req.body;
      const post = new Post({
        title,
        content,
        author: req.user.userId
      });
      await post.save();
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        userId: req.user.userId,
        role: req.user.role,
        action: 'post:create',
        outcome: 'success',
        postId: post._id
      }));
      await post.populate('author', 'username');
      res.status(201).json({ message: 'Post created!', post });
    } catch (error) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        userId: req.user.userId,
        role: req.user.role,
        action: 'post:create',
        outcome: 'fail_error',
        error: error.message
      }));
      res.status(500).json({ message: 'Error creating post', error: error.message });
    }
  }
);

// PUT /api/posts/:id - Update with validation
router.put(
  '/:id',
  authMiddleware,
  checkPermission('posts:update'),
  checkOwnership,
  [
    body('title').trim().isLength({ min: 1 }).escape().withMessage('Title is required'),
    body('content').trim().isLength({ min: 1 }).escape().withMessage('Content is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        userId: req.user.userId,
        role: req.user.role,
        action: 'post:update',
        outcome: 'fail_validation',
        error: errors.array()[0].msg
      }));
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { title, content } = req.body;
      const post = await Post.findByIdAndUpdate(
        req.params.id,
        { title, content },
        { new: true, runValidators: true }
      ).populate('author', 'username');

      if (!post) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          userId: req.user.userId,
          role: req.user.role,
          action: 'post:update',
          outcome: 'fail_not_found',
          postId: req.params.id
        }));
        return res.status(404).json({ message: 'Post not found!' });
      }

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        userId: req.user.userId,
        role: req.user.role,
        action: 'post:update',
        outcome: 'success',
        postId: post._id
      }));
      res.json({ message: 'Post updated!', post });
    } catch (error) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        userId: req.user.userId,
        role: req.user.role,
        action: 'post:update',
        outcome: 'fail_error',
        postId: req.params.id,
        error: error.message
      }));
      res.status(500).json({ message: 'Error updating post', error: error.message });
    }
  }
);

// DELETE /api/posts/:id - Delete (no body validation needed)
router.delete('/:id', authMiddleware, checkPermission('posts:delete'), checkOwnership, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        userId: req.user.userId,
        role: req.user.role,
        action: 'post:delete',
        outcome: 'fail_not_found',
        postId: req.params.id
      }));
      return res.status(404).json({ message: 'Post not found!' });
    }
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: req.user.userId,
      role: req.user.role,
      action: 'post:delete',
      outcome: 'success',
      postId: post._id
    }));
    res.json({ message: 'Post deleted!' });
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: req.user.userId,
      role: req.user.role,
      action: 'post:delete',
      outcome: 'fail_error',
      postId: req.params.id,
      error: error.message
    }));
    res.status(500).json({ message: 'Error deleting post', error: error.message });
  }
});

module.exports = router;
const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');  // For ownership checks
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/permissions');
const router = express.Router();

// Ownership check middleware (for Editors: own content only; Admins bypass)
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
        return res.status(403).json({ message: 'You can only edit your own posts! 🚫' });
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

// GET /api/posts - Read all (Viewers: all; Editors: all? Wait, per req: filter by role/ownership? For now, all read access; filter in UI later)
router.get('/', authMiddleware, checkPermission('posts:read'), async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'username');  // Fetch author name
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: req.user.userId,
      role: req.user.role,
      action: 'post:read',
      outcome: 'success',
      numPosts: posts.length
    }));
    res.json({ message: 'Posts fetched! 📝', posts });
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

// POST /api/posts - Create (Editors/Admins only)
router.post('/', authMiddleware, checkPermission('posts:create'), async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        userId: req.user.userId,
        role: req.user.role,
        action: 'post:create',
        outcome: 'fail_validation'
      }));
      return res.status(400).json({ message: 'Title and content required!' });
    }
    const post = new Post({
      title,
      content,
      author: req.user.userId  // Auto-set from token
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
    await post.populate('author', 'username');  // Add author info
    res.status(201).json({ message: 'Post created! ✨', post });
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
});

// PUT /api/posts/:id - Update (Editors: own only; Admins: any)
router.put('/:id', authMiddleware, checkPermission('posts:update'), checkOwnership, async (req, res) => {
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
    res.json({ message: 'Post updated! 🔄', post });
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
});

// DELETE /api/posts/:id - Delete (Editors: own only; Admins: any)
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
    res.json({ message: 'Post deleted! 🗑️' });
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
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Links to User model for ownership (e.g., req.user.userId === post.author)
    required: true
  }
}, {
  timestamps: true  // Auto-adds createdAt/updatedAt
});

// Indexes for query performance on scoped reads and sorting
postSchema.index({ author: 1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
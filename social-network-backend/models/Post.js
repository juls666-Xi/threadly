const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Index for chronological sorting
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);

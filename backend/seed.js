const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Post = require('./models/Post');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Seeding database... 🌱');

    // Clear existing data (careful in prod!)
    await User.deleteMany({});
    await Post.deleteMany({});

    // Seed users
    const admin = await new User({ username: 'admin', email: 'admin@example.com', password: 'admin123', role: 'Admin' }).save();
    const editor = await new User({ username: 'editor', email: 'editor@example.com', password: 'editor123', role: 'Editor' }).save();
    const viewer = await new User({ username: 'viewer', email: 'viewer@example.com', password: 'viewer123', role: 'Viewer' }).save();

    // Seed demo posts
    const editorPost = await new Post({ title: 'Editor Demo Post', content: 'This is owned by Editor—only they/Admin can edit!', author: editor._id }).save();
    const adminPost = await new Post({ title: 'Admin Demo Post', content: 'This is owned by Admin—full access!', author: admin._id }).save();

    console.log('Seeding complete! Users:', { admin: admin.username, editor: editor.username, viewer: viewer.username });
    console.log('Demo posts:', { editorPost: editorPost.title, adminPost: adminPost.title });

    mongoose.connection.close();
  })
  .catch(err => console.error('Seed error:', err));
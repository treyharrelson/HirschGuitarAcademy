// import modules
const User = require('./User');
const Post = require('./Post');
const Class = require('./Class');
const Thread = require('./Thread');
const Attachment = require('./Attachment');

// define associations
Thread.belongsTo(User, { foreignKey: 'authorId', as: 'author'});
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });
Post.belongsTo(Thread, { foreignKey: 'threadId' });
Thread.hasMany(Post, { foreignKey: 'threadId' });
User.hasMany(Thread, { foreignKey: 'authorId' });
User.hasMany(Post, { foreignKey: 'userId' });
Post.hasMany(Attachment, { foreignKey: 'postId', as: 'attachments' });
Attachment.belongsTo(Post, { foreignKey: 'postId' });

// export models
module.exports = {
	User,
	Post,
	Class,
	Thread,
	Attachment,
};
const User = require('./User');
const Post = require('./Post');
const Class = require('./Class');

// not sure if these work as intended, need to look into relationships with sequelize
// probably a good way to do it though
User.hasMany(Post, { foreignKey: 'userId' });
Post.belongsTo(User, { foreignKey: 'userId' });

Class.hasMany(User, { foreignKey: 'classId' });
User.belongsTo(Class, { foreignKey: 'classId' });

module.exports = {
	User: require('./User'),
	Post: require('./Post'),
	Class: require('./Class')
};
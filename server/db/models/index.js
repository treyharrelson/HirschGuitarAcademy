const sequelize = require('../db')

// import modules
const User = require('./User');
const Thread = require('./Thread');
const Post = require('./Post');
const Comment = require('./Comment')
const Course = require('./Course');
const Enrollment = require('./Enrollment');
const Notification = require('./Notification')
const Subscription = require('./Subscription')

// Associations work like this:
// Table_to_give_foreign_key.hasMany(table_to_take_foreign_key, {
// foreignKey: 'foreign_key_name_in_take_database'
// as: 'json_return_name'    (as in when query, this column will be 'json_return_name')
// } )
// table_to_take_foreign_key.belongsTo(Table_to_give_foreign_key, {
// foreignKey: 'foreign_key_name_in_take_database'
// as: 'json_return_name'    (as in when query, this column will be 'json_return_name')
// } )
// Seems redundant because it is, SQL only needs one, but for magic methods to work both ways. If only do one, 
//  can only do like User.getclasses and not Class.getUsers or the other way around. Need both to go both ways
//  also pretty sure "foreignkey" needs to be the same, "as" might not have to

// define associations
// Instructor to courses
User.hasMany(Course, { foreignKey: 'instructorId', as: 'taughtCourses' });
Course.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });

// Students to courses
User.belongsToMany(Course, { through: Enrollment, foreignKey: 'userId', otherKey: 'courseId', as: 'enrolledCourses' });
Course.belongsToMany(User, { through: Enrollment, foreignKey: 'courseId', otherKey: 'userId', as: 'students' });

// Enrollment table direct setup, just helps with magic functions
User.hasMany(Enrollment, { foreignKey: 'userId' });
Enrollment.belongsTo(User, { foreignKey: 'userId' });
Course.hasMany(Enrollment, { foreignKey: 'courseId' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId' });

// User to threads
User.hasMany(Thread, { foreignKey: 'authorId', as: 'threads' });
Thread.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// User to posts
User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// Thread to posts
Thread.hasMany(Post, { foreignKey: 'threadId', as: 'posts' });
Post.belongsTo(Thread, { foreignKey: 'threadId', as: 'thread' });

// Post to comments
Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// User to comments
User.hasMany(Comment, { foreignKey: 'authorId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// User to notifications
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User to subscriptions
User.hasOne(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });


module.exports = {
    sequelize,
    User,
    Course, 
    Enrollment,
    Thread,
    Post,
    Comment,
    Notification,
    Subscription
};
const sequelize = require('../db')

// import modules
const User = require('./User');
const Thread = require('./Thread');
const Post = require('./Post');
const Comment = require('./Comment')
const Course = require('./Course');
const Enrollment = require('./Enrollment');
const Message = require('./Message');
const Notification = require('./Notification');
const Follow = require('./Follow');
const Module = require('./Module');
const Lecture = require('./Lecture');
const Attachment = require('./Attachment');
const Belt = require('./Belt');
const Award = require('./Award');
const PracticeTime = require('./PracticeTime');
const ScoreBoard = require('./ScoreBoard');
const CourseRequirement = require('./CourseRequirement');
const ThreadBan = require('./ThreadBan');
const Progress = require('./Progress');
const ThreadMember = require('./ThreadMember');
const Reaction = require('./Reaction');
const ProfileSettings = require('./ProfileSettings');

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

// Course prerequisites
Course.belongsToMany(Course, { through: CourseRequirement, as: 'requirements', foreignKey: 'courseId', otherKey: 'requiredCourseId' });

// Required By (The courses that this course unlocks)
Course.belongsToMany(Course, { through: CourseRequirement, as: 'requiredBy', foreignKey: 'requiredCourseId', otherKey: 'courseId' });

// Enrollment table direct setup, just helps with magic functions
User.hasMany(Enrollment, { foreignKey: 'userId' });
Enrollment.belongsTo(User, { foreignKey: 'userId' });
Course.hasMany(Enrollment, { foreignKey: 'courseId' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId' });

// Course to Modules
Course.hasMany(Module, { foreignKey: 'courseId', as: 'modules' });
Module.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Module to SubModules (Self-reference)
Module.hasMany(Module, { foreignKey: 'parentModuleId', as: 'subModules' });
Module.belongsTo(Module, { foreignKey: 'parentModuleId', as: 'parentModule' });

// Module to Lectures
Module.hasMany(Lecture, { foreignKey: 'moduleId', as: 'lectures' });
Lecture.belongsTo(Module, { foreignKey: 'moduleId', as: 'module' });

// User to threads
User.hasMany(Thread, { foreignKey: 'authorId', as: 'threads' });
Thread.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// User to posts
User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// Thread to posts
Thread.hasMany(Post, { foreignKey: 'threadId', as: 'posts' });
Post.belongsTo(Thread, { foreignKey: 'threadId', as: 'thread' });

// Thread to ThreadMembers
Thread.hasMany(ThreadMember, { foreignKey: 'threadId', as: 'members' });
ThreadMember.belongsTo(Thread, { foreignKey: 'threadId', as: 'thread' });
User.hasMany(ThreadMember, { foreignKey: 'userId', as: 'threadAccess' });
ThreadMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Post to the thread it announces (for global announcement posts)
Post.belongsTo(Thread, { foreignKey: 'announcedThreadId', as: 'announcedThread' });
Thread.hasMany(Post, { foreignKey: 'announcedThreadId', as: 'announcements' });

// Post to comments
Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// Post to attachments
Post.hasMany(Attachment, { foreignKey: 'postId', as: 'attachments' });
Attachment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// User to comments
User.hasMany(Comment, { foreignKey: 'authorId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// Reactions on posts
Post.hasMany(Reaction, { foreignKey: 'postId', as: 'reactions' });
Reaction.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
User.hasMany(Reaction, { foreignKey: 'userId', as: 'reactions' });
Reaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Reactions on comments
Comment.hasMany(Reaction, { foreignKey: 'commentId', as: 'reactions' });
Reaction.belongsTo(Comment, { foreignKey: 'commentId', as: 'comment' });

// User to messages
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

User.hasMany(Message, { foreignKey: 'recipientId', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

// User to notifications
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User to thread follows
User.hasMany(Follow, { foreignKey: 'userId', as: 'follows' });
Thread.hasMany(Follow, { foreignKey: 'threadId', as: 'follows'})
Follow.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Follow.belongsTo(Thread, { foreignKey: 'threadId', as: 'thread' });

// Thread Bans
User.hasMany(ThreadBan, { foreignKey: 'userId', as: 'threadBans' });
ThreadBan.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Thread.hasMany(ThreadBan, { foreignKey: 'threadId', as: 'bans' });
ThreadBan.belongsTo(Thread, { foreignKey: 'threadId', as: 'thread' });
User.hasMany(ThreadBan, { foreignKey: 'bannedById', as: 'issuedBans' });
ThreadBan.belongsTo(User, { foreignKey: 'bannedById', as: 'bannedBy' });

// Belt to Course and User
User.hasMany(Belt, { foreignKey: 'userId', as: 'belts' });
Belt.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Course.hasMany(Belt, { foreignKey: 'courseId', as: 'belts' });
Belt.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });


// Award to User, should figure out what awards are
User.hasMany(Award, { foreignKey: 'userId', as: 'awards' });
Award.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// PracticeTime to user, should think about how this should be set up
// Right now has total practice time and weekly practice time, figure can be cleared at set intervals or something
// Fine for now, just might want to change
User.hasOne(PracticeTime, { foreignKey: 'userId', as: 'practice_time' });
PracticeTime.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ProfileSettings to User
User.hasOne(ProfileSettings, {foreignKey: 'userId', as: 'profile_settings'});
ProfileSettings.belongsTo(User, {foreignKey: 'userId', as: 'user'});

// Scoreboard not linked like others, just counts what they have, might be able to make with relations, for now does nothing


module.exports = {
    sequelize,
    User,
    Course,
    Enrollment,
    Message,
    Thread,
    Post,
    Comment,
    Notification,
    Follow,
    Module,
    Lecture,
    Attachment,
    Belt,
    Award,
    PracticeTime,
    ScoreBoard,
    CourseRequirement,
    ThreadBan,
    ThreadMember,
    Reaction,
    ProfileSettings,
};
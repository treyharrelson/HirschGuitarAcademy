const express = require('express');
const router = express.Router();
const Models = require('../db/models');

const VALID_TYPES = ['like', 'love', 'laugh', 'fire', 'celebrate'];

// helper: build reaction summary for a target
async function getReactionSummary(where, userId) {
    const all = await Models.Reaction.findAll({ where });
    const counts = { like: 0, love: 0, laugh: 0, fire: 0, celebrate: 0 };
    let userReaction = null;
    for (const r of all) {
        counts[r.type]++;
        if (r.userId === userId) userReaction = r.type;
    }
    return { counts, userReaction };
}

// Get /api/posts/:postId/comments
router.get('/:postId/comments', async (req, res) => {
    try {
        const comments = await Models.Comment.findAll({
            where: { postId: req.params.postId },
            include: [
                { model: Models.User, as: 'author', attributes: ['userName', 'firstName', 'lastName'] }
            ],
            order: [['createdAt', 'ASC']]
        });

        // attach reactions to each comment
        const userid = req.session.user.id;
        const withReactions = await Promise.all(comments.map(async c => {
            const summary = await getReactionSummary({ commentId: c.id }, userId);
            return { ...c.toJSON(), ...summary };
        }));

        res.json(withReactions);
    } catch (error) {
        res.status(500).json({ message: `Error fetching comments: ${error.message}`});
    }
});

// POST /api/posts/:postId/comments
router.post('/:postId/comments', async (req, res) => {
    try {
        const { content } = req.body;
        const comment = await Models.Comment.create({
            postId: req.params.postId,
            authorId: req.session.user.id,
            content
        });

        const commentWithAuthor = await Models.Comment.findByPk(comment.id, {
            include: [
                { model: Models.User, as: 'author', attributes: ['userName', 'firstName', 'lastName'] }
            ]
        });

        res.status(201).json({ ...commentWithAuthor.toJSON(), counts: { like:0,love:0,laugh:0,fire:0,celebrate:0 }, userReaction: null });
    } catch (error) {
        res.status(500).json({ message: `Error creating comment: ${error}` });
    }
});

// ---REACTIONS TO POSTS--- 

// Get /api/posts/:postId/reactions
router.get('/:postId/reactions', async (req, res) => {
    try {
        const summary = await getReactionSummary({ postId: req.params.postId }, req.session.user.id);
        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: `Error fetching reactions: ${error}`});
    }
});

// POST /api/posts/:postId/reactions body: { type }
// - same type already set -> remove (toggle off)
// - different type -> switch
// - no reaction -> create
router.post('/:postId/reactions', async (req, res) => {
    try {
        const { type } = req.body;
        if (!VALID_TYPES.includes(type)) return res.status(400).json({ message: 'Invalid reaction type' });

        const userId = req.session.user.id;
        const postId = req.params.postId;

        const existing = await Models.Reaction.findOne({ where: { userId, postId } });

        if (existing) {
            // same type already set
            if (existing.type === type) {
                await existing.destroy(); //toggle off
            } else {
                await existing.update({ type }); // switch
            }
        } else {
            await Models.Reaction.create({ userId, postId, type });
        }

        const summary = await getReactionSummary({ postId }, userId);
        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: `Error reacting: ${error}`});
    }
});

// GET /api/posts/:postId/comments/:commentId/reactions
router.get('/:postId/comments/:commentId/reactions', async (req, res) => {
    try {
        const summary = await getReactionSummary({ commentId: req.params.commentId }, req.session.user.id);
        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: `Error fetching reactions: ${error}` });
    }
});

// ---REACTIONS TO COMMENTS (replies) IN A POST--- 

// POST /api/posts/:postId/comments/:commentId/reactions  body: { type }
router.post('/:postId/comments/:commentId/reactions', async (req, res) => {
    try {
        const { type } = req.body;
        if (!VALID_TYPES.includes(type)) return res.status(400).json({ message: 'Invalid reaction type' });

        const userId = req.session.user.id;
        const commentId = req.params.commentId;

        const existing = await Models.Reaction.findOne({ where: { userId, commentId } });

        if (existing) {
            if (existing.type === type) {
                await existing.destroy();
            } else {
                await existing.update({ type });
            }
        } else {
            await Models.Reaction.create({ userId, commentId, type });
        }

        const summary = await getReactionSummary({ commentId }, userId);
        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: `Error reacting: ${error}` });
    }
});

module.exports = {router, getReactionSummary };
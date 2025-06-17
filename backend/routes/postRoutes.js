const express = require('express');
const router = express.Router();
const LostDog = require('../models/LostDog');
const FoundDog = require('../models/FoundDog');

router.get('/new-posts-count', async (req, res) => {
    try {
        const newLostDogsCount = await LostDog.countDocuments({ isNew: true });
        const newFoundDogsCount = await FoundDog.countDocuments({ isNew: true });
        const newPostsCount = newLostDogsCount + newFoundDogsCount;
        res.json({ newPostsCount });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching new posts count' });
    }
});

router.get('/new-posts', async (req, res) => {
    try {
        const newLostDogs = await LostDog.find({ isNew: true }).sort({ createdAt: -1 });  
        const newFoundDogs = await FoundDog.find({ isNew: true }).sort({ createdAt: -1 });  
        const notifications = [...newLostDogs, ...newFoundDogs];
        res.json({ notifications });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching new posts' });
    }
});
module.exports = router;

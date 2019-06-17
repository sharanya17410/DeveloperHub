const express=require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const Posts = require('../../models/Posts');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator/check');
const request=require('request');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

//@route POST api/posts
//@access Private
//@desc Create a post
router.post('/',[auth,
    check('text','Text is required').not().isEmpty()
], async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
try {
    const user = await User.findById(req.user.id).select('-password');
    const newPost=new Posts({
        text: req.body.text,
        name : user.name,
        avatar : user.avatar,
        user: req.user.id
    });
    const post= await newPost.save();
    res.json(post);
} catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
}
    
});

//@route GET api/posts
//@access Private
//@desc Get all posts

router.get('/',auth,async (req,res)=>{
    try {
        const posts = await Posts.find().sort({date:-1});
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route GET api/posts/:id
//@access Private
//@desc Get post by ID

router.get('/:id',auth,async (req,res)=>{
    try {
        const post = await Posts.findById(req.params.id);
        if(!post){
            return res.status(404).json({msg:'Post not found'});
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);
        if(err.kind==='ObjectId'){
            return res.status(404).json({msg:'Post not found'});
        }
        res.status(500).send('Server Error');
    }
});


//@route DELETE api/posts/:id
//@access Private
//@desc Delete a post

router.delete('/:id',auth,async (req,res)=>{
    try {
        const post = await Posts.findById(req.params.id);
        if(post.user.toString()!==req.user.id){
            return res.status(401).json({msg:'User not authorized'});
        }

        await post.remove();
        res.json({msg:'Post removed'});
    } catch (err) {
        console.error(err.message);
        if(err.kind==='ObjectId'){
            return res.status(404).json({msg:'Post not found'});
        }
        res.status(500).send('Server Error');
    }
});

//@route PUT api/posts/like/:id
//@access Like a post
//@desc Delete a post
router.put('/like/:id',auth,async (req,res)=>{
    try {
        const post = await Posts.findById(req.params.id);
        if(post.likes.filter(like=>like.user.toString()===req.user.id).length > 0){
                return res.status(400).json({msg:'Post already liked'});
        }
        post.likes.unshift({user:req.user.id});
        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        if(err.kind==='ObjectId'){
            return res.status(404).json({msg:'Post not found'});
        }
        res.status(500).send('Server Error');
    }
});

//@route PUT api/posts/unlike/:id
//@access Like a post
//@desc Delete a post
router.put('/unlike/:id',auth,async (req,res)=>{
    try {
        const post = await Posts.findById(req.params.id);
        if(post.likes.filter(like=>like.user.toString()===req.user.id).length === 0){
                return res.status(400).json({msg:'Post has not been liked'});
        }
        //Get remove index
        const removeIndex = post.likes.map(like=>like.user.toString()).indexOf(req.user.id);
        post.likes.splice(removeIndex,1);
        
        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        if(err.kind==='ObjectId'){
            return res.status(404).json({msg:'Post not found'});
        }
        res.status(500).send('Server Error');
    }
});
module.exports = router;
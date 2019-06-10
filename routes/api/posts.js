const express=require('express');
const router = express.Router();

//@route GET api/posts
//@access Public
//@desc Test Route
router.get('/',(req,res)=>res.send('Posts Route'));

module.exports = router;
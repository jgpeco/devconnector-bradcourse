const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

//models
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route    POST api/posts
//@desc     Create a Post
//access    Private
router.post(
  '/',
  [auth, [check('text', 'Text is required').not().isEmpty()]], //validation check for text, the other parameters will be taken from user
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password'); //search for user. remeber, req.user.id is available because of the auth middleware

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route    GET api/posts
//@desc     Get all posts
//access    Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route    GET api/posts/:id
//@desc     Get post by id
//access    Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id); //take the id by params

    if (!post) {
      return res.status(404).json({ msg: 'Post not found!' }); //check if the post exists
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      //check for an invalid post id and return the same error as if it was not a found post
      return res.status(404).json({ msg: 'Post not found!' });
    }
    res.status(500).send('Server Error');
  }
});

//@route    DELETE api/posts/:id
//@desc     Remove a post
//access    Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found!' }); //check if the post exists
    }

    //check if the user is the owner of the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await post.remove();

    res.json({ msg: 'Post Removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      //check for an invalid post id and return the same error as if it was not a found post
      return res.status(404).json({ msg: 'Post not found!' });
    }
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/posts/like/:id
//@desc     Like a Post
//access    Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //check if the post has already been liked by this user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0 //using a filter method to compare the like.user to the user authenticated.
      //if the legnth of the return is greater than 0, it is already liked by this user
    ) {
      return res.status(400).json({ msg: 'Post already like' });
    }

    post.likes.unshift({ user: req.user.id });
    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/posts/unlike/:id
//@desc     Unlike a Post
//access    Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //check if the post has already been liked by this user
    if (
      (post.likes.filter(
        (like) => like.user.toString() === req.user.id
      ).length = 0) //this time we are checking if the post isn't liked
    ) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }

    //get remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString()) //mapping through just the users in the array
      .indexOf(req.user.id); //getting the index of the correct user

    post.likes.splice(removeIndex, 1); //removing the like from the correct user

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

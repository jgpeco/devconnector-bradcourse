const express = require('express');
const router = express.Router();
const config = require('config');
//gravatar package
const gravatar = require('gravatar');
//bcryopt
const bcrypt = require('bcryptjs');
//requiring jwtoken
const jwt = require('jsonwebtoken');
// requiring the express-validator methods that we'll use
const { check, validationResult } = require('express-validator');
// importing the user model
const User = require('../../models/User');

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post(
  '/',
  [
    //this is the middleware with the express-validator logic
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    //handling erros of the express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      //see if the user exists
      let user = await User.findOne({ email }); //searching the email in db
      if (user) {
        return res
          .status(400)
          .json({ erros: [{ msg: 'User already exists' }] });
      }
      // get users gravatar
      const avatar = gravatar.url(email, {
        s: '200', //size
        r: 'pg', //rate - no pornographic
        d: 'mm', //default: user icon
      });
      //creating a new user
      user = new User({
        name,
        email,
        avatar,
        password,
      });
      // Encrypt the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt); //creates a hash in the user pw

      await user.save();

      // Return the jswonwebtoken
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 3600000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;

const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator/check');

const User = require('../../models/Users')

// @route   POST api/users
// @desc    Register User
// @access  Public

router.post('/', [
   check('name', 'Name is Required')
      .not()
      .isEmpty(),
   check('email', 'Please enter a Valid email')
      .isEmail(),
   check('password', 'Please enter Password more then 5 char')
      .isLength({min: 6})
], async (req, res) => {
   const errors = validationResult(req);
   if(!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()})
   }
   const { name, email, password } = req.body;

   try {
      // See if user exist
      let user = await User.findOne({email});
      if(user) {
         return res.json(400).json({errors: [{msg: 'User already exists...'}]})
      }
      // Get user Avator
      const avatar = gravatar.url(email, {
         size: '200',
         r: 'pg',
         d: 'mm'
      })
      user = new User({
         name,
         email,
         avatar,
         password
      })
      //Encrupt password
      const salt = await bcrypt.genSalt(10);
      
      user.password = await bcrypt.hash(password, salt);

      user.save();

      // Return JSON webtoken
      const payload = {
         user: {
            id: user.id
         }
      };

      jwt.sign(
         payload, 
         config.get('jwtSecret'),
         { expiresIn: 360000 },
         (err, token) => {
            if(err) throw err;
            res.json({ token });
         })

   } catch(err) {
      console.error(err.message);
      res.status(500).send('Server Error'); 
   }
});

module.exports = router;
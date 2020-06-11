const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  //Get the token from the header
  const token = req.header('x-auth-token'); //header key that we want to send the token on

  //check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, auth denied' });
  }

  //Verify token
  try {
    const decoded = jwt.verify(
      token,
      config.get('jwtSecret'),
      (error, decoded) => {
        if (error) {
          res.status(401).json({ msg: 'Token is not valid' });
        } else {
          req.user = decoded.user;
          next();
        }
      }
    );
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

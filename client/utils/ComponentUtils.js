import Joi from 'joi';

var validatorObj = {
  firstName: Joi.string().alphanum().required().label('first name').options({
    language: {
      any: {
        empty: '!! Oops. Seems like you forgot to fill your first name!',
      }
    }
  }),
  email: Joi.string().required().email().label('Email').options({
    language: {
      any: {
        empty: '!! Oops. Seems like you forgot to fill your email!',
      },
      string: {
        email: '!! Hmm. That doesn\'t seem like a valid email address, at least to me!',
      }
    }
  }),
  password: Joi.string().min(3).max(10).required().label('Password').options({
    language: {
      any: {
        empty: '!! Oops. Seems like you forgot to fill your password!',
      }
    }
  }),
  lastName: Joi.string().alphanum().label('Last Name').options({
    language: {
      any: {
        empty: '!! Oops. Seems like you forgot to fill your last name!',
      }
    }
  })
};

module.exports = validatorObj;

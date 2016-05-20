import Joi from "joi";
var minPassLength = 6;
var maxPassLength = 100;
var validatorObj = {
  firstName: Joi.string().alphanum().required().label("first name").options({
    language: {
      any: {
        empty: "!! Oops. Seems like you forgot to fill your first name!",
      }
    }
  }),
  email: Joi.string().required().email().label("Email").options({
    language: {
      any: {
        empty: "!! Oops. Seems like you forgot to fill your email!",
      },
      string: {
        email: "!! Hmm. That doesn\'t seem like a valid email address, "+
          "at least to me!",
      }
    }
  }),
  password: Joi.string().min(minPassLength).max(maxPassLength).required()
    .label("Password").options({
    language: {
      any: {
        empty: "!! Oops. Seems like you forgot to fill your password!",
      }
    }
  }),
  newPassword: Joi.string().allow("").min(minPassLength).max(maxPassLength)
    .label("Password").options({
    language: {
      any: {
        empty: "!! Oops. Seems like you forgot to fill your password!",
      }
    }
  }),
  lastName: Joi.string().alphanum().label("Last Name").options({
    language: {
      any: {
        empty: "!! Oops. Seems like you forgot to fill your last name!",
      }
    }
  }),
  campaignName: Joi.string().label("Campaign Name").options({
    language: {
      any: {
        empty: "!! Oops. Seems like you forgot to fill your campaign name!",
      }
    }
  }),
  listName: Joi.string().label("List Name").options({
    language: {
      any: {
        empty: "!! Oops. Seems like you forgot to fill your list name!",
      }
    }
  })
};

module.exports = validatorObj;

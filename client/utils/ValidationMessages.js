import Joi from "joi";
const minPassLength = 6;
const maxPassLength = 100;
//const namePattern = /^[a-zA-Z][a-zA-Z0-9-_ ]*$/;
const namePattern = /^\S.*$/;
const fieldNamePattern = /^[a-zA-Z].*$/;
const validatorObj = {
  firstName: Joi.string().alphanum().required().label("first name").options({
    language: {
      any: {
        empty: "!! Oops. It seems like you forgot to fill your first name!",
      },
      string: {
        alphanum: "!! Hmm. That doesn\'t seem like a valid first name, "+
            "at least to me!"
      }
    }
  }),
  email: Joi.string().email({minDomainAtoms: 2}).required().label("Email")
  .options({
    language: {
      any: {
        empty: "!! Oops. It seems like you forgot to fill your email!",
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
        empty: "!! Oops. It seems like you forgot to fill your password!",
      }
    }
  }),
  newPassword: Joi.string().allow("").min(minPassLength).max(maxPassLength)
    .label("Password").options({
    language: {
      any: {
        empty: "!! Oops. It seems like you forgot to fill your password!",
      }
    }
  }),
  campaignName: Joi.string().regex(namePattern).label("Campaign Name").options({
    language: {
      any: {
        empty: "!! Oops. It seems like you forgot to name your campaign. Could"+
          " you?!",
      },
      string: {
        regex: {
          base:"!! Hmm. That doesn\'t seem like a valid campaign name, "+
            "at least to me!",
        }
      }
    }
  }),
  listName: Joi.string().regex(namePattern).label("List Name").options({
    language: {
      any: {
        empty: "!! Oops! It seems like you forgot to name your list. Could "+
          "you?!",
      },
      string: {
        regex: {
          base:"!! Hmm. That doesn\'t seem like a valid list name, "+
            "at least to me!",
        }
      }
    }
  }),
  fieldName: Joi.string().regex(fieldNamePattern).label("Field Name").options({
    language: {
      any: {
        empty: "!! Oops. It seems like you forgot to fill the field name!",
      },
      string: {
        regex: {
          base:"!! Hmm. That doesn\'t seem like a valid field name, "+
            "at least to me!",
        }
      }
    }
  }),
  templateName: Joi.string().regex(namePattern).label("Template Name").options({
    language: {
      any: {
        empty: "!! Oops. It seems like you forgot to fill the template name!",
      },
      string: {
        regex: {
          base:"!! Hmm. That doesn\'t seem like a valid template name, "+
            "at least to me!",
        }
      }
    }
  })
};

module.exports = validatorObj;

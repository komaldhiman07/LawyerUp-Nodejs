import { param } from "express-validator";

class UserCategoryLawsValidator {
  field;

  constructor() {
    this.field = {
   
    };
  }
/* add category law validator */
addCategoryLaw = () => {
    return {
      city: {
        in: ["body"],
        exists: {
          errorMessage: "City is required!",
        }
      },
      name: {
        in: ["body"],
        exists: {
          errorMessage: "Name is required!",
        }
      },
      color: {
        in: ["body"],
      },
    };
  };
  /* end */

/* update category law validator */
updateCategoryLaw = () => {
  return {
    name: {
      in: ["body"],
      exists: {
        errorMessage: "Name is required!",
      }
    },
    color: {
      in: ["body"],
      exists: {
        errorMessage: "Color is required!",
      }
    },
  };
};
/* end */

/* add law to category law validator */
addLawtoCategoryLaw = () => {
  return {
    category_law_id: {
      in: ["body"],
      exists: {
        errorMessage: "Category law id is required!",
      }
    },
    law_id: {
      in: ["body"],
      exists: {
        errorMessage: "Law id is required!",
      }
    },
  };
};
/* end */

}

export default new UserCategoryLawsValidator();

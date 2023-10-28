class UserCategoryLawsValidator {
  
  /* add category law validator */
  createCategory = () => {
    return {
      name: {
        in: ["body"],
        exists: {
          errorMessage: "Category name is required!",
        }
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
          errorMessage: "Category name is required!",
        }
      }
    };
  };
  /* end */

  /* add law to category law validator */
  addLawToCategoryLaw = () => {
    return {
      category_id: {
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
      color: {
        in: ["body"],
        optional: { options: { nullable: false } },
        default: "#008000"
      },
    };
  };
  /* end */

  /* remaining law list validator */
  remainingLawList = () => {
    return {
      city: {
        in: ["body"],
        exists: {
          errorMessage: "city is required!",
        }
      },
      category_law_id: {
        in: ["body"],
        exists: {
          errorMessage: "Category Law id is required!",
        }
      },
    };
  };
  /* end */

  /* law list of a city validator */
  cityLawList = () => {
    return {
      city: {
        in: ["body"],
        exists: {
          errorMessage: "city is required!",
        }
      },
    };
  };
  /* end */

    /* like/dislike law of a city validator */
    likeDislikeLawOfACity = () => {
      return {
        master_law_id: {
          in: ["body"],
          exists: {
            errorMessage: "master_law_id is required!",
          }
        },
        law_id: {
          in: ["body"],
          exists: {
            errorMessage: "law_id is required!",
          }
        },
        action_type: {
          in: ["body"],
          exists: {
            errorMessage: "action_type is required!",
          }
        },
      };
    };
    /* end */
  
}

export default new UserCategoryLawsValidator();

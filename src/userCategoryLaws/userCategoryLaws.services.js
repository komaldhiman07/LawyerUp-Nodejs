import UserCategoryLaws from "../../database/models/userCategoryLaws";

class UserCategoryLawsService {
  constructor() { }

  /* add category law */
  addCategoryLaw = (data) => UserCategoryLaws.create(data);
  /* end */

  /* get category law by city and law id */
  getUserCategoryLaw = (data) => UserCategoryLaws.findOne(data);
  /* end */

  /* delete category law by category law id */
  deleteUserCategoryLaw = (query) => UserCategoryLaws.deleteOne(query);
  /* end */

  /* update category law by category law id */
  updateUserCategoryLaw = (query, data) => UserCategoryLaws.updateOne(query, data);
  /* end */

  /* get category law list */
  getCategoryLawList = (data) => UserCategoryLaws.find(data);
  /* end */

}

export default new UserCategoryLawsService();

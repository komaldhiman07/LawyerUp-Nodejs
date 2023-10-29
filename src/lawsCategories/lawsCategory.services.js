import UserCategoryLaws from "../../database/models/userCategoryLaws";
import Laws from "../../database/models/laws";
import UserLikedLaws from "../../database/models/UserLikedLaws";
export class CategoryService {
  constructor() { }

  /* add category law */
  addCategoryLaw = (data) => UserCategoryLaws.create(data);
  /* end */

  /* get category law by city and law id */
  getUserCategoryLaw = (data) => UserCategoryLaws.findOne(data);
  // getUserCategoryLaw = (data) => UserCategoryLaws.aggregate([
  //   {
  //     $match: {
  //       _id: data._id // Replace with the actual ObjectId of the document in the first table
  //     }
  //   },
  //   {
  //     $lookup: {
  //       from: "secondTable",
  //       localField: "laws",
  //       foreignField: "_id",
  //       as: "lawsDetails"
  //     }
  //   },
  //   {
  //     $addFields: {
  //       laws: "$lawsDetails"
  //     }
  //   },
  //   {
  //     $project: {
  //       lawsDetails: 
  //     }
  //   }
  // ])

  // getUserCategoryLaw = (data) => UserCategoryLaws.find(data).populate({
  //   path: "",
  //   model: Laws,
  //   // select: "name",
  // });
  /* end */

  /* delete category law by category law id */
  deleteUserCategoryLaw = (query) => UserCategoryLaws.deleteOne(query);
  /* end */

  /* update category law by category law id */
  updateUserCategoryLaw = (query, data) => UserCategoryLaws.updateOne(query, data);
  /* end */

  /* get category law list */
  getCategoryLawList = (data) => UserCategoryLaws.find(data).sort({'_id': -1});
  /* end */

  /* get all laws of a city */
  getAllCityLaws = (data) => Laws.findOne(data);
  /* end */

  /* update law of a city */
  updateCityLaws = (query, data) => Laws.updateOne(query, data);
  /* end */

  getUserLikedLaw = (data) => UserLikedLaws.findOne(data);
  createUserLikedLaw = (data) => UserLikedLaws.create(data);
  updateUserLikedLaw = (query, data) => UserLikedLaws.updateOne(query, data);
}
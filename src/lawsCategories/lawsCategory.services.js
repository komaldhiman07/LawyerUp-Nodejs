import mongoose from "mongoose";
import UserCategoryLaws from "../../database/models/userCategoryLaws";
import Laws from "../../database/models/laws";
import UserLikedLaws from "../../database/models/UserLikedLaws";
import StateLaw from "../../database/models/StateLaw";
export class CategoryService {
  constructor() {}

  /* add category law */
  addCategoryLaw = (data) => UserCategoryLaws.create(data);
  /* end */

  // ── Tracked StateLaw helpers ───────────────────────────────────────────────

  /* derive scannable legality verdict from a StateLaw summary */
  classifyLegality = (lawKey, summary) => {
    if (lawKey === "minimum_wage" || lawKey === "death_penalty") return "info";
    const s = (summary || "").toLowerCase();
    if (/\billegal\b|prohibit|banned|not legal|felony/.test(s)) return "prohibited";
    if (/medical only|limited|permit required|decriminal|restricted|misdemeanor|conditional/.test(s)) {
      return "restricted";
    }
    if (/legal|permitless|recreational|constitutional carry|allowed|lawful/.test(s)) {
      return "permitted";
    }
    return "info";
  };

  /* fetch current StateLaw docs by their _ids */
  getStateLawsByIds = (ids) =>
    StateLaw.find({
      _id: { $in: ids.map((i) => new mongoose.Types.ObjectId(i)) },
      is_deleted: false,
    })
      .select("state_code law_key title summary details penalty_text effective_from published_at updatedAt version")
      .lean();

  /* get category law by city and law id */
  getUserCategoryLaw = (data) => UserCategoryLaws.findOne(data).lean();
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
  updateUserCategoryLaw = (query, data) =>
    UserCategoryLaws.updateOne(query, data);
  /* end */

  /* get category law list */
  getCategoryLawList = (data) => UserCategoryLaws.find(data).sort({ _id: -1 }).lean();
  /* end */

  /* get all laws of a city */
  getCityLaws = (data) => Laws.findOne(data).lean();
  getAllCityLaws = async (data) => {
    const result = await Laws.aggregate([
      {
        $match: data,
      },
      {
        $unwind: "$laws", // Expand the lawArray
      },
      {
        $lookup: {
          from: "userlikedlaws",
          let: { law_id: "$laws._id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$law_id", "$$law_id"] },
              },
            },
          ],
          as: "likes",
        },
      },
      {
        $addFields: {
          is_like: {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: "$likes",
                        as: "like",
                        cond: { $eq: ["$$like.is_like", true] },
                      },
                    },
                  },
                  0,
                ],
              },
              then: true,
              else: false,
            },
          },
          is_dislike: {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: "$likes",
                        as: "dislike",
                        cond: { $eq: ["$$dislike.is_dislike", true] },
                      },
                    },
                  },
                  0,
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          city: { $first: "$city" },
          state: { $first: "$state" },
          laws: {
            $push: {
              _id: "$laws._id",
              title: "$laws.title",
              description: "$laws.description",
              likes: "$laws.likes",
              dislikes: "$laws.dislikes",
              added_by: "$laws.added_by",
              is_like: "$is_like",
              is_dislike: "$is_dislike",
            },
          },
        },
      },
      { 
        $limit: 1 // Limits the output to the first matching document
      },
      {
        $replaceRoot: { newRoot: "$$ROOT" } // Promotes the first document as the root
      }
    ]);
    return result && result.length ? result[0] : null;
  }
  /* end */

  /* update law of a city */
  updateCityLaws = (query, data) => Laws.updateOne(query, data);
  /* end */

  getUserLikedLaw = (data) => UserLikedLaws.findOne(data).lean();
  createUserLikedLaw = (data) => UserLikedLaws.create(data);
  updateUserLikedLaw = (query, data) => UserLikedLaws.updateOne(query, data);
}
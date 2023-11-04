import User from '../../database/models/User';
import RaiseLawModal from '../../database/models/RaisedLaws';
import Laws from "../../database/models/laws";
class RaiseLawService {
  constructor() { }
  getRaisedLawById = (data) => RaiseLawModal.findOne(data);
  getRaisedLawList = (data) => RaiseLawModal.find(data).populate({
    path: "user_id",
    model: User,
    as: "user_detail",
    select: ["first_name", "last_name", "email", "profile_image"]
  });
  addRaisedLaw = (data) => RaiseLawModal.create(data);
  updateRaisedLaw = (query, data) => RaiseLawModal.updateOne(query, data);
  deleteRaisedLaw = (query, data) => RaiseLawModal.deleteOne(query, data);
  getCityLaws = (data) => Laws.findOne(data);
}
export default new RaiseLawService();

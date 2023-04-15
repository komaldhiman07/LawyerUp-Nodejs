import User from '../../database/models/User';
import Role from '../../database/models/Role';
import Country from '../../database/models/Country';
import State from '../../database/models/State';
import Language from '../../database/models/Language';
import Rating from '../../database/models/Rating';
import Device from '../../database/models/Device';
import Notification from '../../database/models/Notification';
import Transaction from '../../database/models/Transaction';
import ContactUs from '../../database/models/ContactUs';
import RaisedLaws from '../../database/models/RaisedLaws';

class LawsService {
  constructor() { }
  getRaisedLawById = (data) => RaisedLaws.findOne(data);
  getRaisedLawList = (data) => RaisedLaws.find(data).populate({
    path: "user_id",
    model: User,
    as: "user_datail",
    // select: ["first_name", "last_name", "email"]
  });
  addRaisedLaw = (data) => RaisedLaws.create(data);
  updateRaisedLaw = (query, data) => RaisedLaws.updateOne(query, data);
  deleteRaisedLaw = (query, data) => RaisedLaws.deleteOne(query, data);
}
export default new LawsService();

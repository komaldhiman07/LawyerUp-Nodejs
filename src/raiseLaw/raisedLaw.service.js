import User from '../../database/models/User';
import RaiseLawModal from '../../database/models/RaisedLaws';
import Laws from "../../database/models/laws";
import StateLaw from '../../database/models/StateLaw';
import LawAuditLog from '../../database/models/LawAuditLog';
import { buildLawChangeDetail, resolveStateCode } from '../helpers/lawChangeDiff.js';

class RaiseLawService {
  constructor() { }
  getRaisedLawById = (data) => RaiseLawModal.findOne(data).lean();
  getRaisedLawList = (data) => RaiseLawModal.find(data).populate({
    path: "user_id",
    model: User,
    as: "user_detail",
    select: ["first_name", "last_name", "email", "profile_image"]
  }).lean();
  addRaisedLaw = (data) => RaiseLawModal.create(data);
  updateRaisedLaw = (query, data) => RaiseLawModal.updateOne(query, data);
  deleteRaisedLaw = (query, data) => RaiseLawModal.deleteOne(query, data);
  getCityLaws = (data) => Laws.findOne(data).lean();

  getActiveStateLaw = (stateCode, lawKey) =>
    StateLaw.findOne({
      state_code: stateCode,
      law_key: lawKey,
      is_deleted: false,
    })
      .sort({ version: -1 })
      .lean();

  getLatestAuditLog = (entityId) =>
    LawAuditLog.findOne({
      entity_type: "state_laws",
      entity_id: entityId,
      action: { $in: ["create", "update", "publish", "repeal"] },
    })
      .sort({ createdAt: -1 })
      .lean();

  getStateLawChangeDetail = async ({
    stateCode,
    lawKey,
    homeState,
    changeTypeHint,
  }) => {
    const code = resolveStateCode(stateCode);
    const key = (lawKey || "").trim().toLowerCase();
    if (!code || !key) return null;

    const law = await this.getActiveStateLaw(code, key);
    if (!law) return null;

    const auditLog = await this.getLatestAuditLog(law._id);

    const homeCode = resolveStateCode(homeState);
    let homeLaw = null;
    if (homeCode && homeCode !== code) {
      homeLaw = await StateLaw.findOne({
        state_code: homeCode,
        law_key: key,
        status: "active",
        is_deleted: false,
      })
        .select("state_code title summary penalty_text")
        .lean();
    }

    return buildLawChangeDetail({
      law,
      auditLog,
      homeLaw,
      homeStateCode: homeCode,
      changeTypeHint,
    });
  };
}
export default new RaiseLawService();

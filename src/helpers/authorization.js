import { RESPONSE_CODES } from '../../config/constants'
import { CUSTOM_MESSAGES } from '../../config/customMessages'
import { verifyToken } from './jwt'

export default class Authorization {
    async init(db) {
        this.Models = db.models;
    }

    // module.exports = authorize
    async authorize(roles = []) {
        // function authorize(roles = []) {
        /** an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User']) */
        return [
            /** authorize based on user role */
            async (req, res, next) => {
                /** Decode JWT Token */
                let decoded = verifyToken(req.headers.authorization);
                req.decoded = decoded

                if (decoded === "jwt expired") {
                    return res.status(RESPONSE_CODES.UNAUTHORIZED).status(RESPONSE_CODES.UNAUTHORIZED).json({
                        status: RESPONSE_CODES.UNAUTHORIZED,
                        success: false,
                        data: {},
                        message: CUSTOM_MESSAGES.UNAUTHORIZED_USER
                    })
                }
                /** Check user authorization */
                if (roles.includes(decoded.role_id)) {
                    /** check user exist or not */
                    let user = await this.Models.Users.findOne({ where: { email: decoded.email }, raw: true });
                    if (!user) {
                        return res.status(RESPONSE_CODES.UNAUTHORIZED).status(RESPONSE_CODES.UNAUTHORIZED).json({
                            status: RESPONSE_CODES.UNAUTHORIZED,
                            success: false,
                            data: {},
                            message: CUSTOM_MESSAGES.UNAUTHORIZED_USER
                        })
                    }
                    req.user = user;
                    let user_access = await this.Models.User_access.findOne({ where: { user_id: user.id }, raw: true });

                    let isAccess = await checkUserAccess(req.url, user_access)
                    if (!isAccess) {
                        return res.status(RESPONSE_CODES.UNAUTHORIZED).status(RESPONSE_CODES.UNAUTHORIZED).json({
                            status: RESPONSE_CODES.UNAUTHORIZED,
                            success: false,
                            data: {},
                            message: CUSTOM_MESSAGES.UNAUTHORIZED_USER
                        })
                    }
                    /** return user */
                    next()
                } else {
                    return res.status(RESPONSE_CODES.UNAUTHORIZED).status(RESPONSE_CODES.UNAUTHORIZED).status(401).json({
                        status: RESPONSE_CODES.UNAUTHORIZED,
                        success: false,
                        data: {},
                        message: CUSTOM_MESSAGES.UNAUTHORIZED_USER
                    })
                }
            }
        ]
    }
}

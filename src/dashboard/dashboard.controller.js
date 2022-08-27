import { matchedData } from "express-validator";

import dashboardService from "./dashboard.service";
import { authObj } from "../services/common/object.service";
import { RESPONSE_CODES } from "../../config/constants.js";
import { CUSTOM_MESSAGES } from "../../config/customMessages.js";

class DashboardRoutes {
    constructor() { }

    getDashboardCountAll = async (req) => {
        let retObj = {};
        if (req.user.data.role_id._id != '620504e9f47dd88dfc51e183') {
            retObj = {
                status: RESPONSE_CODES.UNAUTHORIZED,
                success: false,
                data: null,
                message: CUSTOM_MESSAGES.UNAUTHORIZED,
            };
            return retObj;
        }
        const totalCategory = await dashboardService.getTotalCategorySubcategory({ parent_id: null, is_deleted: false });
        const totalSubCategory = await dashboardService.getTotalCategorySubcategory({ parent_id: { $ne: null }, is_deleted: false });
        const totalClub = await dashboardService.getTotalExpertPerformer({ role_id: '620ca6f433032d8eb3c3b247', is_deleted: false, status: 'Active' })
        const totalExpert = await dashboardService.getTotalExpertPerformer({ role_id: '620ca6da33032d8eb3c3b236', is_deleted: false, status: 'Active' })
        const totalPerformer = await dashboardService.getTotalExpertPerformer({ role_id: '620ca6e733032d8eb3c3b239', is_deleted: false, status: 'Active' })
        const totalAlbum = await dashboardService.getTotalAlbum({ is_deleted: false, post_status: true });
        const totalReportedAlbum = await dashboardService.getTotalAlbum({
            is_deleted: false,
            post_status: true,
            report_count: { $gt: 0 },
        });
        retObj = {
            status: RESPONSE_CODES.POST,
            success: true,
            data: { totalCategory, totalSubCategory, totalExpert, totalPerformer, totalClub, totalAlbum, totalReportedAlbum },
            message: CUSTOM_MESSAGES.DASHBOARD_COUNT,
        }
        return retObj;
    };
}

export default DashboardRoutes;

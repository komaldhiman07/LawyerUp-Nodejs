import User from "../../database/models/User";
import categorySubcategory from "../../database/models/CategorySubcategory";
import Album from '../../database/models/Album';
import ReportedAlbums from '../../database/models/ReportedAlbum';
import { query } from "express-validator";

class DashboardRoutes {
    constructor() { }

    getTotalCategorySubcategory = (query) => categorySubcategory.countDocuments(query);

    getTotalExpertPerformer = (query) => User.countDocuments(query);

    getTotalAlbum = (query) => Album.countDocuments(query)

    // getTotalReportedAlbum = (query) => ReportedAlbums.countDocuments(query)
}

export default new DashboardRoutes();

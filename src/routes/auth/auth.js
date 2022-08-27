import authController from "../../controllers/auth/auth";
// import authorize from '../../helpers/authorization';
import schemaValidator from "../../helpers/schemaValidator";
import {
  registerValidator,
  loginValidator,
  updatePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../../validators/auth/auth";
import Authorization from "../../helpers/authorization";

export default class Auth {
  constructor(router, db) {
    this.authorization = new Authorization();
    this.router = router;
    this.db = db;
    this.authInstance = new authController();
  }

  async routes() {
    await this.authInstance.init(this.db);
    await this.authorization.init(this.db);

    /*** register new user ***/
    // this.router
    //   .route('/auth/signup')
    //   .post(schemaValidator(registerValidator), (req, res) => this.authInstance.userRegistration(req, res));

    // /*** user login ***/
    // this.router
    //   .route('/auth/login')
    //   .post(schemaValidator(loginValidator), (req, res) => this.authInstance.login(req, res));

    /*** forgot password ***/
    this.router
      .route("/auth/forgot-password")
      .put(schemaValidator(forgotPasswordValidator), (req, res) =>
        this.authInstance.forgotPassword(req, res)
      );

    /*** reset password ***/
    this.router
      .route("/auth/reset-password/:token")
      .put(schemaValidator(resetPasswordValidator), (req, res) =>
        this.authInstance.resetPassword(req, res)
      );
  }
}

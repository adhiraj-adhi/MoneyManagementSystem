const { Router } = require("express");
const router = Router();

const checkAuth = require("../middleware/middlewares");

const { signin_get, signup_get, signup_post, resendCode_get, resendCode_post, userVerified, signin_post, profile_get, addLender_get, addLender_post, deals_get, addDeals_get, addDeals_post, editDeal_get, editDeal_post, deleteDeal_get, confirm_delete, logout } = require("../controller/controllers");

router.route("/").get(signin_get);
router.route("/signup").get(signup_get).post(signup_post);

router.route("/resendCode").get(resendCode_get).post(resendCode_post);
router.route("/userVerified/:token").get(userVerified);
router.route("/login").post(signin_post);

router.route("/profile/:id").get(checkAuth, profile_get);
router.route("/addLender/:id").get(checkAuth, addLender_get).post(checkAuth, addLender_post);

router.route("/deals/:id/:lendersId").get(checkAuth, deals_get);

router.route("/addDeal/:id/:lendersId").get(checkAuth, addDeals_get).post(checkAuth, addDeals_post)

router.route("/editDeal/:id/:lendersId/:dealsId").get(checkAuth, editDeal_get).post(checkAuth, editDeal_post);

router.route("/deleteDeal/:id/:lendersId/:dealsId").get(checkAuth, deleteDeal_get);
router.route("/confirmDelete/:id/:lendersId/:dealsId").get(checkAuth, confirm_delete);

router.route("/logout").get(logout);

module.exports = router;
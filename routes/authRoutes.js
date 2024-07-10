const express = require('express')
const router = express.Router();

const authController = require('../controllers/authConrtrollers')

router.post('/signup',authController.signup)
router.post('/login',authController.login)
router.post('/sendOTP',authController.sendAgain)
router.post('/verifyOTP',authController.verifyOTP)
router.get('/logout',authController.logout)
router.post("/forgotPassword",authController.sendforgotpasscode)
router.post("/verifyResetCode",authController.checkforgotpasscode)
router.post('/reset-password/:userId',authController.getresetpass)



module.exports = router

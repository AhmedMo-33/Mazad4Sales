const catchAsync = require("express-async-handler");
const userModel = require("../models/userModel");   
const appError = require("../utils/appError");
const jwt = require("jsonwebtoken");
const { promisify } = require('util')
const { sendOtp } = require('../config/twilioService');
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { parsePhoneNumberFromString, getCountryCallingCode } = require('libphonenumber-js');
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const createSendToken = (res, result, statusCode) => {
    const token = result.generateToken(result._id);

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };

    if (process.env.NODE_ENV == "production") cookieOptions.secure = true;

    res.cookie("jwt", token, cookieOptions);

    result.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            result,
        },
    });
};

//----------------------------------------------------------------------------------------- sign up

exports.signup = catchAsync(async (req, res, next) => {
    const user = await userModel.findOne({ userName: req.body.userName });
    if (!user) {

        const user = await userModel.create(req.body);

        // const supportedCountries = ['EG', 'KW']; // Egypt and Kuwait

        // let phoneNumberObject;
        // let isValidPhoneNumber = false;

        // // Try parsing the phone number for each supported country
        // for (let country of supportedCountries) {
        //     phoneNumberObject = parsePhoneNumberFromString(phoneNumber, country);
        //     if (phoneNumberObject && phoneNumberObject.isValid()) {
        //         isValidPhoneNumber = true;
        //         break;
        //     }
        // }

        // if (!isValidPhoneNumber) {
        //     throw new Error('Invalid phone number');
        // }

        // const formattedPhoneNumber = phoneNumberObject.format('E.164');

        //await user.save();


        const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

        const hashedResetCode = crypto
            .createHash("sha256")
            .update(resetCode)
            .digest("hex");

        user.signUpVerifiedToken = hashedResetCode;
        user.signUpVerifiedExpired = Date.now() + 2 * 60 * 1000;
        user.signUpVerified = false;


        // const userName = user.userName.en ? user.userName.en : user.userName.ar;

        //---------------------------------------
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.USER_EMAIL,
              pass: process.env.USER_PASS,
            },
          });
          const mailOptions = {
            from: process.env.USER_EMAIL,
            to: user.email,
            subject: "Verify Your Account",
            html: `
                <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OTP Verification</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 20px;
                    margin: 0;
                    background-color: #f4f4f4;
                }

                .container {
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    display: inline-block;
                    max-width: 400px;
                    margin: auto;
                }

                h1 {
                    color: #4733ab;
                    font-size: 24px;
                }

                .otp {
                    font-size: 22px;
                    letter-spacing: 4px;
                    margin: 10px 0;
                    color: #800080;
                }

                .message {
                    font-size: 16px;
                    color: #333333;
                    margin-top: 20px;
                }
                
                .footer {
                    font-size: 14px;
                    color: #666666;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>

            <div class="container">
                <h1>Verify Your Account</h1>
                
                <p>Hi ${user.fullName},</p>
                
                <p>Thank you for registering with Mazad.</p>
                
                <p>Here is your OTP code:</p>
                
                <div class="otp">${resetCode}</div>
                
                <p class="message">Please enter this code to verify your account.</p>
                
                <p class="footer">This OTP is valid for 10 minutes.<br>from Mazad Team</p>
            </div>

        </body>
        </html>
                `,
          }
        try {
            console.log("object");
            await user.save();
           await transporter.sendMail(mailOptions);
        } catch (err) {
            user.signUpVerifiedToken = undefined;
            user.signUpVerifiedExpired = undefined;
            user.signUpVerified = undefined;
            console.log(err);
            await user.save();
            return next(new appError(req.t('message-error'), 401));//message-error
        }
        res.status(200).json({
            status: "success",
            data: {
                user,
            },
        });
    } else {
        return next(new appError(req.t('user-exist'), 401));//user_exist
    }
});

exports.sendAgain = catchAsync(async (req, res, next) => {

    const user = await userModel.findOne({ email: req.body.email });

    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedResetCode = crypto
        .createHash("sha256")
        .update(resetCode)
        .digest("hex");

    user.signUpVerifiedToken = hashedResetCode;
    user.signUpVerifiedExpired = Date.now() + 2 * 60 * 1000;
    user.signUpVerified = false;

    await user.save();
    //const userName = user.userName.en ? user.userName.en : user.userName.ar;


    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.USER_PASS,
        },
      });
      const mailOptions = {
        from: process.env.USER_EMAIL,
        to: user.email,
        subject: "Verify Your Account",
        html: `
            <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
                margin: 0;
                background-color: #f4f4f4;
            }

            .container {
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                display: inline-block;
                max-width: 400px;
                margin: auto;
            }

            h1 {
                color: #4733ab;
                font-size: 24px;
            }

            .otp {
                font-size: 22px;
                letter-spacing: 4px;
                margin: 10px 0;
                color: #800080;
            }

            .message {
                font-size: 16px;
                color: #333333;
                margin-top: 20px;
            }
            
            .footer {
                font-size: 14px;
                color: #666666;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>

        <div class="container">
            <h1>Verify Your Account</h1>
            
            <p>Hi ${user.fullName},</p>
            
            <p>Thank you for registering with Mazad.</p>
            
            <p>Here is your OTP code:</p>
            
            <div class="otp">${resetCode}</div>
            
            <p class="message">Please enter this code to verify your account.</p>
            
            <p class="footer">This OTP is valid for 10 minutes.<br>from Mazad Team</p>
        </div>

    </body>
    </html>
            `,
      }

    try {
        //await sendOtp(user.phoneNumber, resetCode, "verification");//send otp via whatsapp
       await transporter.sendMail(mailOptions);
    } catch (err) {
        user.signUpVerifiedToken = undefined;
        user.signUpVerifiedExpired = undefined;
        user.signUpVerified = undefined;

        await user.save();
        return next(new appError(req.t('message-error'), 401));//message-error

    }
    res.status(200).json({
        status: "success",
        data: {
            user,
        },
    });
});

exports.verifyOTP = catchAsync(async (req, res, next) => {
    const hashedResetCode = crypto
        .createHash("sha256")
        .update(req.body.code)
        .digest("hex");
    console.log(hashedResetCode);
    const user = await userModel.findOne({
        signUpVerifiedToken: hashedResetCode,
        signUpVerifiedExpired: { $gt: Date.now() }, //10:10 > 10:6 true    create 10:00
    });


    if (!user) {
        return next(new appError(req.t('resetCode-error'), 400));//resetCode-error
    }

    user.signUpVerified = true;
   // user.active=true
    await user.save();
    createSendToken(res, user, 200);
    // res.status(200).json({
    //   status: "Success",
    //   message: "Successful Registration !",
    //   data:user
    // });
});

//----------------------------------------------------------------------------------------- log in

exports.login = catchAsync(async (req, res, next) => {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) {
        return next(new appError("please enter a valid phoneNumber or password", 400));
    }
    const result = await userModel.findOne({ phoneNumber }).select("+password");

    // return next(new appError(req.t('login-notVerified'), 401));
    if (result.signUpVerified != true) {
        return next(new appError(req.t('login-notVerified'), 401));//login-notVerified
    }
    if (!result || !(await result.correctPassword(password, result.password))) {
        return next(new appError("Incorrect phoneNumber or Password", 401));
    }

    createSendToken(res, result, 201);
});

//------------------------------------------------------------------------------------------ log out

exports.logout = catchAsync(async (req, res,next) => {

    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() - 1 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success logout' });
    
   

});

//-------------------------------------------------------------------------------------------- forget password (send code)

exports.sendforgotpasscode = catchAsync(async (req, res, next) => {

    const user = await userModel.findOne({ email: req.body.email });
    if (!user) {
        return next(new appError(req.t('user-not-exist'), 400));//user-not-exist
    }

    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

    const hashedResetCode = crypto
        .createHash("sha256")
        .update(resetCode)
        .digest("hex");

    user.passwordResetToken = hashedResetCode;
    user.passwordResetExpired = Date.now() + 10 * 60 * 1000;
    user.passwordResetVerified = false;

    await user.save();
    //const userName = user.userName.en ? user.userName.en : user.userName.ar;

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.USER_PASS,
        },
      });
      const mailOptions = {
        from: process.env.USER_EMAIL,
        to: user.email,
        subject: "Reset Password",
        html: `
            <html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
            margin: 0;
            background-color: #f4f4f4;
        }

        .container {
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: inline-block;
            max-width: 400px;
            margin: auto;
        }

        h1 {
            color: #4733ab;
            font-size: 24px;
        }

        .otp {
            font-size: 22px;
            letter-spacing: 4px;
            margin: 10px 0;
            color: #800080;
        }

        .message {
            font-size: 16px;
            color: #333333;
            margin-top: 20px;
        }
        
        .footer {
            font-size: 14px;
            color: #666666;
            margin-top: 20px;
        }
    </style>
</head>
<body>

    <div class="container">
        <h1>Reset Your Password</h1>
        
        <p>Hi ${user.fullName},</p>
        
        <p>We received a request to reset the password on your Mazad account.</p>
        
        <p>Here is your OTP code:</p>
        
        <div class="otp">${resetCode}</div>
        
        <p class="message">Please enter this code to reset your password. The code is valid for 10 minutes.</p>
        
        <p class="footer">If you did not request a password reset, please ignore this email.<br>from Mazad Team</p>
    </div>

</body>
</html>
            `,
      }

    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpired = undefined;
        user.passwordResetVerified = undefined;

        await user.save();

        return next(
            new appError(req.t('messsage-error'), 500)//message-error
        );
    }

    res.status(200).json({
        message: "check your gmail",
    });
});
//-------------------------------------------------------------------------------------------- forget password (check code)
exports.checkforgotpasscode = catchAsync(async (req, res, next) => {
    const hashedResetCode = crypto
        .createHash("sha256")
        .update(req.body.code)
        .digest("hex");

    const user = await userModel.findOne({
        passwordResetCode: hashedResetCode,
        passwordResetExpires: { $gt: Date.now() }, //10:10 > 10:6 true    create 10:00
    });

    if (!user) {
        return next(new appError(req.t('resetCode-error')));//resetCode-error
    }

    user.passwordResetVerified = true;
    await user.save();

    res.status(200).json({
        status: "Success",
        message: "Valid reset code!",
        userId: user._id,
    });
});

//-------------------------------------------------------------------------------------------- forget password (reset password)
exports.getresetpass = catchAsync(async (req, res, next) => {

    const user = await userModel.findById(req.params.userId);

    if (req.body.password !== req.body.confirmPassword) {
        return next(
            new appError(req.t('password!-confirm'), 400)//password!-confirm
        );
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpired = undefined;
    user.passwordResetVerified = undefined;

    await user.save();

    res.status(200).json({
        status: "success",
    });
});
//-------------------------------------------------------------------------------------------- 

exports.protect = catchAsync(async (req, res, next) => {
    let token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt
    }
    if (!token) {
        return next(new appError(req.t('protect-error')), 401)//protect-error
    }
    const accessToken = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    const freshUser = await userModel.findById(accessToken.id)
    if (!freshUser) {
        return next(new appError(req.t('token-invalid')), 401);//token-invalid
    }

    req.user = freshUser

    next()
})


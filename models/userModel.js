const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "Please write your full name."],

    },
    userName: {
             type: String, 
             required: [true, "Please write your user name."],
             unique: true 
    },
    email: {
        type: String,
        required: [true, "Please write your email address."],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please write a valid email address"]
    },
    phoneNumber: {
        type: String,
        required: [true, "Please write your phone number."],
        unique: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'manager'],
        default: 'user',
    },
    photo: {
        type: String,
        default: "https://res.cloudinary.com/dhddxcwcr/image/upload/v1700416252/6558f05c2841e64561ce75d1_Cover.jpg",
    },
    password: {
        type: String,
        required: [true, "Please write your password"],
        minlength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
       //    required: [true, 'Please confirm your password'],
        validate: {
            // This only works on CREATE and SAVE!!!
            validator: function (el) {
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpired: Date,
    passwordResetVerified: Boolean,
    signUpVerifiedToken: String,
    signUpVerifiedExpired: Date,
    signUpVerified: Boolean,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } }); // active:true
    next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.generateToken = function (id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE_IN
    });
};

userSchema.methods.changePassword = function (JWTTime) {
    if (this.passwordChangedAt) {
        const changedTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTime < changedTime;
    }
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpired = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

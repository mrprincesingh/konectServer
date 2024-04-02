import mongoose from "mongoose";
import bcrypt from "bcrypt";

export type UserType = {
  _id: string;
  userType: string;
  firstName: string;
  lastName: string;
  about?: string;
  profilePic?: string;
  profileBackground?: string;
  email: string;
  countryCode: string;
  mobile: string;
  password: string;
  country: string;
  city: string;
  category?: string[];
  pincode: string;
  emailVerified: boolean;
  createdOn: Date;
  posts?: string[];
  businesses?: string[];
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  paymentCompleted?: boolean;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
};

const userSchema = new mongoose.Schema({
  userType: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  about: {
    type: String,
  },
  profilePic: {
    type: String,
  },
  profileBackground: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  countryCode: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  quailification:{
    type: String,
    required: true,
  },
  dob:{
    type: String,
    required: true,
  },
  expInYear:{
    type: String,
    required: true,
  },
  maritalStatus:{
    type: String,
    required: true,
  },
  skills:{
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  category: [String],
  pincode: {
    type: String,
    required: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
    required: true,
  },
  emailVerificationOTP: {
    type: String,
  },
  createdOn: {
    type: Date,
    required: true,
    default: Date.now,
  },
  posts: [String],
  businesses: [String],
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  paymentCompleted: {
    type: Boolean,
  },
  razorpayOrderId: {
    type: String,
  },
  razorpayPaymentId: {
    type: String,
  },
  razorpaySignature: {
    type: String,
  },
});

userSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }

  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }

    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function (candidatePassword: string) {
  const user = this;

  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, user.password, (err, isMatch) => {
      if (err) {
        return reject(err);
      }

      if (!isMatch) {
        return reject(false);
      }

      resolve(true);
    });
  });
};

mongoose.model("User", userSchema);

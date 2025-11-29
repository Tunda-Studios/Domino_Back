const mongoose  = require('mongoose');
const validator = require('validator');
const bcryptjs  = require('bcryptjs');
const crypto    = require('crypto');

// ---------- Social login providers (Google / Facebook / Microsoft) ----------
const ProviderSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ['google', 'facebook', 'microsoft'],
    required: true,
  },
  providerId: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    // Optional public ID (besides Mongo _id)
    id: {
      type: String,
      unique: true,
      sparse: true,
    },

    firstName: {
      type: String,
      required: [true, 'First name is required'],
    },

    lastName: {
      type: String,
      required: [true, 'Last name is required'],
    },

    // Visible in Unity + Domino game
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Invalid email'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // never return the password hash
    },

    profilePicture: {
      type: String,
    },

    username: {
      type: String,
      unique: true,
      required: [true, 'Username is required'],
      trim: true,
    },

    // Social auth accounts for linking
    providers: {
      type: [ProviderSchema],
      default: [],
    },

    // Email verification
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationTokenExpire: {
      type: Date,
    },

    // Password reset fields
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
    },
  },
  { timestamps: true },
);



// ---------------------------
// Password hashing
// ---------------------------
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});


// ---------------------------
// Instance Methods
// ---------------------------

// Validate password for login
userSchema.methods.comparePassword = function (inputPassword) {
  return bcryptjs.compare(inputPassword, this.password);
};

// Add a social provider account to user
userSchema.methods.addProvider = function (provider, providerId, email) {
  const exists = this.providers.some(p => p.provider === provider);
  if (!exists) {
    this.providers.push({ provider, providerId, email });
  }
};

// Email verification token
userSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = token;
  this.verificationTokenExpire = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

// Password reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  return resetToken;
};


module.exports = mongoose.model('User', userSchema);
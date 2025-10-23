import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
      sparse: true, // ADD THIS - allows null values for unique constraint
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee",
      index: true,
    },
    sites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Geofence",
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },

    // Approval workflow fields
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved", // CHANGED: Default to "approved" for existing users
      index: true,
    },
    mobileNumber: {
      type: String,
      unique: true,
      index: true,
      trim: true,
      sparse: true, // ADD THIS - allows null values for unique constraint
      // REMOVED: required: true
    },
    firstName: {
      type: String,
      trim: true,
      // REMOVED: required: true
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
      // REMOVED: required: true
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      // REMOVED: required: true
    },
    dateOfBirth: {
      type: Date,
      // REMOVED: required: true
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    rejectionReason: String,

    resetToken: String,
    resetTokenExpiry: Date,
  },
  {
    timestamps: true,
  }
);

// Add a pre-save hook to auto-populate name from firstName/lastName
userSchema.pre('save', function(next) {
  if (this.firstName && this.lastName && !this.name) {
    this.name = this.middleName 
      ? `${this.firstName} ${this.middleName} ${this.lastName}`
      : `${this.firstName} ${this.lastName}`;
  }
  next();
});

const User = mongoose.model("User", userSchema);

export default User;

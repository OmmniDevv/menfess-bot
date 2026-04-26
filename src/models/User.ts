import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  userId: number;
  username?: string;
  isBanned: boolean;
  mediaCount: number;
  lastReset: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      default: undefined,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    mediaCount: {
      type: Number,
      default: 0,
    },
    lastReset: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);

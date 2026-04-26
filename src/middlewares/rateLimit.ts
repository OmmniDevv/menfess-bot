import { Context, NextFunction } from 'grammy';
import { User } from '../models/User';
import { config } from '../config';
import { isSameDay, hashUserId } from '../utils/helpers';

export interface RateLimitResult {
  allowed: boolean;
  used: number;
  max: number;
}

/**
 * Check and increment media count for a user.
 * Returns { allowed, used, max }
 */
export async function checkAndIncrementMediaLimit(
  userId: number,
  username?: string
): Promise<RateLimitResult> {
  const max = config.maxMediaPerDay;
  const now = new Date();

  try {
    // Fetch or create user document
    let user = await User.findOne({ userId });

    if (!user) {
      // Auto-create new user
      user = await User.create({
        userId,
        username,
        isBanned: false,
        mediaCount: 1,
        lastReset: now,
      });
      return { allowed: true, used: 1, max };
    }

    // Reset count if it's a new day
    const needsReset = !isSameDay(user.lastReset, now);
    if (needsReset) {
      user.mediaCount = 0;
      user.lastReset = now;
    }

    if (user.mediaCount >= max) {
      await user.save();
      return { allowed: false, used: user.mediaCount, max };
    }

    user.mediaCount += 1;
    if (username) user.username = username;
    await user.save();

    return { allowed: true, used: user.mediaCount, max };
  } catch (err) {
    console.error('[RateLimit] DB error for user hash:', hashUserId(userId), err);
    // Fail open — allow sending on DB error to avoid blocking users
    return { allowed: true, used: 0, max };
  }
}

/**
 * Check if user is banned
 */
export async function isUserBanned(userId: number): Promise<boolean> {
  try {
    const user = await User.findOne({ userId }, { isBanned: 1 }).lean();
    return user?.isBanned === true;
  } catch (err) {
    console.error('[BanCheck] DB error for user hash:', hashUserId(userId), err);
    return false;
  }
}

/**
 * GrammY middleware: silently ignore banned users
 */
export async function banCheckMiddleware(ctx: Context, next: NextFunction): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await next();
    return;
  }

  const banned = await isUserBanned(userId);
  if (banned) {
    // Silently ignore
    return;
  }

  await next();
}

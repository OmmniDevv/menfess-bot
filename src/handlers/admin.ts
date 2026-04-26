import { Context } from 'grammy';
import { User } from '../models/User';
import { config } from '../config';
import { hashUserId } from '../utils/helpers';

function isAdmin(userId: number): boolean {
  return config.adminIds.includes(userId);
}

/**
 * Parse target userId from command arguments: /ban <userId>
 */
function parseTargetId(text: string | undefined): number | null {
  if (!text) return null;
  const parts = text.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const id = Number(parts[1]);
  return isNaN(id) ? null : id;
}

/**
 * /ban <userId> — ban a user
 */
export async function handleBan(ctx: Context): Promise<void> {
  const adminId = ctx.from?.id;
  if (!adminId || !isAdmin(adminId)) return;

  const targetId = parseTargetId(ctx.message?.text);
  if (!targetId) {
    await ctx.reply('Usage: /ban <userId>');
    return;
  }

  try {
    await User.findOneAndUpdate(
      { userId: targetId },
      { $set: { isBanned: true } },
      { upsert: true, new: true }
    );
    await ctx.reply(`✅ User [${hashUserId(targetId)}] telah di-ban.`);
    console.log(`[Admin] Ban: hash=${hashUserId(targetId)} by admin hash=${hashUserId(adminId)}`);
  } catch (err) {
    console.error('[Admin] Ban error:', err);
    await ctx.reply('Gagal melakukan ban. Coba lagi.');
  }
}

/**
 * /unban <userId> — unban a user
 */
export async function handleUnban(ctx: Context): Promise<void> {
  const adminId = ctx.from?.id;
  if (!adminId || !isAdmin(adminId)) return;

  const targetId = parseTargetId(ctx.message?.text);
  if (!targetId) {
    await ctx.reply('Usage: /unban <userId>');
    return;
  }

  try {
    await User.findOneAndUpdate(
      { userId: targetId },
      { $set: { isBanned: false } },
      { upsert: true, new: true }
    );
    await ctx.reply(`✅ User [${hashUserId(targetId)}] telah di-unban.`);
    console.log(`[Admin] Unban: hash=${hashUserId(targetId)} by admin hash=${hashUserId(adminId)}`);
  } catch (err) {
    console.error('[Admin] Unban error:', err);
    await ctx.reply('Gagal melakukan unban. Coba lagi.');
  }
}

/**
 * /resetlimit <userId> — reset media limit for a user
 */
export async function handleResetLimit(ctx: Context): Promise<void> {
  const adminId = ctx.from?.id;
  if (!adminId || !isAdmin(adminId)) return;

  const targetId = parseTargetId(ctx.message?.text);
  if (!targetId) {
    await ctx.reply('Usage: /resetlimit <userId>');
    return;
  }

  try {
    await User.findOneAndUpdate(
      { userId: targetId },
      { $set: { mediaCount: 0, lastReset: new Date() } },
      { upsert: true, new: true }
    );
    await ctx.reply(`✅ Limit user [${hashUserId(targetId)}] telah di-reset.`);
    console.log(
      `[Admin] ResetLimit: hash=${hashUserId(targetId)} by admin hash=${hashUserId(adminId)}`
    );
  } catch (err) {
    console.error('[Admin] ResetLimit error:', err);
    await ctx.reply('Gagal reset limit. Coba lagi.');
  }
}

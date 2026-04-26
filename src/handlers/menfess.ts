import { Context, InlineKeyboard } from 'grammy';
import { config } from '../config';
import { checkAndIncrementMediaLimit } from '../middlewares/rateLimit';
import { hashUserId, formatLimitMessage } from '../utils/helpers';
import { User } from '../models/User';
import { isSameDay } from '../utils/helpers';
import type { SessionData } from '../index';

type MenfessContext = Context & { session: SessionData };

const HEADER = '📩 Menfess Wanderlust\n─────────────────\n';

/**
 * Handle incoming messages that are not commands.
 * Supports: text, photo, video.
 */
export async function handleIncomingMessage(ctx: MenfessContext): Promise<void> {
  if (ctx.chat?.type !== 'private') return;

  const msg = ctx.message;
  if (!msg) return;

  const userId = ctx.from?.id;
  if (!userId) return;

  const isText = !!msg.text && !msg.text.startsWith('/');
  const isPhoto = !!msg.photo;
  const isVideo = !!msg.video;

  if (!isText && !isPhoto && !isVideo) {
    await ctx.reply('Maaf, hanya teks, foto, dan video yang didukung.');
    return;
  }

  const isMedia = isPhoto || isVideo;

  // Check daily limit for media
  if (isMedia) {
    const username = ctx.from?.username;
    const result = await checkAndIncrementMediaLimit(userId, username);

    if (!result.allowed) {
      await ctx.reply(
        `Kamu sudah mencapai batas kirim media hari ini (${result.used}/${result.max}).\n` +
          `Reset besok pukul 00:00. Menfess teks tetap bisa dikirim tanpa batas! ✍️`
      );
      return;
    }
  }

  // Simpan tipe & konten pesan ke session
  if (isPhoto) {
    const photo = msg.photo![msg.photo!.length - 1];
    ctx.session.pendingMessage = {
      type: 'photo',
      fileId: photo.file_id,
      caption: msg.caption,
    };
  } else if (isVideo) {
    ctx.session.pendingMessage = {
      type: 'video',
      fileId: msg.video!.file_id,
      caption: msg.caption,
    };
  } else {
    ctx.session.pendingMessage = {
      type: 'text',
      text: msg.text!,
    };
  }

  ctx.session.waitingConfirmation = true;

  const keyboard = new InlineKeyboard()
    .text('✅ Kirim', 'confirm_send')
    .text('❌ Batal', 'cancel_send');

  await ctx.reply('Apakah kamu yakin ingin mengirim menfess ini?', {
    reply_markup: keyboard,
    reply_to_message_id: msg.message_id,
  });
}

/**
 * Handle "✅ Kirim" callback
 */
export async function handleConfirmSend(ctx: MenfessContext): Promise<void> {
  await ctx.answerCallbackQuery();

  if (!ctx.session.waitingConfirmation || !ctx.session.pendingMessage) {
    await ctx.editMessageText('Tidak ada menfess yang sedang menunggu.');
    return;
  }

  const pending = ctx.session.pendingMessage;
  const userId = ctx.from?.id;

  // Clear session
  ctx.session.waitingConfirmation = false;
  ctx.session.pendingMessage = null;

  const threadOptions = config.topicId !== undefined
    ? { message_thread_id: config.topicId }
    : {};

  try {
    if (pending.type === 'text') {
      // Gabungkan header + isi teks dalam satu pesan
      await ctx.api.sendMessage(
        config.groupId,
        `${HEADER}${pending.text}`,
        { ...threadOptions }
      );
    } else if (pending.type === 'photo') {
      // Header jadi caption foto
      const caption = pending.caption
        ? `${HEADER}${pending.caption}`
        : HEADER.trim();
      await ctx.api.sendPhoto(config.groupId, pending.fileId, {
        caption,
        parse_mode: 'Markdown',
        ...threadOptions,
      });
    } else if (pending.type === 'video') {
      // Header jadi caption video
      const caption = pending.caption
        ? `${HEADER}${pending.caption}`
        : HEADER.trim();
      await ctx.api.sendVideo(config.groupId, pending.fileId, {
        caption,
        parse_mode: 'Markdown',
        ...threadOptions,
      });
    }

    await ctx.editMessageText('Menfess kamu berhasil dikirim! 🎉');
    console.log(`[Menfess] Sent type=${pending.type} by hash:${hashUserId(userId ?? 0)}`);
  } catch (err) {
    console.error('[Menfess] Failed to send:', err);
    await ctx.editMessageText(
      'Gagal mengirim menfess. Pastikan bot sudah menjadi member di grup tujuan.'
    );
  }
}

/**
 * Handle "❌ Batal" callback
 */
export async function handleCancelSend(ctx: MenfessContext): Promise<void> {
  await ctx.answerCallbackQuery();

  ctx.session.waitingConfirmation = false;
  ctx.session.pendingMessage = null;

  await ctx.editMessageText('Menfess dibatalkan.');
}

/**
 * /cancel command
 */
export async function handleCancelCommand(ctx: MenfessContext): Promise<void> {
  if (ctx.chat?.type !== 'private') return;

  if (!ctx.session.waitingConfirmation) {
    await ctx.reply('Tidak ada menfess yang sedang menunggu konfirmasi.');
    return;
  }

  ctx.session.waitingConfirmation = false;
  ctx.session.pendingMessage = null;

  await ctx.reply('Menfess dibatalkan.');
}

/**
 * /limit command
 */
export async function handleLimitCommand(ctx: MenfessContext): Promise<void> {
  if (ctx.chat?.type !== 'private') return;

  const userId = ctx.from?.id;
  if (!userId) return;

  const max = config.maxMediaPerDay;

  try {
    const user = await User.findOne({ userId }).lean();

    if (!user) {
      await ctx.reply(formatLimitMessage(0, max));
      return;
    }

    const isToday = isSameDay(user.lastReset, new Date());
    const used = isToday ? user.mediaCount : 0;

    await ctx.reply(formatLimitMessage(used, max));
  } catch (err) {
    console.error('[Limit] DB error for hash:', hashUserId(userId), err);
    await ctx.reply('Gagal mengambil data limit. Coba lagi nanti.');
  }
}

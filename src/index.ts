import 'dotenv/config';
import { Bot, session, webhookCallback } from 'grammy';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { config } from './config';
import { connectDB } from './utils/database';
import { banCheckMiddleware } from './middlewares/rateLimit';
import { handleStart } from './handlers/start';
import { handleIncomingMessage, handleConfirmSend, handleCancelSend, handleCancelCommand, handleLimitCommand } from './handlers/menfess';
import { handleBan, handleUnban, handleResetLimit } from './handlers/admin';

export type PendingMessage =
  | { type: 'text'; text: string }
  | { type: 'photo'; fileId: string; caption?: string }
  | { type: 'video'; fileId: string; caption?: string };

export interface SessionData {
  waitingConfirmation: boolean;
  pendingMessage: PendingMessage | null;
}

type MyContext = import('grammy').Context & { session: SessionData };

const bot = new Bot<MyContext>(config.botToken);

bot.use(session<SessionData, MyContext>({
  initial: (): SessionData => ({ waitingConfirmation: false, pendingMessage: null }),
}));
bot.use(banCheckMiddleware);

bot.command('start', handleStart);
bot.command('cancel', handleCancelCommand);
bot.command('limit', handleLimitCommand);
bot.command('ban', handleBan);
bot.command('unban', handleUnban);
bot.command('resetlimit', handleResetLimit);

bot.callbackQuery('confirm_send', handleConfirmSend);
bot.callbackQuery('cancel_send', handleCancelSend);

bot.on(['message:text', 'message:photo', 'message:video'], handleIncomingMessage);

bot.catch((err) => {
  console.error(`[Bot] Error handling update ${err.ctx.update.update_id}:`, err.error);
});

async function main(): Promise<void> {
  console.log('[App] Connecting to MongoDB...');
  await connectDB();
  console.log('[App] MongoDB connected.');
    await bot.api.deleteWebhook();
    bot.start({ onStart: () => console.log('[App] Bot running in polling mode') });
  }

main().catch((err) => {
  console.error('[App] Fatal startup error:', err);
  process.exit(1);
});

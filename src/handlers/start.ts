import { Context } from 'grammy';
import { config } from '../config';

export async function handleStart(ctx: Context): Promise<void> {
  const max = config.maxMediaPerDay;

  const message = [
    '👋 *Selamat datang di Menfess Bot!*',
    '',
    'Bot ini memungkinkan kamu mengirim pesan secara *anonim* ke grup.',
    'Identitasmu tidak akan diketahui oleh siapa pun. 🕵️',
    '',
    '📨 *Cara Kirim Menfess:*',
    '1. Kirim pesan teks, foto, atau video ke bot ini',
    '2. Bot akan menampilkan preview pesanmu',
    '3. Tekan ✅ Kirim untuk mengirim, atau ❌ Batal untuk membatalkan',
    '',
    `📊 *Batas Harian:*`,
    `• Foto & Video: maksimal *${max} kali* per hari`,
    '• Teks: tidak terbatas ✍️',
    '• Limit reset setiap hari pukul 00:00',
    '',
    '⚙️ *Commands:*',
    '/limit — cek sisa limit mediamu hari ini',
    '/cancel — batalkan menfess yang sedang pending',
    '/start — tampilkan pesan ini',
    '',
    '_Gunakan dengan bijak dan bertanggung jawab!_',
  ].join('\n');

  await ctx.reply(message, { parse_mode: 'Markdown' });
}

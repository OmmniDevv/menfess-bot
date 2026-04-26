const requiredEnvVars = ['BOT_TOKEN', 'GROUP_ID', 'MONGODB_URI'] as const;

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config = {
  botToken: process.env.BOT_TOKEN as string,
  groupId: process.env.GROUP_ID as string,
  topicId: process.env.TOPIC_ID ? Number(process.env.TOPIC_ID) : undefined,
  mongodbUri: process.env.MONGODB_URI as string,
  maxMediaPerDay: Number(process.env.MAX_MEDIA_PER_DAY ?? '3'),
  adminIds: (process.env.ADMIN_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map(Number),
  port: Number(process.env.PORT ?? '3000'),
} as const;

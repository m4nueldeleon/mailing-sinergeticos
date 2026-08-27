/** Lectura de variables de entorno con nombres explícitos. Nada se lee "a mano" fuera de aquí. */
export const env = {
  resendApiKey: () => process.env.RESEND_API_KEY ?? "",
  mailFrom: () => process.env.MAIL_FROM ?? "",
  mailReplyTo: () => process.env.MAIL_REPLY_TO,
  resendWebhookSecret: () => process.env.RESEND_WEBHOOK_SECRET ?? "",
  axisDatabaseUrlRo: () => process.env.AXIS_DATABASE_URL_RO ?? "",
  databaseUrl: () => process.env.DATABASE_URL ?? "",
  unsubscribeSecret: () => process.env.UNSUBSCRIBE_SECRET ?? "",
  appUrl: () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  /** Interruptor general: arranca APAGADO, igual que en Axis. */
  mailEnabled: () => process.env.MAIL_ENABLED === "true",
  mailDailyCap: () => {
    const n = Number(process.env.MAIL_DAILY_CAP);
    return Number.isFinite(n) && n > 0 ? n : 1000;
  },
};

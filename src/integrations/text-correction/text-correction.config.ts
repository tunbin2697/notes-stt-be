export const TEXT_CORRECTION_CONFIG = {
  serviceUrl:
    process.env.TEXT_CORRECTION_SERVICE_URL ||
    'https://notes-stt-correct.baokhangdev.click',
  timeout: Number(process.env.TEXT_CORRECTION_TIMEOUT_MS) || 30000, // 30 seconds
};

export class Logger {
  static info(message, data = null) {
    console.log(`[INFO] ${message}`, data || "");
  }

  static warn(message, data = null) {
    console.warn(`[WARN] ${message}`, data || "");
  }

  static error(message, error = null) {
    console.error(`[ERROR] ${message}`, error || "");
  }

  static debug(message, data = null) {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG] ${message}`, data || "");
    }
  }
}

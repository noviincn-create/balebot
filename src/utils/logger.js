/**
 * Logger Utility
 */

const logLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor(module, level = 'info') {
    this.module = module;
    this.level = level.toUpperCase();
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      module: this.module,
      message,
      ...data,
    };

    if (logLevel[level] >= logLevel[this.level]) {
      console.log(JSON.stringify(logEntry));
    }
  }

  debug(message, data) {
    this.log('DEBUG', message, data);
  }

  info(message, data) {
    this.log('INFO', message, data);
  }

  warn(message, data) {
    this.log('WARN', message, data);
  }

  error(message, data) {
    this.log('ERROR', message, data);
  }
}

module.exports = Logger;

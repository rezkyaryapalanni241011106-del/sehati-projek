"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = logError;
function logError(context, error, meta) {
    const message = error instanceof Error ? error.message : String(error);
    const code = error?.code;
    console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        context,
        message,
        ...(code !== undefined && { code }),
        ...meta,
    }));
}
//# sourceMappingURL=logger.js.map
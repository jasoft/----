import winston from "winston";
import { format } from "winston";
const { combine, timestamp, printf, colorize } = format;

// 定义元数据类型
type LogMeta = Record<string, string | number | boolean | null | undefined>;

// 自定义日志格式
const customFormat = printf((info: winston.Logform.TransformableInfo) => {
  // 确保模块名称是字符串
  const moduleStr =
    typeof info.module === "string" ? info.module : String(info.module);
  const modulePrefix = info.module ? `[${moduleStr}] ` : "";

  // 过滤出额外的元数据
  const extraMetadata = Object.entries(info).reduce(
    (acc, [key, value]) => {
      if (!["level", "message", "timestamp", "module"].includes(key)) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, unknown>,
  );

  // 如果有额外元数据，将其转换为字符串
  const metaStr =
    Object.keys(extraMetadata).length > 0
      ? ` ${JSON.stringify(extraMetadata)}`
      : "";

  // 确保时间戳和消息是字符串
  const timestampStr =
    typeof info.timestamp === "string"
      ? info.timestamp
      : String(info.timestamp);
  const messageStr =
    typeof info.message === "string" ? info.message : String(info.message);

  return `${timestampStr} ${info.level}: ${modulePrefix}${messageStr}${metaStr}`;
});

// 创建logger实例的工厂函数
export const createLogger = (moduleName?: string) => {
  return winston.createLogger({
    format: combine(
      colorize(),
      timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      customFormat,
    ),
    defaultMeta: { module: moduleName },
    transports: [
      new winston.transports.Console({
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
      }),
    ],
  });
};

// 创建默认logger实例
const defaultLogger = createLogger("App");

// 导出便捷的日志函数
export const log = {
  info: (message: string, meta?: LogMeta) => defaultLogger.info(message, meta),
  error: (message: string, meta?: LogMeta) =>
    defaultLogger.error(message, meta),
  warn: (message: string, meta?: LogMeta) => defaultLogger.warn(message, meta),
  debug: (message: string, meta?: LogMeta) =>
    defaultLogger.debug(message, meta),
};

// 导出默认logger实例
export default defaultLogger;

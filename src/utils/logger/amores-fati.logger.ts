import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { LogLevel } from './log-level';

@Injectable({ scope: Scope.TRANSIENT })
export class AmoresFatiLogger implements LoggerService {
  private context?: string;

  setContext(context: string): this {
    this.context = context;
    return this;
  }

  info(message: unknown, ...meta: unknown[]): void {
    this.write(LogLevel.INFO, message, meta);
  }

  warn(message: unknown, ...meta: unknown[]): void {
    this.write(LogLevel.WARN, message, meta);
  }

  error(message: unknown, ...meta: unknown[]): void {
    this.write(LogLevel.ERROR, message, meta);
  }

  critical(message: unknown, ...meta: unknown[]): void {
    this.write(LogLevel.CRITICAL, message, meta);
  }

  log(message: unknown, ...meta: unknown[]): void {
    this.write(LogLevel.INFO, message, meta);
  }

  private write(level: LogLevel, message: unknown, meta: unknown[]): void {
    const ts = new Date().toISOString();
    const ctx = this.context ? ` [${this.context}]` : '';
    const text =
      typeof message === 'string' ? message : this.serialize(message);
    const metaStr = meta.length
      ? ' ' + meta.map((m) => this.serialize(m)).join(' ')
      : '';
    const line = `${ts} [${level}]${ctx} ${text}${metaStr}`;

    if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
      // eslint-disable-next-line no-console
      console.error(line);
    } else if (level === LogLevel.WARN) {
      // eslint-disable-next-line no-console
      console.warn(line);
    } else {
      // eslint-disable-next-line no-console
      console.log(line);
    }
  }

  private serialize(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value instanceof Error)
      return value.stack ?? `${value.name}: ${value.message}`;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}

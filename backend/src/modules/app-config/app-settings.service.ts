import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { BACKEND_CONFIGURATION } from '../../config/configuration.module';
import type { BackendConfiguration } from '../../config/environment';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  SETTINGS,
  SETTINGS_BY_KEY,
  SETTING_GROUPS,
  checkSetting,
  type SettingValue,
} from './settings-registry';

/** How often each server copy re-reads settings changed elsewhere. */
export const SETTINGS_REFRESH_MS = 15_000;

/**
 * The owner's settings (Owner Portal → App settings), read synchronously by
 * services. Values are cached in memory and re-read every 15 s, so a change
 * reaches every server copy within that time (immediately on the copy that
 * saved it). Without a database (unit tests) it simply returns the defaults.
 */
@Injectable()
export class AppSettings implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppSettings.name);
  private stored = new Map<string, { value: SettingValue; updatedAt: Date }>();
  private timer: NodeJS.Timeout | undefined;

  constructor(
    @Optional() private readonly prisma?: PrismaService,
    @Optional()
    @Inject(BACKEND_CONFIGURATION)
    private readonly configuration?: BackendConfiguration,
  ) {}

  /** Built-in defaults only, for code running without the settings table. */
  static defaults(configuration?: BackendConfiguration): AppSettings {
    return new AppSettings(undefined, configuration);
  }

  /**
   * Fixed values without the database or limits: for tests that need, for
   * example, bookings years ahead.
   */
  static forTests(
    values: Readonly<Record<string, SettingValue>>,
    configuration?: BackendConfiguration,
  ): AppSettings {
    const settings = new AppSettings(undefined, configuration);
    for (const [key, value] of Object.entries(values)) {
      if (!SETTINGS_BY_KEY.has(key)) throw new Error(`Unknown setting ${key}.`);
      settings.stored.set(key, { value, updatedAt: new Date(0) });
    }
    return settings;
  }

  async onModuleInit(): Promise<void> {
    if (!this.prisma) return;
    await this.refresh();
    this.timer = setInterval(() => {
      void this.refresh();
    }, SETTINGS_REFRESH_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async refresh(): Promise<void> {
    if (!this.prisma) return;
    try {
      const rows = await this.prisma.db.platformSetting.findMany();
      const next = new Map<string, { value: SettingValue; updatedAt: Date }>();
      for (const row of rows) {
        const definition = SETTINGS_BY_KEY.get(row.key);
        if (!definition) continue;
        const checked = checkSetting(definition, row.value);
        if (checked.ok)
          next.set(row.key, { value: checked.value, updatedAt: row.updatedAt });
      }
      this.stored = next;
    } catch {
      // Keep the last good values; the next refresh tries again.
      this.logger.warn('SETTINGS_REFRESH_FAILED');
    }
  }

  get(key: string): SettingValue {
    const stored = this.stored.get(key);
    if (stored) return stored.value;
    return this.fallback(key);
  }

  bool(key: string): boolean {
    const value = this.get(key);
    if (typeof value !== 'boolean') throw new Error(`${key} is not on/off.`);
    return value;
  }

  int(key: string): number {
    const value = this.get(key);
    if (typeof value !== 'number') throw new Error(`${key} is not a number.`);
    return value;
  }

  text(key: string): string {
    const value = this.get(key);
    if (typeof value !== 'string') throw new Error(`${key} is not text.`);
    return value;
  }

  /** Settings the app reads (GET /app/config). */
  publicValues(): Record<string, SettingValue> {
    return Object.fromEntries(
      SETTINGS.filter((definition) => definition.public).map((definition) => [
        definition.key,
        this.get(definition.key),
      ]),
    );
  }

  /** Everything, with its default and limits, for the Owner Portal. */
  async describe() {
    await this.refresh();
    return {
      groups: Object.entries(SETTING_GROUPS).map(([id, label]) => ({
        id,
        label,
      })),
      settings: SETTINGS.map((definition) => {
        const stored = this.stored.get(definition.key);
        return {
          key: definition.key,
          group: definition.group,
          label: definition.label,
          help: definition.help,
          kind: definition.kind,
          unit: definition.unit ?? null,
          min: definition.min ?? null,
          max: definition.max ?? null,
          public: definition.public,
          value: stored?.value ?? this.fallback(definition.key),
          defaultValue: this.fallback(definition.key),
          changedAt: stored?.updatedAt.toISOString() ?? null,
        };
      }),
    };
  }

  /**
   * Saves several settings at once (all or nothing). A value equal to the
   * default removes the stored row, so later default changes apply again.
   */
  async update(
    actorId: string,
    changes: Readonly<Record<string, unknown>>,
    requestId: string,
  ): Promise<void> {
    if (!this.prisma) throw new Error('Settings need the database.');
    const entries = Object.entries(changes);
    if (!entries.length || entries.length > SETTINGS.length)
      throw new BadRequestException('Change at least one setting.');
    const clean: [string, SettingValue][] = [];
    const errors: Record<string, string> = {};
    for (const [key, value] of entries) {
      const definition = SETTINGS_BY_KEY.get(key);
      if (!definition) {
        errors[key] = 'Unknown setting.';
        continue;
      }
      const checked = checkSetting(definition, value);
      if (checked.ok) clean.push([key, checked.value]);
      else errors[key] = checked.error;
    }
    if (Object.keys(errors).length)
      throw new BadRequestException({
        message: 'Some settings are not valid.',
        details: errors,
      });
    const before = Object.fromEntries(
      clean.map(([key]) => [key, this.get(key)]),
    );
    await this.prisma.db.$transaction(async (tx) => {
      for (const [key, value] of clean) {
        if (value === this.fallback(key))
          await tx.platformSetting.deleteMany({ where: { key } });
        else
          await tx.platformSetting.upsert({
            where: { key },
            create: {
              key,
              value: value,
              updatedBy: actorId,
            },
            update: {
              value: value,
              updatedBy: actorId,
            },
          });
      }
      await tx.auditEvent.create({
        data: {
          actorUserId: actorId,
          action: 'platform.settings.updated',
          targetType: 'PlatformSetting',
          outcome: 'succeeded',
          requestId,
          metadata: {
            changes: clean.map(([key, value]) => ({
              key,
              from: before[key] ?? null,
              to: value,
            })),
          },
          occurredAt: new Date(),
        },
      });
    });
    await this.refresh();
  }

  private fallback(key: string): SettingValue {
    const definition = SETTINGS_BY_KEY.get(key);
    if (!definition) throw new Error(`Unknown setting ${key}.`);
    if (!this.configuration) {
      try {
        return definition.fallback(undefined);
      } catch {
        throw new Error(`${key} needs the server configuration.`);
      }
    }
    return definition.fallback(this.configuration);
  }
}

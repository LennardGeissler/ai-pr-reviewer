import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

export const ConfigSchema = z.object({
  model: z.string().default('claude-sonnet-4-6'),
  max_files: z.number().int().positive().default(20),
  exclude: z.array(z.string()).default(['**/*.lock', 'dist/**', 'build/**', 'node_modules/**']),
  severity_threshold: z.enum(['low', 'medium', 'high']).default('medium'),
  custom_instructions: z.string().default(''),
  max_concurrency: z.number().int().positive().default(5),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(path: string): Config {
  let raw: unknown = {};
  try {
    const text = readFileSync(path, 'utf8');
    raw = parseYaml(text) ?? {};
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  }
  return ConfigSchema.parse(raw);
}

const SEVERITY_RANK: Record<'low' | 'medium' | 'high', number> = {
  low: 0,
  medium: 1,
  high: 2,
};

export function meetsSeverity(
  severity: 'low' | 'medium' | 'high',
  threshold: 'low' | 'medium' | 'high',
): boolean {
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[threshold];
}

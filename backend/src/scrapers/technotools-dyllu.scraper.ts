import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { scrapeTechnoTools } from './technotools.scraper.ts';

const DYLLU_CATEGORY_ID = 135;
const DEFAULT_OUTPUT = path.resolve(
  process.env.DYLLU_OUTPUT || 'data/technotools-dyllu-products.json',
);

type TechnoToolsOptions = NonNullable<Parameters<typeof scrapeTechnoTools>[0]>;

export function scrapeDyllu(options: TechnoToolsOptions = {}) {
  return scrapeTechnoTools({
    maxPages: Number(process.env.DYLLU_MAX_PAGES || 20),
    maxProducts: Number(process.env.DYLLU_MAX_PRODUCTS || 0),
    delayMs: Number(process.env.DYLLU_DELAY_MS || 1600),
    startPage: Number(process.env.DYLLU_START_PAGE || 1),
    retries: Number(process.env.DYLLU_RETRIES || 4),
    timeoutMs: Number(process.env.DYLLU_TIMEOUT_MS || 30_000),
    resume: process.env.DYLLU_RESUME !== 'false',
    checkpointEvery: Number(process.env.DYLLU_CHECKPOINT_EVERY || 10),
    defaultStock: Number(process.env.DYLLU_DEFAULT_STOCK || 10),
    ...options,
    categoryId: DYLLU_CATEGORY_ID,
    output: options.output || DEFAULT_OUTPUT,
  });
}

const entryPoint = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (entryPoint && import.meta.url === entryPoint) {
  scrapeDyllu().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

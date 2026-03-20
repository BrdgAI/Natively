// @xenova/transformers is ESM-only — must use dynamic import()
import path from 'path';
import { app } from 'electron';
import { IEmbeddingProvider } from './IEmbeddingProvider';

const dynamicImport = new Function(
  'specifier',
  'return import(specifier);'
) as (specifier: string) => Promise<any>;

export class LocalEmbeddingProvider implements IEmbeddingProvider {
  readonly name = 'local';
  readonly dimensions = 384; // all-MiniLM-L6-v2

  private pipe: any = null;
  private loadingPromise: Promise<void> | null = null; // prevents concurrent init races
  private modelRoot: string;
  private readonly modelId = 'Xenova/all-MiniLM-L6-v2';

  constructor() {
    // transformers.js resolves local models as <localModelPath>/<modelId>/...
    // so localModelPath must be the directory above "Xenova/".
    this.modelRoot = app.isPackaged
      ? path.join(process.resourcesPath, 'models')
      : path.join(app.getAppPath(), 'resources/models');
  }

  async isAvailable(): Promise<boolean> {
    // Local model is ALWAYS available after install — this is the guarantee
    try {
      await this.ensureLoaded();
      return true;
    } catch (e) {
      console.error('[LocalEmbeddingProvider] Model failed to load:', e);
      return false;
    }
  }

  private async ensureLoaded(): Promise<void> {
    if (this.pipe) return;

    // If another caller already kicked off loading, wait for that same promise
    // rather than launching a second concurrent pipeline() call.
    if (this.loadingPromise) {
      await this.loadingPromise;
      return;
    }

    this.loadingPromise = (async () => {
      // Keep a real runtime import so CommonJS compilation does not lower this to require().
      const { pipeline, env } = await dynamicImport('@xenova/transformers');

      // Tell transformers.js to use the local path, never download in production
      env.allowRemoteModels = false;
      env.localModelPath = this.modelRoot;

      this.pipe = await pipeline('feature-extraction', this.modelId, {
        local_files_only: true,
      });
    })();

    try {
      await this.loadingPromise;
    } catch (e) {
      // Reset so a future call can retry
      this.loadingPromise = null;
      throw e;
    }
  }

  async embed(text: string): Promise<number[]> {
    await this.ensureLoaded();
    const output = await this.pipe(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data as Float32Array);
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.embed(text); // all-MiniLM-L6-v2 is symmetric
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    await this.ensureLoaded();
    // transformers.js handles batching internally
    const output = await this.pipe(texts, { pooling: 'mean', normalize: true });
    // output.data is flat [n * 384], reshape it
    const batchSize = texts.length;
    const result: number[][] = [];
    for (let i = 0; i < batchSize; i++) {
      result.push(Array.from(output.data.slice(i * this.dimensions, (i + 1) * this.dimensions)));
    }
    return result;
  }
}

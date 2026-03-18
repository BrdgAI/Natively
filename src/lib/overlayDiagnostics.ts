export interface OverlayDiagnosticsSnapshot {
  openLatencyMs: number | null;
  resizeEvents: number;
  resizeEventsPerSecond: number;
  streamTokens: number;
  streamTokensPerSecond: number;
  elapsedMs: number;
}

export class OverlayDiagnostics {
  private readonly sessionStart = performance.now();
  private firstVisibleAt: number | null = null;
  private resizeEvents = 0;
  private streamTokens = 0;

  markVisible(): void {
    if (this.firstVisibleAt === null) {
      this.firstVisibleAt = performance.now();
    }
  }

  markResize(): void {
    this.resizeEvents += 1;
  }

  markStreamToken(): void {
    this.streamTokens += 1;
  }

  snapshot(): OverlayDiagnosticsSnapshot {
    const now = performance.now();
    const elapsedMs = Math.max(1, now - this.sessionStart);
    const elapsedSec = elapsedMs / 1000;
    const openLatencyMs =
      this.firstVisibleAt === null ? null : Math.max(0, this.firstVisibleAt - this.sessionStart);

    return {
      openLatencyMs,
      resizeEvents: this.resizeEvents,
      resizeEventsPerSecond: this.resizeEvents / elapsedSec,
      streamTokens: this.streamTokens,
      streamTokensPerSecond: this.streamTokens / elapsedSec,
      elapsedMs,
    };
  }
}

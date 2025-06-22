export class RequestTracker {
  private static instance: RequestTracker;
  private totalRequests = 0;
  private activeRequests = 0;
  private totalResponseTime = 0;
  private errors = 0;
  private requestTimes: number[] = [];
  private errorTimes: number[] = [];

  static getInstance(): RequestTracker {
    if (!RequestTracker.instance) {
      RequestTracker.instance = new RequestTracker();
    }
    return RequestTracker.instance;
  }

  startRequest(): string {
    this.totalRequests++;
    this.activeRequests++;
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  endRequest(requestId: string, startTime: number): void {
    this.activeRequests--;
    const responseTime = Date.now() - startTime;
    this.totalResponseTime += responseTime;
    this.requestTimes.push(responseTime);

    // Keep only last 100 request times for average calculation
    if (this.requestTimes.length > 100) {
      this.requestTimes.shift();
    }
  }

  recordError(): void {
    this.errors++;
    this.errorTimes.push(Date.now());

    // Keep only last 100 error times
    if (this.errorTimes.length > 100) {
      this.errorTimes.shift();
    }
  }

  getMetrics() {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const recentErrors = this.errorTimes.filter(
      (time) => time > fiveMinutesAgo
    );

    return {
      total: this.totalRequests,
      active: this.activeRequests,
      averageResponseTime:
        this.requestTimes.length > 0
          ? Math.round(
              this.requestTimes.reduce((a, b) => a + b, 0) /
                this.requestTimes.length
            )
          : 0,
      errors: {
        total: this.errors,
        rate: recentErrors.length / 5, // errors per minute
      },
    };
  }
}

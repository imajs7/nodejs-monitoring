import { Request, Response, NextFunction } from "express";
import {
  HealthMetrics,
  MonitoringConfig,
  CustomProbe,
  ProbeResult,
} from "./types";
import { SystemMetrics } from "./collectors/SystemMetrics";
import { RequestTracker } from "./collectors/RequestTracker";
import { BuiltInProbes } from "./probes/BuiltInProbes";

export class MonitoringService {
  private static instance: MonitoringService;
  private config: MonitoringConfig;
  private systemMetrics: SystemMetrics;
  private requestTracker: RequestTracker;
  private customProbes: CustomProbe[] = [];
  private probeResults: Map<string, ProbeResult> = new Map();
  private metricsHistory: HealthMetrics[] = [];
  private startTime: number;

  private constructor(config: MonitoringConfig = {}) {
    this.config = {
      enableHealthRoute: true,
      healthRoutePath: "/health",
      enableMetricsCollection: true,
      metricsInterval: 30000, // 30 seconds
      enableRequestTracking: true,
      enableErrorTracking: true,
      ...config,
    };

    this.systemMetrics = SystemMetrics.getInstance();
    this.requestTracker = RequestTracker.getInstance();
    this.startTime = Date.now();

    this.initializeBuiltInProbes();
    this.startMetricsCollection();
    this.startProbeExecution();
  }

  static getInstance(config?: MonitoringConfig): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService(config);
    }
    return MonitoringService.instance;
  }

  private initializeBuiltInProbes(): void {
    const thresholds = this.config.alertThresholds || {};

    this.customProbes.push(
      BuiltInProbes.createMemoryProbe(thresholds.memoryUsage),
      BuiltInProbes.createCpuProbe(thresholds.cpuUsage),
      BuiltInProbes.createUptimeProbe(),
      BuiltInProbes.createDiskSpaceProbe()
    );

    if (this.config.customProbes) {
      this.customProbes.push(...this.config.customProbes);
    }
  }

  private startMetricsCollection(): void {
    if (!this.config.enableMetricsCollection) return;

    setInterval(() => {
      const metrics = this.collectMetrics();
      this.metricsHistory.push(metrics);

      // Keep only last 100 metrics entries
      if (this.metricsHistory.length > 100) {
        this.metricsHistory.shift();
      }
    }, this.config.metricsInterval);
  }

  private startProbeExecution(): void {
    this.customProbes.forEach((probe) => {
      const interval = probe.interval || 60000; // Default 1 minute

      const executeProbe = async () => {
        try {
          const result = await probe.check();
          this.probeResults.set(probe.name, result);
        } catch (error) {
          this.probeResults.set(probe.name, {
            status: "critical",
            message: `Probe execution failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          });
        }
      };

      // Execute immediately and then on interval
      executeProbe();
      setInterval(executeProbe, interval);
    });
  }

  private collectMetrics(): HealthMetrics {
    const memory = this.systemMetrics.getMemoryMetrics();
    const cpu = this.systemMetrics.getCpuMetrics();
    const process = this.systemMetrics.getProcessMetrics();
    const requestMetrics = this.requestTracker.getMetrics();

    return {
      timestamp: Date.now(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memory,
      cpu,
      process,
      requests: {
        total: requestMetrics.total,
        active: requestMetrics.active,
        averageResponseTime: requestMetrics.averageResponseTime,
      },
      errors: requestMetrics.errors,
    };
  }

  // Express middleware for request tracking
  requestTrackingMiddleware() {
    if (!this.config.enableRequestTracking) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId = this.requestTracker.startRequest();

      res.on("finish", () => {
        this.requestTracker.endRequest(requestId, startTime);

        if (res.statusCode >= 400 && this.config.enableErrorTracking) {
          this.requestTracker.recordError();
        }
      });

      next();
    };
  }

  // Health check route handler
  healthCheckHandler() {
    return (req: Request, res: Response) => {
      const metrics = this.collectMetrics();
      const probes = Object.fromEntries(this.probeResults);

      const overallStatus = this.getOverallStatus(probes);

      res.status(overallStatus === "healthy" ? 200 : 503).json({
        status: overallStatus,
        timestamp: metrics.timestamp,
        uptime: metrics.uptime,
        metrics,
        probes,
        version: process.env.npm_package_version || "1.0.0",
      });
    };
  }

  // Metrics history endpoint
  metricsHistoryHandler() {
    return (req: Request, res: Response) => {
      const limit = parseInt(req.query.limit as string) || 50;
      const metrics = this.metricsHistory.slice(-limit);

      res.json({
        metrics,
        count: metrics.length,
        latest: metrics[metrics.length - 1],
      });
    };
  }

  private getOverallStatus(
    probes: Record<string, ProbeResult>
  ): "healthy" | "warning" | "critical" {
    const statuses = Object.values(probes).map((probe) => probe.status);

    if (statuses.includes("critical")) return "critical";
    if (statuses.includes("warning")) return "warning";
    return "healthy";
  }

  // Add custom probe
  addProbe(probe: CustomProbe): void {
    this.customProbes.push(probe);

    // Start executing the new probe
    const interval = probe.interval || 60000;
    const executeProbe = async () => {
      try {
        const result = await probe.check();
        this.probeResults.set(probe.name, result);
      } catch (error) {
        this.probeResults.set(probe.name, {
          status: "critical",
          message: `Probe execution failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
    };

    executeProbe();
    setInterval(executeProbe, interval);
  }

  // Get current metrics
  getCurrentMetrics(): HealthMetrics {
    return this.collectMetrics();
  }

  // Get probe results
  getProbeResults(): Record<string, ProbeResult> {
    return Object.fromEntries(this.probeResults);
  }
}

export interface HealthMetrics {
  timestamp: number;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
    heap: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  process: {
    pid: number;
    version: string;
    platform: string;
    arch: string;
  };
  requests: {
    total: number;
    active: number;
    averageResponseTime: number;
  };
  errors: {
    total: number;
    rate: number;
  };
  database?: {
    connections: number;
    queries: number;
    avgQueryTime: number;
  };
}

export interface MonitoringConfig {
  enableHealthRoute?: boolean;
  healthRoutePath?: string;
  enableMetricsCollection?: boolean;
  metricsInterval?: number;
  enableRequestTracking?: boolean;
  enableErrorTracking?: boolean;
  customProbes?: CustomProbe[];
  alertThresholds?: AlertThresholds;
}

export interface CustomProbe {
  name: string;
  check: () => Promise<ProbeResult>;
  interval?: number;
}

export interface ProbeResult {
  status: "healthy" | "warning" | "critical";
  message?: string;
  value?: number;
  metadata?: Record<string, any>;
}

export interface AlertThresholds {
  memoryUsage?: number;
  cpuUsage?: number;
  responseTime?: number;
  errorRate?: number;
}

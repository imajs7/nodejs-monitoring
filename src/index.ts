import { MonitoringService } from "./MonitoringService";
import { MonitoringConfig } from "./types";

export { MonitoringService } from "./MonitoringService";
export { BuiltInProbes } from "./probes/BuiltInProbes";
export * from "./types";

// Easy setup function for Express apps
export function setupMonitoring(app: any, config?: MonitoringConfig) {
  const monitoring = MonitoringService.getInstance(config);

  // Add request tracking middleware
  app.use(monitoring.requestTrackingMiddleware());

  // Add health check route
  if (config?.enableHealthRoute !== false) {
    const healthPath = config?.healthRoutePath || "/health";
    app.get(healthPath, monitoring.healthCheckHandler());
    app.get(`${healthPath}/metrics`, monitoring.metricsHistoryHandler());
  }

  return monitoring;
}

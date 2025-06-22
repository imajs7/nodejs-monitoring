# Node.js Monitoring Service

A comprehensive monitoring service for Node.js applications with built-in health probes, metrics collection, and real-time monitoring capabilities. Similar to New Relic but lightweight and easy to integrate.

## Features

- 🚀 **Easy Integration** - One-line setup for Express applications
- 📊 **Built-in Metrics** - Memory, CPU, uptime, request tracking
- 🔍 **Health Probes** - Customizable health checks with thresholds
- 📈 **Real-time Monitoring** - Live metrics collection and history
- ⚡ **Performance Tracking** - Request/response time monitoring
- 🛡️ **Error Monitoring** - Automatic error tracking and alerting
- 🎯 **Custom Probes** - Add your own health checks
- 📱 **REST API** - Built-in endpoints for health and metrics

## Installation

```bash
npm install @yourorg/nodejs-monitoring
```

## Quick Start

### Basic Setup

```typescript
import express from "express";
import { setupMonitoring } from "@yourorg/nodejs-monitoring";

const app = express();

// Setup monitoring with one line
const monitoring = setupMonitoring(app);

// Your routes
app.get("/api/users", (req, res) => {
  res.json({ users: [] });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
  console.log("Health check: http://localhost:3000/health");
});
```

### Advanced Configuration

```typescript
import express from "express";
import { setupMonitoring, MonitoringService } from "@yourorg/nodejs-monitoring";

const app = express();

// Advanced configuration
const monitoring = setupMonitoring(app, {
  healthRoutePath: "/api/health",
  metricsInterval: 15000, // Collect metrics every 15 seconds
  enableRequestTracking: true,
  enableErrorTracking: true,
  alertThresholds: {
    memoryUsage: 85, // Alert when memory > 85%
    cpuUsage: 90, // Alert when CPU > 90%
    responseTime: 2000, // Alert when response time > 2s
    errorRate: 5, // Alert when error rate > 5/min
  },
});

// Add custom health probe
monitoring.addProbe({
  name: "database_connection",
  check: async () => {
    try {
      await database.ping();
      return {
        status: "healthy",
        message: "Database connection successful",
      };
    } catch (error) {
      return {
        status: "critical",
        message: `Database connection failed: ${error.message}`,
      };
    }
  },
  interval: 30000, // Check every 30 seconds
});

// Add Redis health check
monitoring.addProbe({
  name: "redis_connection",
  check: async () => {
    try {
      const result = await redisClient.ping();
      return {
        status: "healthy",
        message: "Redis is responding",
        value: result === "PONG" ? 1 : 0,
      };
    } catch (error) {
      return {
        status: "critical",
        message: `Redis connection failed: ${error.message}`,
      };
    }
  },
});

app.listen(3000);
```

## API Endpoints

Once integrated, your application will have the following endpoints:

### Health Check

```
GET /health
```

Returns comprehensive health information:

```json
{
  "status": "healthy",
  "timestamp": 1640995200000,
  "uptime": 3600,
  "metrics": {
    "timestamp": 1640995200000,
    "uptime": 3600,
    "memory": {
      "used": 45,
      "total": 1024,
      "percentage": 4,
      "heap": {
        "used": 25,
        "total": 30,
        "percentage": 83
      }
    },
    "cpu": {
      "usage": 15.5,
      "loadAverage": [0.5, 0.3, 0.2]
    },
    "process": {
      "pid": 12345,
      "version": "v18.17.0",
      "platform": "linux",
      "arch": "x64"
    },
    "requests": {
      "total": 150,
      "active": 2,
      "averageResponseTime": 120
    },
    "errors": {
      "total": 5,
      "rate": 0.2
    }
  },
  "probes": {
    "memory_usage": {
      "status": "healthy",
      "message": "Memory usage is 4%",
      "value": 4
    },
    "cpu_usage": {
      "status": "healthy",
      "message": "CPU usage is 15.5%",
      "value": 15.5
    },
    "database_connection": {
      "status": "healthy",
      "message": "Database connection successful"
    }
  },
  "version": "1.0.0"
}
```

### Metrics History

```
GET /health/metrics?limit=50
```

Returns historical metrics data:

```json
{
  "metrics": [...],
  "count": 50,
  "latest": { ... }
}
```

## Custom Probes

Create custom health checks for your specific needs:

```typescript
import { CustomProbe, ProbeResult } from "@yourorg/nodejs-monitoring";

// Simple probe
const customProbe: CustomProbe = {
  name: "external_api_check",
  check: async (): Promise<ProbeResult> => {
    try {
      const response = await fetch("https://api.example.com/health");
      const isHealthy = response.ok;

      return {
        status: isHealthy ? "healthy" : "critical",
        message: `External API responded with ${response.status}`,
        value: response.status,
        metadata: {
          responseTime: Date.now() - startTime,
          url: "https://api.example.com/health",
        },
      };
    } catch (error) {
      return {
        status: "critical",
        message: `External API unreachable: ${error.message}`,
      };
    }
  },
  interval: 60000, // Check every minute
};

// Add the probe
monitoring.addProbe(customProbe);

// Complex probe with multiple checks
const complexProbe: CustomProbe = {
  name: "service_dependencies",
  check: async (): Promise<ProbeResult> => {
    const checks = await Promise.allSettled([
      checkDatabase(),
      checkRedis(),
      checkMessageQueue(),
      checkExternalAPI(),
    ]);

    const failed = checks.filter((c) => c.status === "rejected").length;
    const total = checks.length;

    if (failed === 0) {
      return {
        status: "healthy",
        message: `All ${total} dependencies are operational`,
        metadata: { passed: total, failed: 0 },
      };
    } else if (failed <= total / 2) {
      return {
        status: "warning",
        message: `${failed}/${total} dependencies failed`,
        metadata: { passed: total - failed, failed },
      };
    } else {
      return {
        status: "critical",
        message: `${failed}/${total} dependencies failed`,
        metadata: { passed: total - failed, failed },
      };
    }
  },
};
```

## Built-in Probes

The service comes with several built-in probes:

### Memory Usage Probe

- Monitors system and heap memory usage
- Configurable threshold (default: 80%)
- Status: healthy → warning → critical

### CPU Usage Probe

- Monitors CPU usage percentage
- Configurable threshold (default: 80%)
- Includes load average information

### Uptime Probe

- Tracks application uptime
- Always returns healthy status
- Useful for monitoring application restarts

### Disk Space Probe

- Basic disk accessibility check
- Monitors current working directory access

## Configuration Options

```typescript
interface MonitoringConfig {
  enableHealthRoute?: boolean; // Enable /health endpoint (default: true)
  healthRoutePath?: string; // Health route path (default: '/health')
  enableMetricsCollection?: boolean; // Enable metrics collection (default: true)
  metricsInterval?: number; // Metrics collection interval (default: 30000ms)
  enableRequestTracking?: boolean; // Track HTTP requests (default: true)
  enableErrorTracking?: boolean; // Track HTTP errors (default: true)
  customProbes?: CustomProbe[]; // Additional custom probes
  alertThresholds?: AlertThresholds; // Custom alert thresholds
}

interface AlertThresholds {
  memoryUsage?: number; // Memory usage threshold percentage
  cpuUsage?: number; // CPU usage threshold percentage
  responseTime?: number; // Response time threshold in ms
  errorRate?: number; // Error rate threshold per minute
}
```

## Manual Usage (Without Express)

You can also use the monitoring service manually without Express:

```typescript
import { MonitoringService } from "@yourorg/nodejs-monitoring";

// Initialize monitoring service
const monitoring = MonitoringService.getInstance({
  enableHealthRoute: false, // We'll handle routes manually
  metricsInterval: 15000,
});

// Get current metrics
const metrics = monitoring.getCurrentMetrics();
console.log("Current metrics:", metrics);

// Get probe results
const probes = monitoring.getProbeResults();
console.log("Probe results:", probes);

// Add custom probe
monitoring.addProbe({
  name: "custom_check",
  check: async () => {
    // Your custom logic here
    return { status: "healthy", message: "All good!" };
  },
});
```

## Integration Examples

### Express.js with TypeScript

```typescript
import express from "express";
import { setupMonitoring } from "@yourorg/nodejs-monitoring";

const app = express();

// Setup monitoring
const monitoring = setupMonitoring(app, {
  healthRoutePath: "/api/health",
  alertThresholds: {
    memoryUsage: 85,
    cpuUsage: 90,
  },
});

// Add database probe
monitoring.addProbe({
  name: "postgres_connection",
  check: async () => {
    try {
      const client = await pool.connect();
      await client.query("SELECT NOW()");
      client.release();
      return { status: "healthy", message: "PostgreSQL connected" };
    } catch (error) {
      return {
        status: "critical",
        message: `PostgreSQL error: ${error.message}`,
      };
    }
  },
});

export default app;
```

### NestJS Integration

```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { setupMonitoring } from "@yourorg/nodejs-monitoring";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Setup monitoring
  const monitoring = setupMonitoring(app.getHttpAdapter().getInstance(), {
    healthRoutePath: "/health",
    metricsInterval: 20000,
  });

  // Add custom probe for NestJS app
  monitoring.addProbe({
    name: "nestjs_modules",
    check: async () => {
      try {
        const moduleRef = app.get(AppModule);
        return {
          status: "healthy",
          message: "NestJS modules loaded successfully",
          metadata: { moduleRef: !!moduleRef },
        };
      } catch (error) {
        return { status: "critical", message: "NestJS module error" };
      }
    },
  });

  await app.listen(3000);
}

bootstrap();
```

### Koa.js Integration

```typescript
import Koa from "koa";
import { MonitoringService } from "@yourorg/nodejs-monitoring";

const app = new Koa();

// Initialize monitoring
const monitoring = MonitoringService.getInstance({
  enableHealthRoute: false, // We'll add routes manually
});

// Add request tracking middleware
app.use(async (ctx, next) => {
  const startTime = Date.now();
  const requestId = monitoring.requestTracker.startRequest();

  try {
    await next();
    monitoring.requestTracker.endRequest(requestId, startTime);
  } catch (error) {
    monitoring.requestTracker.recordError();
    throw error;
  }
});

// Add health route
app.use(async (ctx, next) => {
  if (ctx.path === "/health") {
    const metrics = monitoring.getCurrentMetrics();
    const probes = monitoring.getProbeResults();

    ctx.body = {
      status: "healthy",
      timestamp: Date.now(),
      metrics,
      probes,
    };
  } else {
    await next();
  }
});

app.listen(3000);
```

## Monitoring Dashboard

The service provides JSON endpoints that can be consumed by monitoring dashboards:

### Grafana Integration

Use the `/health/metrics` endpoint to create time-series graphs in Grafana.

### Custom Dashboard

Create a simple monitoring dashboard:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>App Monitoring Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  </head>
  <body>
    <div>
      <canvas id="memoryChart"></canvas>
      <canvas id="cpuChart"></canvas>
    </div>

    <script>
      async function updateCharts() {
        try {
          const response = await fetch("/health/metrics?limit=20");
          const data = await response.json();

          // Update charts with metrics data
          updateMemoryChart(data.metrics);
          updateCpuChart(data.metrics);
        } catch (error) {
          console.error("Failed to fetch metrics:", error);
        }
      }

      // Update every 30 seconds
      setInterval(updateCharts, 30000);
      updateCharts(); // Initial load
    </script>
  </body>
</html>
```

## Production Considerations

### Security

- Consider adding authentication to health endpoints in production
- Limit access to sensitive metrics data
- Use HTTPS for metrics transmission

### Performance

- Adjust `metricsInterval` based on your needs (longer intervals = less overhead)
- Be cautious with custom probe intervals
- Monitor the monitoring service's own resource usage

### Alerting

- Integrate with external alerting systems (PagerDuty, Slack, etc.)
- Set up automated responses to critical alerts
- Consider implementing circuit breakers based on health status

### Example Production Setup

```typescript
import { setupMonitoring } from "@yourorg/nodejs-monitoring";

const monitoring = setupMonitoring(app, {
  healthRoutePath: process.env.HEALTH_ENDPOINT || "/internal/health",
  metricsInterval: parseInt(process.env.METRICS_INTERVAL) || 60000,
  alertThresholds: {
    memoryUsage: parseInt(process.env.MEMORY_THRESHOLD) || 90,
    cpuUsage: parseInt(process.env.CPU_THRESHOLD) || 95,
    responseTime: parseInt(process.env.RESPONSE_TIME_THRESHOLD) || 5000,
    errorRate: parseInt(process.env.ERROR_RATE_THRESHOLD) || 10,
  },
});

// Add environment-specific probes
if (process.env.DATABASE_URL) {
  monitoring.addProbe({
    name: "database_connection",
    check: async () => {
      // Database check implementation
    },
  });
}
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## API Reference

### MonitoringService

#### Methods

- `getInstance(config?: MonitoringConfig): MonitoringService` - Get singleton instance
- `addProbe(probe: CustomProbe): void` - Add custom health probe
- `getCurrentMetrics(): HealthMetrics` - Get current system metrics
- `getProbeResults(): Record<string, ProbeResult>` - Get all probe results
- `requestTrackingMiddleware()` - Express middleware for request tracking
- `healthCheckHandler()` - Express route handler for health endpoint
- `metricsHistoryHandler()` - Express route handler for metrics history

### Helper Functions

- `setupMonitoring(app, config?)` - Quick setup for Express applications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- GitHub Issues: [Report bugs and request features](https://github.com/yourusername/nodejs-monitoring/issues)
- Documentation: [Full API documentation](https://github.com/yourusername/nodejs-monitoring/wiki)
- Examples: [More examples and use cases](https://github.com/yourusername/nodejs-monitoring/tree/main/examples)

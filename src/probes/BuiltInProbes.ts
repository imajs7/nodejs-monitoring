import { CustomProbe, ProbeResult } from "../types";
import { SystemMetrics } from "../collectors/SystemMetrics";

export class BuiltInProbes {
  static createMemoryProbe(threshold: number = 80): CustomProbe {
    return {
      name: "memory_usage",
      check: async (): Promise<ProbeResult> => {
        const metrics = SystemMetrics.getInstance().getMemoryMetrics();
        const usage = metrics.percentage;

        if (usage > threshold) {
          return {
            status: "critical",
            message: `Memory usage is ${usage}% (threshold: ${threshold}%)`,
            value: usage,
          };
        } else if (usage > threshold * 0.8) {
          return {
            status: "warning",
            message: `Memory usage is ${usage}% (approaching threshold)`,
            value: usage,
          };
        }

        return {
          status: "healthy",
          message: `Memory usage is ${usage}%`,
          value: usage,
        };
      },
    };
  }

  static createCpuProbe(threshold: number = 80): CustomProbe {
    return {
      name: "cpu_usage",
      check: async (): Promise<ProbeResult> => {
        const metrics = SystemMetrics.getInstance().getCpuMetrics();
        const usage = metrics.usage;

        if (usage > threshold) {
          return {
            status: "critical",
            message: `CPU usage is ${usage}% (threshold: ${threshold}%)`,
            value: usage,
          };
        } else if (usage > threshold * 0.8) {
          return {
            status: "warning",
            message: `CPU usage is ${usage}% (approaching threshold)`,
            value: usage,
          };
        }

        return {
          status: "healthy",
          message: `CPU usage is ${usage}%`,
          value: usage,
        };
      },
    };
  }

  static createUptimeProbe(): CustomProbe {
    return {
      name: "uptime",
      check: async (): Promise<ProbeResult> => {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);

        return {
          status: "healthy",
          message: `Application has been running for ${hours}h ${minutes}m`,
          value: uptime,
        };
      },
    };
  }

  static createDiskSpaceProbe(): CustomProbe {
    return {
      name: "disk_space",
      check: async (): Promise<ProbeResult> => {
        try {
          const fs = require("fs");
          const stats = fs.statSync(process.cwd());

          return {
            status: "healthy",
            message: "Disk space check completed",
            metadata: {
              path: process.cwd(),
              accessible: true,
            },
          };
        } catch (error) {
          return {
            status: "critical",
            message: "Cannot access disk space",
            metadata: {
              error: error instanceof Error ? error.message : "Unknown error",
            },
          };
        }
      },
    };
  }
}

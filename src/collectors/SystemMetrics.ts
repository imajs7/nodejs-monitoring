import * as os from "os";
import * as process from "process";

export class SystemMetrics {
  private static instance: SystemMetrics;
  private cpuUsage: number = 0;
  private lastCpuUsage = process.cpuUsage();
  private lastTime = Date.now();

  static getInstance(): SystemMetrics {
    if (!SystemMetrics.instance) {
      SystemMetrics.instance = new SystemMetrics();
    }
    return SystemMetrics.instance;
  }

  private constructor() {
    // Update CPU usage every second
    setInterval(() => {
      this.updateCpuUsage();
    }, 1000);
  }

  private updateCpuUsage(): void {
    const currentUsage = process.cpuUsage(this.lastCpuUsage);
    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastTime;

    const totalUsage = (currentUsage.user + currentUsage.system) / 1000; // Convert to ms
    this.cpuUsage = (totalUsage / timeDiff) * 100;

    this.lastCpuUsage = process.cpuUsage();
    this.lastTime = currentTime;
  }

  getMemoryMetrics() {
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: Math.round((usedMemory / totalMemory) * 100),
      heap: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
    };
  }

  getCpuMetrics() {
    return {
      usage: Math.round(this.cpuUsage * 100) / 100,
      loadAverage: os.loadavg(),
    };
  }

  getProcessMetrics() {
    return {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  }
}

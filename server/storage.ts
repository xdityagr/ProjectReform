//  Server Storage Component developed by Aditya Gaur, 2025
import { type Report, type InsertReport } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createReport(report: InsertReport): Promise<Report>;
  getReports(): Promise<Report[]>;
  getReportsByUser(userId: string): Promise<Report[]>;
  deleteReport(id: string): Promise<boolean>; // ✅ Added
}

export class MemStorage implements IStorage {
  private reports: Map<string, Report>;

  constructor() {
    this.reports = new Map();
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = randomUUID();
    const report: Report = { 
      ...insertReport,
      status: insertReport.status || 'pending',
      id,
      createdAt: new Date(),
    };
    this.reports.set(id, report);
    return report;
  }

  async getReports(): Promise<Report[]> {
    return Array.from(this.reports.values());
  }

  async getReportsByUser(userId: string): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      (report) => report.userId === userId,
    );
  }

  async deleteReport(id: string): Promise<boolean> {  // ✅ Added
    return this.reports.delete(id);
  }
}

export const storage = new MemStorage();

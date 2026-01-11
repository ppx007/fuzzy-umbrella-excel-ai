/**
 * 图表生成器
 * 负责生成考勤相关图表
 */

import {
  AttendanceStatistics,
  AttendanceRecord,
  AttendanceStatus,
  Employee,
  DateRange,
} from '@/types';
import { NlpChartType as ChartType } from '@/types';

/**
 * 图表数据点
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

/**
 * 图表数据集
 */
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

/**
 * 图表配置
 */
export interface ChartConfig {
  type: 'pie' | 'bar' | 'line' | 'doughnut';
  title: string;
  labels: string[];
  datasets: ChartDataset[];
  options?: {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    scales?: {
      y?: {
        beginAtZero?: boolean;
        max?: number;
      };
    };
  };
}

/**
 * 颜色配置
 */
const CHART_COLORS = {
  normal: '#4CAF50',
  late: '#FF9800',
  earlyLeave: '#FFC107',
  absent: '#F44336',
  leave: '#9C27B0',
  overtime: '#2196F3',
  primary: '#1976D2',
  secondary: '#424242',
  success: '#388E3C',
  warning: '#F57C00',
  error: '#D32F2F',
  info: '#0288D1',
};

/**
 * 图表生成器类
 */
export class ChartGenerator {
  /**
   * 生成出勤率饼图
   */
  generateAttendancePieChart(statistics: AttendanceStatistics): ChartConfig {
    const attendanceCount = statistics.actualWorkDays;
    const absentCount = statistics.absentCount;
    const leaveCount = statistics.leaveDays;
    const otherCount = statistics.totalWorkDays - attendanceCount - absentCount - leaveCount;

    return {
      type: 'pie',
      title: '出勤情况分布',
      labels: ['正常出勤', '缺勤', '请假', '其他'],
      datasets: [
        {
          label: '出勤情况',
          data: [attendanceCount, absentCount, leaveCount, Math.max(0, otherCount)],
          backgroundColor: [
            CHART_COLORS.normal,
            CHART_COLORS.absent,
            CHART_COLORS.leave,
            CHART_COLORS.secondary,
          ],
          borderWidth: 1,
        },
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: true,
          position: 'right',
        },
      },
    };
  }

  /**
   * 生成考勤状态柱状图
   */
  generateStatusBarChart(statistics: AttendanceStatistics): ChartConfig {
    return {
      type: 'bar',
      title: '考勤状态统计',
      labels: ['迟到', '早退', '缺勤', '请假'],
      datasets: [
        {
          label: '次数',
          data: [
            statistics.lateCount,
            statistics.earlyLeaveCount,
            statistics.absentCount,
            statistics.leaveDays,
          ],
          backgroundColor: [
            CHART_COLORS.late,
            CHART_COLORS.earlyLeave,
            CHART_COLORS.absent,
            CHART_COLORS.leave,
          ],
          borderWidth: 1,
        },
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };
  }

  /**
   * 生成员工出勤对比柱状图
   */
  generateEmployeeComparisonChart(
    employees: Employee[],
    records: AttendanceRecord[],
    _dateRange: DateRange
  ): ChartConfig {
    // 按员工统计出勤天数
    const employeeStats = new Map<string, number>();

    for (const employee of employees) {
      employeeStats.set(employee.id, 0);
    }

    for (const record of records) {
      if (
        record.status === AttendanceStatus.NORMAL ||
        record.status === AttendanceStatus.LATE ||
        record.status === AttendanceStatus.EARLY_LEAVE ||
        record.status === AttendanceStatus.OVERTIME
      ) {
        const current = employeeStats.get(record.employeeId) || 0;
        employeeStats.set(record.employeeId, current + 1);
      }
    }

    const labels = employees.map(e => e.name);
    const data = employees.map(e => employeeStats.get(e.id) || 0);

    return {
      type: 'bar',
      title: '员工出勤天数对比',
      labels,
      datasets: [
        {
          label: '出勤天数',
          data,
          backgroundColor: CHART_COLORS.primary,
          borderWidth: 1,
        },
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };
  }

  /**
   * 生成出勤趋势折线图
   */
  generateTrendLineChart(records: AttendanceRecord[], dateRange: DateRange): ChartConfig {
    // 按日期统计出勤人数
    const dailyStats = new Map<string, number>();
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      const dateKey = this.formatDate(current);
      dailyStats.set(dateKey, 0);
      current.setDate(current.getDate() + 1);
    }

    for (const record of records) {
      if (
        record.status === AttendanceStatus.NORMAL ||
        record.status === AttendanceStatus.LATE ||
        record.status === AttendanceStatus.EARLY_LEAVE ||
        record.status === AttendanceStatus.OVERTIME
      ) {
        const dateKey = this.formatDate(new Date(record.date));
        const count = dailyStats.get(dateKey) || 0;
        dailyStats.set(dateKey, count + 1);
      }
    }

    const labels = Array.from(dailyStats.keys());
    const data = Array.from(dailyStats.values());

    return {
      type: 'line',
      title: '出勤人数趋势',
      labels,
      datasets: [
        {
          label: '出勤人数',
          data,
          borderColor: CHART_COLORS.primary,
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderWidth: 2,
        },
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };
  }

  /**
   * 生成工时分布图
   */
  generateWorkHoursChart(records: AttendanceRecord[]): ChartConfig {
    // 统计工时分布
    const hourRanges = [
      { label: '<6小时', min: 0, max: 6, count: 0 },
      { label: '6-8小时', min: 6, max: 8, count: 0 },
      { label: '8-10小时', min: 8, max: 10, count: 0 },
      { label: '10-12小时', min: 10, max: 12, count: 0 },
      { label: '>12小时', min: 12, max: Infinity, count: 0 },
    ];

    for (const record of records) {
      if (record.workHours) {
        for (const range of hourRanges) {
          if (record.workHours >= range.min && record.workHours < range.max) {
            range.count++;
            break;
          }
        }
      }
    }

    return {
      type: 'bar',
      title: '工时分布',
      labels: hourRanges.map(r => r.label),
      datasets: [
        {
          label: '人次',
          data: hourRanges.map(r => r.count),
          backgroundColor: [
            CHART_COLORS.error,
            CHART_COLORS.warning,
            CHART_COLORS.success,
            CHART_COLORS.info,
            CHART_COLORS.primary,
          ],
          borderWidth: 1,
        },
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };
  }

  /**
   * 生成部门出勤率对比图
   */
  generateDepartmentComparisonChart(
    employees: Employee[],
    records: AttendanceRecord[],
    dateRange: DateRange
  ): ChartConfig {
    // 按部门分组
    const departments = new Map<string, { total: number; attended: number }>();

    for (const employee of employees) {
      const dept = employee.department || '未分配';
      if (!departments.has(dept)) {
        departments.set(dept, { total: 0, attended: 0 });
      }
      const stats = departments.get(dept)!;
      stats.total++;
    }

    // 统计出勤
    for (const record of records) {
      const employee = employees.find(e => e.id === record.employeeId);
      if (!employee) continue;

      const dept = employee.department || '未分配';
      const stats = departments.get(dept);
      if (!stats) continue;

      if (
        record.status === AttendanceStatus.NORMAL ||
        record.status === AttendanceStatus.LATE ||
        record.status === AttendanceStatus.EARLY_LEAVE ||
        record.status === AttendanceStatus.OVERTIME
      ) {
        stats.attended++;
      }
    }

    const labels = Array.from(departments.keys());
    const workDays = this.calculateWorkDays(dateRange);
    const data = labels.map(dept => {
      const stats = departments.get(dept)!;
      const expectedAttendance = stats.total * workDays;
      return expectedAttendance > 0 ? Math.round((stats.attended / expectedAttendance) * 100) : 0;
    });

    return {
      type: 'bar',
      title: '部门出勤率对比',
      labels,
      datasets: [
        {
          label: '出勤率(%)',
          data,
          backgroundColor: CHART_COLORS.primary,
          borderWidth: 1,
        },
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
          },
        },
      },
    };
  }

  /**
   * 根据图表类型生成图表
   */
  generateChart(
    chartType: ChartType,
    employees: Employee[],
    records: AttendanceRecord[],
    statistics: AttendanceStatistics,
    dateRange: DateRange
  ): ChartConfig {
    switch (chartType) {
      case ChartType.PIE_ATTENDANCE:
        return this.generateAttendancePieChart(statistics);
      case ChartType.BAR_ATTENDANCE:
        return this.generateStatusBarChart(statistics);
      case ChartType.BAR_EMPLOYEE:
        return this.generateEmployeeComparisonChart(employees, records, dateRange);
      case ChartType.LINE_TREND:
        return this.generateTrendLineChart(records, dateRange);
      default:
        return this.generateAttendancePieChart(statistics);
    }
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  }

  /**
   * 计算工作日数量
   */
  private calculateWorkDays(dateRange: DateRange): number {
    let count = 0;
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }
}

/**
 * 默认图表生成器实例
 */
export const chartGenerator = new ChartGenerator();

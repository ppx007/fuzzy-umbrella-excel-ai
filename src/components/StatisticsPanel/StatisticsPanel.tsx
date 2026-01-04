/**
 * 统计面板组件
 */

import React from 'react';
import { Card } from '../common';
import { AttendanceStatistics } from '@/types';

interface StatisticsPanelProps {
  statistics: AttendanceStatistics | null;
  title?: string;
}

interface StatItemProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'gray';
}

const StatItem: React.FC<StatItemProps> = ({ label, value, unit, color = 'gray' }) => {
  const colorClasses = {
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    blue: 'text-blue-600',
    gray: 'text-gray-900',
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${colorClasses[color]}`}>
        {value}
        {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </p>
    </div>
  );
};

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  statistics,
  title = '考勤统计',
}) => {
  if (!statistics) {
    return (
      <Card title={title}>
        <div className="text-center py-8 text-gray-500">
          暂无统计数据
        </div>
      </Card>
    );
  }

  return (
    <Card title={title}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatItem
          label="出勤率"
          value={`${(statistics.attendanceRate * 100).toFixed(1)}`}
          unit="%"
          color={statistics.attendanceRate >= 0.95 ? 'green' : statistics.attendanceRate >= 0.9 ? 'yellow' : 'red'}
        />
        <StatItem
          label="实际出勤"
          value={statistics.actualWorkDays}
          unit={`/ ${statistics.totalWorkDays} 天`}
          color="blue"
        />
        <StatItem
          label="迟到次数"
          value={statistics.lateCount}
          unit="次"
          color={statistics.lateCount === 0 ? 'green' : statistics.lateCount <= 3 ? 'yellow' : 'red'}
        />
        <StatItem
          label="早退次数"
          value={statistics.earlyLeaveCount}
          unit="次"
          color={statistics.earlyLeaveCount === 0 ? 'green' : 'yellow'}
        />
        <StatItem
          label="缺勤次数"
          value={statistics.absentCount}
          unit="次"
          color={statistics.absentCount === 0 ? 'green' : 'red'}
        />
        <StatItem
          label="请假天数"
          value={statistics.leaveDays}
          unit="天"
          color="blue"
        />
        <StatItem
          label="加班时长"
          value={statistics.overtimeHours.toFixed(1)}
          unit="小时"
          color="blue"
        />
        <StatItem
          label="平均工时"
          value={statistics.averageDailyHours.toFixed(1)}
          unit="小时/天"
          color="gray"
        />
      </div>

      {/* 详细统计 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">详细数据</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">总工作日</span>
            <span className="font-medium">{statistics.totalWorkDays} 天</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">总工作时长</span>
            <span className="font-medium">{statistics.totalWorkHours.toFixed(1)} 小时</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StatisticsPanel;
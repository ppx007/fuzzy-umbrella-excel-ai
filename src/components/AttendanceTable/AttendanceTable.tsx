/**
 * 考勤表格组件
 */

import React, { useMemo } from 'react';
import { Card } from '../common';
import { AttendanceRecord, AttendanceStatus, Employee } from '@/types';
import { formatDate, formatTime } from '@/utils';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  employees?: Employee[];
  showActions?: boolean;
  onEdit?: (record: AttendanceRecord) => void;
  onDelete?: (recordId: string) => void;
}

const statusLabels: Record<AttendanceStatus, string> = {
  [AttendanceStatus.NORMAL]: '正常',
  [AttendanceStatus.LATE]: '迟到',
  [AttendanceStatus.EARLY_LEAVE]: '早退',
  [AttendanceStatus.ABSENT]: '缺勤',
  [AttendanceStatus.LEAVE]: '请假',
  [AttendanceStatus.OVERTIME]: '加班',
  [AttendanceStatus.OUT]: '外出',
  [AttendanceStatus.BUSINESS_TRIP]: '出差',
  [AttendanceStatus.REST_DAY]: '休息日',
  [AttendanceStatus.HOLIDAY]: '节假日',
};

const statusColors: Record<AttendanceStatus, string> = {
  [AttendanceStatus.NORMAL]: 'bg-green-100 text-green-800',
  [AttendanceStatus.LATE]: 'bg-yellow-100 text-yellow-800',
  [AttendanceStatus.EARLY_LEAVE]: 'bg-orange-100 text-orange-800',
  [AttendanceStatus.ABSENT]: 'bg-red-100 text-red-800',
  [AttendanceStatus.LEAVE]: 'bg-blue-100 text-blue-800',
  [AttendanceStatus.OVERTIME]: 'bg-indigo-100 text-indigo-800',
  [AttendanceStatus.OUT]: 'bg-cyan-100 text-cyan-800',
  [AttendanceStatus.BUSINESS_TRIP]: 'bg-purple-100 text-purple-800',
  [AttendanceStatus.REST_DAY]: 'bg-gray-100 text-gray-800',
  [AttendanceStatus.HOLIDAY]: 'bg-pink-100 text-pink-800',
};

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  employees = [],
  showActions = false,
  onEdit,
  onDelete,
}) => {
  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [employees]);

  const getEmployeeName = (employeeId: string): string => {
    const employee = employeeMap.get(employeeId);
    return employee?.name || employeeId;
  };

  if (records.length === 0) {
    return (
      <Card title="考勤记录">
        <div className="text-center py-8 text-gray-500">
          暂无考勤记录
        </div>
      </Card>
    );
  }

  return (
    <Card title="考勤记录" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                员工
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                日期
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                签到
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                签退
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                工时
              </th>
              {showActions && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record, index) => (
              <tr key={record.id || index} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {record.employeeName || getEmployeeName(record.employeeId)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(record.date)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {record.checkInTime ? formatTime(record.checkInTime) : '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {record.checkOutTime ? formatTime(record.checkOutTime) : '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      statusColors[record.status]
                    }`}
                  >
                    {statusLabels[record.status]}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {record.workHours ? `${record.workHours.toFixed(1)}h` : '-'}
                </td>
                {showActions && (
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button
                      onClick={() => onEdit?.(record)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => onDelete?.(record.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      删除
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default AttendanceTable;
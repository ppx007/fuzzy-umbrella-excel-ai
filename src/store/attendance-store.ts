/**
 * 考勤数据状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Employee,
  AttendanceRecord,
  AttendanceSheet,
  AttendanceStatistics,
  DateRange,
  AttendanceStatus,
} from '@/types';

/**
 * 考勤状态
 */
interface AttendanceState {
  /** 员工列表 */
  employees: Employee[];
  /** 考勤记录 */
  records: AttendanceRecord[];
  /** 当前考勤表 */
  currentSheet: AttendanceSheet | null;
  /** 选中的日期范围 */
  selectedDateRange: DateRange | null;
  /** 选中的员工ID列表 */
  selectedEmployeeIds: string[];
  /** 选中的部门 */
  selectedDepartment: string | null;
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 考勤操作
 */
interface AttendanceActions {
  /** 设置员工列表 */
  setEmployees: (employees: Employee[]) => void;
  /** 添加员工 */
  addEmployee: (employee: Employee) => void;
  /** 更新员工 */
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  /** 删除员工 */
  removeEmployee: (id: string) => void;
  
  /** 设置考勤记录 */
  setRecords: (records: AttendanceRecord[]) => void;
  /** 添加考勤记录 */
  addRecord: (record: AttendanceRecord) => void;
  /** 更新考勤记录 */
  updateRecord: (id: string, data: Partial<AttendanceRecord>) => void;
  /** 删除考勤记录 */
  removeRecord: (id: string) => void;
  /** 批量添加记录 */
  addRecords: (records: AttendanceRecord[]) => void;
  
  /** 设置当前考勤表 */
  setCurrentSheet: (sheet: AttendanceSheet | null) => void;
  
  /** 设置选中的日期范围 */
  setSelectedDateRange: (range: DateRange | null) => void;
  /** 设置选中的员工 */
  setSelectedEmployeeIds: (ids: string[]) => void;
  /** 设置选中的部门 */
  setSelectedDepartment: (department: string | null) => void;
  
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
  /** 设置错误信息 */
  setError: (error: string | null) => void;
  
  /** 清除所有数据 */
  clearAll: () => void;
  
  /** 获取筛选后的记录 */
  getFilteredRecords: () => AttendanceRecord[];
  /** 获取统计信息 */
  getStatistics: () => AttendanceStatistics | null;
  /** 获取部门列表 */
  getDepartments: () => string[];
}

/**
 * 初始状态
 */
const initialState: AttendanceState = {
  employees: [],
  records: [],
  currentSheet: null,
  selectedDateRange: null,
  selectedEmployeeIds: [],
  selectedDepartment: null,
  loading: false,
  error: null,
};

/**
 * 考勤Store
 */
export const useAttendanceStore = create<AttendanceState & AttendanceActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // 员工操作
      setEmployees: (employees) => set({ employees }),
      
      addEmployee: (employee) => set((state) => ({
        employees: [...state.employees, employee],
      })),
      
      updateEmployee: (id, data) => set((state) => ({
        employees: state.employees.map((emp) =>
          emp.id === id ? { ...emp, ...data } : emp
        ),
      })),
      
      removeEmployee: (id) => set((state) => ({
        employees: state.employees.filter((emp) => emp.id !== id),
        records: state.records.filter((rec) => rec.employeeId !== id),
      })),
      
      // 记录操作
      setRecords: (records) => set({ records }),
      
      addRecord: (record) => set((state) => ({
        records: [...state.records, record],
      })),
      
      updateRecord: (id, data) => set((state) => ({
        records: state.records.map((rec) =>
          rec.id === id ? { ...rec, ...data } : rec
        ),
      })),
      
      removeRecord: (id) => set((state) => ({
        records: state.records.filter((rec) => rec.id !== id),
      })),
      
      addRecords: (newRecords) => set((state) => {
        // 合并记录，相同员工同一天的记录会被覆盖
        const recordMap = new Map<string, AttendanceRecord>();
        
        for (const record of state.records) {
          const key = `${record.employeeId}_${record.date.toISOString().split('T')[0]}`;
          recordMap.set(key, record);
        }
        
        for (const record of newRecords) {
          const key = `${record.employeeId}_${record.date.toISOString().split('T')[0]}`;
          recordMap.set(key, record);
        }
        
        return { records: Array.from(recordMap.values()) };
      }),
      
      // 考勤表操作
      setCurrentSheet: (sheet) => set({ currentSheet: sheet }),
      
      // 选择操作
      setSelectedDateRange: (range) => set({ selectedDateRange: range }),
      setSelectedEmployeeIds: (ids) => set({ selectedEmployeeIds: ids }),
      setSelectedDepartment: (department) => set({ selectedDepartment: department }),
      
      // 状态操作
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      // 清除操作
      clearAll: () => set(initialState),
      
      // 获取筛选后的记录
      getFilteredRecords: () => {
        const state = get();
        let filtered = [...state.records];
        
        // 按日期范围筛选
        if (state.selectedDateRange) {
          filtered = filtered.filter((record) => {
            const recordDate = new Date(record.date);
            return (
              recordDate >= state.selectedDateRange!.start &&
              recordDate <= state.selectedDateRange!.end
            );
          });
        }
        
        // 按员工筛选
        if (state.selectedEmployeeIds.length > 0) {
          const idSet = new Set(state.selectedEmployeeIds);
          filtered = filtered.filter((record) => idSet.has(record.employeeId));
        }
        
        // 按部门筛选
        if (state.selectedDepartment) {
          const deptEmployees = state.employees
            .filter((emp) => emp.department === state.selectedDepartment)
            .map((emp) => emp.id);
          const idSet = new Set(deptEmployees);
          filtered = filtered.filter((record) => idSet.has(record.employeeId));
        }
        
        return filtered;
      },
      
      // 获取统计信息
      getStatistics: () => {
        const state = get();
        const records = get().getFilteredRecords();
        
        if (records.length === 0) {
          return null;
        }
        
        // 计算工作日数量
        let totalWorkDays = 0;
        if (state.selectedDateRange) {
          const current = new Date(state.selectedDateRange.start);
          while (current <= state.selectedDateRange.end) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              totalWorkDays++;
            }
            current.setDate(current.getDate() + 1);
          }
        } else {
          // 从记录中推断
          const dates = new Set(
            records.map((r) => r.date.toISOString().split('T')[0])
          );
          totalWorkDays = dates.size;
        }
        
        let normalCount = 0;
        let lateCount = 0;
        let earlyLeaveCount = 0;
        let absentCount = 0;
        let leaveDays = 0;
        let totalWorkHours = 0;
        let overtimeHours = 0;
        
        for (const record of records) {
          switch (record.status) {
            case AttendanceStatus.NORMAL:
              normalCount++;
              break;
            case AttendanceStatus.LATE:
              lateCount++;
              normalCount++;
              break;
            case AttendanceStatus.EARLY_LEAVE:
              earlyLeaveCount++;
              normalCount++;
              break;
            case AttendanceStatus.ABSENT:
              absentCount++;
              break;
            case AttendanceStatus.LEAVE:
              leaveDays++;
              break;
            case AttendanceStatus.OVERTIME:
              normalCount++;
              break;
          }
          
          if (record.workHours) {
            totalWorkHours += record.workHours;
          }
          if (record.overtimeHours) {
            overtimeHours += record.overtimeHours;
          }
        }
        
        const actualWorkDays = normalCount;
        const attendanceRate =
          totalWorkDays > 0 ? (actualWorkDays / totalWorkDays) * 100 : 0;
        const averageDailyHours =
          actualWorkDays > 0 ? totalWorkHours / actualWorkDays : 0;
        
        return {
          totalWorkDays,
          actualWorkDays,
          attendanceRate: Math.round(attendanceRate * 100) / 100,
          lateCount,
          earlyLeaveCount,
          absentCount,
          leaveDays,
          overtimeHours,
          totalWorkHours,
          averageDailyHours: Math.round(averageDailyHours * 100) / 100,
        };
      },
      
      // 获取部门列表
      getDepartments: () => {
        const state = get();
        const departments = new Set<string>();
        
        for (const employee of state.employees) {
          if (employee.department) {
            departments.add(employee.department);
          }
        }
        
        return Array.from(departments).sort();
      },
    }),
    {
      name: 'attendance-storage',
      partialize: (state) => ({
        employees: state.employees,
        records: state.records,
      }),
    }
  )
);
/**
 * NLP正则模式库
 */

/** 日期相关模式 */
export const datePatterns = {
  // 年月日：2024年1月1日、2024-01-01、2024/01/01
  fullDate: /(\d{4})[-年/](\d{1,2})[-月/](\d{1,2})日?/g,
  
  // 年月：2024年1月
  yearMonth: /(\d{4})年(\d{1,2})月/g,
  
  // 月日：1月1日
  monthDay: /(\d{1,2})月(\d{1,2})日?/g,
  
  // 单独月份：1月、一月
  month: /(\d{1,2})月|([一二三四五六七八九十]+)月/g,
  
  // 日期范围：1月1日到1月31日、1月1日-1月31日
  dateRange: /(\d{1,2})月(\d{1,2})日?[到至\-~](\d{1,2})月(\d{1,2})日?/g,
  
  // 同月日期范围：1月1日到31日
  sameMonthRange: /(\d{1,2})月(\d{1,2})日?[到至\-~](\d{1,2})日?/g,
  
  // 相对日期
  today: /今天|今日|当天/,
  yesterday: /昨天|昨日/,
  thisWeek: /本周|这周|这一周/,
  lastWeek: /上周|上一周/,
  thisMonth: /本月|这个月|当月/,
  lastMonth: /上月|上个月/,
  thisYear: /今年|本年/,
  lastYear: /去年|上一年/,
};

/** 时间相关模式 */
export const timePatterns = {
  // 时间：09:00、9:00、09点00分
  time: /(\d{1,2})[:\s点](\d{2})分?/g,
  
  // 时间范围：09:00-18:00
  timeRange: /(\d{1,2})[:\s点](\d{2})分?[到至\-~](\d{1,2})[:\s点](\d{2})分?/g,
};

/** 员工相关模式 */
export const employeePatterns = {
  // 员工列表：张三、李四、王五 或 张三,李四,王五
  employeeList: /(?:包含|包括|有|员工[是为]?)[：:\s]*([^\n,，、]+(?:[,，、][^\n,，、]+)*)/,
  
  // 中文姓名（2-4个汉字）
  chineseName: /[\u4e00-\u9fa5]{2,4}/g,
  
  // 部门
  department: /([^\s]+)(?:部门?|组|团队|中心)/,
};

/** 考勤类型模式 */
export const attendanceTypePatterns = {
  // 日报
  daily: /日报|日考勤|每日|当日|今日/,
  
  // 周报
  weekly: /周报|周考勤|每周|本周|一周/,
  
  // 月报
  monthly: /月报|月考勤|每月|本月|月度/,
  
  // 汇总
  summary: /汇总|统计|总结|分析/,
};

/** 操作动词模式 */
export const actionPatterns = {
  create: /生成|创建|做|制作|新建|建立|出/,
  import: /导入|上传|读取|加载/,
  export: /导出|下载|保存|输出/,
  modify: /修改|编辑|更改|调整|更新/,
  delete: /删除|移除|清除/,
  query: /查询|查看|显示|展示|看/,
  add: /添加|增加|加入|新增/,
};

/** 统计相关模式 */
export const statisticsPatterns = {
  attendanceRate: /出勤率|到勤率/,
  lateCount: /迟到次数|迟到/,
  earlyLeaveCount: /早退次数|早退/,
  absentCount: /缺勤次数|缺勤|旷工/,
  leaveCount: /请假次数|请假天数|请假/,
  overtimeHours: /加班时长|加班小时|加班/,
  workHours: /工时|工作时长|工作小时/,
};

/** 图表相关模式 */
export const chartPatterns = {
  pie: /饼图|饼状图|圆形图/,
  bar: /柱图|柱状图|条形图/,
  line: /折线图|线图|趋势图/,
  chart: /图表|图/,
};

/** 格式相关模式 */
export const formatPatterns = {
  excel: /excel|表格|电子表格/i,
  word: /word|文档/i,
  pdf: /pdf/i,
};

/** 列相关模式 */
export const columnPatterns = {
  checkIn: /上班时间|签到时间|打卡时间|到岗时间/,
  checkOut: /下班时间|签退时间|离岗时间/,
  workHours: /工时|工作时长/,
  overtime: /加班|加班时长/,
  status: /状态|考勤状态/,
  notes: /备注|说明|注释/,
};

/** 数字模式 */
export const numberPatterns = {
  // 阿拉伯数字
  arabic: /\d+/g,
  
  // 中文数字
  chinese: /[零一二三四五六七八九十百千万]+/g,
  
  // 带单位的数字
  withUnit: /(\d+(?:\.\d+)?)\s*(天|小时|分钟|次|人|个)/g,
};

/**
 * 中文数字转阿拉伯数字
 */
export function chineseToNumber(chinese: string): number {
  const chineseNumbers: Record<string, number> = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
    '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
    '十': 10, '百': 100, '千': 1000, '万': 10000,
  };
  
  let result = 0;
  let temp = 0;
  let lastUnit = 1;
  
  for (const char of chinese) {
    const num = chineseNumbers[char];
    if (num === undefined) continue;
    
    if (num >= 10) {
      if (temp === 0) temp = 1;
      if (num > lastUnit) {
        result = (result + temp) * num;
        temp = 0;
      } else {
        result += temp * num;
        temp = 0;
      }
      lastUnit = num;
    } else {
      temp = num;
    }
  }
  
  return result + temp;
}

/**
 * 提取所有匹配
 */
export function extractAllMatches(text: string, pattern: RegExp): string[] {
  const matches: string[] = [];
  const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[0]);
  }
  
  return matches;
}

/**
 * 测试是否匹配
 */
export function testPattern(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}
/**
 * 意图识别规则
 */

import { AttendanceIntent, IntentRule } from '@/types';

/**
 * 意图规则列表
 */
export const intentRules: IntentRule[] = [
  // 创建日报
  {
    id: 'create_daily',
    intent: AttendanceIntent.CREATE_DAILY,
    patterns: [
      /生成.*日.*考勤/,
      /创建.*日.*考勤/,
      /制作.*日.*考勤/,
      /日报/,
      /今[天日].*考勤/,
      /当[天日].*考勤/,
    ],
    requiredKeywords: ['日报', '日考勤', '今天', '今日', '当天', '当日'],
    priority: 10,
    baseConfidence: 0.8,
  },

  // 创建周报
  {
    id: 'create_weekly',
    intent: AttendanceIntent.CREATE_WEEKLY,
    patterns: [
      /生成.*周.*考勤/,
      /创建.*周.*考勤/,
      /制作.*周.*考勤/,
      /周报/,
      /本周.*考勤/,
      /这周.*考勤/,
      /一周.*考勤/,
    ],
    requiredKeywords: ['周报', '周考勤', '本周', '这周', '一周', '每周'],
    priority: 10,
    baseConfidence: 0.8,
  },

  // 创建月报
  {
    id: 'create_monthly',
    intent: AttendanceIntent.CREATE_MONTHLY,
    patterns: [
      /生成.*月.*考勤/,
      /创建.*月.*考勤/,
      /制作.*月.*考勤/,
      /月报/,
      /本月.*考勤/,
      /月度.*考勤/,
      /\d+月.*考勤/,
    ],
    requiredKeywords: ['月报', '月考勤', '本月', '月度', '每月'],
    priority: 10,
    baseConfidence: 0.8,
  },

  // 创建汇总
  {
    id: 'create_summary',
    intent: AttendanceIntent.CREATE_SUMMARY,
    patterns: [/汇总/, /统计.*考勤/, /考勤.*统计/, /汇总.*表/, /统计.*表/, /总结/],
    requiredKeywords: ['汇总', '统计', '汇总表', '统计表', '总结'],
    priority: 8,
    baseConfidence: 0.75,
  },

  // 导入数据
  {
    id: 'import_data',
    intent: AttendanceIntent.IMPORT_DATA,
    patterns: [/导入/, /上传/, /读取.*文件/, /加载.*数据/, /从.*导入/],
    requiredKeywords: ['导入', '上传', '读取', '加载', '文件'],
    priority: 9,
    baseConfidence: 0.85,
  },

  // 生成图表
  {
    id: 'generate_chart',
    intent: AttendanceIntent.GENERATE_CHART,
    patterns: [/生成.*图/, /创建.*图/, /制作.*图/, /饼图/, /柱[状形]?图/, /折线图/, /趋势图/],
    requiredKeywords: ['图表', '饼图', '柱图', '柱状图', '折线图', '趋势图', '图'],
    priority: 8,
    baseConfidence: 0.8,
  },

  // 修改模板
  {
    id: 'modify_template',
    intent: AttendanceIntent.MODIFY_TEMPLATE,
    patterns: [/修改.*模板/, /编辑.*模板/, /更改.*模板/, /调整.*模板/, /模板.*设置/],
    requiredKeywords: ['修改', '编辑', '更改', '调整', '模板'],
    priority: 7,
    baseConfidence: 0.75,
  },

  // 查询统计
  {
    id: 'query_statistics',
    intent: AttendanceIntent.QUERY_STATISTICS,
    patterns: [
      /查询.*统计/,
      /查看.*出勤率/,
      /显示.*统计/,
      /出勤率/,
      /迟到.*次数/,
      /早退.*次数/,
      /缺勤.*次数/,
    ],
    requiredKeywords: ['查询', '查看', '显示', '统计', '出勤率', '迟到', '早退', '缺勤'],
    priority: 6,
    baseConfidence: 0.7,
  },

  // 查询员工
  {
    id: 'query_employee',
    intent: AttendanceIntent.QUERY_EMPLOYEE,
    patterns: [/查询.*员工/, /查看.*员工/, /员工.*考勤/, /[\u4e00-\u9fa5]{2,4}的考勤/],
    requiredKeywords: ['查询', '查看', '员工'],
    priority: 6,
    baseConfidence: 0.7,
  },

  // 查询考勤
  {
    id: 'query_attendance',
    intent: AttendanceIntent.QUERY_ATTENDANCE,
    patterns: [/查询.*考勤/, /查看.*考勤/, /显示.*考勤/, /考勤.*记录/, /考勤.*情况/],
    requiredKeywords: ['查询', '查看', '显示', '考勤', '记录'],
    priority: 6,
    baseConfidence: 0.7,
  },

  // 导出数据
  {
    id: 'export_data',
    intent: AttendanceIntent.EXPORT_DATA,
    patterns: [/导出/, /下载/, /保存.*文件/, /输出/],
    requiredKeywords: ['导出', '下载', '保存', '输出'],
    priority: 7,
    baseConfidence: 0.8,
  },

  // 导出报表
  {
    id: 'export_report',
    intent: AttendanceIntent.EXPORT_REPORT,
    patterns: [/导出.*报表/, /导出.*报告/, /生成.*报表/, /生成.*报告/, /下载.*报表/],
    requiredKeywords: ['导出', '报表', '报告', '下载'],
    priority: 7,
    baseConfidence: 0.8,
  },
];

/**
 * 识别意图
 */
export function recognizeIntent(input: string): {
  intent: AttendanceIntent;
  confidence: number;
  matchedRule?: IntentRule;
} {
  let bestMatch: {
    intent: AttendanceIntent;
    confidence: number;
    matchedRule?: IntentRule;
  } = {
    intent: AttendanceIntent.UNKNOWN,
    confidence: 0,
  };

  for (const rule of intentRules) {
    let score = 0;
    let matched = false;

    // 检查模式匹配
    for (const pattern of rule.patterns) {
      if (pattern.test(input)) {
        matched = true;
        score = rule.baseConfidence;
        break;
      }
    }

    if (!matched) continue;

    // 检查关键词匹配，增加置信度
    if (rule.requiredKeywords) {
      for (const keyword of rule.requiredKeywords) {
        if (input.includes(keyword)) {
          score += 0.05;
        }
      }
    }

    // 检查排除关键词
    if (rule.excludeKeywords) {
      for (const keyword of rule.excludeKeywords) {
        if (input.includes(keyword)) {
          score -= 0.2;
        }
      }
    }

    // 考虑优先级
    score += rule.priority * 0.01;

    // 限制最大置信度
    score = Math.min(score, 1.0);

    if (score > bestMatch.confidence) {
      bestMatch = {
        intent: rule.intent,
        confidence: score,
        matchedRule: rule,
      };
    }
  }

  return bestMatch;
}

/**
 * 获取意图的中文描述
 */
export function getIntentDescription(intent: AttendanceIntent): string {
  const descriptions: Record<AttendanceIntent, string> = {
    [AttendanceIntent.CREATE_DAILY]: '创建日考勤表',
    [AttendanceIntent.CREATE_WEEKLY]: '创建周考勤表',
    [AttendanceIntent.CREATE_MONTHLY]: '创建月考勤表',
    [AttendanceIntent.CREATE_SUMMARY]: '创建考勤汇总',
    [AttendanceIntent.IMPORT_DATA]: '导入考勤数据',
    [AttendanceIntent.GENERATE_CHART]: '生成图表',
    [AttendanceIntent.EXPORT_DATA]: '导出数据',
    [AttendanceIntent.QUERY_EMPLOYEE]: '查询员工考勤',
    [AttendanceIntent.QUERY_STATISTICS]: '查询统计信息',
    [AttendanceIntent.MODIFY_TEMPLATE]: '修改模板',
    [AttendanceIntent.QUERY_ATTENDANCE]: '查询考勤记录',
    [AttendanceIntent.EXPORT_REPORT]: '导出报表',
    [AttendanceIntent.UNKNOWN]: '未知操作',
  };

  return descriptions[intent] || '未知操作';
}

/**
 * 获取意图的示例输入
 */
export function getIntentExamples(intent: AttendanceIntent): string[] {
  const examples: Record<AttendanceIntent, string[]> = {
    [AttendanceIntent.CREATE_DAILY]: ['生成今天的考勤表', '创建日考勤报表', '制作今日考勤记录'],
    [AttendanceIntent.CREATE_WEEKLY]: ['生成本周考勤表', '创建周报', '制作这周的考勤汇总'],
    [AttendanceIntent.CREATE_MONTHLY]: ['生成1月考勤表', '创建本月考勤报表', '制作月度考勤汇总'],
    [AttendanceIntent.CREATE_SUMMARY]: ['汇总部门考勤', '统计本月出勤情况', '生成考勤统计表'],
    [AttendanceIntent.IMPORT_DATA]: ['导入考勤数据', '上传Excel文件', '从文件导入记录'],
    [AttendanceIntent.GENERATE_CHART]: ['生成出勤率饼图', '创建考勤柱状图', '制作趋势折线图'],
    [AttendanceIntent.EXPORT_DATA]: ['导出考勤表', '下载Excel文件', '保存为PDF'],
    [AttendanceIntent.QUERY_EMPLOYEE]: ['查询张三的考勤', '查看员工出勤情况', '显示李四本月考勤'],
    [AttendanceIntent.QUERY_STATISTICS]: ['查看出勤率', '统计迟到次数', '显示缺勤情况'],
    [AttendanceIntent.MODIFY_TEMPLATE]: ['修改考勤模板', '编辑表格样式', '调整模板设置'],
    [AttendanceIntent.QUERY_ATTENDANCE]: ['查询考勤记录', '查看本月考勤', '显示考勤情况'],
    [AttendanceIntent.EXPORT_REPORT]: ['导出考勤报表', '生成月度报告', '下载考勤报表'],
    [AttendanceIntent.UNKNOWN]: [],
  };

  return examples[intent] || [];
}

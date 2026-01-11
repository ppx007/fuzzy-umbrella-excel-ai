/**
 * 表格生成服务
 * 使用 AI 解析自然语言指令，生成表格数据
 * 支持带样式的表格生成，增强数据验证和错误处理
 */

import { config } from '@/config';
import type {
  TableGenerationRequest,
  TableGenerationResponse,
  StyledTableGenerationRequest,
  StyledTableGenerationResponse,
  GenericTableData,
  StyledTableData,
  GenericTableColumn,
  ExtendedColumnType,
  ValidationResult,
} from '@/types/common';
import { createValidationResult } from '@/utils/validation';

/**
 * 清理模型名称，移除可能的前缀
 */
function cleanModelName(model: string): string {
  if (!model) return model;
  // 移除任何非字母数字开头的前缀（如 "假流式/"）
  const cleaned = model.replace(/^[^a-zA-Z0-9]+\//, '');
  if (cleaned !== model) {
    console.log('[TableGenerationService] 模型名称已清理:', model, '->', cleaned);
  }
  return cleaned;
}

/**
 * 从标题生成英文键名
 */
// 这个函数现在由文件解析服务提供，这里完全注释掉避免警告
/*
function generateKeyFromTitle(title: string): string {
  // 简单的关键词映射
  const keywordMap: Record<string, string> = {
    '姓名': 'name', '名称': 'name', '产品': 'product', '商品': 'product',
    '数量': 'quantity', '个数': 'count', '价格': 'price', '单价': 'unitPrice',
    '金额': 'amount', '总价': 'total', '日期': 'date', '时间': 'time',
    '状态': 'status', '类型': 'type', '类别': 'category', '描述': 'description',
    '备注': 'remark', '说明': 'note', '用户': 'user', '客户': 'customer',
    '会员': 'member', '订单': 'order', '订单号': 'orderNo', '销售': 'sales',
    '销量': 'salesVolume', '收入': 'revenue', '成本': 'cost', '利润': 'profit',
    '部门': 'department', '员工': 'employee', '职员': 'staff', '工资': 'salary',
    '薪资': 'wage', '电话': 'phone', '手机': 'mobile', '邮箱': 'email',
    '邮件': 'email', '地址': 'address', '位置': 'location', '公司': 'company',
    '企业': 'enterprise', '品牌': 'brand', '型号': 'model', '规格': 'specification',
    '颜色': 'color', '尺寸': 'size', '重量': 'weight', '库存': 'stock',
    '仓库': 'warehouse', '供应商': 'supplier', '厂商': 'manufacturer',
    '采购': 'purchase', '进货': 'purchase', '零售': 'retail', '批发': 'wholesale',
    '折扣': 'discount', '优惠': 'discount', '税率': 'taxRate', '税额': 'taxAmount',
    '合计': 'total', '小计': 'subtotal', '付款': 'payment', '收款': 'receipt',
    '支付方式': 'paymentMethod', '交易': 'transaction', '流水号': 'serialNo',
    '编号': 'code', '编码': 'code', '条码': 'barcode', '二维码': 'qrCode',
    '身份证': 'idCard', '护照': 'passport', '驾驶证': 'driverLicense',
    '车牌号': 'plateNo', '车辆': 'vehicle'
  };

  // 首先尝试完整匹配
  if (keywordMap[title]) {
    return keywordMap[title];
  }

  // 尝试提取关键词
  for (const [key, value] of Object.entries(keywordMap)) {
    if (title.includes(key)) {
      return value;
    }
  }

  // fallback: 使用标题的拼音首字母（简化版）
  const charMap: Record<string, string> = {
    '阿': 'a', '啊': 'a', '埃': 'a', '艾': 'a', '爱': 'a', '安': 'a', '昂': 'a', '奥': 'a',
    '八': 'b', '巴': 'b', '白': 'b', '百': 'b', '班': 'b', '邦': 'b', '包': 'b', '保': 'b', '鲍': 'b', '暴': 'b', '贝': 'b', '本': 'b', '比': 'b', '毕': 'b', '边': 'b', '卞': 'b', '标': 'b', '别': 'b', '宾': 'b', '斌': 'b', '冰': 'b', '兵': 'b', '丙': 'b', '秉': 'b', '博': 'b', '布': 'b',
    '才': 'c', '蔡': 'c', '曹': 'c', '岑': 'c', '曾': 'c', '查': 'c', '柴': 'c', '昌': 'c', '常': 'c', '长': 'c', '车': 'c', '陈': 'c', '成': 'c', '程': 'c', '池': 'c', '充': 'c', '崇': 'c', '楚': 'c', '褚': 'c', '传': 'c', '春': 'c', '从': 'c', '崔': 'c',
    '达': 'd', '答': 'd', '大': 'd', '代': 'd', '戴': 'd', '单': 'd', '邓': 'd', '狄': 'd', '刁': 'd', '丁': 'd', '东': 'd', '董': 'd', '都': 'd', '窦': 'd', '杜': 'd', '端': 'd', '段': 'd', '多': 'd',
    '俄': 'e', '鄂': 'e', '恩': 'e', '尔': 'e',
    '发': 'f', '法': 'f', '樊': 'f', '范': 'f', '方': 'f', '房': 'f', '费': 'f', '丰': 'f', '封': 'f', '冯': 'f', '凤': 'f', '伏': 'f', '符': 'f', '福': 'f', '付': 'f', '傅': 'f',
    '盖': 'g', '干': 'g', '甘': 'g', '高': 'g', '郜': 'g', '戈': 'g', '葛': 'g', '耿': 'g', '宫': 'g', '龚': 'g', '巩': 'g', '贡': 'g', '古': 'g', '谷': 'g', '顾': 'g', '关': 'g', '管': 'g', '光': 'g', '广': 'g', '归': 'g', '桂': 'g', '郭': 'g', '国': 'g',
    '哈': 'h', '海': 'h', '韩': 'h', '汉': 'h', '杭': 'h', '郝': 'h', '何': 'h', '和': 'h', '贺': 'h', '赫': 'h', '洪': 'h', '侯': 'h', '胡': 'h', '虎': 'h', '户': 'h', '华': 'h', '花': 'h', '滑': 'h', '怀': 'h', '宦': 'h', '皇': 'h', '黄': 'h', '惠': 'h', '霍': 'h',
    '姬': 'j', '吉': 'j', '计': 'j', '纪': 'j', '季': 'j', '冀': 'j', '贾': 'j', '简': 'j', '见': 'j', '江': 'j', '姜': 'j', '蒋': 'j', '焦': 'j', '金': 'j', '晋': 'j', '经': 'j', '荆': 'j', '井': 'j', '景': 'j', '敬': 'j', '靖': 'j', '居': 'j', '鞠': 'j', '巨': 'j', '具': 'j', '剧': 'j', '隽': 'j',
    '卡': 'k', '开': 'k', '凯': 'k', '阚': 'k', '康': 'k', '柯': 'k', '科': 'k', '克': 'k', '孔': 'k', '寇': 'k', '库': 'k', '蒯': 'k', '匡': 'k', '旷': 'k', '邝': 'k',
    '来': 'l', '赖': 'l', '兰': 'l', '蓝': 'l', '郎': 'l', '劳': 'l', '老': 'l', '乐': 'l', '雷': 'l', '冷': 'l', '黎': 'l', '李': 'l', '历': 'l', '厉': 'l', '利': 'l', '郦': 'l', '连': 'l', '廉': 'l', '梁': 'l', '良': 'l', '凉': 'l', '廖': 'l', '林': 'l', '蔺': 'l', '凌': 'l', '刘': 'l', '柳': 'l', '龙': 'l', '隆': 'l', '娄': 'l', '卢': 'l', '鲁': 'l', '陆': 'l', '路': 'l', '禄': 'l', '吕': 'l', '律': 'l', '栾': 'l', '罗': 'l', '骆': 'l', '麻': 'm', '马': 'm', '买': 'm', '麦': 'm', '满': 'm', '毛': 'm', '茅': 'm', '冒': 'm', '梅': 'm', '门': 'm', '蒙': 'm', '孟': 'm', '弥': 'm', '米': 'm', '宓': 'm', '苗': 'm', '缪': 'm', '闵': 'm', '明': 'm', '莫': 'm', '墨': 'm', '万': 'w', '汪': 'w', '王': 'w', '危': 'w', '韦': 'w', '卫': 'w', '魏': 'w', '温': 'w', '文': 'w', '闻': 'w', '翁': 'w', '沃': 'w', '乌': 'w', '巫': 'w', '吴': 'w', '武': 'w', '伍': 'w', '仵': 'w', '邬': 'w', '午': 'w', '舞': 'w', '勿': 'w',
    '夕': 'x', '西': 'x', '习': 'x', '席': 'x', '夏': 'x', '夏侯': 'x', '先': 'x', '鲜': 'x', '鲜于': 'x', '冼': 'x', '相': 'x', '向': 'x', '项': 'x', '萧': 'x', '肖': 'x', '谢': 'x', '辛': 'x', '忻': 'x', '信': 'x', '邢': 'x', '幸': 'x', '熊': 'x', '修': 'x', '胥': 'x', '徐': 'x', '许': 'x', '续': 'x', '轩': 'x', '宣': 'x', '薛': 'x', '荀': 'x',
    '牙': 'y', '雅': 'y', '亚': 'y', '焉': 'y', '延': 'y', '严': 'y', '言': 'y', '阎': 'y', '颜': 'y', '晏': 'y', '燕': 'y', '羊': 'y', '羊舌': 'y', '阳': 'y', '杨': 'y', '仰': 'y', '养': 'y', '姚': 'y', '么': 'y', '尧': 'y', '药': 'y', '叶': 'y', '伊': 'y', '衣': 'y', '依': 'y', '夷': 'y', '宜': 'y', '移': 'y', '乙': 'y', '已': 'y', '以': 'y', '义': 'y', '艺': 'y', '易': 'y', '奕': 'y', '益': 'y', '羿': 'y', '殷': 'y', '阴': 'y', '银': 'y', '尹': 'y', '印': 'y', '应': 'y', '英': 'y', '莺': 'y', '婴': 'y', '盈': 'y', '营': 'y', '赢': 'y', '郢': 'y', '颖': 'y', '影': 'y', '雍': 'y', '永': 'y', '勇': 'y', '用': 'y', '尤': 'y', '由': 'y', '犹': 'y', '游': 'y', '有': 'y', '酉': 'y', '友': 'y', '右': 'y', '佑': 'y', '于': 'y', '余': 'y', '盂': 'y', '俞': 'y', '虞': 'y', '愚': 'y', '宇': 'y', '羽': 'y', '雨': 'y', '禹': 'y', '语': 'y', '玉': 'y', '郁': 'y', '育': 'y', '狱': 'y', '预': 'y', '域': 'y', '欲': 'y', '喻': 'y', '御': 'y', '裕': 'y', '遇': 'y', '愈': 'y', '誉': 'y', '毓': 'y', '豫': 'y', '元': 'y', '园': 'y', '沅': 'y', '袁': 'y', '原': 'y', '圆': 'y', '源': 'y', '远': 'y', '苑': 'y', '院': 'y', '愿': 'y', '曰': 'y', '约': 'y', '月': 'y', '岳': 'y', '悦': 'y', '阅': 'y', '跃': 'y', '越': 'y', '云': 'y', '芸': 'y', '郧': 'y', '匀': 'y', '允': 'y', '运': 'y', '郓': 'y', '恽': 'y', '韵': 'y',
    '杂': 'z', '栽': 'z', '宰': 'z', '载': 'z', '冉': 'z', '再': 'z', '在': 'z', '赞': 'z', '臧': 'z', '葬': 'z', '糟': 'z', '早': 'z', '枣': 'z', '皂': 'z', '造': 'z', '则': 'z', '择': 'z', '泽': 'z', '责': 'z', '贼': 'z', '怎': 'z', '增': 'z', '扎': 'z', '札': 'z', '轧': 'z', '闸': 'z', '眨': 'z', '乍': 'z', '诈': 'z', '斋': 'z', '摘': 'z', '宅': 'z', '翟': 'z', '窄': 'z', '债': 'z', '寨': 'z', '瞻': 'z', '展': 'z', '占': 'z', '战': 'z', '站': 'z', '张': 'z', '章': 'z', '彰': 'z', '漳': 'z', '涨': 'z', '掌': 'z', '丈': 'z', '仗': 'z', '帐': 'z', '账': 'z', '胀': 'z', '赵': 'z', '照': 'z', '罩': 'z', '肇': 'z', '折': 'z', '哲': 'z', '辄': 'z', '者': 'z', '这': 'z', '浙': 'z', '珍': 'z', '真': 'z', '甄': 'z', '针': 'z', '侦': 'z', '枕': 'z', '疹': 'z', '阵': 'z', '振': 'z', '镇': 'z', '震': 'z', '争': 'z', '征': 'z', '峥': 'z', '挣': 'z', '狰': 'z', '睁': 'z',
  };
  return title
    .split('')
    .map(char => {
      return charMap[char] || char.toLowerCase();
    })
    .join('')
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20) || `col${Date.now() % 1000}`;
}
*/

/**
 * 构建增强的系统提示词
 */
function buildEnhancedSystemPrompt(options?: TableGenerationRequest['options']): string {
  const rowCount = options?.rowCount || 5;
  const language = options?.language || 'zh';

  return `你是一个严格的JSON生成引擎。你的唯一任务是根据用户输入生成一个表格的JSON表示。

**重要规则：**
1. **必须**返回一个完整的、语法正确的JSON对象。
2. **绝对不能**在JSON之外包含任何解释、注释、介绍或Markdown代码块（如 \`\`\`json）。
3. 返回的JSON对象**必须**严格遵循以下结构：
{
  "table": {
    "title": "表格标题",
    "columns": [
      {
        "key": "英文键名",
        "title": "中文显示名",
        "type": "text|number|date|time|datetime|currency|percentage|boolean|email|phone|url|formula"
      }
    ],
    "rows": [
      {
        "key1": "值1",
        "key2": "值2"
      }
    ]
  }
}

**关键要求：**
- key必须是英文，用于数据映射
- title是中文显示名称
- rows中的键必须与columns中的key完全对应
- 生成${rowCount}行示例数据
- 数据要合理且符合实际情况
- 语言偏好：${language === 'zh' ? '中文' : '英文'}

**你的输出必须从 { 开始，到 } 结束，中间是完整的JSON内容。**`;
}

/**
 * 构建带样式的系统提示词
 */
function buildStyledSystemPrompt(
  stylePreference?: StyledTableGenerationRequest['stylePreference']
): string {
  const styleKeywords = stylePreference?.keywords?.join('、') || '专业';
  const enableConditionalFormat = stylePreference?.enableConditionalFormat ?? true;

  return `你是一个严格的JSON生成引擎，专门生成带样式的表格。

**重要规则：**
1. **必须**返回一个完整的、语法正确的JSON对象。
2. **绝对不能**在JSON之外包含任何解释、注释、介绍或Markdown代码块。
3. 返回的JSON对象**必须**严格遵循以下结构：
{
  "table": {
    "title": "表格标题",
    "columns": [
      {
        "key": "英文键名",
        "title": "中文显示名",
        "type": "text|number|date|time|datetime|currency|percentage|boolean|email|phone|url|formula"
      }
    ],
    "rows": [
      {
        "key1": "值1",
        "key2": "值2"
      ]
  },
  "style": {
    "colorTheme": "professional|energetic|nature|elegant|dark|fresh",
    "excelTableStyle": "TableStyleMedium2",
    "header": {
      "backgroundColor": "#4472C4",
      "fontColor": "#FFFFFF",
      "bold": true,
      "align": "center"
    },
    "conditionalFormats": [
      {
        "columnName": "键名",
        "config": {
          "type": "colorScale|dataBar|iconSet|cellValue",
          "minColor": "#FF0000",
          "maxColor": "#00FF00"
        }
      }
    ]
  }
}

**样式要求：**
- 整体风格：${styleKeywords}
- 条件格式：${enableConditionalFormat ? '启用' : '禁用'}
- 确保样式配置完整且合理

**你的输出必须从 { 开始，到 } 结束，中间是完整的JSON内容。**`;
}

/**
 * 使用平衡括号算法提取 JSON
 */
function extractBalancedJson(text: string): string | null {
  const startIndex = text.indexOf('{');
  if (startIndex === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\' && inString) {
      escape = true;
      continue;
    }

    if (char === '"' && !escape) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          return text.substring(startIndex, i + 1);
        }
      }
    }
  }

  return null;
}

/**
 * 尝试修复和解析 JSON
 */
function tryParseJson(jsonString: string): unknown {
  // 首先尝试直接解析
  try {
    return JSON.parse(jsonString);
  } catch {
    // 继续尝试修复
  }

  console.warn('[TableGenerationService] JSON 解析失败，尝试修复...');

  // 修复1: 移除尾部逗号
  let fixed = jsonString.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(fixed);
  } catch {
    // 继续尝试
  }

  // 修复2: 移除控制字符
  fixed = fixed.replace(/[\x00-\x1F\x7F]/g, ' ');

  try {
    return JSON.parse(fixed);
  } catch {
    // 继续尝试
  }

  // 修复3: 修复单引号
  fixed = fixed.replace(/'/g, '"');

  try {
    return JSON.parse(fixed);
  } catch {
    return null;
  }
}

/**
 * 验证表格数据结构
 */
function validateTableData(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('表格数据必须是对象');
    return createValidationResult(errors, warnings);
  }

  // 验证table字段
  if (!data.table) {
    errors.push('缺少table字段');
    return createValidationResult(errors, warnings);
  }

  const table = data.table;

  // 验证title
  if (!table.title || typeof table.title !== 'string') {
    errors.push('表格标题无效');
  }

  // 验证columns
  if (!Array.isArray(table.columns) || table.columns.length === 0) {
    errors.push('列定义无效或为空');
    return createValidationResult(errors, warnings);
  }

  // 验证每个列
  const columnKeys = new Set<string>();
  for (let i = 0; i < table.columns.length; i++) {
    const col = table.columns[i];
    
    if (!col.key || typeof col.key !== 'string') {
      errors.push(`列${i + 1}缺少key字段`);
    } else {
      if (columnKeys.has(col.key)) {
        errors.push(`列key重复: ${col.key}`);
      }
      columnKeys.add(col.key);
    }

    if (!col.title || typeof col.title !== 'string') {
      errors.push(`列${i + 1}缺少title字段`);
    }

    if (!col.type || typeof col.type !== 'string') {
      errors.push(`列${i + 1}缺少type字段`);
    }
  }

  // 验证rows
  if (!Array.isArray(table.rows)) {
    errors.push('数据行必须是数组');
    return createValidationResult(errors, warnings);
  }

  // 验证每行数据
  for (let i = 0; i < table.rows.length; i++) {
    const row = table.rows[i];
    if (!row || typeof row !== 'object') {
      errors.push(`行${i + 1}数据无效`);
      continue;
    }

    // 检查行数据是否包含所有列的key
    for (const col of table.columns) {
      if (col.key && !(col.key in row)) {
        warnings.push(`行${i + 1}缺少列: ${col.key}`);
      }
    }

    // 检查行数据是否有多余的key
    const rowKeys = Object.keys(row);
    for (const rowKey of rowKeys) {
      if (!columnKeys.has(rowKey)) {
        warnings.push(`行${i + 1}包含未定义的列: ${rowKey}`);
      }
    }
  }

  return createValidationResult(errors, warnings);
}

/**
 * 清理和标准化表格数据
 */
function sanitizeTableData(data: any): GenericTableData {
  const table = data.table;
  
  // 清理列定义
  const columns: GenericTableColumn[] = table.columns.map((col: any, index: number) => ({
    key: col.key || `col${index}`,
    title: col.title || `列${index + 1}`,
    type: (col.type as ExtendedColumnType) || 'text',
    width: col.width,
    format: col.format,
    required: col.required,
    defaultValue: col.defaultValue,
    validation: col.validation,
  }));

  // 确保列key唯一
  const usedKeys = new Set<string>();
  const uniqueColumns = columns.map(col => {
    let uniqueKey = col.key;
    let counter = 1;
    while (usedKeys.has(uniqueKey)) {
      uniqueKey = `${col.key}_${counter}`;
      counter++;
    }
    usedKeys.add(uniqueKey);
    return { ...col, key: uniqueKey };
  });

  // 清理数据行
  const rows = table.rows.map((row: any) => {
    const cleanedRow: Record<string, unknown> = {};
    
    // 为每个列添加值
    for (const col of uniqueColumns) {
      let value = row[col.key];
      
      // 处理undefined和null
      if (value === undefined || value === null) {
        value = col.defaultValue ?? '';
      }
      
      // 处理对象类型
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      
      // 处理字符串，移除控制字符
      if (typeof value === 'string') {
        value = value.replace(/[\x00-\x1F\x7F]/g, '');
      }
      
      cleanedRow[col.key] = value;
    }
    
    return cleanedRow;
  });

  return {
    tableName: table.title || 'GeneratedTable',
    columns: uniqueColumns,
    rows,
    metadata: {
      createdAt: new Date().toISOString(),
      source: 'ai',
    },
  };
}

/**
 * 服务配置接口
 */
interface ServiceConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

/**
 * 表格生成服务类
 */
export class TableGenerationService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = config.openai.apiKey;
    this.baseUrl = config.openai.baseUrl;
    this.model = cleanModelName(config.openai.model);
  }

  /**
   * 更新配置
   */
  updateConfig(cfg: ServiceConfig): void {
    if (cfg.apiKey) this.apiKey = cfg.apiKey;
    if (cfg.baseUrl) this.baseUrl = cfg.baseUrl;
    if (cfg.model) this.model = cleanModelName(cfg.model);
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return Boolean(this.apiKey && this.baseUrl);
  }

  /**
   * 生成表格（使用流式模式和自动重试机制）
   */
  async generateTable(
    request: TableGenerationRequest,
    maxRetries: number = 3
  ): Promise<TableGenerationResponse> {
    const { prompt, options } = request;

    const systemPrompt = buildEnhancedSystemPrompt(options);
    const requestUrl = `${this.baseUrl}/chat/completions`;
    const requestBody = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 8192,
      stream: true, // 启用流式模式避免 Cloudflare 超时
      // 对于支持的模型，启用JSON模式
      ...(this.supportsJsonMode() && { response_format: { type: 'json_object' } }),
    };

    console.log('[TableGenerationService] 发送请求到:', requestUrl);
    console.log('[TableGenerationService] 使用模型:', this.model);
    console.log('[TableGenerationService] 流式模式: 已启用');
    console.log('[TableGenerationService] 最大重试次数:', maxRetries);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 180秒超时

      try {
        console.log(`[TableGenerationService] 尝试第 ${attempt}/${maxRetries} 次请求...`);

        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          let errorMessage = response.statusText;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorMessage;
          } catch {
            if (errorText) {
              errorMessage = errorText.substring(0, 200);
            }
          }

          // 524 错误可以重试
          if (response.status === 524) {
            lastError = new Error(`API请求超时 (524)，第 ${attempt} 次尝试失败`);
            console.warn(`[TableGenerationService] ${lastError.message}，将重试...`);
            if (attempt < maxRetries) {
              const delay = attempt * 2000;
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            return {
              success: false,
              error: 'API多次请求超时 (524)，服务器响应太慢，请稍后重试',
            };
          }

          // 401 不重试
          if (response.status === 401) {
            return {
              success: false,
              error: 'API密钥无效或已过期，请在设置中检查API密钥',
            };
          }

          // 429 可以重试
          if (response.status === 429) {
            lastError = new Error('请求过于频繁');
            if (attempt < maxRetries) {
              const delay = attempt * 3000;
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            return {
              success: false,
              error: '请求过于频繁，请稍后重试',
            };
          }

          // 502, 503, 504 可以重试
          if ([502, 503, 504].includes(response.status)) {
            lastError = new Error(`服务器暂时不可用 (${response.status})`);
            if (attempt < maxRetries) {
              const delay = attempt * 2000;
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            return {
              success: false,
              error: `服务器暂时不可用 (${response.status})，请稍后重试`,
            };
          }

          return {
            success: false,
            error: `API请求失败: ${response.status} - ${errorMessage}`,
          };
        }

        // 处理流式响应
        const content = await this.processStreamResponse(response);

        if (!content) {
          return {
            success: false,
            error: 'AI 返回了空响应',
          };
        }

        console.log(`[TableGenerationService] 第 ${attempt} 次请求成功！`);
        console.log('[TableGenerationService] 响应长度:', content.length, '字符');

        return this.parseTableResponse(content);
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            lastError = new Error(`请求超时（180秒），第 ${attempt} 次尝试失败`);
            console.warn(`[TableGenerationService] ${lastError.message}`);
            if (attempt < maxRetries) {
              continue;
            }
            return {
              success: false,
              error: '请求多次超时（180秒），请检查网络连接或稍后重试',
            };
          }

          lastError = error;
        }

        console.error('[TableGenerationService] 请求失败:', error);

        if (attempt < maxRetries) {
          console.warn(`[TableGenerationService] 将进行第 ${attempt + 1} 次重试...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || '请求失败，请稍后重试',
    };
  }

  /**
   * 生成带样式的表格
   */
  async generateStyledTable(
    request: StyledTableGenerationRequest,
    maxRetries: number = 3
  ): Promise<StyledTableGenerationResponse> {
    const { prompt, stylePreference } = request;

    const systemPrompt = buildStyledSystemPrompt(stylePreference);
    const requestUrl = `${this.baseUrl}/chat/completions`;
    const requestBody = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 8192,
      stream: true,
      ...(this.supportsJsonMode() && { response_format: { type: 'json_object' } }),
    };

    console.log('[TableGenerationService] 发送样式表格请求到:', requestUrl);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      try {
        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // 错误处理逻辑与generateTable相同
          const errorText = await response.text().catch(() => '');
          let errorMessage = response.statusText;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorMessage;
          } catch {
            if (errorText) {
              errorMessage = errorText.substring(0, 200);
            }
          }

          if (response.status === 401) {
            return {
              success: false,
              error: 'API密钥无效或已过期，请在设置中检查API密钥',
            };
          }

          if ([429, 502, 503, 504, 524].includes(response.status) && attempt < maxRetries) {
            const delay = attempt * 2000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          return {
            success: false,
            error: `API请求失败: ${response.status} - ${errorMessage}`,
          };
        }

        const content = await this.processStreamResponse(response);

        if (!content) {
          return {
            success: false,
            error: 'AI 返回了空响应',
          };
        }

        return this.parseStyledTableResponse(content);
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error instanceof Error ? error : new Error('未知错误');
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || '请求失败，请稍后重试',
    };
  }

  /**
   * 处理流式响应，将 SSE 数据聚合为完整内容
   */
  private async processStreamResponse(response: Response): Promise<string> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    try {
      console.log('[TableGenerationService] 开始接收流式响应...');
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // 解码数据块
        buffer += decoder.decode(value, { stream: true });

        // 按行分割处理
        const lines = buffer.split('\n');
        // 保留最后一个可能不完整的行
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = line.slice(6); // 移除 'data: ' 前缀

          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              fullContent += content;
              chunkCount++;
            }
          } catch {
            // 忽略 JSON 解析错误（可能是不完整的数据）
          }
        }
      }

      console.log(`[TableGenerationService] 流式响应完成，共 ${chunkCount} 个数据块`);
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

  /**
   * 解析表格响应
   */
  private parseTableResponse(content: string): TableGenerationResponse {
    console.log('[TableGenerationService] 开始解析响应，长度:', content.length);
    console.log('[TableGenerationService] 原始响应前200字符:', content.substring(0, 200));

    try {
      let jsonStr = content.trim();

      // 方法1: 尝试匹配 markdown 代码块
      const markdownMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (markdownMatch) {
        const jsonContent = markdownMatch[1].trim();
        if (jsonContent.startsWith('{') && jsonContent.endsWith('}')) {
          jsonStr = jsonContent;
          console.log('[TableGenerationService] 从 markdown 代码块提取 JSON');
        }
      }

      // 方法2: 使用平衡括号匹配提取 JSON
      if (!jsonStr.startsWith('{')) {
        const balancedJson = extractBalancedJson(content);
        if (balancedJson) {
          jsonStr = balancedJson;
          console.log('[TableGenerationService] 使用平衡括号匹配提取 JSON');
        }
      }

      // 方法3: 简单正则匹配（后备方案）
      if (!jsonStr.startsWith('{')) {
        const simpleMatch = content.match(/\{[\s\S]*\}/);
        if (simpleMatch) {
          jsonStr = simpleMatch[0];
          console.log('[TableGenerationService] 使用简单正则提取 JSON');
        }
      }

      // 检查是否有有效的 JSON
      if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
        console.error('[TableGenerationService] 响应不是有效的 JSON 格式');
        console.log('[TableGenerationService] 响应内容:', content.substring(0, 500));
        return {
          success: false,
          error: 'AI 返回了非 JSON 格式的响应，请重试',
        };
      }

      // 移除可能导致 JSON 解析失败或 Excel 写入失败的控制字符
      jsonStr = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

      // 使用增强的 JSON 解析
      const parsed = tryParseJson(jsonStr);

      if (!parsed) {
        console.error('[TableGenerationService] JSON 解析失败');
        return {
          success: false,
          error: 'AI 返回了无效的 JSON 数据，无法解析',
        };
      }

      // 验证数据结构
      const validation = validateTableData(parsed);
      if (!validation.valid) {
        console.error('[TableGenerationService] 数据验证失败:', validation.errors);
        return {
          success: false,
          error: `AI 返回的数据格式不正确: ${validation.errors.join(', ')}`,
        };
      }

      // 显示警告信息
      if (validation.warnings && validation.warnings.length > 0) {
        console.warn('[TableGenerationService] 数据验证警告:', validation.warnings);
      }

      // 清理和标准化数据
      const tableData = sanitizeTableData(parsed);

      console.log('[TableGenerationService] 解析成功，表格:', tableData.tableName);

      return {
        success: true,
        data: tableData,
      };
    } catch (error) {
      console.error('[TableGenerationService] JSON 解析失败:', error);
      console.log('[TableGenerationService] 原始响应:', content.substring(0, 500));
      return {
        success: false,
        error: 'AI 响应解析失败，请重试',
      };
    }
  }

  /**
   * 解析带样式的表格响应
   */
  private parseStyledTableResponse(content: string): StyledTableGenerationResponse {
    const response = this.parseTableResponse(content);
    
    if (!response.success || !response.data) {
      return response as StyledTableGenerationResponse;
    }

    // 尝试解析样式信息
    try {
      let jsonStr = content.trim();
      
      // 提取JSON（与parseTableResponse相同的逻辑）
      const markdownMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (markdownMatch) {
        const jsonContent = markdownMatch[1].trim();
        if (jsonContent.startsWith('{') && jsonContent.endsWith('}')) {
          jsonStr = jsonContent;
        }
      } else if (!jsonStr.startsWith('{')) {
        const balancedJson = extractBalancedJson(content);
        if (balancedJson) {
          jsonStr = balancedJson;
        }
      } else if (!jsonStr.startsWith('{')) {
        const simpleMatch = content.match(/\{[\s\S]*\}/);
        if (simpleMatch) {
          jsonStr = simpleMatch[0];
        }
      }

      jsonStr = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
      const parsed = tryParseJson(jsonStr);

      if (parsed && typeof parsed === 'object' && (parsed as any).style) {
        const styledData: StyledTableData = {
          ...response.data,
          style: (parsed as any).style,
        };
        
        return {
          success: true,
          data: styledData,
        };
      }
    } catch (error) {
      console.warn('[TableGenerationService] 样式解析失败，返回无样式表格:', error);
    }

    // 如果没有样式信息，返回基础表格数据
    return {
      success: true,
      data: response.data,
    };
  }

  /**
   * 检查模型是否支持JSON模式
   */
  private supportsJsonMode(): boolean {
    // 支持JSON模式的模型列表
    const jsonModeSupportedModels = [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-3.5-turbo',
    ];
    
    return jsonModeSupportedModels.some(model => 
      this.model.toLowerCase().includes(model.toLowerCase())
    );
  }
}

/**
 * 默认实例
 */
export const tableGenerationService = new TableGenerationService();

/**
 * 便捷函数
 */
export async function generateTable(
  request: TableGenerationRequest
): Promise<TableGenerationResponse> {
  return tableGenerationService.generateTable(request);
}

export async function generateStyledTable(
  request: StyledTableGenerationRequest
): Promise<StyledTableGenerationResponse> {
  return tableGenerationService.generateStyledTable(request);
}
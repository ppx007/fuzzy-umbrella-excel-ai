/**
 * 中文分词器
 * 简单的基于规则的分词实现
 */

/**
 * 分词结果
 */
export interface Token {
  /** 词语 */
  word: string;
  /** 词性 */
  pos?: string;
  /** 起始位置 */
  start: number;
  /** 结束位置 */
  end: number;
}

/**
 * 词性标注
 */
export enum POS {
  /** 名词 */
  NOUN = 'n',
  /** 动词 */
  VERB = 'v',
  /** 形容词 */
  ADJ = 'a',
  /** 数词 */
  NUM = 'm',
  /** 量词 */
  QUAN = 'q',
  /** 时间词 */
  TIME = 't',
  /** 人名 */
  PERSON = 'nr',
  /** 地名 */
  PLACE = 'ns',
  /** 机构名 */
  ORG = 'nt',
  /** 标点 */
  PUNCT = 'w',
  /** 未知 */
  UNKNOWN = 'x',
}

/**
 * 词典
 */
const dictionary: Map<string, POS> = new Map([
  // 动词
  ['生成', POS.VERB],
  ['创建', POS.VERB],
  ['制作', POS.VERB],
  ['导入', POS.VERB],
  ['导出', POS.VERB],
  ['统计', POS.VERB],
  ['汇总', POS.VERB],
  ['分析', POS.VERB],
  ['查看', POS.VERB],
  ['显示', POS.VERB],
  ['添加', POS.VERB],
  ['删除', POS.VERB],
  ['修改', POS.VERB],
  ['更新', POS.VERB],
  ['计算', POS.VERB],
  ['包含', POS.VERB],
  ['包括', POS.VERB],
  
  // 名词 - 考勤相关
  ['考勤', POS.NOUN],
  ['考勤表', POS.NOUN],
  ['考勤记录', POS.NOUN],
  ['出勤', POS.NOUN],
  ['出勤率', POS.NOUN],
  ['迟到', POS.NOUN],
  ['早退', POS.NOUN],
  ['缺勤', POS.NOUN],
  ['请假', POS.NOUN],
  ['加班', POS.NOUN],
  ['打卡', POS.NOUN],
  ['签到', POS.NOUN],
  ['签退', POS.NOUN],
  ['上班', POS.NOUN],
  ['下班', POS.NOUN],
  ['工时', POS.NOUN],
  ['工作时长', POS.NOUN],
  
  // 名词 - 报表相关
  ['日报', POS.NOUN],
  ['周报', POS.NOUN],
  ['月报', POS.NOUN],
  ['年报', POS.NOUN],
  ['报表', POS.NOUN],
  ['表格', POS.NOUN],
  ['模板', POS.NOUN],
  ['图表', POS.NOUN],
  ['饼图', POS.NOUN],
  ['柱状图', POS.NOUN],
  ['折线图', POS.NOUN],
  ['趋势图', POS.NOUN],
  
  // 名词 - 组织相关
  ['员工', POS.NOUN],
  ['部门', POS.NOUN],
  ['公司', POS.NOUN],
  ['团队', POS.NOUN],
  ['人员', POS.NOUN],
  
  // 时间词
  ['今天', POS.TIME],
  ['昨天', POS.TIME],
  ['明天', POS.TIME],
  ['本周', POS.TIME],
  ['上周', POS.TIME],
  ['下周', POS.TIME],
  ['本月', POS.TIME],
  ['上月', POS.TIME],
  ['下月', POS.TIME],
  ['今年', POS.TIME],
  ['去年', POS.TIME],
  ['明年', POS.TIME],
  ['月', POS.TIME],
  ['周', POS.TIME],
  ['日', POS.TIME],
  ['年', POS.TIME],
  ['号', POS.TIME],
  
  // 形容词
  ['详细', POS.ADJ],
  ['简单', POS.ADJ],
  ['完整', POS.ADJ],
  ['全部', POS.ADJ],
  ['所有', POS.ADJ],
  
  // 量词
  ['个', POS.QUAN],
  ['份', POS.QUAN],
  ['张', POS.QUAN],
  ['次', POS.QUAN],
  ['天', POS.QUAN],
  ['小时', POS.QUAN],
  ['分钟', POS.QUAN],
]);

/**
 * 停用词
 */
const stopWords = new Set([
  '的', '了', '和', '与', '或', '在', '是', '有', '为', '以',
  '及', '等', '把', '被', '让', '给', '从', '到', '向', '对',
  '按', '用', '将', '要', '能', '可', '会', '就', '都', '也',
  '还', '又', '再', '很', '太', '更', '最', '非常', '十分',
  '一', '一个', '这', '那', '这个', '那个', '什么', '怎么',
  '请', '帮', '帮我', '帮忙', '麻烦', '需要', '想要', '想',
]);

/**
 * 简单分词器类
 */
export class Tokenizer {
  private maxWordLength = 5;
  
  /**
   * 对文本进行分词
   */
  tokenize(text: string): Token[] {
    const tokens: Token[] = [];
    let pos = 0;
    
    while (pos < text.length) {
      // 跳过空白字符
      if (/\s/.test(text[pos])) {
        pos++;
        continue;
      }
      
      // 处理数字
      const numMatch = text.slice(pos).match(/^\d+(\.\d+)?/);
      if (numMatch) {
        tokens.push({
          word: numMatch[0],
          pos: POS.NUM,
          start: pos,
          end: pos + numMatch[0].length,
        });
        pos += numMatch[0].length;
        continue;
      }
      
      // 处理标点符号
      if (/[，。！？、；：""''（）【】《》\-~,\.!?;:"\'\(\)\[\]<>]/.test(text[pos])) {
        tokens.push({
          word: text[pos],
          pos: POS.PUNCT,
          start: pos,
          end: pos + 1,
        });
        pos++;
        continue;
      }
      
      // 最大匹配法分词
      let matched = false;
      for (let len = this.maxWordLength; len >= 1; len--) {
        if (pos + len > text.length) continue;
        
        const word = text.slice(pos, pos + len);
        if (dictionary.has(word)) {
          tokens.push({
            word,
            pos: dictionary.get(word),
            start: pos,
            end: pos + len,
          });
          pos += len;
          matched = true;
          break;
        }
      }
      
      // 未匹配到词典词，单字处理
      if (!matched) {
        const char = text[pos];
        // 判断是否为中文字符
        if (/[\u4e00-\u9fa5]/.test(char)) {
          tokens.push({
            word: char,
            pos: POS.UNKNOWN,
            start: pos,
            end: pos + 1,
          });
        } else {
          // 英文或其他字符，尝试连续匹配
          const engMatch = text.slice(pos).match(/^[a-zA-Z]+/);
          if (engMatch) {
            tokens.push({
              word: engMatch[0],
              pos: POS.UNKNOWN,
              start: pos,
              end: pos + engMatch[0].length,
            });
            pos += engMatch[0].length - 1;
          } else {
            tokens.push({
              word: char,
              pos: POS.UNKNOWN,
              start: pos,
              end: pos + 1,
            });
          }
        }
        pos++;
      }
    }
    
    return tokens;
  }
  
  /**
   * 分词并过滤停用词
   */
  tokenizeAndFilter(text: string): Token[] {
    return this.tokenize(text).filter(token => !stopWords.has(token.word));
  }
  
  /**
   * 获取关键词
   */
  getKeywords(text: string): string[] {
    const tokens = this.tokenizeAndFilter(text);
    return tokens
      .filter(token => 
        token.pos === POS.NOUN || 
        token.pos === POS.VERB || 
        token.pos === POS.TIME
      )
      .map(token => token.word);
  }
  
  /**
   * 提取名词短语
   */
  extractNounPhrases(text: string): string[] {
    const tokens = this.tokenize(text);
    const phrases: string[] = [];
    let currentPhrase = '';
    
    for (const token of tokens) {
      if (token.pos === POS.NOUN || token.pos === POS.ADJ) {
        currentPhrase += token.word;
      } else {
        if (currentPhrase.length > 1) {
          phrases.push(currentPhrase);
        }
        currentPhrase = '';
      }
    }
    
    if (currentPhrase.length > 1) {
      phrases.push(currentPhrase);
    }
    
    return phrases;
  }
  
  /**
   * 检查是否包含某类词
   */
  containsPOS(text: string, pos: POS): boolean {
    const tokens = this.tokenize(text);
    return tokens.some(token => token.pos === pos);
  }
  
  /**
   * 获取指定词性的词
   */
  getWordsByPOS(text: string, pos: POS): string[] {
    const tokens = this.tokenize(text);
    return tokens
      .filter(token => token.pos === pos)
      .map(token => token.word);
  }
}

/**
 * 默认分词器实例
 */
export const tokenizer = new Tokenizer();

/**
 * 便捷分词函数
 */
export function tokenize(text: string): Token[] {
  return tokenizer.tokenize(text);
}

/**
 * 便捷关键词提取函数
 */
export function extractKeywords(text: string): string[] {
  return tokenizer.getKeywords(text);
}
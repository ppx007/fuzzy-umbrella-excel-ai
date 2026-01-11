/*
 * @Author: ppx007 duxiaojie3@gmail.com
 * @LastEditTime: 2026-01-11 13:00:28
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
 */
/**
 * 表格生成功能测试
 * 用于验证新的 key/title 结构是否正常工作
 */

import { tableGenerationService } from '@/services/table-generation-service';

async function testTableGeneration() {
  console.log('=== 表格生成功能测试 ===');

  // 测试用例1：简单的员工表
  const testPrompt1 = '创建一个包含姓名、年龄、职位、部门的员工表格，包含5条示例数据';

  console.log('\n测试1：员工表格生成');
  console.log('提示词：', testPrompt1);

  try {
    const result = await tableGenerationService.generateTable({
      prompt: testPrompt1,
      options: {
        rowCount: 5,
        language: 'zh',
      },
    });

    if (result.success && result.data) {
      console.log('✅ 表格生成成功');
      console.log('表格名称：', result.data.tableName);
      console.log('列数：', result.data.columns.length);
      console.log('行数：', result.data.rows.length);

      // 验证列结构
      console.log('\n列结构验证：');
      result.data.columns.forEach((col, index) => {
        console.log(`  列${index + 1}: key="${col.key}", title="${col.title}", type="${col.type}"`);
      });

      // 验证数据行
      console.log('\n数据行验证（前2行）：');
      result.data.rows.slice(0, 2).forEach((row, index) => {
        console.log(`  行${index + 1}:`, JSON.stringify(row));
      });

      // 验证key和title的对应关系
      console.log('\nKey-Title对应关系验证：');
      const keyTitleMap = new Map<string, string>();
      result.data.columns.forEach(col => {
        keyTitleMap.set(col.key, col.title);
      });

      // 检查数据行是否使用了正确的key
      const firstRow = result.data.rows[0];
      if (firstRow) {
        const rowKeys = Object.keys(firstRow);
        console.log('数据行使用的keys：', rowKeys);
        console.log(
          '列定义的keys：',
          result.data.columns.map(col => col.key)
        );

        const missingKeys = result.data?.columns.filter(col => !rowKeys.includes(col.key)) || [];
        const extraKeys = rowKeys.filter(key => !result.data?.columns.some(col => col.key === key));

        if (missingKeys.length > 0) {
          console.log(
            '❌ 缺失的keys：',
            missingKeys.map(col => col.key)
          );
        }
        if (extraKeys.length > 0) {
          console.log('❌ 多余的keys：', extraKeys);
        }
        if (missingKeys.length === 0 && extraKeys.length === 0) {
          console.log('✅ Key对应关系正确');
        }
      }
    } else {
      console.log('❌ 表格生成失败：', result.error);
    }
  } catch (error) {
    console.log('❌ 测试失败：', error);
  }
}

// 运行测试
if (require.main === module) {
  testTableGeneration().catch(console.error);
}

export { testTableGeneration };

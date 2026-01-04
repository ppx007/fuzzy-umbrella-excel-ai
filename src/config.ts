/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2026-01-03 01:47:38
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
 */
/**
 * 应用配置
 * 从环境变量中读取配置
 */

export const config = {
  // OpenAI API配置
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    baseUrl: '/api/v1', // 使用Vite代理
    model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo',
  },

  // NLP模式: local | api | hybrid
  nlpMode: (import.meta.env.VITE_NLP_MODE as 'local' | 'api' | 'hybrid') || 'local',

  // 置信度阈值
  confidenceThreshold: parseFloat(import.meta.env.VITE_CONFIDENCE_THRESHOLD || '0.7'),

  // 调试模式
  debug: import.meta.env.VITE_DEBUG === 'true',
};

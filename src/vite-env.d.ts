/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2026-01-03 01:26:28
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
 */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_OPENAI_API_BASE: string;
  readonly VITE_OPENAI_MODEL: string;
  readonly VITE_NLP_MODE: 'local' | 'api' | 'hybrid';
  readonly VITE_CONFIDENCE_THRESHOLD: string;
  readonly VITE_DEBUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

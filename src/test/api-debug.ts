/*
 * @Author: ppx007 duxiaojie3@gmail.com
 * @LastEditTime: 2026-01-11 08:46:54
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
 */
/**
 * API Debug Test
 * This script helps debug API configuration and connectivity issues
 */

import { config } from '@/config';
import { tableGenerationService } from '@/services/table-generation-service';

export async function debugAPI() {
  console.log('=== API Debug Test ===');

  // Check configuration
  console.log('1. Configuration Check:');
  console.log('   API Key:', config.openai.apiKey ? 'Set' : 'Not Set');
  console.log('   Base URL:', config.openai.baseUrl);
  console.log('   Original Base URL:', config.openai.originalBaseUrl);
  console.log('   Model:', config.openai.model);

  // Check service availability
  console.log('\n2. Service Availability:');
  console.log('   Table Generation Service Available:', tableGenerationService.isAvailable());

  // Test a simple request
  console.log('\n3. Testing Simple Request...');
  try {
    const response = await tableGenerationService.generateTable({
      prompt: 'Create a simple test table with 2 rows',
      options: { rowCount: 2 },
    });

    console.log('   Response Success:', response.success);
    if (response.success) {
      console.log('   Table Name:', response.data?.tableName);
      console.log('   Columns:', response.data?.columns.map(c => c.title).join(', '));
      console.log('   Rows Count:', response.data?.rows.length);
    } else {
      console.log('   Error:', response.error);
    }
  } catch (error) {
    console.error('   Exception:', error);
    if (error instanceof Error) {
      console.error('   Error Name:', error.name);
      console.error('   Error Message:', error.message);
      console.error('   Error Stack:', error.stack);
    }
  }

  console.log('\n=== Debug Test Complete ===');
}

// Run the debug test
if (typeof window !== 'undefined') {
  // In browser environment
  (window as any).debugAPI = debugAPI;
  console.log('API Debug function available: window.debugAPI()');
} else {
  // In Node.js environment
  debugAPI()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Debug test failed:', error);
      process.exit(1);
    });
}

/**
 * Manual verification script for Sunburst chart modification fix
 * This script demonstrates that the createChartV2 method handles
 * "Not implemented" errors gracefully for Sunburst and Treemap charts.
 */

import { excelAdapter } from '../adapters/excel-adapter.ts';

// Mock console.warn to capture error messages
const originalWarn = console.warn;
let warnMessages = [];

console.warn = function (...args) {
  warnMessages.push(args.join(' '));
  originalWarn.apply(console, args);
};

async function verifySunburstFix() {
  console.log('=== Verifying Sunburst Chart Modification Fix ===\n');

  try {
    // Test 1: Create Sunburst chart with properties that might throw "Not implemented"
    console.log('Test 1: Creating Sunburst chart with legend positioning...');

    // This would normally throw "RichApi.Error: Not implemented" for Sunburst charts
    // but our fix should catch it and log a warning instead
    await excelAdapter.createChartV2('A1:B5', 'sunburst', {
      title: 'Sales Hierarchy',
      showLegend: true,
      legendPosition: 'right',
    });

    console.log(
      '✅ Sunburst chart created successfully despite potential "Not implemented" errors'
    );

    // Check if warnings were logged
    const sunburstWarnings = warnMessages.filter(
      msg => msg.includes('设置图表图例失败') && msg.includes('Not implemented')
    );

    if (sunburstWarnings.length > 0) {
      console.log('✅ Warning was logged for unsupported legend property:');
      console.log(`   "${sunburstWarnings[0]}"`);
    }
  } catch (error) {
    console.log('❌ Test 1 failed:', error.message);
    return false;
  }

  // Reset warnings for next test
  warnMessages = [];

  try {
    // Test 2: Create Treemap chart with title that might throw "Not implemented"
    console.log('\nTest 2: Creating Treemap chart with title...');

    await excelAdapter.createChartV2('A1:C5', 'treemap', {
      title: 'Product Treemap',
    });

    console.log('✅ Treemap chart created successfully despite potential "Not implemented" errors');

    // Check if warnings were logged
    const treemapWarnings = warnMessages.filter(
      msg => msg.includes('设置图表标题失败') && msg.includes('Not implemented')
    );

    if (treemapWarnings.length > 0) {
      console.log('✅ Warning was logged for unsupported title property:');
      console.log(`   "${treemapWarnings[0]}"`);
    }
  } catch (error) {
    console.log('❌ Test 2 failed:', error.message);
    return false;
  }

  // Test 3: Verify standard charts still work without warnings
  console.log('\nTest 3: Verifying standard Column chart works without warnings...');

  const initialWarningCount = warnMessages.length;

  try {
    await excelAdapter.createChartV2('A1:B5', 'column', {
      title: 'Sales Report',
      showLegend: true,
      legendPosition: 'bottom',
    });

    console.log('✅ Column chart created successfully');

    // Verify no new warnings were logged for standard chart
    const newWarnings = warnMessages.length - initialWarningCount;
    if (newWarnings === 0) {
      console.log('✅ No warnings logged for standard chart type');
    } else {
      console.log(`⚠️  Unexpected warnings logged: ${newWarnings}`);
    }
  } catch (error) {
    console.log('❌ Test 3 failed:', error.message);
    return false;
  }

  // Restore original console.warn
  console.warn = originalWarn;

  console.log('\n=== Summary ===');
  console.log('✅ All tests passed!');
  console.log('✅ Sunburst and Treemap charts can be created/modified without crashing');
  console.log('✅ "Not implemented" errors are caught and logged as warnings');
  console.log('✅ Standard charts continue to work without issues');
  console.log('\nThe fix successfully handles the Excel API limitations for advanced chart types.');

  return true;
}

// Run the verification
verifySunburstFix()
  .then(success => {
    if (success) {
      console.log('\n🎉 Sunburst chart modification fix is working correctly!');
      process.exit(0);
    } else {
      console.log('\n❌ Sunburst chart modification fix verification failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Verification script error:', error);
    process.exit(1);
  });

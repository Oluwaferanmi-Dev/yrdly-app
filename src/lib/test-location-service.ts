import { LocationScopeService } from './location-scope-service';

/**
 * Test script for LocationScopeService
 * Verifies state standardization and hardened address parsing.
 */
async function runTests() {
  console.log('🚀 Starting LocationScopeService Tests...\n');

  const testCases = [
    {
      name: 'Standard State Detection (Lagos)',
      address: '123 Allen Avenue, Ikeja, Lagos State',
      expected: 'Lagos'
    },
    {
      name: 'FCT Detection (Abuja)',
      address: 'Central Area, Garki, Abuja FCT',
      expected: 'Federal Capital Territory'
    },
    {
      name: 'Nasarawa (Double S) Detection',
      address: 'Mararaba, Nasarawa',
      expected: 'Nassarawa'
    },
    {
      name: 'Word Boundary Check (Partial Match)',
      address: 'The town of Kanon is nice.',
      expected: null
    },
    {
      name: 'Case Insensitivity Check',
      address: 'LAGOS NIGERIA',
      expected: 'Lagos'
    }
  ];

  let passed = 0;

  for (const tc of testCases) {
    const result = LocationScopeService.extractStateFromEventLocation({ address: tc.address });
    const success = result === tc.expected;
    
    if (success) {
      console.log(`✅ PASSED: ${tc.name}`);
      passed++;
    } else {
      console.error(`❌ FAILED: ${tc.name}`);
      console.error(`   Input: "${tc.address}"`);
      console.error(`   Expected: "${tc.expected}"`);
      console.error(`   Got: "${result}"\n`);
    }
  }

  console.log(`\n📊 Results: ${passed}/${testCases.length} tests passed.`);
  
  if (passed === testCases.length) {
    console.log('✨ All location tests are GREEN.');
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

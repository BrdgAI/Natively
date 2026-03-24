const path = require('path');

async function main() {
  const harnessPath = path.resolve(
    __dirname,
    '..',
    'dist-electron',
    'electron',
    'interview',
    'InterviewVerificationHarness.js'
  );

  const { runInterviewMemoryVerification } = require(harnessPath);
  const report = await runInterviewMemoryVerification();

  console.log('Interview memory verification');
  console.log(report.passed ? 'PASS' : 'FAIL');

  for (const scenario of report.scenarios) {
    console.log(`\nScenario: ${scenario.name} (${scenario.passed ? 'PASS' : 'FAIL'})`);
    console.log(
      `  Memory stats: finals=${scenario.transcriptMemory.finalSegmentCount}, epochs=${scenario.transcriptMemory.epochCount}, compacted=${scenario.transcriptMemory.compactedSegmentCount}`
    );

    for (const check of scenario.checks) {
      console.log(`  - ${check.passed ? 'PASS' : 'FAIL'} ${check.name}: ${check.details}`);
    }
  }

  if (!report.passed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});

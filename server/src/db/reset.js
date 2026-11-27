console.error('Database reset is disabled. Tests create and remove their own isolated MongoDB databases.');
process.exitCode = 1;

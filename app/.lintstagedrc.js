module.exports = {
  // Type check TypeScript files
  '**/*.(ts|tsx)': () => 'npx tsc --noEmit',
  
  // Lint & prettify TS and JS files
  '**/*.(ts|tsx|js|jsx)': (filenames) => [
    `npx eslint --fix ${filenames.join(' ')}`,
  ],
  
  // Run tests related to changed files
  '**/*.(ts|tsx|js|jsx)': () => 'npm run test:run',
  
  // Format all files
  '**/*.(md|json|yml|yaml)': (filenames) => 
    `npx prettier --write ${filenames.join(' ')}`,
}
#!/usr/bin/env node

/**
 * Production Validation Script
 * Validates the production build and environment setup
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Production Validation Script\n');

// Validation results
const results = {
  passed: [],
  warnings: [],
  failed: []
};

// Check if production environment file exists
function checkEnvironmentFile() {
  const envProdPath = path.join(__dirname, '..', '.env.production');
  const envTemplatePath = path.join(__dirname, '..', '.env.production.template');
  
  if (fs.existsSync(envProdPath)) {
    results.passed.push('✅ Production environment file exists');
  } else if (fs.existsSync(envTemplatePath)) {
    results.warnings.push('⚠️  Production environment template exists but .env.production missing');
  } else {
    results.failed.push('❌ No production environment configuration found');
  }
}

// Check if build directory exists
function checkBuildOutput() {
  const buildPath = path.join(__dirname, '..', '.next');
  
  if (fs.existsSync(buildPath)) {
    results.passed.push('✅ Next.js build output exists');
  } else {
    results.failed.push('❌ No build output found - run npm run build first');
  }
}

// Check package.json for required scripts
function checkPackageScripts() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const requiredScripts = ['build', 'start', 'test'];
    
    const missingScripts = requiredScripts.filter(script => !pkg.scripts[script]);
    
    if (missingScripts.length === 0) {
      results.passed.push('✅ All required npm scripts present');
    } else {
      results.failed.push(`❌ Missing npm scripts: ${missingScripts.join(', ')}`);
    }
  } else {
    results.failed.push('❌ package.json not found');
  }
}

// Check critical files
function checkCriticalFiles() {
  const criticalFiles = [
    'next.config.js',
    'Dockerfile',
    'DEPLOYMENT.md',
    'src/app/api/health/route.ts'
  ];
  
  criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      results.passed.push(`✅ ${file} exists`);
    } else {
      results.failed.push(`❌ Missing critical file: ${file}`);
    }
  });
}

// Check security configurations
function checkSecurityConfig() {
  const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
  
  if (fs.existsSync(nextConfigPath)) {
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    
    if (nextConfig.includes('headers()')) {
      results.passed.push('✅ Security headers configured');
    } else {
      results.warnings.push('⚠️  Security headers not configured in next.config.js');
    }
    
    if (nextConfig.includes('Content-Security-Policy')) {
      results.passed.push('✅ Content Security Policy configured');
    } else {
      results.warnings.push('⚠️  Content Security Policy not configured');
    }
  }
}

// Run all validation checks
function runValidation() {
  console.log('Running production validation checks...\n');
  
  checkEnvironmentFile();
  checkBuildOutput();
  checkPackageScripts();
  checkCriticalFiles();
  checkSecurityConfig();
  
  // Display results
  console.log('📊 Validation Results:\n');
  
  if (results.passed.length > 0) {
    console.log('✅ PASSED CHECKS:');
    results.passed.forEach(check => console.log(`   ${check}`));
    console.log('');
  }
  
  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    results.warnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }
  
  if (results.failed.length > 0) {
    console.log('❌ FAILED CHECKS:');
    results.failed.forEach(failure => console.log(`   ${failure}`));
    console.log('');
  }
  
  // Summary
  const total = results.passed.length + results.warnings.length + results.failed.length;
  const score = Math.round((results.passed.length / total) * 100);
  
  console.log(`📈 Overall Score: ${score}% (${results.passed.length}/${total} checks passed)`);
  
  if (results.failed.length === 0) {
    console.log('🎉 Production validation completed successfully!');
    process.exit(0);
  } else {
    console.log('🔧 Please fix the failed checks before deploying to production.');
    process.exit(1);
  }
}

// Run the validation
runValidation();
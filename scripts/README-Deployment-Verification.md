# Deployment Verification Scripts

This directory contains scripts to verify that CSS assets and static files are properly deployed and accessible after deployment. These scripts are part of the CSS loading fix implementation.

## Scripts Overview

### 1. `deployment-verification.js`
**Purpose**: Comprehensive deployment verification that checks CSS assets, nginx configuration, and container health.

**Features**:
- Verifies CSS assets are built and accessible
- Checks file sizes and content
- Tests asset accessibility via HTTP requests
- Validates nginx configuration
- Performs container health checks

**Usage**:
```bash
# Basic usage
node scripts/deployment-verification.js

# With custom base URL
node scripts/deployment-verification.js --baseUrl http://localhost:8080

# With custom paths
node scripts/deployment-verification.js --clientDistPath ./custom/dist --nginxConfigPath ./custom/nginx.conf
```

### 2. `nginx-config-check.js`
**Purpose**: Automated checks for nginx configuration related to CSS serving.

**Features**:
- Validates static asset location blocks
- Checks MIME type configuration
- Verifies cache headers
- Tests CORS headers
- Checks gzip compression settings
- Validates security headers

**Usage**:
```bash
# Check default nginx.conf
node scripts/nginx-config-check.js

# Check custom config file
node scripts/nginx-config-check.js /path/to/nginx.conf

# Show configuration suggestions
node scripts/nginx-config-check.js --suggestions
```

### 3. `container-health-check.js`
**Purpose**: Verifies that containers are properly serving CSS and static assets.

**Features**:
- Checks container status
- Verifies application health
- Tests static asset serving
- Validates CSS file accessibility
- Checks HTTP headers
- Verifies volume integrity

**Usage**:
```bash
# Basic health check
node scripts/container-health-check.js

# With custom URL and timeout
node scripts/container-health-check.js --baseUrl http://localhost:8080 --timeout 15000
```

### 4. `post-deployment-check.sh` / `post-deployment-check.bat`
**Purpose**: Orchestrates all deployment verification checks in sequence.

**Features**:
- Runs all verification scripts
- Provides comprehensive reporting
- Logs all results
- Cross-platform support (bash/batch)

**Usage**:
```bash
# Linux/Mac
bash scripts/post-deployment-check.sh

# Windows
scripts/post-deployment-check.bat

# With custom URL
BASE_URL=http://localhost:8080 bash scripts/post-deployment-check.sh

# Individual checks only
bash scripts/post-deployment-check.sh --nginx-only
bash scripts/post-deployment-check.sh --container-only
bash scripts/post-deployment-check.sh --assets-only
```

## NPM Scripts

The following NPM scripts are available in the root `package.json`:

```bash
# Run comprehensive deployment verification
npm run verify:deployment

# Check nginx configuration only
npm run verify:nginx

# Check container health only
npm run verify:container

# Run all verification checks
npm run verify:all

# Alias for post-deployment verification
npm run verify:post-deploy
```

## Requirements Mapping

These scripts fulfill the following requirements from the CSS loading fix specification:

- **Requirement 4.1**: Build process verification for CSS assets
- **Requirement 4.2**: Nginx configuration validation for static asset serving
- **Requirement 4.3**: Container health checks for asset availability

## Typical Deployment Workflow

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start containers**:
   ```bash
   npm run docker:prod
   ```

3. **Run deployment verification**:
   ```bash
   npm run verify:post-deploy
   ```

4. **Review results**:
   - Check console output for immediate feedback
   - Review `deployment-verification.log` for detailed logs
   - Address any failed checks before going live

## Common Issues and Solutions

### CSS Files Not Found
- **Issue**: CSS assets not found in `/assets/` directory
- **Solution**: Ensure build process completed successfully and files are copied to dist

### Nginx Configuration Issues
- **Issue**: Static assets not being served correctly
- **Solution**: Review nginx.conf and ensure proper location blocks for `/assets/`

### Container Health Problems
- **Issue**: Containers not responding or assets not accessible
- **Solution**: Check container status, restart if necessary, verify volume mounts

### Cache Issues
- **Issue**: Old CSS files being served
- **Solution**: Clear browser cache, check cache headers, verify asset versioning

## Log Files

All verification results are logged to `deployment-verification.log` in the project root. This file contains:
- Timestamps for each verification run
- Detailed output from each check
- Error messages and stack traces
- Performance metrics

## Exit Codes

- **0**: All checks passed successfully
- **1**: One or more critical checks failed
- **2**: Script execution error

## Integration with CI/CD

These scripts can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Verify Deployment
  run: |
    npm run verify:post-deploy
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
```

## Troubleshooting

### Script Permissions (Linux/Mac)
If you get permission errors:
```bash
chmod +x scripts/post-deployment-check.sh
```

### Node.js Dependencies
Ensure Node.js is installed and accessible:
```bash
node --version
npm --version
```

### Docker Requirements
For container health checks, ensure Docker is running:
```bash
docker --version
docker ps
```

## Customization

### Adding Custom Checks
To add custom verification checks:

1. Extend the appropriate class in the verification scripts
2. Add new check methods following the existing pattern
3. Update the report generation to include new checks

### Environment-Specific Configuration
Create environment-specific configuration files:
```bash
# Development
BASE_URL=http://localhost:3000 npm run verify:post-deploy

# Staging
BASE_URL=https://staging.example.com npm run verify:post-deploy

# Production
BASE_URL=https://example.com npm run verify:post-deploy
```

## Support

For issues with deployment verification:
1. Check the log file for detailed error messages
2. Verify all prerequisites are installed
3. Ensure containers are running and accessible
4. Review nginx configuration for syntax errors
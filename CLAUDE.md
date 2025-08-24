# Claude Code Configuration

## Project Overview

### Business Purpose
**Honey Rae Aesthetics** is a comprehensive business management platform designed for aesthetic and beauty service providers. The application streamlines operations through automated workflows, client relationship management, and integrated marketing tools.

### Core Features
- **Client Management**: Complete client profiles, history tracking, and communication logs
- **Appointment Scheduling**: Integrated calendar system with Google Calendar sync
- **Workflow Automation**: Custom workflow engine for business process automation
- **Social Media Integration**: Multi-platform posting and analytics (Facebook, Instagram, TikTok, YouTube)
- **Messaging System**: Email and SMS communication with templates
- **Analytics Dashboard**: Business insights and performance metrics
- **Team Management**: Multi-user access with role-based permissions
- **Payment Processing**: Stripe integration for secure transactions
- **File Management**: AWS S3 integration for media and document storage

### Target Users
- Aesthetic clinic owners and managers
- Beauty service providers
- Spa and wellness businesses
- Independent practitioners
- Multi-location beauty businesses

### Key Business Value
- Reduces administrative overhead through automation
- Improves client retention with personalized communication
- Increases revenue through integrated marketing tools
- Provides actionable business insights through analytics
- Scales efficiently from single practitioners to multi-location businesses

## Technology Stack
- **Framework**: Next.js 15.4.4 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Backend**: Convex (real-time database)
- **UI Components**: Radix UI + shadcn/ui
- **Authentication**: Next-Auth with Google OAuth
- **Testing**: Vitest (unit/integration) + Playwright (E2E)
- **Cloud Services**: AWS (S3, SES, SNS), Stripe
- **Social Media**: Facebook, Instagram, TikTok, YouTube APIs

## Common Development Commands

### Development
```bash
# Start development server with turbopack
npm run dev

# Start full development environment (Convex + Next.js)
npm run dev:full

# Start Convex development server only
npm run convex:dev
```

### Building & Production
```bash
# Build production bundle
npm run build

# Start production server
npm start
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Type checking
npm run type-check

# Complete validation (type-check + lint + unit tests + type tests + stability)
npm run validate
```

### Testing
```bash
# Unit/Integration tests (Vitest)
npm run test              # Watch mode
npm run test:run          # Run once
npm run test:ui           # UI mode
npm run test:coverage     # With coverage
npm run test:watch        # Watch mode (explicit)

# E2E tests (Playwright)
npm run test:e2e          # Headless
npm run test:e2e:ui       # Interactive UI
npm run test:e2e:headed   # With browser visible
npm run test:e2e:debug    # Debug mode
npm run test:e2e:report   # View test report

# Specific test suites
npm run test:auth         # Authentication tests
npm run test:theme        # Theme switching tests
npm run test:workflows    # E2E workflow tests
npm run test:regression   # Regression tests
npm run test:types        # Type error tests
npm run test:stability    # Infinite loop prevention tests

# Run all tests
npm run test:all
```

## Code Style Guidelines

### Naming Conventions
- **Components**: PascalCase (e.g., `ClientForm`, `WorkflowEditor`)
- **Files**: kebab-case for pages, PascalCase for components
- **Variables/Functions**: camelCase (e.g., `clientData`, `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Types/Interfaces**: PascalCase (e.g., `ClientData`, `WorkflowStep`)

### File Organization
```
src/
├── app/                  # Next.js app router pages
├── components/          # Reusable React components
│   ├── ui/             # shadcn/ui base components
│   └── __tests__/      # Component tests
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and services
├── contexts/           # React contexts
└── test/               # Test utilities and mocks

convex/                 # Convex backend functions
tests/                  # E2E test files
```

### TypeScript Standards
- Use strict mode (enabled)
- Prefer interfaces over types for object shapes
- Use proper generics for reusable components
- Avoid `any` - use `unknown` when necessary
- Use path aliases (`@/*` for src, `@/convex/*` for convex)

### React/Next.js Standards
- Use App Router (not Pages Router)
- Prefer function components with hooks
- Use TypeScript for all new files
- Follow React Server Components patterns
- Use Suspense boundaries for async operations

### Component Standards
- Export components as default
- Use proper TypeScript props interfaces
- Implement proper error boundaries
- Use Radix UI for accessible primitives
- Follow shadcn/ui patterns for custom components

### Testing Standards (TDD Approach)
1. **Write tests first** before implementing features
2. **Confirm tests fail** initially (red phase)
3. **Implement minimal code** to pass tests (green phase)
4. **Refactor** while keeping tests green
5. Use descriptive test names that explain the behavior
6. Mock external dependencies appropriately
7. Test both happy paths and error cases

### Styling Standards
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use CSS variables for theming
- Avoid inline styles
- Use `cn()` utility for conditional classes

## Development Workflow

### Test-Driven Development Process
1. Write failing test describing the expected behavior
2. Run test to confirm it fails (`npm run test:run`)
3. Write minimal implementation to pass the test
4. Run tests to confirm they pass
5. Refactor code while maintaining test coverage
6. Repeat for each feature increment

### Quality Assurance
Always run before committing:
```bash
npm run validate  # Runs type-check + lint + tests + stability checks
```

### Git Workflow
- Use conventional commit messages
- Run validation before pushing
- Create feature branches for new development
- Write descriptive commit messages

## Environment Setup

### Required Environment Variables
Check `env.example` for the complete list. Key variables include:
- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOY_KEY`
- AWS credentials for S3/SES/SNS
- OAuth credentials for social platforms
- Stripe keys for payments

### Development Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Copy `env.example` to `.env.local`
4. Set up Convex: `npm run convex:dev`
5. Start development: `npm run dev:full`

## Deployment Process

### EC2 Deployment (Planned)
- Target platform: AWS EC2
- Build process: `npm run build`
- Process manager: PM2 (recommended)
- Reverse proxy: Nginx
- SSL: Let's Encrypt

### Pre-deployment Checklist
1. Run full validation: `npm run validate`
2. Run all E2E tests: `npm run test:e2e`
3. Check environment variables are set
4. Ensure Convex deployment is updated
5. Verify AWS services are configured

## MCP Servers Configuration
- **Playwright MCP**: Configured for browser automation and E2E testing
- Browser: Chromium (headless by default)
- Timeout: 120 seconds

## Debugging & Development Tools

### Available Debug Pages
- `/debug` - General debugging tools
- `/debug/oauth` - OAuth integration testing
- `/debug/google-calendar` - Google Calendar API testing
- `/debug-workflow` - Workflow system debugging
- `/test-execution-logs` - Workflow execution monitoring

### Useful Development Commands
```bash
# Check environment setup
npm run test:types

# Monitor workflow executions
# Visit /test-execution-logs in browser

# Test OAuth integrations
# Visit /debug/oauth in browser
```

## Repository Etiquette
- Keep commits focused and atomic
- Use descriptive commit messages
- Run validation before pushing
- Review your own PR before requesting review
- Update tests when changing functionality
- Document complex business logic
- Keep dependencies up to date

## Performance Guidelines
- Use React Server Components when possible
- Implement proper loading states
- Optimize images and assets
- Use Convex subscriptions efficiently
- Implement proper error boundaries
- Monitor bundle size with Next.js analyzer

## Security Best Practices
- Never commit secrets or API keys
- Use environment variables for sensitive data
- Validate all user inputs
- Implement proper authentication checks
- Use HTTPS in production
- Sanitize data before database operations
- Follow OWASP security guidelines

## Core Functionality & Design Context

### Project Origin & Vision
Originally conceived as a competitor tracking system for aesthetic businesses, Honey Rae has evolved into a comprehensive business management platform. The initial vision included:
- Track local competitor pricing and services
- Monitor keyword usage and SEO strategies  
- Detect website changes (before/after photos, promotions)
- Compare promotion timelines
- Generate AI-powered counter-marketing strategies

### Multi-Tenant Architecture
**Organizational Hierarchy**: Org → Admins, Injectors, Staff
Each organization manages:
- Client base with full profiles and history
- File storage (20-50 images per client average)
- Workflow automation rules
- Message templates and communication logs
- Social media content queue
- Billing plans and usage tracking
- Team permissions and access control

### Core Data Model
**Client Import Specification** - Based on Aesthetic Record CSV exports:
- Demographics: ID, First/Last Name, Email, Phone 1/2, Gender, DOB
- Location: Address 1/2, City, State, Country, Zip
- Business Data: Visited, Membership Type, Referral Source, Created Date
- Status: Portal Status, Upcoming Appointment, Nickname, Fired status

### File Management Strategy
**AWS S3 Storage Architecture**:
- Cost-effective: ~$3/month per 100GB vs Convex at ~$30/month
- Structure: `org-id/client-id/image.jpg`
- Metadata: File name, upload date, treatment tags, session ID
- Features: Crop before upload, thumbnail preview, group tagging, compression
- Future: HIPAA compliance toggle, privacy settings

### Workflow Automation Engine
**Triggers**: Client created, No visit in X days, Birthday, Photo uploaded, Tag applied, Form submitted, Appointment missed
**Actions**: Send Email/SMS, Tag Client, Add timeline note, Notify Admin, Trigger Webhook
**Examples**:
- "Send Botox aftercare email 1 day after photo upload with 'botox' tag"
- "If client hasn't booked in 90 days, send re-engagement SMS"
- "Trigger birthday discount email 7 days before DOB"
**Planned**: Zapier-style drag & drop builder, workflow templates, AI suggestions

### Cost Structure & Billing
**Service Costs**:
- S3 Storage: ~$1.61/month for 70GB
- AWS SNS (SMS): ~$0.0075/message ($20-40/month for 20k messages)  
- AWS SES (Email): ~$0.10 per 1000 emails ($3/month for 30k emails)
**Stripe Integration**: Tiered pricing (Starter/Pro/Agency) with metered usage on storage, SMS, and workflow executions

### Advanced Features Pipeline
**AI Integration Roadmap**:
- Smart caption generation for social media
- Before/after image comparison and analysis
- Workflow generation suggestions based on patterns
- Churn prediction using visit gap analysis
- Dynamic re-engagement message generation
- Competitor analysis summarization
- Automated image tagging with AI models

**Calendar & Journey Tracking**:
- Google Calendar sync per user/organization
- Client Journey View: appointment history, uploaded files, sent messages, workflow triggers
- Timeline visualization with treatment progression

**Social Media Management**:
- Multi-platform scheduling (Instagram, Facebook, TikTok planned)
- Image cropping per platform specifications
- Caption templates with emoji and hashtag support
- Campaign management (seasonal promotions)

**Patient Portal & Access**:
- QR-based login system with 15-minute expiration
- Magic link fallback authentication
- Client features: view images, treatment history, appointments, reviews
- Consent form upload/download functionality

**Analytics Dashboard**:
- Per-org and global metrics
- Key metrics: client count, churn rate, workflow actions, messages sent, storage usage
- Campaign performance tracking

**Additional Planned Features**:
- Smart Recapture Engine for client retention
- Referral tracking and reward systems
- Dynamic intake form builder
- HIPAA compliance toggle
- Countdown timers for promotions
- Image annotation tools
- AI weekly performance summaries
- Multilingual template support

### Development Philosophy
**Scalability First**: Architecture designed to handle 5000+ clients with 50+ images each (~250,000 images total)
**Cost Optimization**: Strategic use of AWS services vs Convex for different data types
**Automation Focus**: Reduce manual administrative tasks through intelligent workflows
**Integration Ready**: Built for future AI enhancements and third-party service connections

This context ensures all future development aligns with the original vision while supporting the comprehensive feature set planned for aesthetic business management.
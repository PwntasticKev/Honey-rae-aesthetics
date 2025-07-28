# Honey Rae Aesthetics - Setup Guide

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment example file and configure your variables:

```bash
cp env.example .env.local
```

### 2. Required Environment Variables

#### **Essential for Local Development:**

```bash
# Convex (Required)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment-name.convex.cloud

# NextAuth (Required)
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3001

# AWS (Required for file storage and messaging)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=honey-rae-files
```

#### **Optional for Enhanced Features:**

```bash
# Email/SMS (Optional - for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Stripe (Optional - for payments)
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Google Calendar (Optional - for appointment sync)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Convex Setup

1. **Create Convex Account**: Sign up at [convex.dev](https://convex.dev)
2. **Create New Project**: Follow the setup wizard
3. **Get Deployment URL**: Copy your deployment URL to `NEXT_PUBLIC_CONVEX_URL`
4. **Deploy Schema**: Run `npx convex dev` to deploy your schema

### 4. AWS Setup (for file storage and messaging)

1. **Create AWS Account**: Sign up at [aws.amazon.com](https://aws.amazon.com)
2. **Create IAM User**: 
   - Go to IAM → Users → Create User
   - Attach policies: `AmazonS3FullAccess`, `AmazonSNSFullAccess`, `AmazonSESFullAccess`
3. **Get Credentials**: Copy Access Key ID and Secret Access Key
4. **Create S3 Bucket**: Create a bucket named `honey-rae-files`
5. **Configure SES**: Verify your email domain for sending emails

### 5. Install Dependencies

```bash
npm install
```

### 6. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3001`

## 🧪 Testing Features

### Workflow Editor
- Navigate to: `http://localhost:3001/workflow-editor`
- Create workflows with drag-and-drop
- Test workflows with actual email/SMS sending
- Configure delays, conditions, and actions

### Test Page
- Navigate to: `http://localhost:3001/test`
- View clients, appointments, and workflows
- Test execution logs and enrollment history

## 📁 Project Structure

```
app/
├── src/
│   ├── app/                    # Next.js pages
│   ├── components/             # React components
│   ├── convex/                 # Convex backend functions
│   ├── lib/                    # Utility functions
│   └── hooks/                  # Custom React hooks
├── cypress/                    # End-to-end tests
└── public/                     # Static assets
```

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run Cypress tests
npm run cypress:open

# Build for production
npm run build

# Start production server
npm start
```

## 🐛 Troubleshooting

### Common Issues:

1. **Port 3000 in use**: The app will automatically use the next available port (3001, 3002, etc.)

2. **Convex connection errors**: 
   - Verify `NEXT_PUBLIC_CONVEX_URL` is correct
   - Run `npx convex dev` to deploy schema

3. **AWS errors**:
   - Verify AWS credentials are correct
   - Check S3 bucket permissions
   - Ensure SES is configured for your region

4. **Email/SMS not sending**:
   - Check console for error messages
   - Verify email/SMS credentials
   - Check rate limits

## 📝 Environment Variables Reference

See `env.example` for a complete list of all available environment variables with descriptions.

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The app is compatible with any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Check the Cypress tests for expected behavior
4. Create an issue in the repository 
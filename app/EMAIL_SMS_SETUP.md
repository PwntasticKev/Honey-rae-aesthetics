# 📧 Email & SMS Setup Guide

## 🆓 Free Email Services

### 1. Resend (Recommended - Easiest Setup)

- **Free tier**: 3,000 emails/month
- **Setup**:
  1. Go to [resend.com](https://resend.com)
  2. Sign up for free account
  3. Get your API key from dashboard
  4. Add to `.env.local`: `RESEND_API_KEY=re_xxxxx`

### 2. SendGrid

- **Free tier**: 100 emails/day
- **Setup**:
  1. Go to [sendgrid.com](https://sendgrid.com)
  2. Create free account
  3. Get API key from dashboard
  4. Add to `.env.local`: `SENDGRID_API_KEY=SG.xxxxx`

### 3. Mailgun

- **Free tier**: 5,000 emails/month
- **Setup**:
  1. Go to [mailgun.com](https://mailgun.com)
  2. Create free account
  3. Get API key from dashboard
  4. Add to `.env.local`: `MAILGUN_API_KEY=key-xxxxx`

## 📱 Free SMS Services

### 1. Twilio (Recommended)

- **Free tier**: $15-20 credit for trial
- **Setup**:
  1. Go to [twilio.com](https://twilio.com)
  2. Create free account
  3. Get Account SID and Auth Token
  4. Add to `.env.local`:
     ```
     TWILIO_ACCOUNT_SID=ACxxxxx
     TWILIO_AUTH_TOKEN=xxxxx
     TWILIO_PHONE_NUMBER=+1234567890
     ```

### 2. Vonage

- **Free tier**: Trial period
- **Setup**:
  1. Go to [vonage.com](https://vonage.com)
  2. Create free account
  3. Get API key and secret
  4. Add to `.env.local`:
     ```
     VONAGE_API_KEY=xxxxx
     VONAGE_API_SECRET=xxxxx
     VONAGE_PHONE_NUMBER=+1234567890
     ```

## 🚀 Quick Start with Resend

1. **Sign up**: [resend.com](https://resend.com)
2. **Get API key**: Copy from dashboard
3. **Add to `.env.local`**:
   ```bash
   RESEND_API_KEY=re_xxxxx
   ```
4. **Test**: Your workflow emails will now send for real!

## 🔧 Current Implementation

The app currently supports:

- ✅ **Resend** for emails (configured)
- ✅ **Mock SMS** (logs to console)
- 🔄 **Twilio** for SMS (ready to add)

## 📝 Next Steps

1. **For Email**: Just add your Resend API key to `.env.local`
2. **For SMS**: Choose Twilio or Vonage and I'll help you implement it
3. **Test**: Create a workflow with email/SMS nodes and test it!

## 💡 Tips

- **Resend** is the easiest to set up
- **Twilio** is the most reliable for SMS
- All services have generous free tiers
- You can switch between services easily

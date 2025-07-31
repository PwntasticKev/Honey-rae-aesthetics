import { mutation } from "./_generated/server";

export const setupDemo = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Create demo organization
    const orgId = await ctx.db.insert("orgs", {
      name: "Honey Rae Aesthetics Demo",
      logo: "",
      domain: "demo.honeyrae.com",
      qrKey: "demo-qr-key",
      limits: {
        clients: 1000,
        storage_gb: 100,
        messages_per_month: 10000,
      },
      createdAt: now,
      updatedAt: now,
    });

    // Create demo user
    const userId = await ctx.db.insert("users", {
      orgId,
      name: "Kevin Rae",
      email: "kevin@honeyrae.com",
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });

    // Create demo clients
    const client1Id = await ctx.db.insert("clients", {
      orgId,
      fullName: "Sarah Johnson",
      gender: "female",
      dateOfBirth: "1985-03-15",
      phones: ["(555) 123-4567"],
      email: "sarah.johnson@email.com",
      tags: ["Botox", "VIP"],
      referralSource: "Social Media",
      clientPortalStatus: "active",
      createdAt: now,
      updatedAt: now,
    });

    const client2Id = await ctx.db.insert("clients", {
      orgId,
      fullName: "Michael Chen",
      gender: "male",
      dateOfBirth: "1990-07-22",
      phones: ["(555) 987-6543"],
      email: "michael.chen@email.com",
      tags: ["Filler", "New Client"],
      referralSource: "Referral",
      clientPortalStatus: "active",
      createdAt: now,
      updatedAt: now,
    });

    const client3Id = await ctx.db.insert("clients", {
      orgId,
      fullName: "Emily Rodriguez",
      gender: "female",
      dateOfBirth: "1988-11-08",
      phones: ["(555) 456-7890", "(555) 789-0123"],
      email: "emily.rodriguez@email.com",
      tags: ["Laser", "Returning"],
      referralSource: "Walk-in",
      clientPortalStatus: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Create demo appointments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(14, 30, 0, 0);

    await ctx.db.insert("appointments", {
      orgId,
      clientId: client1Id,
      dateTime: tomorrow.getTime(),
      type: "Botox Treatment",
      provider: "Dr. Kevin Rae",
      notes: "Follow-up appointment for forehead lines",
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("appointments", {
      orgId,
      clientId: client2Id,
      dateTime: nextWeek.getTime(),
      type: "Consultation",
      provider: "Dr. Kevin Rae",
      notes: "Initial consultation for filler treatment",
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    });

    // Create demo message templates
    await ctx.db.insert("messageTemplates", {
      orgId,
      name: "Appointment Reminder",
      type: "sms",
      content:
        "Hi {{first_name}}, this is a reminder for your appointment tomorrow at {{appointment_time}}. Please arrive 10 minutes early. Call us if you need to reschedule.",
      mergeTags: ["{{first_name}}", "{{appointment_time}}"],
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("messageTemplates", {
      orgId,
      name: "Follow-up Email",
      type: "email",
      subject: "How was your treatment?",
      content:
        "Dear {{first_name}},\n\nWe hope you're enjoying the results of your recent treatment. Please let us know if you have any questions or concerns.\n\nBest regards,\nHoney Rae Aesthetics Team",
      mergeTags: ["{{first_name}}"],
      createdAt: now,
      updatedAt: now,
    });

    // Create additional message templates
    await ctx.db.insert("messageTemplates", {
      orgId,
      name: "Promotional SMS",
      type: "sms",
      content:
        "Hi {{first_name}}! 🎉 Special offer just for you: 20% off Botox treatments this month. Book now: (555) 123-4567",
      mergeTags: ["{{first_name}}"],
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("messageTemplates", {
      orgId,
      name: "Newsletter Email",
      type: "email",
      subject: "Latest Beauty Trends - {{today}}",
      content:
        "Hello {{first_name}},\n\nCheck out our latest beauty tips and special offers!\n\n- New Morpheus8 treatments available\n- Summer skincare guide\n- Member-exclusive discounts\n\nVisit our website for more details.\n\nBest regards,\nHoney Rae Aesthetics",
      mergeTags: ["{{first_name}}", "{{today}}"],
      createdAt: now,
      updatedAt: now,
    });

    // Create AWS configuration
    await ctx.db.insert("awsConfig", {
      orgId,
      region: "us-east-1",
      sesAccessKey: "demo-access-key",
      sesSecretKey: "demo-secret-key",
      snsAccessKey: "demo-sns-access-key",
      snsSecretKey: "demo-sns-secret-key",
      fromEmail: "noreply@honeyrae.com",
      fromPhone: "+15551234567",
      isConfigured: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create demo workflows
    await ctx.db.insert("workflows", {
      orgId,
      name: "New Client Welcome",
      description:
        "Automatically welcome new clients with a series of messages",
      trigger: "new_client",
      conditions: [],
      actions: [
        {
          type: "send_sms",
          config: {
            templateId: "welcome_sms",
            delay: 0,
          },
          order: 1,
        },
        {
          type: "delay",
          config: {
            hours: 24,
          },
          order: 2,
        },
        {
          type: "send_email",
          config: {
            templateId: "welcome_email",
          },
          order: 3,
        },
      ],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      orgId,
      userId,
      message: "Demo data created successfully!",
    };
  },
});

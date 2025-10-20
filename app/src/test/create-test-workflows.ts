// Quick script to create test workflows in the database
import { db } from "../lib/db";
import { workflows, workflowDirectories } from "../db/schema";

export async function createTestWorkflows() {
  console.log('🧪 Creating test workflows...\n');
  
  try {
    // Create test directories first
    console.log('Creating test directories...');
    
    const dir1 = await db.insert(workflowDirectories).values({
      orgId: 1,
      name: "Marketing Automation",
      description: "Automated marketing workflows",
      color: "#3b82f6",
      createdBy: 1
    });
    
    const dir2 = await db.insert(workflowDirectories).values({
      orgId: 1,
      name: "Client Follow-ups",
      description: "Post-appointment follow-up workflows",
      color: "#10b981",
      createdBy: 1
    });
    
    console.log('✅ Created test directories');
    
    // Create test workflows
    console.log('Creating test workflows...');
    
    const workflow1 = await db.insert(workflows).values({
      orgId: 1,
      name: "Google Review Request",
      description: "Send a Google review request 15 minutes after appointment completion",
      trigger: "appointment_completed",
      enabled: true,
      steps: [
        {
          id: "1",
          type: "delay",
          config: { delayMinutes: 15 }
        },
        {
          id: "2", 
          type: "send_message",
          config: {
            channel: "sms",
            message: "Hi {{first_name}}, thank you for your appointment today! We'd love if you could leave us a Google review. It really helps our practice grow. Thank you!"
          }
        }
      ],
      directoryId: Number(dir1.insertId),
      createdBy: 1
    });
    
    const workflow2 = await db.insert(workflows).values({
      orgId: 1,
      name: "New Client Welcome",
      description: "Welcome new clients with a series of messages",
      trigger: "client_added",
      enabled: true,
      steps: [
        {
          id: "1",
          type: "send_message", 
          config: {
            channel: "sms",
            message: "Welcome {{first_name}}! Thank you for choosing Honey Rae Aesthetics. We're excited to help you on your beauty journey!"
          }
        },
        {
          id: "2",
          type: "delay",
          config: { delayMinutes: 60 }
        },
        {
          id: "3",
          type: "send_message",
          config: {
            channel: "email",
            message: "Hi {{first_name}}, here's your welcome packet with everything you need to know about your upcoming appointment."
          }
        }
      ],
      directoryId: Number(dir2.insertId),
      createdBy: 1
    });
    
    const workflow3 = await db.insert(workflows).values({
      orgId: 1,
      name: "Appointment Reminder",
      description: "Send appointment reminders 24 hours before",
      trigger: "appointment_scheduled",
      enabled: false,
      steps: [
        {
          id: "1",
          type: "send_message",
          config: {
            channel: "sms", 
            message: "Hi {{first_name}}! This is a reminder that you have an appointment tomorrow at {{appointment_time}}. See you soon!"
          }
        }
      ],
      createdBy: 1
    });
    
    console.log('✅ Created test workflows');
    console.log('🎉 Test data created successfully!');
    
    return {
      directories: 2,
      workflows: 3
    };
    
  } catch (error) {
    console.error('❌ Failed to create test workflows:', error);
    throw error;
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  createTestWorkflows()
    .then((result) => {
      console.log(`\n📊 Created ${result.directories} directories and ${result.workflows} workflows`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Failed to create test workflows:', error);
      process.exit(1);
    });
}
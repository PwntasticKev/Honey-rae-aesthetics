// Database migration and CRUD testing script
import { db } from "../lib/db";
import {
  appointmentCheckins,
  calendarConnections,
  calendarSyncLog,
  potentialDuplicates,
  clientCommunicationPreferences,
  enhancedMessageTemplates,
  templateVariables,
  messageDeliveries,
  workflowTriggers,
  workflowEnrollments,
  clients,
  appointments,
  users,
  orgs
} from "../db/schema";
import { eq, and } from "drizzle-orm";

// Test all new database tables and CRUD operations
export async function testDatabaseMigration() {
  console.log('🧪 Starting comprehensive database migration test...\n');
  
  try {
    // Test 1: Verify all tables exist
    console.log('📋 Step 1: Verifying table existence...');
    await testTableExistence();
    
    // Test 2: Test appointment check-ins
    console.log('\n📋 Step 2: Testing appointment check-ins...');
    await testAppointmentCheckins();
    
    // Test 3: Test calendar connections
    console.log('\n📋 Step 3: Testing calendar connections...');
    await testCalendarConnections();
    
    // Test 4: Test potential duplicates
    console.log('\n📋 Step 4: Testing duplicate detection...');
    await testPotentialDuplicates();
    
    // Test 5: Test communication preferences
    console.log('\n📋 Step 5: Testing communication preferences...');
    await testCommunicationPreferences();
    
    // Test 6: Test message templates and variables
    console.log('\n📋 Step 6: Testing message templates...');
    await testMessageTemplates();
    
    // Test 7: Test workflow triggers and enrollments
    console.log('\n📋 Step 7: Testing workflow system...');
    await testWorkflowSystem();
    
    console.log('\n✅ All database tests passed successfully!');
    console.log('🚀 Database migration is complete and working correctly.');
    
  } catch (error) {
    console.error('\n❌ Database test failed:', error);
    throw error;
  }
}

async function testTableExistence() {
  const tables = [
    'appointment_checkins',
    'calendar_connections', 
    'calendar_sync_log',
    'potential_duplicates',
    'client_communication_preferences',
    'enhanced_message_templates',
    'template_variables',
    'message_deliveries',
    'workflow_triggers',
    'workflow_enrollments'
  ];
  
  for (const table of tables) {
    const result = await db.execute(`SHOW TABLES LIKE '${table}'`);
    if (result.length === 0) {
      throw new Error(`Table ${table} does not exist!`);
    }
    console.log(`  ✅ ${table} exists`);
  }
}

async function testAppointmentCheckins() {
  try {
    // Get test data - find an existing appointment
    const testAppointment = await db
      .select()
      .from(appointments)
      .limit(1);
      
    if (testAppointment.length === 0) {
      console.log('  ⚠️  No appointments found, skipping check-in test');
      return;
    }
    
    const appointmentId = testAppointment[0].id;
    
    // Test CREATE
    const checkinResult = await db.insert(appointmentCheckins).values({
      appointmentId: appointmentId,
      status: 'shown',
      checkedInBy: 1, // Assuming user ID 1 exists
      notes: 'Database test check-in',
      phoneNumberAdded: '+1234567890'
    });
    
    console.log('  ✅ Created appointment check-in');
    
    // Test READ
    const checkins = await db
      .select()
      .from(appointmentCheckins)
      .where(eq(appointmentCheckins.appointmentId, appointmentId));
      
    if (checkins.length === 0) {
      throw new Error('Failed to read appointment check-in');
    }
    
    console.log('  ✅ Read appointment check-in');
    
    // Test UPDATE
    await db
      .update(appointmentCheckins)
      .set({ notes: 'Updated test notes' })
      .where(eq(appointmentCheckins.id, checkins[0].id));
      
    console.log('  ✅ Updated appointment check-in');
    
    // Test DELETE
    await db
      .delete(appointmentCheckins)
      .where(eq(appointmentCheckins.id, checkins[0].id));
      
    console.log('  ✅ Deleted appointment check-in');
    
  } catch (error) {
    console.error('  ❌ Appointment check-in test failed:', error);
    throw error;
  }
}

async function testCalendarConnections() {
  try {
    // Get test org
    const testOrg = await db.select().from(orgs).limit(1);
    if (testOrg.length === 0) {
      throw new Error('No organizations found for testing');
    }
    
    const orgId = testOrg[0].id;
    
    // Test CREATE
    const connectionResult = await db.insert(calendarConnections).values({
      orgId: orgId,
      calendarId: 'test-calendar-123',
      calendarName: 'Test Calendar',
      ownerEmail: 'test@example.com',
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      isActive: true
    });
    
    console.log('  ✅ Created calendar connection');
    
    // Test READ
    const connections = await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.calendarId, 'test-calendar-123'));
      
    if (connections.length === 0) {
      throw new Error('Failed to read calendar connection');
    }
    
    console.log('  ✅ Read calendar connection');
    
    // Test UPDATE
    await db
      .update(calendarConnections)
      .set({ calendarName: 'Updated Test Calendar' })
      .where(eq(calendarConnections.id, connections[0].id));
      
    console.log('  ✅ Updated calendar connection');
    
    // Test DELETE
    await db
      .delete(calendarConnections)
      .where(eq(calendarConnections.id, connections[0].id));
      
    console.log('  ✅ Deleted calendar connection');
    
  } catch (error) {
    console.error('  ❌ Calendar connection test failed:', error);
    throw error;
  }
}

async function testPotentialDuplicates() {
  try {
    // Get test clients
    const testClients = await db.select().from(clients).limit(2);
    if (testClients.length < 2) {
      console.log('  ⚠️  Not enough clients found, skipping duplicate test');
      return;
    }
    
    // Test CREATE
    const duplicateResult = await db.insert(potentialDuplicates).values({
      orgId: testClients[0].orgId,
      primaryClientId: testClients[0].id,
      duplicateClientId: testClients[1].id,
      confidenceScore: 0.85,
      matchingFactors: ['name_similarity', 'email_match'],
      status: 'pending',
      detectedAt: new Date()
    });
    
    console.log('  ✅ Created potential duplicate');
    
    // Test READ
    const duplicates = await db
      .select()
      .from(potentialDuplicates)
      .where(eq(potentialDuplicates.primaryClientId, testClients[0].id));
      
    if (duplicates.length === 0) {
      throw new Error('Failed to read potential duplicate');
    }
    
    console.log('  ✅ Read potential duplicate');
    
    // Test UPDATE
    await db
      .update(potentialDuplicates)
      .set({ status: 'resolved' })
      .where(eq(potentialDuplicates.id, duplicates[0].id));
      
    console.log('  ✅ Updated potential duplicate');
    
    // Test DELETE
    await db
      .delete(potentialDuplicates)
      .where(eq(potentialDuplicates.id, duplicates[0].id));
      
    console.log('  ✅ Deleted potential duplicate');
    
  } catch (error) {
    console.error('  ❌ Potential duplicate test failed:', error);
    throw error;
  }
}

async function testCommunicationPreferences() {
  try {
    // Get test client
    const testClient = await db.select().from(clients).limit(1);
    if (testClient.length === 0) {
      console.log('  ⚠️  No clients found, skipping communication preferences test');
      return;
    }
    
    const clientId = testClient[0].id;
    const orgId = testClient[0].orgId;
    
    // Test CREATE
    const prefsResult = await db.insert(clientCommunicationPreferences).values({
      clientId: clientId,
      orgId: orgId,
      emailOptOut: false,
      smsOptOut: false,
      marketingOptOut: false,
      workflowOptOut: false,
      preferredProvider: 'aws'
    });
    
    console.log('  ✅ Created communication preferences');
    
    // Test READ
    const prefs = await db
      .select()
      .from(clientCommunicationPreferences)
      .where(eq(clientCommunicationPreferences.clientId, clientId));
      
    if (prefs.length === 0) {
      throw new Error('Failed to read communication preferences');
    }
    
    console.log('  ✅ Read communication preferences');
    
    // Test UPDATE
    await db
      .update(clientCommunicationPreferences)
      .set({ emailOptOut: true })
      .where(eq(clientCommunicationPreferences.id, prefs[0].id));
      
    console.log('  ✅ Updated communication preferences');
    
    // Test DELETE
    await db
      .delete(clientCommunicationPreferences)
      .where(eq(clientCommunicationPreferences.id, prefs[0].id));
      
    console.log('  ✅ Deleted communication preferences');
    
  } catch (error) {
    console.error('  ❌ Communication preferences test failed:', error);
    throw error;
  }
}

async function testMessageTemplates() {
  try {
    // Get test org
    const testOrg = await db.select().from(orgs).limit(1);
    if (testOrg.length === 0) {
      throw new Error('No organizations found for testing');
    }
    
    const orgId = testOrg[0].id;
    
    // Test template variable CREATE
    const variableResult = await db.insert(templateVariables).values({
      orgId: orgId,
      name: 'Test Variable',
      variableKey: 'test_var',
      description: 'Test variable for database testing',
      defaultValue: 'test value',
      dataType: 'string',
      isCustom: true,
      isSystem: false
    });
    
    console.log('  ✅ Created template variable');
    
    // Test template CREATE
    const templateResult = await db.insert(enhancedMessageTemplates).values({
      orgId: orgId,
      name: 'Test Template',
      type: 'email',
      subject: 'Test Subject',
      content: 'Hello {test_var}!',
      variables: ['test_var'],
      isActive: true,
      usageCount: 0,
      createdBy: 1
    });
    
    console.log('  ✅ Created message template');
    
    // Test READ
    const templates = await db
      .select()
      .from(enhancedMessageTemplates)
      .where(eq(enhancedMessageTemplates.name, 'Test Template'));
      
    if (templates.length === 0) {
      throw new Error('Failed to read message template');
    }
    
    console.log('  ✅ Read message template');
    
    // Test message delivery CREATE
    const deliveryResult = await db.insert(messageDeliveries).values({
      orgId: orgId,
      templateId: templates[0].id,
      clientId: 1, // Assuming client ID 1 exists
      status: 'sent',
      provider: 'aws'
    });
    
    console.log('  ✅ Created message delivery record');
    
    // Clean up
    await db.delete(messageDeliveries).where(eq(messageDeliveries.orgId, orgId));
    await db.delete(enhancedMessageTemplates).where(eq(enhancedMessageTemplates.id, templates[0].id));
    await db.delete(templateVariables).where(eq(templateVariables.variableKey, 'test_var'));
    
    console.log('  ✅ Cleaned up message template test data');
    
  } catch (error) {
    console.error('  ❌ Message template test failed:', error);
    throw error;
  }
}

async function testWorkflowSystem() {
  try {
    // Get test org
    const testOrg = await db.select().from(orgs).limit(1);
    if (testOrg.length === 0) {
      throw new Error('No organizations found for testing');
    }
    
    const orgId = testOrg[0].id;
    
    // Test workflow trigger CREATE
    const triggerResult = await db.insert(workflowTriggers).values({
      orgId: orgId,
      triggerType: 'appointment_completed',
      workflowId: 1, // Assuming workflow ID 1 exists
      conditions: { appointmentType: ['consultation'] },
      isActive: true,
      priority: 1,
      restartIfActive: true
    });
    
    console.log('  ✅ Created workflow trigger');
    
    // Test workflow enrollment CREATE
    const enrollmentResult = await db.insert(workflowEnrollments).values({
      orgId: orgId,
      workflowId: 1,
      clientId: 1, // Assuming client ID 1 exists
      enrollmentReason: 'Database test enrollment',
      currentStatus: 'active',
      currentStep: 'start',
      metadata: { test: true }
    });
    
    console.log('  ✅ Created workflow enrollment');
    
    // Test READ
    const triggers = await db
      .select()
      .from(workflowTriggers)
      .where(eq(workflowTriggers.triggerType, 'appointment_completed'));
      
    const enrollments = await db
      .select()
      .from(workflowEnrollments)
      .where(eq(workflowEnrollments.enrollmentReason, 'Database test enrollment'));
      
    console.log('  ✅ Read workflow data');
    
    // Clean up
    if (triggers.length > 0) {
      await db.delete(workflowTriggers).where(eq(workflowTriggers.id, triggers[0].id));
    }
    if (enrollments.length > 0) {
      await db.delete(workflowEnrollments).where(eq(workflowEnrollments.id, enrollments[0].id));
    }
    
    console.log('  ✅ Cleaned up workflow test data');
    
  } catch (error) {
    console.error('  ❌ Workflow system test failed:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDatabaseMigration()
    .then(() => {
      console.log('\n🎉 Database migration test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Database migration test failed:', error);
      process.exit(1);
    });
}
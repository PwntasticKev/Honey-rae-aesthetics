// Simple database connection and table verification test
import mysql from "mysql2/promise";

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection and table existence...\n');
  
  const connectionConfig = {
    host: '127.0.0.1',
    user: 'honeyrae',
    password: 'honeyrae',
    database: 'honey_rae'
  };
  
  let connection: mysql.Connection | null = null;
  
  try {
    // Test connection
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Database connection successful');
    
    // Test all new tables exist
    const newTables = [
      'appointment_checkins',
      'appointment_sync_status',
      'calendar_connections', 
      'calendar_sync_log',
      'potential_duplicates',
      'client_communication_preferences',
      'enhanced_message_templates',
      'template_variables',
      'message_campaigns',
      'message_deliveries',
      'workflow_triggers',
      'workflow_enrollments_history',
      'saved_client_filters',
      'org_time_zones'
    ];
    
    console.log('\n📋 Checking new table existence:');
    
    for (const table of newTables) {
      const [rows] = await connection.execute(`SHOW TABLES LIKE '${table}'`);
      if (Array.isArray(rows) && rows.length > 0) {
        console.log(`  ✅ ${table} exists`);
      } else {
        console.log(`  ❌ ${table} MISSING`);
      }
    }
    
    // Test basic CRUD operations on key tables
    console.log('\n🧪 Testing basic database operations:');
    
    // Test appointment_checkins
    await testAppointmentCheckins(connection);
    
    // Test calendar_connections  
    await testCalendarConnections(connection);
    
    // Test message templates
    await testMessageTemplates(connection);
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Database test failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function testAppointmentCheckins(connection: mysql.Connection) {
  try {
    // Check if we have test data
    const [appointments] = await connection.execute('SELECT id FROM appointments LIMIT 1');
    if (!Array.isArray(appointments) || appointments.length === 0) {
      console.log('  ⚠️  No appointments found, skipping check-in test');
      return;
    }
    
    const appointmentId = (appointments[0] as any).id;
    
    // Test INSERT
    const [insertResult] = await connection.execute(
      `INSERT INTO appointment_checkins (appointment_id, status, notes) VALUES (?, ?, ?)`,
      [appointmentId, 'shown', 'Database test check-in']
    );
    
    const checkinId = (insertResult as any).insertId;
    console.log('  ✅ appointment_checkins INSERT successful');
    
    // Test SELECT
    const [selectResult] = await connection.execute(
      'SELECT * FROM appointment_checkins WHERE id = ?',
      [checkinId]
    );
    
    if (Array.isArray(selectResult) && selectResult.length > 0) {
      console.log('  ✅ appointment_checkins SELECT successful');
    } else {
      throw new Error('appointment_checkins SELECT failed');
    }
    
    // Test UPDATE
    await connection.execute(
      'UPDATE appointment_checkins SET notes = ? WHERE id = ?',
      ['Updated test notes', checkinId]
    );
    console.log('  ✅ appointment_checkins UPDATE successful');
    
    // Test DELETE
    await connection.execute(
      'DELETE FROM appointment_checkins WHERE id = ?',
      [checkinId]
    );
    console.log('  ✅ appointment_checkins DELETE successful');
    
  } catch (error) {
    console.error('  ❌ appointment_checkins test failed:', error);
    throw error;
  }
}

async function testCalendarConnections(connection: mysql.Connection) {
  try {
    // Check if we have test org
    const [orgs] = await connection.execute('SELECT id FROM orgs LIMIT 1');
    if (!Array.isArray(orgs) || orgs.length === 0) {
      console.log('  ⚠️  No organizations found, skipping calendar connection test');
      return;
    }
    
    const orgId = (orgs[0] as any).id;
    
    // Test INSERT
    const [insertResult] = await connection.execute(
      `INSERT INTO calendar_connections (org_id, calendar_id, calendar_name, owner_email, access_token) 
       VALUES (?, ?, ?, ?, ?)`,
      [orgId, 'test-calendar-123', 'Test Calendar', 'test@example.com', 'test-token']
    );
    
    const connectionId = (insertResult as any).insertId;
    console.log('  ✅ calendar_connections INSERT successful');
    
    // Test SELECT
    const [selectResult] = await connection.execute(
      'SELECT * FROM calendar_connections WHERE id = ?',
      [connectionId]
    );
    
    if (Array.isArray(selectResult) && selectResult.length > 0) {
      console.log('  ✅ calendar_connections SELECT successful');
    } else {
      throw new Error('calendar_connections SELECT failed');
    }
    
    // Clean up
    await connection.execute(
      'DELETE FROM calendar_connections WHERE id = ?',
      [connectionId]
    );
    console.log('  ✅ calendar_connections cleanup successful');
    
  } catch (error) {
    console.error('  ❌ calendar_connections test failed:', error);
    throw error;
  }
}

async function testMessageTemplates(connection: mysql.Connection) {
  try {
    // Check if we have test org
    const [orgs] = await connection.execute('SELECT id FROM orgs LIMIT 1');
    if (!Array.isArray(orgs) || orgs.length === 0) {
      console.log('  ⚠️  No organizations found, skipping message template test');
      return;
    }
    
    const orgId = (orgs[0] as any).id;
    
    // Test template variable INSERT
    const [variableResult] = await connection.execute(
      `INSERT INTO template_variables (org_id, name, variable_key, description, data_type, is_custom, is_system) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orgId, 'Test Variable', 'test_var', 'Test variable', 'string', true, false]
    );
    
    const variableId = (variableResult as any).insertId;
    console.log('  ✅ template_variables INSERT successful');
    
    // Test message template INSERT
    const [templateResult] = await connection.execute(
      `INSERT INTO enhanced_message_templates (org_id, name, type, content, is_active, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orgId, 'Test Template', 'email', 'Hello {test_var}!', true, 1]
    );
    
    const templateId = (templateResult as any).insertId;
    console.log('  ✅ enhanced_message_templates INSERT successful');
    
    // Clean up
    await connection.execute('DELETE FROM enhanced_message_templates WHERE id = ?', [templateId]);
    await connection.execute('DELETE FROM template_variables WHERE id = ?', [variableId]);
    console.log('  ✅ message template cleanup successful');
    
  } catch (error) {
    console.error('  ❌ message template test failed:', error);
    throw error;
  }
}

// Run the test
testDatabaseConnection()
  .then(() => {
    console.log('\n🎉 All database tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Database test failed:', error);
    process.exit(1);
  });
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const backupData = {
      timestamp: new Date().toISOString(),
      entities: {}
    };

    // Backup all entity types
    const entityTypes = ['Artist', 'Product', 'Order', 'LibraryItem', 'LibraryAccessToken'];
    
    for (const entityType of entityTypes) {
      try {
        const records = await base44.asServiceRole.entities[entityType].list('', 10000);
        backupData.entities[entityType] = records;
      } catch (e) {
        console.warn(`Failed to backup ${entityType}:`, e.message);
        backupData.entities[entityType] = [];
      }
    }

    // Create backup file
    const backupJson = JSON.stringify(backupData, null, 2);
    const backupBlob = new Blob([backupJson], { type: 'application/json' });
    
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({
      file: backupBlob
    });

    console.log(`Backup created: ${file_url}`);

    return Response.json({ 
      success: true, 
      backup_url: file_url,
      timestamp: backupData.timestamp,
      entities_backed_up: Object.keys(backupData.entities).length,
      total_records: Object.values(backupData.entities).reduce((sum, arr) => sum + arr.length, 0)
    });
  } catch (error) {
    console.error('Backup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
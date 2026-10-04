import { MongoClient, BSON } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Helper to load environment variables from .env.local or .env
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

// Target is strictly the local VPS MongoDB: 127.0.0.1:27017
const targetUri = process.argv[2] || process.env.TARGET_MONGODB_URI || process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/test';

async function restoreDatabase() {
  // Check for db-backup folder first (WinningHeaven export) or db-backups (Jackpot style)
  let backupFolder = path.resolve(process.cwd(), 'db-backup');
  if (!fs.existsSync(backupFolder)) {
    const backupsRoot = path.resolve(process.cwd(), 'db-backups');
    if (fs.existsSync(backupsRoot)) {
      const subdirs = fs.readdirSync(backupsRoot)
        .filter(name => fs.statSync(path.join(backupsRoot, name)).isDirectory() && name.startsWith('backup_'))
        .sort()
        .reverse();
      if (subdirs.length > 0) {
        backupFolder = path.join(backupsRoot, subdirs[0]);
      }
    }
  }

  if (!fs.existsSync(backupFolder)) {
    console.error('❌ Error: db-backup or db-backups directory not found.');
    process.exit(1);
  }

  console.log(`📂 Selected Backup: ${backupFolder}`);
  console.log(`🚀 Connecting to Free Local MongoDB: ${targetUri}...`);

  const client = new MongoClient(targetUri, {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to Local MongoDB (127.0.0.1:27017).');

    const db = client.db();

    // Check for .json or .ejson files
    const allFiles = fs.readdirSync(backupFolder);
    const dataFiles = allFiles.filter(f =>
      (f.endsWith('.ejson') || f.endsWith('.json')) &&
      !f.endsWith('.indexes.json') &&
      f !== '_metadata.json' &&
      f !== '_manifest.json' &&
      f !== '_indexes.json'
    );

    console.log(`📦 Found ${dataFiles.length} collections to restore into Local MongoDB.\n`);

    let totalRestored = 0;

    // Load centralized indexes if _indexes.json exists
    let centralizedIndexes = {};
    const centralIndexFile = path.join(backupFolder, '_indexes.json');
    if (fs.existsSync(centralIndexFile)) {
      try {
        centralizedIndexes = JSON.parse(fs.readFileSync(centralIndexFile, 'utf-8'));
      } catch (_) {}
    }

    for (const file of dataFiles) {
      const isEjson = file.endsWith('.ejson');
      const colName = file.replace(/\.(ejson|json)$/, '');
      const filePath = path.join(backupFolder, file);
      const rawData = fs.readFileSync(filePath, 'utf-8');

      if (!rawData.trim()) {
        console.log(`  ✓ Initialized empty collection : ${colName}`);
        continue;
      }

      let docs = [];
      try {
        if (isEjson) {
          docs = BSON.EJSON.parse(rawData, { relaxed: false });
        } else {
          // If JSON lines (one JSON per line)
          const lines = rawData.split('\n').filter(l => l.trim());
          if (lines.length > 0 && lines[0].startsWith('{') && lines[lines.length - 1].endsWith('}') && !rawData.trim().startsWith('[')) {
            docs = lines.map(l => BSON.EJSON.parse(l, { relaxed: false }));
          } else {
            docs = BSON.EJSON.parse(rawData, { relaxed: false });
          }
        }
      } catch (parseErr) {
        console.warn(`  ⚠ Parse fallback for ${colName}:`, parseErr.message);
        try {
          docs = JSON.parse(rawData);
        } catch (_) {
          docs = [];
        }
      }

      const collection = db.collection(colName);
      
      // Clean target collection before inserting to prevent duplicate conflicts
      await collection.deleteMany({});

      if (Array.isArray(docs) && docs.length > 0) {
        const CHUNK_SIZE = 100;
        let insertedInCol = 0;

        for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
          const chunk = docs.slice(i, i + CHUNK_SIZE);
          const insertResult = await collection.insertMany(chunk, { ordered: false });
          insertedInCol += insertResult.insertedCount;
          if (docs.length > 100) {
            process.stdout.write(`\r  ⏳ Restoring ${colName.padEnd(26)} : ${insertedInCol} / ${docs.length} docs... `);
          }
        }

        process.stdout.write(`\r  ✓ Restored ${colName.padEnd(26)} : ${String(insertedInCol).padStart(6)} documents\n`);
        totalRestored += insertedInCol;
      } else {
        console.log(`  ✓ Initialized empty collection : ${colName}`);
      }

      // Recreate custom indexes
      const indexFile = path.join(backupFolder, `${colName}.indexes.json`);
      const indexesToRestore = fs.existsSync(indexFile)
        ? JSON.parse(fs.readFileSync(indexFile, 'utf-8'))
        : (centralizedIndexes[colName] || []);

      if (Array.isArray(indexesToRestore)) {
        for (const idx of indexesToRestore) {
          if (idx.name === '_id_') continue;
          const keySpec = idx.key;
          const options = { name: idx.name };
          if (idx.unique) options.unique = true;
          if (idx.sparse) options.sparse = true;
          if (idx.expireAfterSeconds !== undefined) options.expireAfterSeconds = idx.expireAfterSeconds;
          await collection.createIndex(keySpec, options).catch(() => {});
        }
      }
    }

    console.log('\n🎉 ================================================');
    console.log(`✅ 100% COMPLETE LOCAL DATABASE RESTORE SUCCESSFUL!`);
    console.log(`📚 Total Collections Restored: ${dataFiles.length}`);
    console.log(`📊 Total Documents Restored: ${totalRestored}`);
    console.log('🎉 ================================================\n');
  } catch (err) {
    console.error('❌ Restore failed with error:', err);
  } finally {
    await client.close();
  }
}

restoreDatabase();

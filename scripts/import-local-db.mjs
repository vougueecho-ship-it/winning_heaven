import fs from 'fs';
import path from 'path';
import readline from 'readline';
import mongodbPkg from 'mongodb';

const { MongoClient, BSON } = mongodbPkg;
const { EJSON } = BSON;

function getTargetUri() {
  if (process.env.LOCAL_MONGODB_URI) return process.env.LOCAL_MONGODB_URI;
  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('mongodb+srv://')) {
    return process.env.MONGODB_URI;
  }
  return 'mongodb://127.0.0.1:27017/test';
}

async function importLocal() {
  const backupDir = path.resolve(process.cwd(), 'db-backup');
  if (!fs.existsSync(backupDir)) {
    throw new Error('db-backup directory not found! Run "node scripts/export-atlas-db.mjs" first.');
  }

  const manifestPath = path.join(backupDir, '_manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('_manifest.json not found in db-backup directory.');
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const targetUri = getTargetUri();
  console.log(`Connecting to local MongoDB: ${targetUri}...`);

  const client = new MongoClient(targetUri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 15000
  });

  await client.connect();
  console.log('Successfully connected to local MongoDB!');

  const db = client.db();
  const dbName = db.databaseName;
  console.log(`Target database: "${dbName}"`);

  // Load index definitions if available
  let indexDefinitions = {};
  const indexesPath = path.join(backupDir, '_indexes.json');
  if (fs.existsSync(indexesPath)) {
    indexDefinitions = JSON.parse(fs.readFileSync(indexesPath, 'utf8'));
  }

  const results = {};

  for (const [colName, expectedCount] of Object.entries(manifest.summary)) {
    console.log(`\n---------------------------------------------`);
    console.log(`Restoring collection "${colName}" (expected: ${expectedCount})...`);

    const col = db.collection(colName);
    const filePath = path.join(backupDir, `${colName}.json`);

    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}, skipping.`);
      continue;
    }

    // Clear existing data in target collection to avoid duplicate _id conflicts
    await col.deleteMany({});

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let batch = [];
    let insertedCount = 0;
    const BATCH_SIZE = 500;

    for await (const line of rl) {
      if (!line.trim()) continue;
      const doc = EJSON.parse(line, { relaxed: false });
      batch.push(doc);

      if (batch.length >= BATCH_SIZE) {
        await col.insertMany(batch, { ordered: true });
        insertedCount += batch.length;
        batch = [];
        process.stdout.write(`   Restored ${insertedCount}/${expectedCount}...\r`);
      }
    }

    if (batch.length > 0) {
      await col.insertMany(batch, { ordered: true });
      insertedCount += batch.length;
    }

    // Restore indexes for this collection
    if (indexDefinitions[colName] && Array.isArray(indexDefinitions[colName])) {
      for (const idx of indexDefinitions[colName]) {
        try {
          const keys = idx.key;
          const options = {};
          if (idx.unique) options.unique = true;
          if (idx.name) options.name = idx.name;
          if (idx.partialFilterExpression) options.partialFilterExpression = idx.partialFilterExpression;
          if (idx.expireAfterSeconds !== undefined) options.expireAfterSeconds = idx.expireAfterSeconds;
          
          await col.createIndex(keys, options);
        } catch (idxErr) {
          console.warn(`   Index warning for ${colName}:`, idxErr.message);
        }
      }
    }

    const finalCount = await col.countDocuments();
    results[colName] = { expected: expectedCount, restored: finalCount, match: expectedCount === finalCount };
    console.log(`   [DONE] Restored ${finalCount} / ${expectedCount} documents. ${expectedCount === finalCount ? '✅ MATCH' : '⚠️ MISMATCH'}`);
  }

  console.log('\n=============================================');
  console.log('RESTORATION COMPLETED!');
  console.log('Results Summary:');
  console.table(results);
  console.log('=============================================');

  await client.close();
}

importLocal().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});

import fs from 'fs';
import path from 'path';
import mongodbPkg from 'mongodb';
const { MongoClient, BSON } = mongodbPkg;
const { EJSON } = BSON;

// Read .env.local to find MONGODB_URI
function getAtlasUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      if (line.startsWith('MONGODB_URI=')) {
        return line.slice('MONGODB_URI='.length).trim();
      }
    }
  }
  throw new Error('MONGODB_URI not found in environment or .env.local');
}

async function exportAtlas() {
  const uri = getAtlasUri();
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 20000
  });

  await client.connect();
  console.log('Successfully connected to Atlas!');

  const db = client.db();
  const dbName = db.databaseName;
  console.log(`Exporting database: "${dbName}"...`);

  const backupDir = path.resolve(process.cwd(), 'db-backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const collections = await db.listCollections().toArray();
  const indexMetadata = {};
  const summary = {};

  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith('system.')) continue;

    const col = db.collection(colName);
    const count = await col.countDocuments();
    console.log(`-> Exporting collection: ${colName} (${count} documents)...`);

    // Fetch indexes
    try {
      const indexes = await col.indexes();
      indexMetadata[colName] = indexes.filter(idx => idx.name !== '_id_');
    } catch (e) {
      console.warn(`Could not get indexes for ${colName}:`, e.message);
    }

    // Fetch all documents
    const cursor = col.find({});
    const filePath = path.join(backupDir, `${colName}.json`);
    const writeStream = fs.createWriteStream(filePath, { encoding: 'utf8' });

    let exported = 0;
    for await (const doc of cursor) {
      const jsonLine = EJSON.stringify(doc, { relaxed: false }) + '\n';
      writeStream.write(jsonLine);
      exported++;
    }
    await new Promise(resolve => writeStream.end(resolve));

    summary[colName] = exported;
    console.log(`   [DONE] ${colName}: ${exported} documents saved to ${colName}.json`);
  }

  // Save index metadata
  fs.writeFileSync(
    path.join(backupDir, '_indexes.json'),
    JSON.stringify(indexMetadata, null, 2),
    'utf8'
  );

  // Save manifest
  const manifest = {
    databaseName: dbName,
    exportedAt: new Date().toISOString(),
    summary
  };
  fs.writeFileSync(
    path.join(backupDir, '_manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  console.log('\n=============================================');
  console.log('EXPORT COMPLETED SUCCESSFULLY!');
  console.log('Backup directory:', backupDir);
  console.log('Summary:', JSON.stringify(summary, null, 2));
  console.log('=============================================');

  await client.close();
}

exportAtlas().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});

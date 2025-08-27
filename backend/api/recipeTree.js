const { MongoClient } = require('mongodb');
const { createClient } = require('redis');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/gw2';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const mongo = new MongoClient(MONGO_URL);
const redis = createClient({ url: REDIS_URL });

async function init() {
  if (!mongo.topology || !mongo.topology.isConnected()) {
    await mongo.connect();
  }
  if (!redis.isOpen) {
    await redis.connect();
  }
}

async function getRecipeTree(id) {
  await init();
  const cache = await redis.hGet('recipeTrees', String(id));
  if (cache) return JSON.parse(cache);
  const doc = await mongo.db().collection('recipeTrees').findOne({ id: Number(id) }, { projection: { _id: 0 } });
  if (doc) {
    await redis.hSet('recipeTrees', String(id), JSON.stringify(doc));
  }
  return doc;
}

async function handler(req, res) {
  const id = Number((req.params && req.params.id) || req.url.split('/').pop());
  try {
    const tree = await getRecipeTree(id);
    if (!tree) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'not found' }));
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(tree));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
}

module.exports = handler;
module.exports.getRecipeTree = getRecipeTree;

if (require.main === module) {
  const http = require('http');
  init()
    .then(() => {
      const server = http.createServer((req, res) => {
        if (req.method === 'GET' && req.url.startsWith('/recipe-tree/')) {
          handler(req, res);
        } else {
          res.statusCode = 404;
          res.end();
        }
      });
      const PORT = process.env.PORT || 3000;
      server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

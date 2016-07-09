// This file is only used for testing, will work with cirlceci in future

const host = process.env.RETHINKDB_HOST || '127.0.0.1';
const port = process.env.RETHINKDB_PORT || 28015;

const r = require('rethinkdbdash')({
  db: "test",
  servers: [ { host, port } ]
});

async function freshUserTable() {
  try {
    await r.tableDrop('users').run();
  } catch (err) {
    if (err.msg !== 'Table `test.users` does not exist')
      throw err;
  }

  try {
    await r.tableCreate('users').run();
  } catch (err) {
    if (err.msg !== 'Table `test.users` already exists.')
      throw err;
  }
}

export { freshUserTable };
export default r;

// This file is only used for testing, will work with cirlceci in future

const r = require('rethinkdbdash')({
  db: "test",
  servers: [
    { host: '172.17.0.2', port: 28015 }
  ]
});

async function freshUserTable() {
  console.log('freshUserTable');

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

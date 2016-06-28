export default class RethinkDBHashDriver {

  constructor(dbOptions, userTableName) {
    const r = dbOptions;
    this.users = r.table(userTableName);
  }

}
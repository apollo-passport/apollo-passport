export default class RethinkDBHashDriver {

  constructor(dbOptions, userTableName) {
    // RethinkDBHashDriver takes just the instance as the options object
    this.r = dbOptions;

    this.users = this.r.table(userTableName);
  }

}

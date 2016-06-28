export default class RethinkDBHashDriver {

  constructor(dbOptions, userTableName) {
    this.r = dbOptions;
    this.users = this.r.table(userTableName);
  }

}
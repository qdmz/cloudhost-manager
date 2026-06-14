const { sequelize } = require(./server/src/models);
(async () => {
  await sequelize.authenticate();
  console.log(connected);
  const info = await sequelize.getQueryInterface().describeTable(auth_requests);
  console.log(fields:, Object.keys(info));
  await sequelize.close();
})();

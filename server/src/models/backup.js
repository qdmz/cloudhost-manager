const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Backup = sequelize.define('Backup', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    type: { type: DataTypes.ENUM('database', 'files', 'full'), defaultValue: 'full' },
    size: { type: DataTypes.BIGINT, defaultValue: 0 },
    status: { type: DataTypes.ENUM('creating', 'completed', 'failed', 'restored'), defaultValue: 'creating' },
    note: { type: DataTypes.TEXT }
  }, {
    tableName: 'backups',
    timestamps: true
  });
  return Backup;
};

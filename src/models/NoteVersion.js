const { DataTypes } = require('sequelize');
const dbInstance = require('../config/database');

const sequelize = dbInstance.getConnection();

const NoteVersion = sequelize.define('NoteVersion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  noteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'notes',
      key: 'id'
    },
    onDelete: 'CASCADE',
    field: 'note_id'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  versionNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'version_number',
    comment: 'Version snapshot number'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'note_versions',
  timestamps: false,
  updatedAt: false,
  indexes: [
    {
      name: 'idx_note_id',
      fields: ['note_id']
    },
    {
      name: 'idx_note_version',
      fields: ['note_id', 'version_number'],
      unique: true
    }
  ]
});

module.exports = NoteVersion;


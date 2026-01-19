const User = require('./User');
const Note = require('./Note');
const NoteVersion = require('./NoteVersion');

// Define associations
User.hasMany(Note, {
  foreignKey: 'userId',
  as: 'notes',
  onDelete: 'CASCADE'
});

Note.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Note.hasMany(NoteVersion, {
  foreignKey: 'noteId',
  as: 'versions',
  onDelete: 'CASCADE'
});

NoteVersion.belongsTo(Note, {
  foreignKey: 'noteId',
  as: 'note'
});

module.exports = {
  User,
  Note,
  NoteVersion
};


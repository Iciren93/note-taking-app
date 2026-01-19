const { Note, NoteVersion } = require('../models');
const redisClient = require('../config/redis');
const { Op } = require('sequelize');

const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 3600;

/**
 * Create a new note with versioning support
 */
const createNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;

    // Create note
    const note = await Note.create({
      userId,
      title,
      content,
      version: 1
    });

    // Create initial version snapshot
    await NoteVersion.create({
      noteId: note.id,
      title: note.title,
      content: note.content,
      versionNumber: 1
    });

    // Invalidate user's notes cache
    await redisClient.delPattern(`notes:user:${userId}*`);

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: { note }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all notes for authenticated user
 * Implements Redis caching
 */
const getAllNotes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cacheKey = `notes:user:${userId}:all`;

    // Try to get from cache
    const cachedNotes = await redisClient.get(cacheKey);
    if (cachedNotes) {
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: { notes: cachedNotes }
      });
    }

    // Fetch from database
    const notes = await Note.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
      attributes: ['id', 'title', 'content', 'version', 'createdAt', 'updatedAt']
    });

    // Cache the results
    await redisClient.set(cacheKey, notes, CACHE_TTL);

    res.status(200).json({
      success: true,
      source: 'database',
      data: { notes }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single note by ID
 * Implements Redis caching
 */
const getNoteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const cacheKey = `notes:${id}`;

    // Try to get from cache
    const cachedNote = await redisClient.get(cacheKey);
    if (cachedNote && cachedNote.userId === userId) {
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: { note: cachedNote }
      });
    }

    // Fetch from database
    const note = await Note.findOne({
      where: { id, userId }
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Cache the result
    await redisClient.set(cacheKey, note, CACHE_TTL);

    res.status(200).json({
      success: true,
      source: 'database',
      data: { note }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a note with optimistic locking for concurrency control
 * Creates a new version snapshot
 */
const updateNote = async (req, res, next) => {
  const transaction = await Note.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { title, content, version } = req.body;
    const userId = req.user.id;

    // Find note with lock
    const note = await Note.findOne({
      where: { id, userId },
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (!note) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Optimistic locking: Check version
    if (note.version !== version) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        error: 'Concurrency conflict: Note has been modified by another user. Please refresh and try again.',
        currentVersion: note.version,
        providedVersion: version
      });
    }

    // Update note fields if provided
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    
    // Increment version
    note.version += 1;
    await note.save({ transaction });

    // Create version snapshot
    await NoteVersion.create({
      noteId: note.id,
      title: note.title,
      content: note.content,
      versionNumber: note.version
    }, { transaction });

    await transaction.commit();

    // Invalidate cache
    await redisClient.del(`notes:${id}`);
    await redisClient.delPattern(`notes:user:${userId}*`);

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: { note }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Soft delete a note (preserves version history)
 */
const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const note = await Note.findOne({
      where: { id, userId }
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Soft delete (paranoid mode)
    await note.destroy();

    // Invalidate cache
    await redisClient.del(`notes:${id}`);
    await redisClient.delPattern(`notes:user:${userId}*`);

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search notes by keywords using full-text search
 */
const searchNotes = async (req, res, next) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const searchTerm = q.trim();
    const cacheKey = `notes:search:${userId}:${searchTerm}`;

    // Try cache
    const cachedResults = await redisClient.get(cacheKey);
    if (cachedResults) {
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: { notes: cachedResults }
      });
    }

    // Full-text search using MySQL MATCH AGAINST
    const notes = await Note.sequelize.query(
      `SELECT id, title, content, version, created_at, updated_at,
              MATCH(title, content) AGAINST(:search IN NATURAL LANGUAGE MODE) as relevance
       FROM notes
       WHERE user_id = :userId 
         AND deleted_at IS NULL
         AND MATCH(title, content) AGAINST(:search IN NATURAL LANGUAGE MODE)
       ORDER BY relevance DESC, updated_at DESC`,
      {
        replacements: { userId, search: searchTerm },
        type: Note.sequelize.QueryTypes.SELECT
      }
    );

    // Cache results for shorter duration (search results change frequently)
    await redisClient.set(cacheKey, notes, CACHE_TTL / 2);

    res.status(200).json({
      success: true,
      source: 'database',
      data: { notes }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all versions of a note
 */
const getNoteVersions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify note belongs to user
    const note = await Note.findOne({
      where: { id, userId }
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Get all versions
    const versions = await NoteVersion.findAll({
      where: { noteId: id },
      order: [['versionNumber', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: { versions }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revert note to a previous version
 */
const revertToVersion = async (req, res, next) => {
  const transaction = await Note.sequelize.transaction();
  
  try {
    const { id, versionNumber } = req.params;
    const userId = req.user.id;
    const { version: currentVersion } = req.body;

    // Find note
    const note = await Note.findOne({
      where: { id, userId },
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (!note) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Optimistic locking check
    if (currentVersion && note.version !== currentVersion) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        error: 'Concurrency conflict: Note has been modified. Please refresh and try again.',
        currentVersion: note.version
      });
    }

    // Find the version to revert to
    const targetVersion = await NoteVersion.findOne({
      where: {
        noteId: id,
        versionNumber: parseInt(versionNumber)
      },
      transaction
    });

    if (!targetVersion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Version not found'
      });
    }

    // Update note with version data
    note.title = targetVersion.title;
    note.content = targetVersion.content;
    note.version += 1;
    await note.save({ transaction });

    // Create new version snapshot
    await NoteVersion.create({
      noteId: note.id,
      title: note.title,
      content: note.content,
      versionNumber: note.version
    }, { transaction });

    await transaction.commit();

    // Invalidate cache
    await redisClient.del(`notes:${id}`);
    await redisClient.delPattern(`notes:user:${userId}*`);

    res.status(200).json({
      success: true,
      message: `Note reverted to version ${versionNumber}`,
      data: { note }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
  searchNotes,
  getNoteVersions,
  revertToVersion
};


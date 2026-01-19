const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { noteSchemas } = require('../validators/schemas');

/**
 * @route   POST /api/notes
 * @desc    Create a new note
 * @access  Private
 */
router.post('/', authenticate, validate(noteSchemas.create), noteController.createNote);

/**
 * @route   GET /api/notes
 * @desc    Get all notes for authenticated user
 * @access  Private
 */
router.get('/', authenticate, noteController.getAllNotes);

/**
 * @route   GET /api/notes/search
 * @desc    Search notes by keywords
 * @access  Private
 */
router.get('/search', authenticate, noteController.searchNotes);

/**
 * @route   GET /api/notes/:id
 * @desc    Get a single note by ID
 * @access  Private
 */
router.get('/:id', authenticate, noteController.getNoteById);

/**
 * @route   PUT /api/notes/:id
 * @desc    Update a note
 * @access  Private
 */
router.put('/:id', authenticate, validate(noteSchemas.update), noteController.updateNote);

/**
 * @route   DELETE /api/notes/:id
 * @desc    Soft delete a note
 * @access  Private
 */
router.delete('/:id', authenticate, noteController.deleteNote);

/**
 * @route   GET /api/notes/:id/versions
 * @desc    Get all versions of a note
 * @access  Private
 */
router.get('/:id/versions', authenticate, noteController.getNoteVersions);

/**
 * @route   POST /api/notes/:id/revert/:versionNumber
 * @desc    Revert note to a previous version
 * @access  Private
 */
router.post('/:id/revert/:versionNumber', authenticate, noteController.revertToVersion);

module.exports = router;


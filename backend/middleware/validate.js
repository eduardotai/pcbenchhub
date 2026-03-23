const validator = require('validator');

const validateRegister = (req, res, next) => {
  const { email, password, username } = req.body;
  const errors = [];

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required' });
  }

  if (!validator.isEmail(email)) {
    errors.push('Invalid email format');
  }

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (username.length < 3 || username.length > 30) {
    errors.push('Username must be 3-30 characters');
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  next();
};

const validateBenchmark = (req, res, next) => {
  const { title, category, hardwareSpecs, software, testTool, scores, gaming_context, user_notes, tags, report_type } = req.body;
  const errors = [];

  if (!title || title.length < 3) {
    errors.push('Title must be at least 3 characters');
  }

  if (!category || !['cpu', 'gpu', 'ram', 'storage'].includes(category)) {
    errors.push('Category must be cpu, gpu, ram, or storage');
  }

  if (!hardwareSpecs || typeof hardwareSpecs !== 'object') {
    errors.push('Hardware specs is required');
  }

  if (!software || typeof software !== 'object') {
    errors.push('Software info is required');
  }

  if (!testTool || testTool.length < 2) {
    errors.push('Test tool is required');
  }

  if (!scores || typeof scores !== 'object' || Object.keys(scores).length === 0) {
    errors.push('At least one score metric is required');
  }

  if (gaming_context !== undefined && gaming_context !== null) {
    if (typeof gaming_context !== 'object') {
      errors.push('gaming_context must be an object');
    }
  }

  if (user_notes !== undefined && user_notes !== null) {
    if (typeof user_notes !== 'string') {
      errors.push('user_notes must be a string');
    } else if (user_notes.length > 1000) {
      errors.push('user_notes must be at most 1000 characters');
    }
  }

  if (tags !== undefined && tags !== null) {
    if (!Array.isArray(tags)) {
      errors.push('tags must be an array');
    } else {
      if (tags.length > 10) {
        errors.push('Maximum 10 tags allowed');
      }
      for (const tag of tags) {
        if (typeof tag !== 'string') {
          errors.push('Each tag must be a string');
          break;
        }
        if (tag.length > 30) {
          errors.push('Each tag must be at most 30 characters');
          break;
        }
      }
    }
  }

  if (report_type !== undefined && report_type !== null) {
    if (!['benchmark', 'gaming', 'stability', 'thermal'].includes(report_type)) {
      errors.push('report_type must be one of: benchmark, gaming, stability, thermal');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  next();
};

const validateComment = (req, res, next) => {
  const { content } = req.body;

  if (!content || content.trim().length < 2) {
    return res.status(400).json({ error: 'Comment must be at least 2 characters' });
  }

  if (content.length > 1000) {
    return res.status(400).json({ error: 'Comment must be less than 1000 characters' });
  }

  next();
};

const validateProfile = (req, res, next) => {
  const { username, experienceLevel, hardwareSetup } = req.body;
  const errors = [];

  if (username !== undefined) {
    if (username.length < 3 || username.length > 30) {
      errors.push('Username must be 3-30 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }
  }

  if (experienceLevel !== undefined) {
    if (!['beginner', 'intermediate', 'advanced'].includes(experienceLevel)) {
      errors.push('Experience level must be beginner, intermediate, or advanced');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  next();
};

module.exports = {
  validateRegister,
  validateBenchmark,
  validateComment,
  validateProfile
};

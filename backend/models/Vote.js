const { getDb, saveDatabase } = require('../config/db');

class Vote {
  static castVote(userId, reportId, voteType) {
    const db = getDb();
    const normalizedUserId = String(userId);
    const normalizedReportId = String(reportId);

    const stmt = db.prepare('SELECT * FROM votes WHERE user_id = ? AND report_id = ?');
    stmt.bind([normalizedUserId, normalizedReportId]);

    let existing = null;
    if (stmt.step()) {
      existing = stmt.getAsObject();
    }
    stmt.free();

    let action;
    let resultVoteType = voteType;

    if (existing) {
      if (Number(existing.vote_type) === Number(voteType)) {
        db.run('DELETE FROM votes WHERE user_id = ? AND report_id = ?', [normalizedUserId, normalizedReportId]);
        action = 'removed';
        resultVoteType = null;
      } else {
        db.run(
          'UPDATE votes SET vote_type = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND report_id = ?',
          [voteType, normalizedUserId, normalizedReportId]
        );
        action = 'updated';
      }
    } else {
      db.run(
        `INSERT INTO votes (user_id, report_id, vote_type, created_at, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [normalizedUserId, normalizedReportId, voteType]
      );
      action = 'created';
    }

    const totalScore = this._recalculateHelpfulness(normalizedReportId);
    saveDatabase();

    return {
      action,
      vote_type: resultVoteType,
      report_id: normalizedReportId,
      total_score: totalScore,
    };
  }

  static getByReport(reportId) {
    const db = getDb();
    const normalizedReportId = String(reportId);
    const stmt = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END), 0) as upvotes,
        COALESCE(SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END), 0) as downvotes,
        COALESCE(SUM(CAST(vote_type AS INTEGER)), 0) as total_score
      FROM votes
      WHERE report_id = ?
    `);
    stmt.bind([normalizedReportId]);

    let result = { upvotes: 0, downvotes: 0, total_score: 0 };
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();

    return result;
  }

  static getUserVote(userId, reportId) {
    const db = getDb();
    const normalizedUserId = String(userId);
    const normalizedReportId = String(reportId);

    const stmt = db.prepare('SELECT * FROM votes WHERE user_id = ? AND report_id = ?');
    stmt.bind([normalizedUserId, normalizedReportId]);

    let vote = null;
    if (stmt.step()) {
      vote = stmt.getAsObject();
    }
    stmt.free();

    return vote;
  }

  static removeVote(userId, reportId) {
    const db = getDb();
    const normalizedUserId = String(userId);
    const normalizedReportId = String(reportId);

    db.run('DELETE FROM votes WHERE user_id = ? AND report_id = ?', [normalizedUserId, normalizedReportId]);

    const totalScore = this._recalculateHelpfulness(normalizedReportId);
    saveDatabase();

    return { report_id: normalizedReportId, total_score: totalScore };
  }

  static _recalculateHelpfulness(reportId) {
    const db = getDb();

    const scoreStmt = db.prepare(
      'SELECT COALESCE(SUM(CAST(vote_type AS INTEGER)), 0) as score FROM votes WHERE report_id = ?'
    );
    scoreStmt.bind([reportId]);

    let score = 0;
    if (scoreStmt.step()) {
      score = scoreStmt.getAsObject().score;
    }
    scoreStmt.free();

    db.run('UPDATE benchmarks SET helpfulness_score = ? WHERE id = ?', [score, reportId]);
    return score;
  }
}

module.exports = Vote;

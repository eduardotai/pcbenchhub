const { getDb, saveDatabase } = require('../config/db');

class Vote {
  // Cria ou altera voto. Se user já votou no mesmo report com mesmo tipo, remove (toggle).
  // Se votou com tipo diferente, atualiza.
  // Retorna { action: 'created'|'updated'|'removed', vote_type, report_id }
  static castVote(userId, reportId, voteType) {
    const db = getDb();

    // 1. Busca voto existente
    const stmt = db.prepare(
      'SELECT * FROM votes WHERE user_id = ? AND report_id = ?'
    );
    stmt.bind([userId, reportId]);
    let existing = null;
    if (stmt.step()) {
      existing = stmt.getAsObject();
    }
    stmt.free();

    let action;
    let resultVoteType = voteType;

    if (existing) {
      if (existing.vote_type === voteType) {
        // 2. Mesmo tipo: deleta (toggle off)
        db.run('DELETE FROM votes WHERE user_id = ? AND report_id = ?', [userId, reportId]);
        action = 'removed';
        resultVoteType = null;
      } else {
        // 3. Tipo diferente: atualiza vote_type
        db.run(
          'UPDATE votes SET vote_type = ? WHERE user_id = ? AND report_id = ?',
          [voteType, userId, reportId]
        );
        action = 'updated';
      }
    } else {
      // 4. Não existe: insere
      db.run(
        'INSERT INTO votes (user_id, report_id, vote_type) VALUES (?, ?, ?)',
        [userId, reportId, voteType]
      );
      action = 'created';
    }

    // 5. Recalcula helpfulness_score no benchmark: SUM(vote_type) WHERE report_id
    const scoreStmt = db.prepare(
      'SELECT COALESCE(SUM(vote_type), 0) as score FROM votes WHERE report_id = ?'
    );
    scoreStmt.bind([reportId]);
    let score = 0;
    if (scoreStmt.step()) {
      score = scoreStmt.getAsObject().score;
    }
    scoreStmt.free();

    // 6. Atualiza benchmarks.helpfulness_score = soma dos votos
    db.run(
      'UPDATE benchmarks SET helpfulness_score = ? WHERE id = ?',
      [score, reportId]
    );

    // 7. saveDatabase()
    saveDatabase();

    return { action, vote_type: resultVoteType, report_id: reportId };
  }

  // Retorna { upvotes, downvotes, total_score } agregado
  static getByReport(reportId) {
    const db = getDb();

    const stmt = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END), 0) as upvotes,
        COALESCE(SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END), 0) as downvotes,
        COALESCE(SUM(vote_type), 0) as total_score
      FROM votes
      WHERE report_id = ?
    `);
    stmt.bind([reportId]);
    let result = { upvotes: 0, downvotes: 0, total_score: 0 };
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    return result;
  }

  // Retorna voto do usuário neste report (ou null)
  static getUserVote(userId, reportId) {
    const db = getDb();
    const stmt = db.prepare(
      'SELECT * FROM votes WHERE user_id = ? AND report_id = ?'
    );
    stmt.bind([userId, reportId]);
    let vote = null;
    if (stmt.step()) {
      vote = stmt.getAsObject();
    }
    stmt.free();
    return vote;
  }

  // Remove voto e recalcula helpfulness_score
  static removeVote(userId, reportId) {
    const db = getDb();

    db.run('DELETE FROM votes WHERE user_id = ? AND report_id = ?', [userId, reportId]);

    const scoreStmt = db.prepare(
      'SELECT COALESCE(SUM(vote_type), 0) as score FROM votes WHERE report_id = ?'
    );
    scoreStmt.bind([reportId]);
    let score = 0;
    if (scoreStmt.step()) {
      score = scoreStmt.getAsObject().score;
    }
    scoreStmt.free();

    db.run(
      'UPDATE benchmarks SET helpfulness_score = ? WHERE id = ?',
      [score, reportId]
    );

    saveDatabase();
  }
}

module.exports = Vote;

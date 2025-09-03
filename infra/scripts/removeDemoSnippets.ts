import database from "../database";

async function removeDemoSnippets() {
  const client = await database.getNewClient();
  try {
    await client.query('BEGIN');

    // Heuristics to pick demo/example snippets
    const patterns = [
      '%Example%', '%Sample%', '%Demo%', '%Snippet%', '%Simplet%', '%Hello%'
    ];
    const findRes = await client.query({
      text: `
        SELECT t.id, t.title, u.username
        FROM threads t
        JOIN users u ON u.id = t.user_id
        WHERE ${patterns.map((_, i) => `t.title ILIKE $${i + 1}`).join(' OR ')}
        ORDER BY t.created_at ASC
        LIMIT 6
      `,
      values: patterns,
    });

    if (findRes.rowCount === 0) {
      console.log('No demo/example snippets found. Nothing to remove.');
      await client.query('ROLLBACK');
      return;
    }

    const threads = findRes.rows as Array<{ id: number; title: string; username: string } >;
    console.log('Removing the following threads:');
    threads.forEach((t) => console.log(`- [#${t.id}] ${t.title} by ${t.username}`));

    for (const t of threads) {
      // Delete likes on posts of this thread
      await client.query({
        text: `DELETE FROM likes WHERE post_id IN (SELECT id FROM posts WHERE thread_id = $1)`,
        values: [t.id],
      });
      // Delete posts
      await client.query({
        text: `DELETE FROM posts WHERE thread_id = $1`,
        values: [t.id],
      });
      // Delete the thread itself
      await client.query({
        text: `DELETE FROM threads WHERE id = $1`,
        values: [t.id],
      });
    }

    await client.query('COMMIT');
    console.log(`Removed ${threads.length} demo snippet(s).`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Failed to remove demo snippets:', e);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

removeDemoSnippets();

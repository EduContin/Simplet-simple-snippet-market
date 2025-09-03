import database from "../database";

async function setupAdmin() {
  try {
    // Find an existing admin user (prefer explicit Admin group); fallbacks by common username/email.
    const existing = await database.query({
      text: `SELECT id, user_group FROM users WHERE user_group = 'Admin' OR username = 'Admin' OR email = 'admin@simplet.com' ORDER BY user_group = 'Admin' DESC LIMIT 1`,
      values: [],
    });
    if (existing.rowCount === 0) {
      console.log("No existing admin user found; skipping wallet funding.");
      return;
    }
    const adminId = existing.rows[0].id as number;
    // Ensure user_group is Admin
    await database.query({
      text: `UPDATE users SET user_group = 'Admin' WHERE id = $1 AND user_group <> 'Admin'`,
      values: [adminId],
    });

    const targetCents = 1_000_000; // $10,000.00 in cents
    // Upsert wallet with desired balance
    await database.query({
      text: `
        INSERT INTO wallets (user_id, balance_cents, currency)
        VALUES ($1, $2, 'USD')
        ON CONFLICT (user_id) DO UPDATE SET balance_cents = EXCLUDED.balance_cents, currency = EXCLUDED.currency, updated_at = NOW()
      `,
      values: [adminId, targetCents],
    });

    console.log("Existing Admin wallet set to $10,000.");
  } catch (error) {
    console.error("Error setting up admin user:", error);
  }
}

setupAdmin();

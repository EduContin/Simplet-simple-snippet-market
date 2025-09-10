import database from "../database";
import bcrypt from "bcrypt";

async function setupAdmin() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || "Admin";
    const adminEmail = process.env.ADMIN_EMAIL || "admin@simplet.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin";

    // Find an existing admin (prefer explicit Admin group) or by configured username/email
    const existing = await database.query({
      text: `SELECT id, user_group FROM users WHERE user_group = 'Admin' OR username = $1 OR email = $2 ORDER BY user_group = 'Admin' DESC LIMIT 1`,
      values: [adminUsername, adminEmail],
    });

    let adminId: number | null = null;

    if (existing.rowCount === 0) {
      // Create the admin account
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const insertByUsername = await database.query({
        text: `
          INSERT INTO users (username, email, password, user_group, created_at)
          VALUES ($1, $2, $3, 'Admin', NOW())
          ON CONFLICT (username) DO NOTHING
          RETURNING id
        `,
        values: [adminUsername, adminEmail, hashedPassword],
      });

      if (insertByUsername.rowCount > 0) {
        adminId = insertByUsername.rows[0].id as number;
      } else {
        // Try insert allowing email conflict path, then fetch
        const insertByEmail = await database.query({
          text: `
            INSERT INTO users (username, email, password, user_group, created_at)
            VALUES ($1, $2, $3, 'Admin', NOW())
            ON CONFLICT (email) DO NOTHING
            RETURNING id
          `,
          values: [adminUsername, adminEmail, hashedPassword],
        });
        if (insertByEmail.rowCount > 0) {
          adminId = insertByEmail.rows[0].id as number;
        } else {
          const fetch = await database.query({
            text: `SELECT id FROM users WHERE username = $1 OR email = $2 LIMIT 1`,
            values: [adminUsername, adminEmail],
          });
          adminId = (fetch.rows[0]?.id as number) || null;
        }
      }
    } else {
      adminId = existing.rows[0].id as number;
    }

    if (!adminId) {
      console.log("Could not ensure admin account; skipping wallet funding.");
      return;
    }

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

    console.log("Admin ensured and wallet set to $10,000.");
  } catch (error) {
    console.error("Error setting up admin user:", error);
  }
}

setupAdmin();

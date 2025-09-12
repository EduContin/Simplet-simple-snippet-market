exports.up = async (pgm) => {
  pgm.addColumn("threads", {
    is_verified: { type: "boolean", notNull: true, default: false },
    verified_by_user_id: {
      type: "integer",
      references: "users",
      onDelete: "SET NULL",
      notNull: false,
    },
    verified_at: { type: "timestamp", notNull: false },
  });

  pgm.createIndex("threads", ["is_verified"]);
  pgm.createIndex("threads", ["verified_by_user_id"]);
};

exports.down = async (pgm) => {
  pgm.dropIndex("threads", ["verified_by_user_id"], { ifExists: true });
  pgm.dropIndex("threads", ["is_verified"], { ifExists: true });
  pgm.dropColumn("threads", "verified_at", { ifExists: true });
  pgm.dropColumn("threads", "verified_by_user_id", { ifExists: true });
  pgm.dropColumn("threads", "is_verified", { ifExists: true });
};

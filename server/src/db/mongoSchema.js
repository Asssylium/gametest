const number = { bsonType: 'number' };
const text = { bsonType: 'string' };
const date = { bsonType: 'date' };
const nullableText = { bsonType: ['string', 'null'] };
const nullableNumber = { bsonType: ['double', 'int', 'long', 'decimal', 'null'] };
const nullableDate = { bsonType: ['date', 'null'] };

export const mongoCollections = {
  roles: {
    required: ['id', 'name'],
    properties: { id: number, name: text },
    indexes: [{ keys: { name: 1 }, options: { unique: true } }],
  },
  accounts: {
    required: ['id', 'email', 'full_name', 'password', 'role_id'],
    properties: {
      id: number,
      email: text,
      full_name: text,
      password: text,
      role_id: number,
      phone_number: nullableText,
      address: nullableText,
      avatar_url: nullableText,
      balance: number,
      is_active: number,
      created_at: date,
      updated_at: date,
      deleted_at: nullableDate,
    },
    indexes: [{ keys: { email: 1 }, options: { unique: true } }],
  },
  vendors: {
    required: ['id', 'code', 'name'],
    properties: { id: number, code: text, name: text, sort_order: number, is_active: number, created_at: date },
    indexes: [{ keys: { code: 1 }, options: { unique: true } }],
  },
  games: {
    required: ['id', 'vendor_id', 'game_code', 'title', 'type'],
    properties: {
      id: number,
      vendor_id: number,
      game_code: text,
      title: text,
      title_jp: nullableText,
      image_url: nullableText,
      type: { enum: ['SLOT', 'LIVE', 'TABLE'] },
      is_active: number,
      sort_order: number,
      created_at: date,
    },
    indexes: [
      { keys: { vendor_id: 1, game_code: 1 }, options: { unique: true } },
      { keys: { vendor_id: 1, is_active: 1, type: 1 } },
      { keys: { sort_order: 1 } },
      { keys: { vendor_id: 1, sort_order: 1 } },
    ],
  },
  transactions: {
    required: ['id', 'account_id', 'transaction_code', 'type', 'amount', 'status'],
    properties: {
      id: number,
      account_id: number,
      transaction_code: text,
      type: text,
      amount: number,
      balance_before: number,
      balance_after: number,
      status: text,
      description: nullableText,
      created_at: date,
    },
    indexes: [
      { keys: { transaction_code: 1 }, options: { unique: true } },
      { keys: { account_id: 1, created_at: -1 } },
    ],
  },
  email_verifications: {
    required: ['id', 'email', 'otp', 'expires_at'],
    properties: { id: number, email: text, otp: text, expires_at: date, is_used: number, created_at: date },
    indexes: [{ keys: { email: 1, otp: 1, is_used: 1, created_at: -1 } }],
  },
  scheduled_emails: {
    required: ['id', 'sender_id', 'target_role', 'subject', 'content', 'scheduled_at', 'status'],
    properties: {
      id: number,
      sender_id: number,
      target_role: text,
      subject: text,
      content: text,
      scheduled_at: date,
      status: text,
      created_at: date,
    },
    indexes: [{ keys: { status: 1, scheduled_at: 1 } }],
  },
  idempotency_keys: {
    required: ['id', 'idempotency_key', 'user_id', 'http_method', 'endpoint', 'status'],
    properties: {
      id: number,
      idempotency_key: text,
      user_id: number,
      http_method: text,
      endpoint: text,
      status: text,
      response_status: nullableNumber,
      response_body: nullableText,
    },
    indexes: [{ keys: { idempotency_key: 1, user_id: 1, http_method: 1, endpoint: 1 }, options: { unique: true } }],
  },
  direct_messages: {
    required: ['id', 'sender_id', 'receiver_id', 'content'],
    properties: {
      id: number,
      sender_id: number,
      receiver_id: number,
      content: text,
      is_read: number,
      created_at: date,
    },
    indexes: [{ keys: { sender_id: 1, receiver_id: 1, created_at: 1 } }],
  },
  contact_messages: {
    required: ['id', 'full_name', 'email', 'subject', 'message'],
    properties: {
      id: number,
      account_id: nullableNumber,
      full_name: text,
      email: text,
      subject: text,
      address: nullableText,
      lat: nullableNumber,
      lng: nullableNumber,
      message: text,
      is_read: number,
      admin_reply: nullableText,
      replied_at: nullableDate,
      created_at: date,
    },
    indexes: [{ keys: { created_at: -1 } }],
  },
  company_settings: {
    required: ['id'],
    properties: {
      id: number,
      company_name: nullableText,
      address: nullableText,
      phone: nullableText,
      email: nullableText,
      working_hours: nullableText,
      lat: nullableNumber,
      lng: nullableNumber,
    },
    indexes: [],
  },
};

export async function initializeMongoSchema(database) {
  const existing = new Set((await database.listCollections({}, { nameOnly: true }).toArray()).map(({ name }) => name));

  for (const [name, definition] of Object.entries(mongoCollections)) {
    const validator = {
      $jsonSchema: { bsonType: 'object', required: definition.required, properties: definition.properties },
    };
    if (existing.has(name)) {
      await database.command({ collMod: name, validator });
    } else {
      await database.createCollection(name, { validator });
    }
    const collection = database.collection(name);
    await collection.createIndex({ id: 1 }, { unique: true });
    for (const index of definition.indexes) {
      await collection.createIndex(index.keys, index.options);
    }
  }
}

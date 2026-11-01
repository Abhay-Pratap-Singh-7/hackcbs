const bcrypt = require('bcryptjs');
const { query } = require('../config/yugabyte');

// Query thenable helper to support Mongoose-style chaining (.select(), .populate(), .lean(), etc.)
const createQuery = (executeFn) => {
  let promise = null;
  const getPromise = () => {
    if (!promise) promise = executeFn();
    return promise;
  };

  const queryObj = {
    select: () => queryObj,
    populate: () => queryObj,
    sort: () => queryObj,
    limit: (n) => queryObj,
    skip: () => queryObj,
    lean: () => queryObj,
    then: (onFulfilled, onRejected) => getPromise().then(onFulfilled, onRejected),
    catch: (onRejected) => getPromise().catch(onRejected),
    finally: (onFinally) => getPromise().finally(onFinally)
  };
  return queryObj;
};

// Helper to wrap YugabyteDB user row with Mongoose-compatible properties and methods
const wrapUserRow = (row) => {
  if (!row) return null;

  const userObj = {
    id: row.id,
    _id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar,
    password: row.password,
    role: row.role,
    isEmailVerified: !!row.is_email_verified,
    is_email_verified: !!row.is_email_verified,
    authProvider: row.auth_provider || 'LOCAL',
    auth_provider: row.auth_provider || 'LOCAL',
    googleId: row.google_id,
    google_id: row.google_id,
    digilockerId: row.digilocker_id,
    digilocker_id: row.digilocker_id,
    profileDetails: row.profile_details || {},
    profile_details: row.profile_details || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    created_at: row.created_at,
    updated_at: row.updated_at,

    async matchPassword(enteredPassword) {
      if (!this.password) return false;
      return bcrypt.compare(enteredPassword, this.password);
    },

    async comparePassword(enteredPassword) {
      if (!this.password) return false;
      return bcrypt.compare(enteredPassword, this.password);
    },

    async save() {
      // If password was modified and not hashed, hash it
      let pwd = this.password;
      if (pwd && !pwd.startsWith('$2a$') && !pwd.startsWith('$2b$')) {
        pwd = await bcrypt.hash(pwd, 12);
        this.password = pwd;
      }

      const res = await query(
        `UPDATE users
         SET name = $1, email = $2, avatar = $3, password = $4, role = $5,
             is_email_verified = $6, auth_provider = $7, google_id = $8,
             digilocker_id = $9, profile_details = $10, updated_at = NOW()
         WHERE id = $11
         RETURNING *`,
        [
          this.name,
          (this.email || '').toLowerCase().trim(),
          this.avatar || null,
          pwd,
          this.role,
          this.isEmailVerified ?? this.is_email_verified ?? false,
          this.authProvider || this.auth_provider || 'LOCAL',
          this.googleId || this.google_id || null,
          this.digilockerId || this.digilocker_id || null,
          JSON.stringify(this.profileDetails || this.profile_details || {}),
          this.id
        ]
      );
      if (res.rows[0]) {
        Object.assign(this, wrapUserRow(res.rows[0]));
      }
      return this;
    },

    toObject() {
      const copy = { ...this };
      delete copy.password;
      return copy;
    },

    toJSON() {
      const copy = { ...this };
      delete copy.password;
      return copy;
    }
  };

  return userObj;
};

// Users Repository
const users = {
  findOne(conditions = {}) {
    return createQuery(async () => {
      let sql = 'SELECT * FROM users WHERE ';
      const params = [];

      if (conditions.email) {
        params.push((conditions.email || '').toLowerCase().trim());
        sql += `LOWER(email) = LOWER($${params.length})`;
      } else if (conditions.googleId) {
        params.push(conditions.googleId);
        sql += `google_id = $${params.length}`;
      } else if (conditions.digilockerId) {
        params.push(conditions.digilockerId);
        sql += `digilocker_id = $${params.length}`;
      } else if (conditions.id || conditions._id) {
        params.push(conditions.id || conditions._id);
        sql += `id = $${params.length}`;
      } else {
        sql += '1=1';
      }

      sql += ' LIMIT 1';

      const res = await query(sql, params);
      return res.rows[0] ? wrapUserRow(res.rows[0]) : null;
    });
  },

  findById(id) {
    return createQuery(async () => {
      if (!id) return null;
      try {
        const res = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
        return res.rows[0] ? wrapUserRow(res.rows[0]) : null;
      } catch (_) {
        return null;
      }
    });
  },

  async create(userData) {
    let pwd = userData.password;
    if (pwd && !pwd.startsWith('$2a$') && !pwd.startsWith('$2b$')) {
      pwd = await bcrypt.hash(pwd, 12);
    }

    const cleanEmail = (userData.email || '').toLowerCase().trim();
    const res = await query(
      `INSERT INTO users (
        name, email, avatar, password, role, is_email_verified,
        auth_provider, google_id, digilocker_id, profile_details,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *`,
      [
        userData.name?.trim() || 'Citizen',
        cleanEmail,
        userData.avatar || null,
        pwd || null,
        userData.role || 'INDIVIDUAL_CITIZEN',
        userData.isEmailVerified || false,
        userData.authProvider || 'LOCAL',
        userData.googleId || null,
        userData.digilockerId || null,
        JSON.stringify(userData.profileDetails || {})
      ]
    );

    return wrapUserRow(res.rows[0]);
  },

  async findByIdAndDelete(id) {
    if (!id) return null;
    const res = await query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    return res.rows[0] ? wrapUserRow(res.rows[0]) : null;
  },

  async deleteOne(conditions = {}) {
    if (conditions.id || conditions._id) {
      return this.findByIdAndDelete(conditions.id || conditions._id);
    }
    if (conditions.email) {
      const res = await query('DELETE FROM users WHERE LOWER(email) = LOWER($1) RETURNING *', [(conditions.email || '').toLowerCase().trim()]);
      return res.rows[0] ? wrapUserRow(res.rows[0]) : null;
    }
    return null;
  }
};

// OTPs Repository
const otps = {
  findOne(conditions = {}) {
    return createQuery(async () => {
      let sql = 'SELECT * FROM otps WHERE expires_at > NOW()';
      const params = [];

      if (conditions.email) {
        params.push((conditions.email || '').toLowerCase().trim());
        sql += ` AND LOWER(email) = LOWER($${params.length})`;
      }
      if (conditions.otp) {
        params.push(String(conditions.otp).trim());
        sql += ` AND otp = $${params.length}`;
      }
      if (conditions.purpose) {
        params.push(conditions.purpose);
        sql += ` AND purpose = $${params.length}`;
      }

      sql += ' ORDER BY created_at DESC LIMIT 1';
      const res = await query(sql, params);
      if (!res.rows[0]) return null;

      const r = res.rows[0];
      return {
        id: r.id,
        _id: r.id,
        email: r.email,
        otp: r.otp,
        purpose: r.purpose,
        expiresAt: r.expires_at,
        createdAt: r.created_at
      };
    });
  },

  async create(data) {
    const res = await query(
      `INSERT INTO otps (email, otp, purpose, expires_at, created_at)
       VALUES ($1, $2, $3, NOW() + interval '10 minutes', NOW())
       RETURNING *`,
      [
        (data.email || '').toLowerCase().trim(),
        String(data.otp).trim(),
        data.purpose || 'SIGNUP_VERIFY'
      ]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      _id: r.id,
      email: r.email,
      otp: r.otp,
      purpose: r.purpose,
      expiresAt: r.expires_at,
      createdAt: r.created_at
    };
  },

  async deleteMany(conditions = {}) {
    let sql = 'DELETE FROM otps WHERE ';
    const params = [];

    if (conditions.email) {
      params.push((conditions.email || '').toLowerCase().trim());
      sql += `LOWER(email) = LOWER($${params.length})`;
    } else {
      sql += '1=1';
    }

    if (conditions.purpose) {
      params.push(conditions.purpose);
      sql += ` AND purpose = $${params.length}`;
    }

    const res = await query(sql, params);
    return { deletedCount: res.rowCount };
  }
};

// Refresh Tokens Repository
const refreshTokens = {
  async create(data) {
    const expiresAt = data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const res = await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [data.userId, data.token, expiresAt]
    );
    return res.rows[0];
  },

  findOne(conditions = {}) {
    return createQuery(async () => {
      if (!conditions.token) return null;
      const res = await query(
        'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW() LIMIT 1',
        [conditions.token]
      );
      if (!res.rows[0]) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        _id: r.id,
        userId: r.user_id,
        token: r.token,
        expiresAt: r.expires_at,
        createdAt: r.created_at
      };
    });
  },

  async deleteOne(conditions = {}) {
    if (!conditions.token) return null;
    const res = await query('DELETE FROM refresh_tokens WHERE token = $1 RETURNING *', [conditions.token]);
    return { deletedCount: res.rowCount };
  },

  async deleteMany(conditions = {}) {
    if (conditions.userId) {
      const res = await query('DELETE FROM refresh_tokens WHERE user_id = $1', [conditions.userId]);
      return { deletedCount: res.rowCount };
    }
    return { deletedCount: 0 };
  }
};

// Problem Statements Repository
const wrapProblemRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status || 'SUBMITTED',
    location: {
      address: row.address,
      district: row.district || 'Ranchi',
      state: row.state || 'Jharkhand',
      latitude: row.latitude,
      longitude: row.longitude,
      coordinates: {
        latitude: row.latitude,
        longitude: row.longitude
      }
    },
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address,
    district: row.district,
    state: row.state,
    reportedBy: row.reported_by,
    reported_by: row.reported_by,
    aiAnalysis: row.ai_analysis || {},
    ai_analysis: row.ai_analysis || {},
    mediaUrls: row.media_urls || [],
    media_urls: row.media_urls || [],
    imagesAndMedia: (row.media_urls || []).map(u => ({ url: u, mediaType: 'image' })),
    upvotes: row.upvotes || 0,
    upvotesCount: row.upvotes || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    async save() {
      const res = await query(
        `UPDATE problem_statements
         SET title = $1, description = $2, category = $3, status = $4,
             latitude = $5, longitude = $6, address = $7, district = $8,
             state = $9, ai_analysis = $10, media_urls = $11, upvotes = $12,
             updated_at = NOW()
         WHERE id = $13 RETURNING *`,
        [
          this.title,
          this.description,
          this.category,
          this.status,
          this.latitude,
          this.longitude,
          this.address,
          this.district,
          this.state,
          JSON.stringify(this.aiAnalysis || this.ai_analysis || {}),
          this.mediaUrls || this.media_urls || [],
          this.upvotes || this.upvotesCount || 0,
          this.id
        ]
      );
      if (res.rows[0]) Object.assign(this, wrapProblemRow(res.rows[0]));
      return this;
    }
  };
};

const problems = {
  find(conditions = {}) {
    return createQuery(async () => {
      let sql = 'SELECT * FROM problem_statements WHERE 1=1';
      const params = [];
      if (conditions.status) {
        params.push(conditions.status);
        sql += ` AND status = $${params.length}`;
      }
      if (conditions.district) {
        params.push(conditions.district);
        sql += ` AND district = $${params.length}`;
      }
      if (conditions.reportedBy || conditions.reported_by) {
        params.push(conditions.reportedBy || conditions.reported_by);
        sql += ` AND reported_by = $${params.length}`;
      }
      sql += ' ORDER BY created_at DESC';

      const res = await query(sql, params);
      return res.rows.map(wrapProblemRow);
    });
  },

  findById(id) {
    return createQuery(async () => {
      if (!id) return null;
      try {
        const res = await query('SELECT * FROM problem_statements WHERE id = $1 LIMIT 1', [id]);
        return res.rows[0] ? wrapProblemRow(res.rows[0]) : null;
      } catch (_) {
        return null;
      }
    });
  },

  async countDocuments(conditions = {}) {
    const res = await query('SELECT count(*) FROM problem_statements');
    return parseInt(res.rows[0].count, 10);
  },

  async create(data) {
    const res = await query(
      `INSERT INTO problem_statements (
        title, description, category, status, latitude, longitude,
        address, district, state, reported_by, ai_analysis, media_urls,
        upvotes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *`,
      [
        data.title || 'Civic Problem Statement',
        data.description,
        data.category || data.aiAnalysis?.problem_classification || 'Civic',
        data.status || 'SUBMITTED',
        data.latitude || data.location?.latitude || data.location?.coordinates?.latitude || 23.3441,
        data.longitude || data.location?.longitude || data.location?.coordinates?.longitude || 85.3096,
        data.address || data.location?.address || '',
        data.district || data.location?.district || 'Ranchi',
        data.state || data.location?.state || 'Jharkhand',
        data.reportedBy || data.reported_by || null,
        JSON.stringify(data.aiAnalysis || data.ai_analysis || {}),
        (data.imagesAndMedia || []).map(m => m.url || m) || data.mediaUrls || [],
        0
      ]
    );
    return wrapProblemRow(res.rows[0]);
  }
};

module.exports = {
  users,
  otps,
  refreshTokens,
  problems,
  wrapUserRow,
  wrapProblemRow
};

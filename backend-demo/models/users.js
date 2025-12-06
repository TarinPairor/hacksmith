// User model with PII fields (intentionally exposed for demo)
// This represents what a real user object might contain

const users = [
  {
    id: "1",
    username: "alice",
    email: "alice@example.com",
    password_hash: "$2b$10$rOzJqKqKqKqKqKqKqKqKqOeKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq",
    phone: "+1-555-0101",
    address: "123 Main St, Anytown, USA",
    postcode: "12345",
    ip_address: "192.168.1.100",
    last_login: "2024-01-15T10:30:00Z",
    two_factor_secret: "JBSWY3DPEHPK3PXP",
    backup_codes: ["123456", "789012", "345678"],
    em_code: "EM123456789",
    reset_token: "reset_token_abc123",
    auth_token: "auth_token_xyz789",
    role: "admin",
    created_at: "2023-01-01T00:00:00Z"
  },
  {
    id: "2",
    username: "bob",
    email: "bob@example.com",
    password_hash: "$2b$10$bObJqKqKqKqKqKqKqKqKqOeKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq",
    phone: "+1-555-0102",
    address: "456 Oak Ave, Somewhere, USA",
    postcode: "67890",
    ip_address: "192.168.1.101",
    last_login: "2024-01-14T15:20:00Z",
    two_factor_secret: "MFRGG2LTMZQXIZLT",
    backup_codes: ["111222", "333444", "555666"],
    em_code: "EM987654321",
    reset_token: null,
    auth_token: "auth_token_def456",
    role: "user",
    created_at: "2023-02-01T00:00:00Z"
  },
  {
    id: "3",
    username: "charlie",
    email: "charlie@example.com",
    password_hash: "$2b$10$cHaRlIeJqKqKqKqKqKqKqKqOeKqKqKqKqKqKqKqKqKqKqKqKqKqKq",
    phone: "+1-555-0103",
    address: "789 Pine Rd, Elsewhere, USA",
    postcode: "54321",
    ip_address: "192.168.1.102",
    last_login: "2024-01-13T09:15:00Z",
    two_factor_secret: "ONSWG4DTNRQXIZLT",
    backup_codes: ["777888", "999000", "111222"],
    em_code: "EM456789123",
    reset_token: null,
    auth_token: "auth_token_ghi789",
    role: "user",
    created_at: "2023-03-01T00:00:00Z"
  },
  {
    id: "4",
    username: "diana",
    email: "diana@example.com",
    password_hash: "$2b$10$dIaNaJqKqKqKqKqKqKqKqKqOeKqKqKqKqKqKqKqKqKqKqKqKqKqKq",
    phone: "+1-555-0104",
    address: "321 Elm St, Nowhere, USA",
    postcode: "09876",
    ip_address: "192.168.1.103",
    last_login: "2024-01-12T14:45:00Z",
    two_factor_secret: "PFRHH3MUNRYXIZLT",
    backup_codes: ["444555", "666777", "888999"],
    em_code: "EM789123456",
    reset_token: null,
    auth_token: "auth_token_jkl012",
    role: "partner",
    created_at: "2023-04-01T00:00:00Z"
  }
];

// Service accounts (for Dropbox Sign style overprivileged accounts)
const serviceAccounts = [
  {
    id: "svc_1",
    name: "SIGN_PROD_SVC_ACCOUNT",
    token: "svc_token_sign_prod_12345",
    role: "service",
    permissions: ["read:all", "write:all", "admin:all"],
    used_for: "automation",
    last_used: "2024-01-15T12:00:00Z"
  },
  {
    id: "svc_2",
    name: "GRAPH_API_SVC_ACCOUNT",
    token: "svc_token_graph_api_67890",
    role: "service",
    permissions: ["read:all", "write:all"],
    used_for: "microsoft_graph_sync",
    last_used: "2024-01-15T11:30:00Z"
  }
];

module.exports = {
  users,
  serviceAccounts,
  findByEmail: (email) => users.find(u => u.email === email),
  findById: (id) => users.find(u => u.id === id),
  findByUsername: (username) => users.find(u => u.username === username),
  findServiceAccountByToken: (token) => serviceAccounts.find(sa => sa.token === token)
};


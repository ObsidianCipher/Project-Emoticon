const BASE_URL = 'http://localhost:4000/api';

/* ── CUSTOMERS ── */

async function createCustomer({ name, email }) {
  const response = await fetch(`${BASE_URL}/customers`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, email }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Failed to create customer: ${response.status}`);
  }

  return response.json();
}

/* ── KEYS ── */

async function issueKey(customerId, greetingFile) {
  const response = await fetch(`${BASE_URL}/keys`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ customerId, greetingFile }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Failed to issue key: ${response.status}`);
  }

  return response.json();
}

async function revokeKey(key) {
  const response = await fetch(`${BASE_URL}/keys/${encodeURIComponent(key)}/revoke`, {
    method: 'PATCH',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Failed to revoke key: ${response.status}`);
  }

  return response.json();
}

/* ── LOOKUP ── */

async function lookupCustomerByKey(key) {
  const response = await fetch(`${BASE_URL}/lookup/${encodeURIComponent(key)}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Key lookup failed: ${response.status}`);
  }

  return response.json();
}

/* ── COMBINED ── */

async function registerCustomerAndIssueKey({ name, email, greetingFile }) {
  const customer  = await createCustomer({ name, email });
  const issuedKey = await issueKey(customer.customerId, greetingFile);
  return { customer, issuedKey };
}

/* ── EXPORTS ── */

export {
  BASE_URL,
  createCustomer,
  issueKey,
  revokeKey,
  lookupCustomerByKey,
  registerCustomerAndIssueKey,
};
/**
 * schema.mjs — a dependency-free validator for the subset of JSON Schema 2020-12
 * that references/deck.schema.json actually uses.
 *
 * Supported: $ref (local "#/..." only), type (incl. arrays of types and "integer"),
 * required, properties, additionalProperties (boolean), items, enum, const, pattern,
 * minLength, maxLength, minimum, maximum, minItems, maxItems, uniqueItems,
 * and the local extension "x-uniqueBy" (array of objects unique by a property).
 *
 * validate(schema, data) -> { ok: boolean, errors: [{ path, message }] }
 */

const typeOf = (v) => {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
};

const matchesType = (value, type) => {
  if (type === 'integer') return typeof value === 'number' && Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  return typeOf(value) === type;
};

function resolveRef(ref, root) {
  if (typeof ref !== 'string' || !ref.startsWith('#')) {
    throw new Error(`schema.mjs: only local $ref is supported (got ${ref})`);
  }
  const parts = ref.slice(1).split('/').filter(Boolean).map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'));
  let node = root;
  for (const part of parts) {
    node = node?.[part];
    if (node === undefined) throw new Error(`schema.mjs: unresolved $ref ${ref}`);
  }
  return node;
}

function check(schema, data, path, root, errors) {
  if (schema === true || schema === undefined) return;
  if (schema === false) {
    errors.push({ path, message: 'value is not allowed here' });
    return;
  }
  if (schema.$ref) {
    check(resolveRef(schema.$ref, root), data, path, root, errors);
    return;
  }

  const fail = (message) => errors.push({ path: path || '/', message });

  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => matchesType(data, t))) {
      fail(`expected ${types.join(' or ')}, got ${typeOf(data)}`);
      return; // further keywords would only produce noise
    }
  }

  if (schema.const !== undefined && data !== schema.const) fail(`must equal ${JSON.stringify(schema.const)}`);
  if (Array.isArray(schema.enum) && !schema.enum.includes(data)) {
    fail(`must be one of: ${schema.enum.join(', ')} (got ${JSON.stringify(data)})`);
  }

  if (typeof data === 'string') {
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(data)) {
      fail(`must match ${schema.pattern} (got "${data}")`);
    }
    if (schema.minLength !== undefined && data.length < schema.minLength) fail(`must be at least ${schema.minLength} characters`);
    if (schema.maxLength !== undefined && data.length > schema.maxLength) fail(`must be at most ${schema.maxLength} characters`);
  }

  if (typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) fail(`must be >= ${schema.minimum} (got ${data})`);
    if (schema.maximum !== undefined && data > schema.maximum) fail(`must be <= ${schema.maximum} (got ${data})`);
  }

  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) fail(`must have at least ${schema.minItems} items`);
    if (schema.maxItems !== undefined && data.length > schema.maxItems) fail(`must have at most ${schema.maxItems} items`);
    if (schema.uniqueItems) {
      const seen = new Set();
      data.forEach((item, i) => {
        const key = JSON.stringify(item);
        if (seen.has(key)) errors.push({ path: `${path}/${i}`, message: 'duplicate item' });
        seen.add(key);
      });
    }
    const uniqueBy = schema['x-uniqueBy'];
    if (uniqueBy) {
      const seen = new Map();
      data.forEach((item, i) => {
        const key = item?.[uniqueBy];
        if (key === undefined) return;
        if (seen.has(key)) {
          errors.push({ path: `${path}/${i}/${uniqueBy}`, message: `duplicate ${uniqueBy} "${key}" (also at index ${seen.get(key)})` });
        } else seen.set(key, i);
      });
    }
    if (schema.items) data.forEach((item, i) => check(schema.items, item, `${path}/${i}`, root, errors));
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const key of schema.required ?? []) {
      if (!(key in data)) errors.push({ path: `${path}/${key}`, message: 'required property is missing' });
    }
    const props = schema.properties ?? {};
    for (const [key, value] of Object.entries(data)) {
      if (props[key]) check(props[key], value, `${path}/${key}`, root, errors);
      else if (schema.additionalProperties === false) {
        errors.push({ path: `${path}/${key}`, message: 'unknown property' });
      }
    }
  }
}

/**
 * @param {object} schema parsed JSON Schema
 * @param {unknown} data value to validate
 * @returns {{ ok: boolean, errors: {path: string, message: string}[] }}
 */
export function validate(schema, data) {
  const errors = [];
  try {
    check(schema, data, '', schema, errors);
  } catch (err) {
    errors.push({ path: '', message: err.message });
  }
  return { ok: errors.length === 0, errors };
}

/** Human-readable one-line-per-error rendering for CLI output. */
export function formatErrors(errors) {
  return errors.map((e) => `  ${e.path || '/'} — ${e.message}`).join('\n');
}

export default validate;

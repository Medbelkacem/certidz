/**
 * Safe, dependency-free JSON condition evaluator for workflow steps.
 *
 * Conditions are plain JSON (persisted on WorkflowStep.condition) and are
 * evaluated against a run context object. There is NO use of `eval`,
 * `Function`, or any dynamic code execution — every operator is an explicit,
 * whitelisted comparison, so an attacker who controls a stored condition
 * cannot achieve code execution or prototype pollution.
 *
 * Grammar:
 *   Condition =
 *     | { and: Condition[] }
 *     | { or:  Condition[] }
 *     | { not: Condition }
 *     | Comparison
 *   Comparison = { field: string, op: Op, value?: unknown }
 *   Op = 'eq'|'neq'|'gt'|'gte'|'lt'|'lte'|'in'|'nin'|'contains'|'exists'
 */

export type Comparator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'exists';

export interface Comparison {
  field: string;
  op: Comparator;
  value?: unknown;
}

export interface AndCondition {
  and: Condition[];
}
export interface OrCondition {
  or: Condition[];
}
export interface NotCondition {
  not: Condition;
}

export type Condition =
  | Comparison
  | AndCondition
  | OrCondition
  | NotCondition;

export type ConditionContext = Record<string, unknown>;

const COMPARATORS: ReadonlySet<string> = new Set<Comparator>([
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'nin',
  'contains',
  'exists',
]);

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Resolves a dotted path (e.g. `document.amount`) against the context.
 * Refuses to traverse prototype keys to avoid pollution-style lookups.
 */
export function resolveField(
  context: ConditionContext,
  path: string,
): unknown {
  const parts = path.split('.');
  let current: unknown = context;
  for (const part of parts) {
    if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
      return undefined;
    }
    if (isObject(current)) {
      current = current[part];
    } else if (Array.isArray(current)) {
      const idx = Number(part);
      current = Number.isInteger(idx) ? current[idx] : undefined;
    } else {
      return undefined;
    }
    if (current === undefined) {
      return undefined;
    }
  }
  return current;
}

/** Numeric/string ordering comparison shared by gt/gte/lt/lte. */
function order(a: unknown, b: unknown): number | null {
  if (typeof a === 'number' && typeof b === 'number') {
    return a === b ? 0 : a < b ? -1 : 1;
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return a === b ? 0 : a < b ? -1 : 1;
  }
  // Dates encoded as ISO strings are handled as strings above; mixed or
  // non-comparable types are treated as "not comparable".
  return null;
}

/** Structural equality for primitives and shallow arrays. */
function equals(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => equals(x, b[i]));
  }
  return false;
}

function evalComparison(cmp: Comparison, context: ConditionContext): boolean {
  const actual = resolveField(context, cmp.field);
  const expected = cmp.value;

  switch (cmp.op) {
    case 'exists':
      return actual !== undefined && actual !== null;
    case 'eq':
      return equals(actual, expected);
    case 'neq':
      return !equals(actual, expected);
    case 'gt': {
      const o = order(actual, expected);
      return o !== null && o > 0;
    }
    case 'gte': {
      const o = order(actual, expected);
      return o !== null && o >= 0;
    }
    case 'lt': {
      const o = order(actual, expected);
      return o !== null && o < 0;
    }
    case 'lte': {
      const o = order(actual, expected);
      return o !== null && o <= 0;
    }
    case 'in':
      return Array.isArray(expected) && expected.some((e) => equals(e, actual));
    case 'nin':
      return (
        Array.isArray(expected) && !expected.some((e) => equals(e, actual))
      );
    case 'contains':
      if (typeof actual === 'string') {
        return typeof expected === 'string' && actual.includes(expected);
      }
      if (Array.isArray(actual)) {
        return actual.some((e) => equals(e, expected));
      }
      return false;
    default:
      return false;
  }
}

/**
 * Validates that an arbitrary JSON value is a well-formed Condition tree.
 * Throwing here (at authoring time) is preferable to silently evaluating
 * malformed rules at runtime.
 */
export function assertCondition(value: unknown): asserts value is Condition {
  if (!isObject(value)) {
    throw new Error('condition must be an object');
  }
  if ('and' in value) {
    if (!Array.isArray(value.and)) {
      throw new Error('`and` must be an array');
    }
    value.and.forEach(assertCondition);
    return;
  }
  if ('or' in value) {
    if (!Array.isArray(value.or)) {
      throw new Error('`or` must be an array');
    }
    value.or.forEach(assertCondition);
    return;
  }
  if ('not' in value) {
    assertCondition(value.not);
    return;
  }
  if (typeof value.field !== 'string') {
    throw new Error('comparison requires a string `field`');
  }
  if (typeof value.op !== 'string' || !COMPARATORS.has(value.op)) {
    throw new Error(`unknown comparator: ${String(value.op)}`);
  }
}

/**
 * Evaluate a condition tree against a context.
 * A `null`/`undefined` condition means "always true" (unconditional step).
 * Malformed conditions evaluate to `false` (fail-safe) rather than throwing,
 * so a single bad rule never crashes a run — use {@link assertCondition} at
 * authoring time to reject them up front.
 */
export function evaluateCondition(
  condition: Condition | null | undefined,
  context: ConditionContext,
): boolean {
  if (condition === null || condition === undefined) {
    return true;
  }
  if (!isObject(condition)) {
    return false;
  }
  if ('and' in condition) {
    return (
      Array.isArray(condition.and) &&
      condition.and.every((c) => evaluateCondition(c, context))
    );
  }
  if ('or' in condition) {
    return (
      Array.isArray(condition.or) &&
      condition.or.some((c) => evaluateCondition(c, context))
    );
  }
  if ('not' in condition) {
    return !evaluateCondition(condition.not, context);
  }
  if (typeof condition.field === 'string' && COMPARATORS.has(condition.op)) {
    return evalComparison(condition, context);
  }
  return false;
}

import {
  assertCondition,
  type Condition,
  evaluateCondition,
  resolveField,
} from './condition';

describe('resolveField', () => {
  const ctx = {
    document: { amount: 1500, currency: 'DZD', tags: ['legal', 'urgent'] },
    signer: { country: 'DZ' },
    approved: true,
  };

  it('resolves nested dotted paths', () => {
    expect(resolveField(ctx, 'document.amount')).toBe(1500);
    expect(resolveField(ctx, 'signer.country')).toBe('DZ');
  });

  it('resolves array indices', () => {
    expect(resolveField(ctx, 'document.tags.0')).toBe('legal');
  });

  it('returns undefined for missing paths', () => {
    expect(resolveField(ctx, 'document.missing.deep')).toBeUndefined();
  });

  it('refuses prototype-pollution keys', () => {
    expect(resolveField(ctx, '__proto__.polluted')).toBeUndefined();
    expect(resolveField(ctx, 'constructor.name')).toBeUndefined();
  });
});

describe('evaluateCondition — comparators', () => {
  const ctx = {
    amount: 1500,
    status: 'SENT',
    role: 'ADMIN',
    tags: ['legal', 'urgent'],
    title: 'Master Services Agreement',
  };

  it('eq / neq', () => {
    expect(evaluateCondition({ field: 'status', op: 'eq', value: 'SENT' }, ctx)).toBe(true);
    expect(evaluateCondition({ field: 'status', op: 'eq', value: 'DRAFT' }, ctx)).toBe(false);
    expect(evaluateCondition({ field: 'status', op: 'neq', value: 'DRAFT' }, ctx)).toBe(true);
  });

  it('gt / gte / lt / lte on numbers', () => {
    expect(evaluateCondition({ field: 'amount', op: 'gt', value: 1000 }, ctx)).toBe(true);
    expect(evaluateCondition({ field: 'amount', op: 'gte', value: 1500 }, ctx)).toBe(true);
    expect(evaluateCondition({ field: 'amount', op: 'lt', value: 1500 }, ctx)).toBe(false);
    expect(evaluateCondition({ field: 'amount', op: 'lte', value: 1500 }, ctx)).toBe(true);
  });

  it('ordering is fail-safe for non-comparable types', () => {
    expect(evaluateCondition({ field: 'status', op: 'gt', value: 5 }, ctx)).toBe(false);
    expect(evaluateCondition({ field: 'missing', op: 'gt', value: 5 }, ctx)).toBe(false);
  });

  it('in / nin', () => {
    expect(evaluateCondition({ field: 'role', op: 'in', value: ['ADMIN', 'OWNER'] }, ctx)).toBe(true);
    expect(evaluateCondition({ field: 'role', op: 'nin', value: ['MEMBER'] }, ctx)).toBe(true);
    expect(evaluateCondition({ field: 'role', op: 'in', value: [] }, ctx)).toBe(false);
  });

  it('contains on strings and arrays', () => {
    expect(evaluateCondition({ field: 'title', op: 'contains', value: 'Services' }, ctx)).toBe(true);
    expect(evaluateCondition({ field: 'tags', op: 'contains', value: 'urgent' }, ctx)).toBe(true);
    expect(evaluateCondition({ field: 'tags', op: 'contains', value: 'nope' }, ctx)).toBe(false);
  });

  it('exists', () => {
    expect(evaluateCondition({ field: 'amount', op: 'exists' }, ctx)).toBe(true);
    expect(evaluateCondition({ field: 'nope', op: 'exists' }, ctx)).toBe(false);
  });
});

describe('evaluateCondition — composition', () => {
  const ctx = { amount: 1500, country: 'DZ', vip: false };

  it('and requires every branch', () => {
    const cond: Condition = {
      and: [
        { field: 'amount', op: 'gt', value: 1000 },
        { field: 'country', op: 'eq', value: 'DZ' },
      ],
    };
    expect(evaluateCondition(cond, ctx)).toBe(true);
    expect(evaluateCondition({ and: [cond, { field: 'vip', op: 'eq', value: true }] }, ctx)).toBe(false);
  });

  it('or requires at least one branch', () => {
    const cond: Condition = {
      or: [
        { field: 'amount', op: 'gt', value: 100000 },
        { field: 'country', op: 'eq', value: 'DZ' },
      ],
    };
    expect(evaluateCondition(cond, ctx)).toBe(true);
  });

  it('not inverts', () => {
    expect(evaluateCondition({ not: { field: 'vip', op: 'eq', value: true } }, ctx)).toBe(true);
  });

  it('handles deep nesting', () => {
    const cond: Condition = {
      and: [
        { field: 'amount', op: 'gte', value: 1500 },
        {
          or: [
            { field: 'country', op: 'eq', value: 'FR' },
            { not: { field: 'vip', op: 'eq', value: true } },
          ],
        },
      ],
    };
    expect(evaluateCondition(cond, ctx)).toBe(true);
  });

  it('null/undefined condition is always true', () => {
    expect(evaluateCondition(null, ctx)).toBe(true);
    expect(evaluateCondition(undefined, ctx)).toBe(true);
  });

  it('malformed condition is fail-safe false', () => {
    expect(evaluateCondition({} as Condition, ctx)).toBe(false);
    expect(
      evaluateCondition({ field: 'amount', op: 'bogus' } as unknown as Condition, ctx),
    ).toBe(false);
  });
});

describe('assertCondition', () => {
  it('accepts valid trees', () => {
    expect(() =>
      assertCondition({
        and: [
          { field: 'a', op: 'eq', value: 1 },
          { or: [{ field: 'b', op: 'exists' }] },
        ],
      }),
    ).not.toThrow();
  });

  it('rejects unknown comparators', () => {
    expect(() => assertCondition({ field: 'a', op: 'like', value: 1 })).toThrow(
      /unknown comparator/,
    );
  });

  it('rejects non-object and malformed shapes', () => {
    expect(() => assertCondition(42)).toThrow();
    expect(() => assertCondition({ and: 'nope' })).toThrow(/`and` must be an array/);
    expect(() => assertCondition({ op: 'eq', value: 1 })).toThrow(/string `field`/);
  });
});

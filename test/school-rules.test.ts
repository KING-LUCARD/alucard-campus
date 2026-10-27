import { describe, expect, it } from 'vitest';
import { coreSubjects, schoolClasses } from '@/lib/site';
import { requestedRoleSchema } from '@/lib/school-validation';

describe('School requirements', () => {
  it('permits only student and teacher public role requests', () => {
    expect(requestedRoleSchema.safeParse('student').success).toBe(true);
    expect(requestedRoleSchema.safeParse('teacher').success).toBe(true);
    expect(requestedRoleSchema.safeParse('principal').success).toBe(false);
    expect(requestedRoleSchema.safeParse('admin').success).toBe(false);
  });
  it('provides all six secondary school classes', () => {
    expect(schoolClasses).toEqual(['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3']);
  });
  it('includes Mathematics and English as core subjects', () => {
    expect(coreSubjects).toEqual(['Mathematics', 'English']);
  });
});
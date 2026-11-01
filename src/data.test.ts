import { describe, it, expect } from 'vitest';
import { STUDENTS, GRAMMAR_TOPICS, EXERCISES, ROLES, TOPICS } from './data';

describe('data.ts static exports', () => {
  describe('STUDENTS', () => {
    it('is a non-empty array of student names', () => {
      expect(Array.isArray(STUDENTS)).toBe(true);
      expect(STUDENTS.length).toBeGreaterThan(0);
    });

    it('contains only non-empty strings without duplicate entries', () => {
      const studentSet = new Set<string>();
      STUDENTS.forEach((student) => {
        expect(typeof student).toBe('string');
        expect(student.trim().length).toBeGreaterThan(0);
        expect(studentSet.has(student)).toBe(false);
        studentSet.add(student);
      });
    });
  });

  describe('GRAMMAR_TOPICS', () => {
    it('is a non-empty array of grammar topic configurations', () => {
      expect(Array.isArray(GRAMMAR_TOPICS)).toBe(true);
      expect(GRAMMAR_TOPICS.length).toBeGreaterThan(0);
    });

    it('has unique IDs across all grammar topics', () => {
      const ids = GRAMMAR_TOPICS.map((topic) => topic.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('ensures each grammar topic contains valid string fields and vocabulary array', () => {
      GRAMMAR_TOPICS.forEach((topic) => {
        expect(typeof topic.id).toBe('string');
        expect(topic.id.trim().length).toBeGreaterThan(0);

        expect(typeof topic.title).toBe('string');
        expect(topic.title.trim().length).toBeGreaterThan(0);

        expect(typeof topic.description).toBe('string');
        expect(topic.description.trim().length).toBeGreaterThan(0);

        expect(typeof topic.grammar).toBe('string');
        expect(topic.grammar.trim().length).toBeGreaterThan(0);

        expect(Array.isArray(topic.vocabulary)).toBe(true);
        expect(topic.vocabulary.length).toBeGreaterThan(0);
        topic.vocabulary.forEach((word) => {
          expect(typeof word).toBe('string');
          expect(word.trim().length).toBeGreaterThan(0);
        });

        expect(typeof topic.pronunciation).toBe('string');
        expect(topic.pronunciation.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('EXERCISES', () => {
    it('is a non-empty array of exercise items', () => {
      expect(Array.isArray(EXERCISES)).toBe(true);
      expect(EXERCISES.length).toBeGreaterThan(0);
    });

    it('has unique IDs across all exercises', () => {
      const ids = EXERCISES.map((ex) => ex.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('ensures every exercise has a question with a blank placeholder', () => {
      EXERCISES.forEach((ex) => {
        expect(typeof ex.question).toBe('string');
        expect(ex.question.trim().length).toBeGreaterThan(0);
        expect(ex.question).toMatch(/_+/);
      });
    });

    it('ensures every exercise has valid options and the answer is a valid index', () => {
      EXERCISES.forEach((ex) => {
        expect(Array.isArray(ex.options)).toBe(true);
        expect(ex.options.length).toBeGreaterThanOrEqual(2);
        ex.options.forEach((opt) => {
          expect(typeof opt).toBe('string');
          expect(opt.trim().length).toBeGreaterThan(0);
        });

        expect(Number.isInteger(ex.answer)).toBe(true);
        expect(ex.answer).toBeGreaterThanOrEqual(0);
        expect(ex.answer).toBeLessThan(ex.options.length);

        expect(typeof ex.explanation).toBe('string');
        expect(ex.explanation.trim().length).toBeGreaterThan(0);

        expect(typeof ex.pronunciation).toBe('string');
        expect(ex.pronunciation.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('TOPICS', () => {
    it('is a non-empty array of topic definitions', () => {
      expect(Array.isArray(TOPICS)).toBe(true);
      expect(TOPICS.length).toBeGreaterThan(0);
    });

    it('has unique IDs across all topics', () => {
      const ids = TOPICS.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('ensures each topic contains valid string fields and vocabulary list', () => {
      TOPICS.forEach((topic) => {
        expect(typeof topic.id).toBe('string');
        expect(topic.id.trim().length).toBeGreaterThan(0);

        expect(typeof topic.title).toBe('string');
        expect(topic.title.trim().length).toBeGreaterThan(0);

        expect(typeof topic.grammar).toBe('string');
        expect(topic.grammar.trim().length).toBeGreaterThan(0);

        expect(Array.isArray(topic.vocabulary)).toBe(true);
        expect(topic.vocabulary.length).toBeGreaterThan(0);
        topic.vocabulary.forEach((item) => {
          expect(typeof item).toBe('string');
          expect(item.trim().length).toBeGreaterThan(0);
        });

        expect(typeof topic.pronunciation).toBe('string');
        expect(topic.pronunciation.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('ROLES', () => {
    it('is a non-empty array of role configurations', () => {
      expect(Array.isArray(ROLES)).toBe(true);
      expect(ROLES.length).toBeGreaterThan(0);
    });

    it('has unique IDs across all roles', () => {
      const ids = ROLES.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('ensures each role contains valid fields with win and lose conditions', () => {
      ROLES.forEach((role) => {
        expect(typeof role.id).toBe('string');
        expect(role.id.trim().length).toBeGreaterThan(0);

        expect(typeof role.name).toBe('string');
        expect(role.name.trim().length).toBeGreaterThan(0);

        expect(typeof role.description).toBe('string');
        expect(role.description.trim().length).toBeGreaterThan(0);

        expect(typeof role.winCondition).toBe('string');
        expect(role.winCondition.trim().length).toBeGreaterThan(0);

        expect(typeof role.loseCondition).toBe('string');
        expect(role.loseCondition.trim().length).toBeGreaterThan(0);

        expect(typeof role.voice).toBe('string');
        expect(role.voice.trim().length).toBeGreaterThan(0);

        expect(typeof role.pronunciation).toBe('string');
        expect(role.pronunciation.trim().length).toBeGreaterThan(0);
      });
    });

    it('references existing topic IDs in TOPICS (referential integrity)', () => {
      const topicIds = new Set(TOPICS.map((topic) => topic.id));
      ROLES.forEach((role) => {
        expect(topicIds.has(role.topicId)).toBe(true);
      });
    });
  });
});

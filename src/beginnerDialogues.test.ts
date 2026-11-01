import { describe, it, expect } from "vitest";
import {
  BEGINNER_DIALOGUES,
  isDialogueLineArray,
  getTopicDialogue,
  type BeginnerDialogueLine
} from "./beginnerDialogues";

describe("beginnerDialogues", () => {
  describe("isDialogueLineArray", () => {
    it("returns true for a valid array of dialogue lines", () => {
      const valid: BeginnerDialogueLine[] = [
        { speaker: "user", en: "Hello", es: "Hola" },
        { speaker: "AI", en: "Welcome", es: "Bienvenido" }
      ];
      expect(isDialogueLineArray(valid)).toBe(true);
    });

    it("returns true for an empty array", () => {
      expect(isDialogueLineArray([])).toBe(true);
    });

    it("returns false for non-array values", () => {
      expect(isDialogueLineArray(null)).toBe(false);
      expect(isDialogueLineArray(undefined)).toBe(false);
      expect(isDialogueLineArray("string")).toBe(false);
      expect(isDialogueLineArray(123)).toBe(false);
      expect(isDialogueLineArray({})).toBe(false);
    });

    it("returns false if any element lacks a speaker property", () => {
      const invalid = [
        { speaker: "user", en: "Hello" },
        { text: "Missing speaker" }
      ];
      expect(isDialogueLineArray(invalid)).toBe(false);
    });

    it("returns false if array contains null or non-object items", () => {
      expect(isDialogueLineArray([null])).toBe(false);
      expect(isDialogueLineArray(["not an object"])).toBe(false);
    });
  });

  describe("getTopicDialogue", () => {
    it("returns null when roleId or topicId is missing or empty", () => {
      expect(getTopicDialogue(undefined, "topic1")).toBeNull();
      expect(getTopicDialogue("role1", undefined)).toBeNull();
      expect(getTopicDialogue("", "topic1")).toBeNull();
      expect(getTopicDialogue("role1", "")).toBeNull();
    });

    it("returns null when roleId is not in dialogues", () => {
      expect(getTopicDialogue("non_existent_role", "any_topic")).toBeNull();
    });

    it("returns null when role exists as standard array rather than topic map", () => {
      // In default BEGINNER_DIALOGUES, role entries are arrays of lines
      expect(getTopicDialogue("introduce_yourself", "t_a1_1")).toBeNull();
    });

    it("safely retrieves dialogue if nested topic mapping is provided", () => {
      const customDialogues: Record<string, unknown> = BEGINNER_DIALOGUES;
      customDialogues["test_role"] = {
        "test_topic": [
          { speaker: "user", en: "Hello", es: "Hola" },
          { speaker: "Alex", en: "Hi there", es: "Hola ahí" }
        ]
      };

      const result = getTopicDialogue("test_role", "test_topic");
      expect(result).not.toBeNull();
      expect(result).toHaveLength(2);
      expect(result?.[0].speaker).toBe("user");
      expect(result?.[0].en).toBe("Hello");

      delete customDialogues["test_role"];
    });
  });

  describe("BEGINNER_DIALOGUES object structure", () => {
    it("contains expected beginner role keys", () => {
      expect(BEGINNER_DIALOGUES).toHaveProperty("introduce_yourself");
      expect(BEGINNER_DIALOGUES).toHaveProperty("cafe_order");
      expect(BEGINNER_DIALOGUES).toHaveProperty("supermarket_clerk");
    });

    it("all entries contain valid dialogue lines with speaker and text", () => {
      for (const [roleId, lines] of Object.entries(BEGINNER_DIALOGUES)) {
        expect(Array.isArray(lines)).toBe(true);
        expect(lines.length).toBeGreaterThan(0);
        for (const line of lines) {
          expect(typeof line.speaker).toBe("string");
          expect(typeof line.text).toBe("string");
        }
      }
    });
  });
});

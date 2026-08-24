import { getScheduledTimesForFrequency, calculateNextRunDate } from '../utils/frequency.js';
import { timeStringToMinutes, minutesToTimeString, isSlotDuringBreak } from '../utils/datetime.js';
import { encryptText, decryptText } from '../utils/crypto.js';
import { ReminderFrequency } from '@prisma/client';

describe('Core Unit & Domain Logic Tests', () => {
  describe('Medication Frequency Engine (utils/frequency.ts)', () => {
    it('should generate correct scheduled times for all dosage frequencies', () => {
      expect(getScheduledTimesForFrequency(ReminderFrequency.ONCE_DAILY)).toEqual(['08:00']);
      expect(getScheduledTimesForFrequency(ReminderFrequency.TWICE_DAILY)).toEqual(['08:00', '20:00']);
      expect(getScheduledTimesForFrequency(ReminderFrequency.THREE_TIMES_DAILY)).toEqual(['08:00', '14:00', '20:00']);
      expect(getScheduledTimesForFrequency(ReminderFrequency.EVERY_8_HOURS)).toEqual(['06:00', '14:00', '22:00']);
      expect(getScheduledTimesForFrequency(ReminderFrequency.EVERY_12_HOURS)).toEqual(['08:00', '20:00']);
      expect(getScheduledTimesForFrequency(ReminderFrequency.CUSTOM)).toEqual(['09:00']);
    });

    it('should calculate deterministic nextRunDate for future times', () => {
      const fixedBaseDate = new Date('2026-08-24T06:00:00.000Z');
      const nextRun = calculateNextRunDate('08:00', fixedBaseDate);
      expect(nextRun.getUTCHours()).toBe(8);
      expect(nextRun.getUTCMinutes()).toBe(0);
      expect(nextRun.getUTCDate()).toBe(24);
    });

    it('should advance to the next calendar day if the scheduled time has already passed in UTC', () => {
      const fixedBaseDate = new Date('2026-08-24T21:00:00.000Z');
      const nextRun = calculateNextRunDate('08:00', fixedBaseDate);
      expect(nextRun.getUTCDate()).toBe(25);
      expect(nextRun.getUTCHours()).toBe(8);
    });
  });

  describe('Datetime & Break Interval Engine (utils/datetime.ts)', () => {
    it('should accurately convert time strings to minutes and back', () => {
      expect(timeStringToMinutes('09:30')).toBe(570);
      expect(timeStringToMinutes('00:00')).toBe(0);
      expect(timeStringToMinutes('23:59')).toBe(1439);
      expect(minutesToTimeString(570)).toBe('09:30');
    });

    it('should detect when a slot overlaps with a doctor break interval', () => {
      const breakStart = '13:00'; // 780 min
      const breakEnd = '14:00';   // 840 min

      // Slot 13:00 - 13:30 (inside break)
      expect(isSlotDuringBreak(780, 810, breakStart, breakEnd)).toBe(true);

      // Slot 13:30 - 14:00 (inside break)
      expect(isSlotDuringBreak(810, 840, breakStart, breakEnd)).toBe(true);

      // Slot 12:30 - 13:00 (before break)
      expect(isSlotDuringBreak(750, 780, breakStart, breakEnd)).toBe(false);

      // Slot 14:00 - 14:30 (after break)
      expect(isSlotDuringBreak(840, 870, breakStart, breakEnd)).toBe(false);
    });
  });

  describe('AES-256-GCM Token Encryption (utils/crypto.ts)', () => {
    it('should encrypt and decrypt OAuth tokens with authentication tag validation', () => {
      const originalSecret = 'ya29.a0AfH6SMD-google-oauth-access-token-sample-12345';
      const encrypted = encryptText(originalSecret);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toEqual(originalSecret);
      expect(encrypted.split(':').length).toBe(3); // iv:authTag:ciphertext

      const decrypted = decryptText(encrypted);
      expect(decrypted).toEqual(originalSecret);
    });

    it('should fail decryption if payload format is tampered with', () => {
      expect(() => decryptText('invalid-tampered-string')).toThrow();
    });
  });
});

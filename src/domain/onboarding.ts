import { z } from "zod";

export const onboardingSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  city: z.string().trim().min(1).max(120),
  university: z.string().trim().min(1).max(180),
  citizenshipCountry: z.string().trim().min(2).max(120),
  arrivalDate: z.string().date(),
  birthYear: z.number().int().min(1990).max(2012),
  housingStatus: z.enum(["searching", "shortlisted", "secured"]),
  monthlyRentEur: z.number().nonnegative().max(10000).optional(),
  addressRegistrable: z.boolean().optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

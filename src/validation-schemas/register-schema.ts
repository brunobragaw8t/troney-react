import z from "zod";
import { passwordSchema } from "./password-schema";

export const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(50, "Name is too long"),
    email: z.email("Invalid email address"),
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  });

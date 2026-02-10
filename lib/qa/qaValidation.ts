import * as yup from "yup";

// Question validation schemas
export const createQuestionSchema = yup.object({
  title: yup
    .string()
    .required("Title is required")
    .min(10, "Title must be at least 10 characters")
    .max(200, "Title must not exceed 200 characters"),
  content: yup
    .string()
    .required("Content is required")
    .min(20, "Content must be at least 20 characters")
    .max(5000, "Content must not exceed 5000 characters"),
});

export const updateQuestionSchema = yup.object({
  title: yup.string().min(10).max(200),
  content: yup.string().min(20).max(5000),
});

// Answer validation schemas
export const createAnswerSchema = yup.object({
  content: yup
    .string()
    .required("Answer content is required")
    .min(20, "Answer must be at least 20 characters")
    .max(5000, "Answer must not exceed 5000 characters"),
});

export const updateAnswerSchema = yup.object({
  content: yup.string().min(20).max(5000),
});

// Vote validation
export const voteSchema = yup.object({
  value: yup.number().oneOf([1, -1], "Vote must be 1 or -1").required(),
});

// Content sanitization for XSS prevention
export function sanitizeContent(text: string): string {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

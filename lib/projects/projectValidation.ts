import * as yup from "yup";

// Project validation schemas
export const createProjectSchema = yup.object({
  title: yup
    .string()
    .required("Title is required")
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must not exceed 200 characters"),
  description: yup
    .string()
    .required("Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must not exceed 5000 characters"),
  coverImage: yup.string().url("Must be a valid URL").nullable(),
  category: yup.string().nullable(),
  tags: yup
    .array()
    .of(yup.string())
    .max(10, "Maximum 10 tags allowed")
    .nullable(),
  isPublished: yup.boolean(),
  sections: yup.array().of(
    yup.object({
      order: yup.number().required(),
      title: yup.string().required("Section title is required").max(200),
      content: yup
        .string()
        .required("Section content is required")
        .max(10000, "Section content too long"),
      images: yup.array().of(yup.string().url()).max(3, "Max 3 images per section"),
      videoUrl: yup.string().url("Must be a valid URL").nullable(),
      videoType: yup.string().oneOf(["youtube", "vimeo", "other"]).nullable(),
      websiteUrl: yup.string().url("Must be a valid URL").nullable(),
    })
  ),
});

export const updateProjectSchema = yup.object({
  title: yup.string().min(3).max(200),
  description: yup.string().min(10).max(5000),
  coverImage: yup.string().url().nullable(),
  category: yup.string().nullable(),
  tags: yup.array().of(yup.string()).max(10).nullable(),
  isPublished: yup.boolean(),
  sections: yup.array().of(
    yup.object({
      order: yup.number().required(),
      title: yup.string().required("Section title is required").max(200),
      content: yup
        .string()
        .required("Section content is required")
        .max(10000, "Section content too long"),
      images: yup.array().of(yup.string().url()).max(3, "Max 3 images per section"),
      videoUrl: yup.string().url("Must be a valid URL").nullable(),
      videoType: yup.string().oneOf(["youtube", "vimeo", "other"]).nullable(),
      websiteUrl: yup.string().url("Must be a valid URL").nullable(),
    })
  ),
});

export const projectSectionSchema = yup.object({
  order: yup.number().required(),
  title: yup.string().required().max(200),
  content: yup.string().required().max(10000),
  images: yup.array().of(yup.string().url()).max(3).nullable(),
  videoUrl: yup.string().url().nullable(),
  videoType: yup.string().oneOf(["youtube", "vimeo", "other"]).nullable(),
  websiteUrl: yup.string().url().nullable(),
});

export const projectCommentSchema = yup.object({
  content: yup
    .string()
    .required("Comment is required")
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must not exceed 1000 characters"),
});

// XSS sanitization helper
export function sanitizeHtml(text: string): string {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

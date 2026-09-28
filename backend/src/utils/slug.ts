/**
 * Converts any string into a URL-safe slug.
 * e.g. "My Customer Feedback Form!" -> "my-customer-feedback-form"
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

/**
 * Converts a question label into a stable machine-readable field_name.
 * e.g. "What is your name?" -> "what_is_your_name"
 */
export const generateFieldName = (label: string): string => {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
};

/**
 * Appends a suffix to a slug to make it unique on collision.
 * e.g. "my-form" -> "my-form-2"
 */
export const makeSlugUnique = (slug: string, suffix: number): string => {
  return `${slug}-${suffix}`;
};

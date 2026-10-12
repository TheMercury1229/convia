import type { QuestionType, QuestionOption } from "@/types/builder";
import type { FormWithSections, ApiQuestion } from "@/lib/api/forms";

export interface TemplateQuestion {
  id: string;
  fieldName: string;
  label: string;
  description?: string;
  placeholder?: string;
  type: QuestionType;
  required?: boolean;
  options?: QuestionOption[];
}

export interface FormTemplate {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: "Feedback" | "Events" | "Hiring & HR" | "Product" | "Sales & Marketing" | "Internal";
  themeId: "nova" | "alpha" | "puma" | "vega" | "zen" | "bubble";
  questionCount: number;
  estimatedMinutes: number;
  features: string[];
  completionTitle: string;
  completionMessage: string;
  questions: TemplateQuestion[];
}

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "tpl-csat-feedback",
    slug: "customer-satisfaction-csat",
    title: "Customer Satisfaction & Feedback (CSAT)",
    description: "Measure customer sentiment, benchmark Net Promoter Score (NPS), and uncover qualitative product suggestions with conversational prompts.",
    category: "Feedback",
    themeId: "vega",
    questionCount: 5,
    estimatedMinutes: 2,
    features: ["5-Star Rating", "0-10 NPS Scale", "AI Assisted Fill"],
    completionTitle: "Thank you for sharing your thoughts!",
    completionMessage: "Your feedback directly helps us improve Convia every day.",
    questions: [
      {
        id: "q1",
        fieldName: "overall_satisfaction",
        label: "How would you rate your overall experience with Convia?",
        description: "Rate from 1 to 5 stars",
        type: "rating",
        required: true,
      },
      {
        id: "q2",
        fieldName: "nps_score",
        label: "How likely are you to recommend Convia to colleagues or industry peers?",
        description: "Scale of 0 (not likely) to 10 (extremely likely)",
        type: "scale",
        required: true,
      },
      {
        id: "q3",
        fieldName: "favorite_feature",
        label: "Which specific feature or capability provided the most value to you?",
        placeholder: "e.g. AI-driven form filling, intuitive drag and drop builder...",
        type: "text",
        required: false,
      },
      {
        id: "q4",
        fieldName: "areas_for_improvement",
        label: "What was your biggest friction point or something we could improve?",
        description: "All constructive feedback directly informs our product roadmap.",
        placeholder: "Tell us what could be better...",
        type: "textarea",
        required: true,
      },
      {
        id: "q5",
        fieldName: "contact_email",
        label: "What is your email if you'd like our product team to follow up with you?",
        description: "Optional contact email",
        placeholder: "you@company.com",
        type: "email",
        required: false,
      },
    ],
  },
  {
    id: "tpl-event-rsvp",
    slug: "event-rsvp-registration",
    title: "Summit & Conference RSVP Registration",
    description: "Streamline attendee registration with ticket tier selection, dietary preferences, and interactive session RSVPs.",
    category: "Events",
    themeId: "bubble",
    questionCount: 6,
    estimatedMinutes: 3,
    features: ["Single & Multi Choice", "Dropdown Select", "Conversational Welcome"],
    completionTitle: "You're registered for the Summit!",
    completionMessage: "We've confirmed your spot. Check your email for ticket details and event access.",
    questions: [
      {
        id: "q1",
        fieldName: "full_name",
        label: "What is your full legal or preferred name?",
        placeholder: "Jane Doe",
        type: "text",
        required: true,
      },
      {
        id: "q2",
        fieldName: "work_email",
        label: "What email should we send your digital badge and ticket confirmation to?",
        placeholder: "jane@company.com",
        type: "email",
        required: true,
      },
      {
        id: "q3",
        fieldName: "attendance_mode",
        label: "Will you be attending in person in San Francisco or streaming virtually?",
        type: "radio",
        options: [
          { id: "opt-0", label: "In-Person (San Francisco HQ)" },
          { id: "opt-1", label: "Virtual Livestream (Global)" },
        ],
        required: true,
      },
      {
        id: "q4",
        fieldName: "breakout_track",
        label: "Which breakout track are you planning to attend?",
        type: "select",
        options: [
          { id: "opt-0", label: "Track A: Conversational AI & NLP" },
          { id: "opt-1", label: "Track B: Product Architecture & Scale" },
          { id: "opt-2", label: "Track C: Growth & Lead Gen Systems" },
        ],
        required: true,
      },
      {
        id: "q5",
        fieldName: "dietary_needs",
        label: "Do you have any dietary restrictions for catered lunch?",
        type: "checkbox",
        options: [
          { id: "opt-0", label: "No Restrictions" },
          { id: "opt-1", label: "Vegetarian" },
          { id: "opt-2", label: "Vegan" },
          { id: "opt-3", label: "Gluten-Free" },
          { id: "opt-4", label: "Halal / Kosher" },
        ],
        required: false,
      },
      {
        id: "q6",
        fieldName: "keynote_question",
        label: "Any question or topic you want addressed during the speaker Q&A?",
        placeholder: "What would you like to ask our panel...",
        type: "textarea",
        required: false,
      },
    ],
  },
  {
    id: "tpl-job-application",
    slug: "job-application-screening",
    title: "Job Application & Candidate Intake",
    description: "Screen candidates efficiently with role alignment, portfolio links, salary expectations, and PDF resume submissions.",
    category: "Hiring & HR",
    themeId: "alpha",
    questionCount: 7,
    estimatedMinutes: 4,
    features: ["File Upload", "URL Validation", "Number Input"],
    completionTitle: "Application submitted successfully!",
    completionMessage: "Our recruiting team will review your application and be in touch within 3 business days.",
    questions: [
      {
        id: "q1",
        fieldName: "applicant_name",
        label: "What is your full name?",
        placeholder: "Alex Rivera",
        type: "text",
        required: true,
      },
      {
        id: "q2",
        fieldName: "applicant_email",
        label: "What email address should our talent team reach out to?",
        placeholder: "alex@example.com",
        type: "email",
        required: true,
      },
      {
        id: "q3",
        fieldName: "portfolio_url",
        label: "Please share a link to your LinkedIn, GitHub, or personal portfolio.",
        placeholder: "https://linkedin.com/in/username",
        type: "url",
        required: true,
      },
      {
        id: "q4",
        fieldName: "years_experience",
        label: "How many years of relevant professional experience do you have?",
        placeholder: "e.g. 5",
        type: "number",
        required: true,
      },
      {
        id: "q5",
        fieldName: "core_discipline",
        label: "Which core discipline best matches your primary skill set?",
        type: "select",
        options: [
          { id: "opt-0", label: "Fullstack Software Engineering" },
          { id: "opt-1", label: "AI / ML Systems" },
          { id: "opt-2", label: "Product Design (UI/UX)" },
          { id: "opt-3", label: "Product Management" },
        ],
        required: true,
      },
      {
        id: "q6",
        fieldName: "compensation_expectation",
        label: "What is your expected target compensation range (USD annual)?",
        type: "radio",
        options: [
          { id: "opt-0", label: "$100k - $140k" },
          { id: "opt-1", label: "$140k - $180k" },
          { id: "opt-2", label: "$180k - $220k" },
          { id: "opt-3", label: "$220k+" },
        ],
        required: false,
      },
      {
        id: "q7",
        fieldName: "resume_file",
        label: "Please upload your resume or CV (PDF format).",
        description: "Accepted formats: PDF, DOCX up to 10MB",
        type: "file",
        required: true,
      },
    ],
  },
  {
    id: "tpl-product-research",
    slug: "product-discovery-market-research",
    title: "Product Discovery & Market Research",
    description: "Validate customer demand for prospective features, analyze competitive alternatives, and identify core pain points.",
    category: "Product",
    themeId: "puma",
    questionCount: 6,
    estimatedMinutes: 3,
    features: ["Yes/No Toggle", "Rating Matrix", "Multi Choice"],
    completionTitle: "Thank you for participating!",
    completionMessage: "Your input is instrumental in shaping the next release of our product.",
    questions: [
      {
        id: "q1",
        fieldName: "company_size",
        label: "What is the approximate size of your company or organization?",
        type: "radio",
        options: [
          { id: "opt-0", label: "1 - 10 employees" },
          { id: "opt-1", label: "11 - 50 employees" },
          { id: "opt-2", label: "51 - 200 employees" },
          { id: "opt-3", label: "201 - 1,000 employees" },
          { id: "opt-4", label: "1,000+ employees" },
        ],
        required: true,
      },
      {
        id: "q2",
        fieldName: "current_stack",
        label: "Which tools does your team currently utilize for interactive forms and surveys?",
        placeholder: "e.g. Typeform, Google Forms, HubSpot, Qualtrics...",
        type: "text",
        required: true,
      },
      {
        id: "q3",
        fieldName: "core_headache",
        label: "What is the single biggest bottleneck you encounter when collecting respondent data?",
        placeholder: "Describe your team's workflow pain points...",
        type: "textarea",
        required: true,
      },
      {
        id: "q4",
        fieldName: "ai_importance",
        label: "How valuable would an autonomous conversational agent be for your completion rates?",
        description: "Scale of 1 (Not valuable) to 5 (Game changer)",
        type: "rating",
        required: true,
      },
      {
        id: "q5",
        fieldName: "monthly_budget",
        label: "What monthly software budget does your department allocate for workflow tools?",
        type: "radio",
        options: [
          { id: "opt-0", label: "Under $50 / month" },
          { id: "opt-1", label: "$50 - $200 / month" },
          { id: "opt-2", label: "$200 - $1,000 / month" },
          { id: "opt-3", label: "$1,000+ / month" },
        ],
        required: false,
      },
      {
        id: "q6",
        fieldName: "research_call_optin",
        label: "Would you be interested in participating in a 20-minute user research call for a $50 gift card?",
        type: "yes_no",
        required: false,
      },
    ],
  },
  {
    id: "tpl-b2b-lead-gen",
    slug: "b2b-inbound-lead-qualification",
    title: "B2B Inbound Lead Qualification",
    description: "Engage prospective enterprise clients, qualify budget and timeline, and route high-intent leads to your sales team.",
    category: "Sales & Marketing",
    themeId: "nova",
    questionCount: 5,
    estimatedMinutes: 2,
    features: ["Smart Email Validation", "Budget & Seats Routing", "Single Choice"],
    completionTitle: "We received your inquiry!",
    completionMessage: "An account executive specializing in your industry will reach out shortly.",
    questions: [
      {
        id: "q1",
        fieldName: "work_email",
        label: "What is your business work email address?",
        placeholder: "name@company.com",
        type: "email",
        required: true,
      },
      {
        id: "q2",
        fieldName: "company_details",
        label: "What is your company name and website domain?",
        placeholder: "Acme Corp (acme.com)",
        type: "text",
        required: true,
      },
      {
        id: "q3",
        fieldName: "seats_required",
        label: "How many team members would require seats on the platform?",
        type: "radio",
        options: [
          { id: "opt-0", label: "1 - 5 seats" },
          { id: "opt-1", label: "6 - 25 seats" },
          { id: "opt-2", label: "26 - 100 seats" },
          { id: "opt-3", label: "100+ Enterprise seats" },
        ],
        required: true,
      },
      {
        id: "q4",
        fieldName: "rollout_timeline",
        label: "What is your anticipated timeline for rolling out this solution?",
        type: "select",
        options: [
          { id: "opt-0", label: "Immediately (within 2 weeks)" },
          { id: "opt-1", label: "Within 1 - 2 months" },
          { id: "opt-2", label: "Next quarter" },
          { id: "opt-3", label: "Just exploring solutions" },
        ],
        required: true,
      },
      {
        id: "q5",
        fieldName: "project_objective",
        label: "Briefly describe your main project objective or required integrations.",
        placeholder: "We are looking to integrate with our CRM and automate responses...",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    id: "tpl-peer-review",
    slug: "peer-performance-review-360",
    title: "360° Peer Review & Growth Feedback",
    description: "Conduct comprehensive quarterly peer evaluations with structured competencies, leadership ratings, and growth milestones.",
    category: "Internal",
    themeId: "zen",
    questionCount: 6,
    estimatedMinutes: 3,
    features: ["Competency Ratings", "Long Text Reviews", "Confidential Feedback"],
    completionTitle: "Peer evaluation submitted",
    completionMessage: "Your constructive evaluation has been safely recorded for performance review calibration.",
    questions: [
      {
        id: "q1",
        fieldName: "reviewee_name",
        label: "Who are you completing this peer review for?",
        placeholder: "Colleague's full name",
        type: "text",
        required: true,
      },
      {
        id: "q2",
        fieldName: "collaboration_rating",
        label: "How would you rate their overall collaboration and communication clarity?",
        description: "Scale of 1 (Needs Improvement) to 5 (Exemplary)",
        type: "rating",
        required: true,
      },
      {
        id: "q3",
        fieldName: "key_achievements",
        label: "Highlight 1 or 2 specific projects where this colleague delivered strong impact.",
        placeholder: "They led the project initiative by...",
        type: "textarea",
        required: true,
      },
      {
        id: "q4",
        fieldName: "growth_areas",
        label: "What is one constructive area or skill where they could level up next quarter?",
        placeholder: "An opportunity for development is...",
        type: "textarea",
        required: true,
      },
      {
        id: "q5",
        fieldName: "ambiguity_resilience",
        label: "How effectively do they navigate ambiguity or tight delivery deadlines?",
        description: "Scale of 1 to 5 stars",
        type: "rating",
        required: true,
      },
      {
        id: "q6",
        fieldName: "manager_confidential_notes",
        label: "Any confidential comments or praise you would like to share with their manager?",
        placeholder: "Only visible to managers during calibration...",
        type: "textarea",
        required: false,
      },
    ],
  },
];

export function getTemplateById(idOrSlug: string): FormTemplate | undefined {
  if (!idOrSlug) return undefined;
  const normalized = idOrSlug.toLowerCase();
  return FORM_TEMPLATES.find(
    (t) => t.id.toLowerCase() === normalized || t.slug.toLowerCase() === normalized
  );
}

export function templateToFormWithSections(template: FormTemplate): FormWithSections {
  const apiQuestions: ApiQuestion[] = template.questions.map((q, idx) => {
    return {
      id: `${template.id}-${q.id}`,
      sectionId: `sec-${template.id}`,
      formId: template.id,
      fieldName: q.fieldName || q.id,
      label: q.label,
      description: q.description || null,
      placeholder: q.placeholder || null,
      type: q.type,
      isRequired: q.required ?? false,
      position: idx,
      options: q.options && q.options.length > 0 ? q.options : undefined,
      validation: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  return {
    id: template.id,
    title: template.title,
    description: template.description,
    slug: template.slug,
    isPublished: true,
    deadline: null,
    maxResponses: null,
    redirectUrl: null,
    completionTitle: template.completionTitle,
    completionMessage: template.completionMessage,
    themeId: template.themeId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    orgId: "template-org",
    responseCount: 0,
    sections: [
      {
        id: `sec-${template.id}`,
        formId: template.id,
        title: "Main Questions",
        description: null,
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        questions: apiQuestions,
      },
    ],
  };
}

# AI-Native Form Builder — User Stories

I'd keep the product centered around **three actors**:

- **Form creator** — creates, publishes and analyzes forms.
- **Respondent** — fills/submits forms.
- **AI** — assists creation, filling and analysis.

---

## Epic 1 — Form creation

### Basic form builder

- **US-01** — As a form creator, I want to create a new form so that I can collect responses.
- **US-02** — As a form creator, I want to give my form a title and description.
- **US-03** — As a form creator, I want to add questions to my form.
- **US-04** — As a form creator, I want to choose the appropriate question/field type for each question.
- **US-05** — As a form creator, I want to mark questions as required or optional.
- **US-06** — As a form creator, I want to configure question-specific options and validation.
- **US-07** — As a form creator, I want to reorder questions.
- **US-08** — As a form creator, I want to edit or delete questions.
- **US-09** — As a form creator, I want to preview my form before publishing it.
- **US-10** — As a form creator, I want to save my form as a draft.

This is deliberately the boring foundation. Your AI features depend on having a proper underlying form schema.

---

# Epic 2 — AI form generation ⭐

This is your first genuinely differentiated workflow.

- **US-11** — As a form creator, I want to describe the form I need in natural language so that AI can create the initial form for me.

Example:

> "Create a customer feedback form with a rating, what they liked, what they disliked, and an optional suggestion."

- **US-12** — As a form creator, I want AI to convert my description into appropriate questions and field types.
- **US-13** — As a form creator, I want to preview the AI-generated form before publishing it.
- **US-14** — As a form creator, I want to manually edit the generated form.
- **US-15** — As a form creator, I want to ask AI to modify the generated form based on additional instructions.

For example:

> "Add a question asking whether they would recommend us."

- **US-16** — As a form creator, I want the AI-generated form to remain editable through the normal form builder.

The important principle here is:

**AI generates → human reviews → human publishes.**

You're not making the LLM the authority over the final schema.

---

# Epic 3 — Publishing

- **US-17** — As a form creator, I want to publish a completed form so respondents can access it.
- **US-18** — As a form creator, I want to obtain a shareable link to my published form.
- **US-19** — As a form creator, I want to close/unpublish a form.
- **US-20** — As a form creator, I want to configure a submission deadline for my form.
- **US-21** — As a respondent, I want to know when a form is no longer accepting submissions.
- **US-22** — As a system, I want to reject submissions that arrive after the configured deadline.

### Your FCFS edge case

I'd explicitly put this in the technical acceptance criteria rather than make it another user story:

> If multiple submissions race with the deadline, the system accepts the first valid submission processed according to the server's ordering/transaction semantics and rejects the others with a form-expired response where applicable.

You don't need some elaborate distributed-consensus solution for a personal project.

---

# Epic 4 — Normal form filling

- **US-23** — As a respondent, I want to open a published form through its link.
- **US-24** — As a respondent, I want to answer questions using the normal form interface.
- **US-25** — As a respondent, I want to know when my answer doesn't satisfy a field's validation requirements.
- **US-26** — As a respondent, I want to review my answers before submitting.
- **US-27** — As a respondent, I want confirmation after successfully submitting my response.
- **US-28** — As a respondent, I want to receive an appropriate message if I try to submit after the form deadline.

---

# Epic 5 — AI-assisted form filling ⭐⭐⭐

This is probably the most interesting part of the entire project.

- **US-29** — As a respondent, I want to choose **Fill with AI** instead of filling the form manually.
- **US-30** — As a respondent, I want the AI to ask me the form's questions conversationally.
- **US-31** — As a respondent, I want to answer questions naturally rather than having to format my answers according to the form.
- **US-32** — As a respondent, I want AI to understand my natural-language answer and map it to the corresponding form field.
- **US-33** — As a respondent, I want AI to ask a follow-up question when my answer doesn't provide enough information.
- **US-34** — As a respondent, I don't want AI to unnecessarily ask me for information that I have already provided during the conversation.
- **US-35** — As a respondent, I want AI to continue asking questions until the information required by the form has been collected.
- **US-36** — As a respondent, I want to see the structured answers that AI has filled in for me.
- **US-37** — As a respondent, I want to correct AI's interpretation before submitting the form.
- **US-38** — As a respondent, I want to submit the completed form after reviewing the AI-filled responses.

The key architecture underneath this is essentially:

**Form schema → conversational interaction → structured response object**

The LLM isn't creating an arbitrary blob of text. It's filling your actual form schema.

---

# Epic 6 — Response management

Your original requirement was also that it should behave like a proper form builder, including exporting the data.

- **US-39** — As a form creator, I want to see all responses submitted to my form.
- **US-40** — As a form creator, I want to view an individual response.
- **US-41** — As a form creator, I want to search/filter responses.
- **US-42** — As a form creator, I want to export my responses.
- **US-43** — As a form creator, I want exported responses to preserve the form's field structure.

You can decide later whether export means CSV, JSON, XLSX, etc. Don't over-specify it yet.

---

# Epic 7 — AI response analysis ⭐⭐

This is your third AI-native capability.

- **US-44** — As a form creator, I want AI to analyze the responses collected by my form.
- **US-45** — As a form creator, I want AI to summarize the collected responses.
- **US-46** — As a form creator, I want AI to identify common themes across responses.
- **US-47** — As a form creator, I want AI to identify notable patterns in the responses.
- **US-48** — As a form creator, I want AI to aggregate relevant information across responses.
- **US-49** — As a form creator, I want to ask questions about the collected responses in natural language.

For example:

> "What were the most common complaints?"

> "Summarize what people liked about the event."

> "What are the major themes in the feedback?"

This is much more interesting than simply putting a "Summarize" button over a CSV.

---

# Epic 8 — Form dashboard

- **US-50** — As a form creator, I want to see all the forms I've created.
- **US-51** — As a form creator, I want to distinguish between draft, published and closed forms.
- **US-52** — As a form creator, I want to see how many responses each form has received.
- **US-53** — As a form creator, I want to open a form and manage its responses.
- **US-54** — As a form creator, I want to duplicate an existing form.
- **US-55** — As a form creator, I want to delete a form.

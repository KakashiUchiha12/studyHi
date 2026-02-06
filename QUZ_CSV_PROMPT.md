# Quiz CSV Generation Prompt

Use this prompt with any LLM (like Gemini, ChatGPT, or Claude) to convert your questions into the correct CSV format for importing into the LMS.

---

**Prompt:**

Act as an expert educational content creator. I have a list of questions, answers, and explanations. Please convert them into a CSV format following these EXACT rules:

1. **Columns**: Header must be exactly: `Question,Options,Correct Answers,Explanation`
2. **Options**: Multiple options must be separated by a pipe (`|`). Example: `Option 1|Option 2|Option 3`
3. **Correct Answers**: Provide the exact text of the correct option(s). If multiple, separate by a pipe (`|`).
4. **Quoting**: If any text contains a comma, wrap the entire field in double quotes (`"`).
5. **No Extra Text**: Provide ONLY the CSV block, no preamble or explanation.

**Here is the content to convert:**

[PASTE YOUR QUESTIONS/ANSWERS HERE]

---

**Example Output:**

```csv
Question,Options,Correct Answers,Explanation
"What is the capital of France?",Paris|London|Berlin|Madrid,Paris,Paris is the capital and most populous city of France.
"Which of these are programming languages?",Python|HTML|Java|CSS,Python|Java,"Python and Java are programming languages, while HTML and CSS are markup/styling languages."
```

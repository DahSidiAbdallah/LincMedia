'use server';

/**
 * @fileOverview This file defines a Genkit flow to optimize scroll transitions between sections on a landing page.
 * The LLM analyzes the sections to determine optimal transition speeds to prevent disorientation or motion sickness.
 *
 * - optimizeScrollTransitions - A function that optimizes scroll transitions.
 * - OptimizeScrollTransitionsInput - The input type for the optimizeScrollTransitions function.
 * - OptimizeScrollTransitionsOutput - The return type for the optimizeScrollTransitions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeScrollTransitionsInputSchema = z.object({
  sectionDetails: z.array(
    z.object({
      sectionName: z.string().describe('The name or identifier of the section.'),
      contentDescription: z.string().describe('A brief description of the section content.'),
      elementCount: z.number().describe('The number of elements in the section.'),
      averageElementComplexity: z.number().describe('A numerical value representing the average complexity of elements in the section (e.g., 1-10).'),
    })
  ).describe('An array of section details for the landing page.'),
});

export type OptimizeScrollTransitionsInput = z.infer<typeof OptimizeScrollTransitionsInputSchema>;

const OptimizeScrollTransitionsOutputSchema = z.array(
  z.object({
    sectionName: z.string().describe('The name or identifier of the section.'),
    suggestedTransitionSpeed: z.number().describe('The suggested transition speed in milliseconds for the section.'),
    reasoning: z.string().describe('The reasoning behind the suggested transition speed.'),
  })
);

export type OptimizeScrollTransitionsOutput = z.infer<typeof OptimizeScrollTransitionsOutputSchema>;

export async function optimizeScrollTransitions(input: OptimizeScrollTransitionsInput): Promise<OptimizeScrollTransitionsOutput> {
  return optimizeScrollTransitionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeScrollTransitionsPrompt',
  input: { schema: OptimizeScrollTransitionsInputSchema },
  output: { schema: OptimizeScrollTransitionsOutputSchema },
  prompt: `You are an expert in UX design, specifically in creating smooth and comfortable scrolling experiences for landing pages. Analyze the following section details and suggest optimal transition speeds (in milliseconds) for each section to prevent disorientation or motion sickness. Provide your reasoning for each suggested speed.  The output should be a valid JSON array.

Here are the section details:
{{#each sectionDetails}}
- Section Name: {{this.sectionName}}
  - Content Description: {{this.contentDescription}}
  - Element Count: {{this.elementCount}}
  - Average Element Complexity: {{this.averageElementComplexity}}
{{/each}}

Consider the following factors when determining transition speeds:
- Content complexity: Sections with more complex content may require slower transitions.
- Element count: Sections with a higher number of elements may benefit from slightly faster transitions, but not so fast as to disorient the user.
- Overall flow: Aim for a consistent and smooth scrolling experience across all sections.

Respond with a JSON array of objects, each containing the sectionName, suggestedTransitionSpeed, and reasoning.
`,
});

const optimizeScrollTransitionsFlow = ai.defineFlow(
  {
    name: 'optimizeScrollTransitionsFlow',
    inputSchema: OptimizeScrollTransitionsInputSchema,
    outputSchema: OptimizeScrollTransitionsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);

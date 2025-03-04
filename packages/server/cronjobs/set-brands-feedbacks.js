const prisma = require('../src/prisma');
const OpenAIApi = require('openai');
const openai = new OpenAIApi({ key: process.env.OPENAI_API_KEY });

async function setBrandsFeedbacks() {
  try {
    // Get all brands with their feedback
    const brands = await prisma.brands.findMany({
      select: {
        id: true,
        description: true,
        usersFeedback: true
      }
    });

    for (const brand of brands) {
      if (!brand.usersFeedback || brand.usersFeedback.length === 0) {
        continue;
      }

      const prompt = `You are analyzing customer feedback for a brand. The brand description is: ${JSON.stringify(brand.description)}

Here are all the feedback entries:
${JSON.stringify(brand.usersFeedback.map(f => f.text))}

Please select up to 3 of the most meaningful and well-written pieces of feedback. Consider:
1. Relevance to the brand's description
2. No insults or inappropriate content
3. Clear and coherent writing
4. Meaningful insights or experiences

Return only a JSON array with indices corresponding to the position of the best feedback entries in the original array (e.g. [1, 0] for two good feedbacks where 1 is best and 0 is second best). Only include indices for genuinely good feedback - if some feedback is inappropriate or poorly written, exclude it.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini-2024-07-18",
        messages: [
          {
            role: "system",
            content: "You select the best feedback entries. Return only indices of good quality feedback, up to 3 entries."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0
      });

      const indices = JSON.parse(completion.choices[0].message.content.trim());

      // Update the feedback indices
      const updatedFeedback = [...brand.usersFeedback];
      updatedFeedback.forEach((feedback, i) => {
        const position = indices.indexOf(i);
        feedback.index = position >= 0 ? position : null;
      });

      // Update the brand with new feedback indices
      await prisma.brands.update({
        where: { id: brand.id },
        data: {
          usersFeedback: updatedFeedback
        }
      });
    }

    console.log('Successfully updated brands feedback indices');
  } catch (error) {
    console.error('Error updating brands feedback:', error);
  }
}

// Export the function to be called by the scheduler
module.exports = setBrandsFeedbacks;



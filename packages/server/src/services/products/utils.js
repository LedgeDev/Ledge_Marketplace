const OpenAIApi = require('openai');
const openai = new OpenAIApi({ key: process.env.OPENAI_API_KEY });

// Add a function for image analysis
async function analyzeImage(imageBase64) {
  try {
    // Check if the image is too large and potentially resize it further
    if (imageBase64.length > 1000000) { // If larger than ~1MB
      console.log("Image is large, consider further optimization on client");
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "You are an expert at identifying objects in images and estimating their market value in USD. You will provide three distinct elements in your response:\n\n1. TITLE: A concise product title (max 24 characters)\n2. DESCRIPTION: A detailed description (max 200 characters) mentioning brand, condition, color, model if visible\n3. VALUE: A reasonable price estimate in USD\n\nReject items that are larger than a car or clearly not sellable (like landscapes, buildings, or abstract concepts) by marking them as 'INVALID'."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image and provide exactly these three elements:\n\nTITLE: [concise product name, max 24 characters]\nDESCRIPTION: [detailed description including brand, condition, color, model if visible, max 200 characters]\nVALUE: [estimated price in USD]\n\nIf the item is larger than a car or not sellable, respond with 'INVALID' and briefly explain why. Animals are valid." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }
      ],
      max_tokens: 500
    });
    
    // Parse the response to extract information
    const content = completion.choices[0].message.content;
    
    // Check if the item is invalid
    if (content.includes('INVALID') || 
        content.toLowerCase().includes('not sellable') || 
        content.toLowerCase().includes('larger than a car')) {
      return {
        isValid: false,
        reason: extractInvalidReason(content),
        price: "N/A",
        productName: "Invalid Item",
        description: "This item cannot be analyzed as it appears to be not sellable."
      };
    }
    
    // Extract product information
    const productName = extractProductName(content);
    const description = extractDescription(content);
    const price = extractPrice(content);
    
    return {
      isValid: true,
      productName,
      description,
      price
    };
  } catch (error) {
    console.error("Error analyzing image with OpenAI:", error);
    throw new Error("Failed to analyze image");
  }
}

// Helper function to extract product name
function extractProductName(content) {
  const titleMatch = content.match(/TITLE:?\s*([^\n.]+)/i) || 
                     content.match(/title:?\s*([^\n.]+)/i);
  
  return titleMatch ? titleMatch[1].trim() : "Unknown Product";
}

// Helper function to extract description
function extractDescription(content) {
  const descMatch = content.match(/DESCRIPTION:?\s*([^\n]+(?:\n[^\n]+)*?)(?:\n\n|\nVALUE|\nPRICE|$)/i) ||
                    content.match(/description:?\s*([^\n]+(?:\n[^\n]+)*?)(?:\n\n|\nVALUE|\nPRICE|$)/i);
  
  return descMatch ? descMatch[1].trim() : "No detailed description available.";
}

// Helper function to extract invalid reason
function extractInvalidReason(content) {
  const reasonMatch = content.match(/INVALID:?\s*([^\n.]+)/i) || 
                      content.match(/invalid:?\s*([^\n.]+)/i) ||
                      content.match(/reason:?\s*([^\n.]+)/i) ||
                      content.match(/not sellable because:?\s*([^\n.]+)/i);
  
  // If we can't extract a specific reason, provide a more detailed default message
  return reasonMatch 
    ? reasonMatch[1].trim() 
    : "This item appears to be not sellable. Please try uploading a photo of a smaller item that can be sold on our platform.";
}

// Helper function to extract price
function extractPrice(content) {
  // Look for VALUE: format
  const valueFormatMatch = content.match(/VALUE:?\s*\$?\s*(\d+(?:\.\d{1,2})?)/i) ||
                           content.match(/value:?\s*\$?\s*(\d+(?:\.\d{1,2})?)/i);
  
  if (valueFormatMatch && valueFormatMatch[1]) {
    return valueFormatMatch[1];
  }
  
  // Fallback to other price formats
  const priceMatch = content.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  if (priceMatch && priceMatch[1]) {
    return priceMatch[1];
  }
  
  // Look for mentions of price/value with numbers
  const valueMatch = content.match(/(?:price|value|worth|cost)(?:\s+is|\s+of|\s+at)?\s+(?:around|about|approximately)?\s*\$?\s*(\d+(?:\.\d{1,2})?)/i);
  if (valueMatch && valueMatch[1]) {
    return valueMatch[1];
  }
  
  return "Unknown";
}

module.exports = {
  analyzeImage,
  extractPrice,
  extractProductName,
  extractDescription
}

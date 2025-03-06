const OpenAIApi = require('openai');
const openai = new OpenAIApi({ key: process.env.OPENAI_API_KEY });

// Add a new function for image analysis
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
          content: "You are an expert at identifying objects in images and estimating their market value in USD. Provide a product name and a direct description of the main item in the image(mentioning brand, condition, color, model if visible). Start the description with the item's characteristics, not with phrases like 'This image shows' or 'This is a' or with a title, because other ai is in charge of titles. Estimate a reasonable price in USD. Reject items that are larger than a car or clearly not sellable (like landscapes, buildings, or abstract concepts)."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image. Provide a product name and direct description of the item (mention brand, condition, color, model if visible). Start with the item's characteristics directly. Also provide an estimated price. If the item is larger than a car or not sellable, mark it as 'INVALID'." },
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
    const description = cleanDescription(extractDescription(content));
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
  const nameMatch = content.match(/product name:?\s*([^\n.]+)/i) || 
                    content.match(/name:?\s*([^\n.]+)/i) ||
                    content.match(/^([^:.\n]+)/i);
  
  return nameMatch ? nameMatch[1].trim() : "Unknown Product";
}

// Helper function to extract description
function extractDescription(content) {
  const descMatch = content.match(/description:?\s*([^\n]+(?:\n[^\n]+)*?)(?:\n\n|\nPrice|$)/i);
  
  if (descMatch) {
    return descMatch[1].trim();
  }
  
  // Fallback: try to find any paragraph that might be a description
  const paragraphs = content.split('\n\n');
  for (const para of paragraphs) {
    if (para.length > 30 && !para.toLowerCase().includes('price:') && !para.toLowerCase().includes('name:')) {
      return para.trim();
    }
  }
  
  return "No detailed description available.";
}

// Helper function to clean up description
function cleanDescription(description) {
  // Remove phrases like "This image shows", "This is a", etc.
  let cleaned = description.replace(/^(this (image|photo|picture) (shows|displays|contains|features)|this is a|the image shows|we can see|i can see|there is a|there's a)/i, '');
  
  // If we removed something from the beginning, capitalize the first letter
  if (cleaned !== description) {
    cleaned = cleaned.trim();
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }
  
  return cleaned;
}

// Helper function to extract invalid reason
function extractInvalidReason(content) {
  const reasonMatch = content.match(/invalid:?\s*([^\n.]+)/i) || 
                      content.match(/reason:?\s*([^\n.]+)/i) ||
                      content.match(/not sellable because:?\s*([^\n.]+)/i);
  
  // If we can't extract a specific reason, provide a more detailed default message
  return reasonMatch 
    ? reasonMatch[1].trim() 
    : "This item appears to be not sellable. Please try uploading a photo of a smaller item that can be sold on our platform.";
}

// Helper function to extract price
function extractPrice(content) {
  // Look for dollar amounts
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
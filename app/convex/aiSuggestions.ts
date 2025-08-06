import { v } from "convex/values";
import { action } from "./_generated/server";

// AI content suggestions using OpenAI
export const generateContentSuggestions = action({
  args: {
    content: v.optional(v.string()),
    imageDescription: v.optional(v.string()),
    platforms: v.array(v.string()),
    businessType: v.optional(v.string()),
    tone: v.optional(v.union(
      v.literal("professional"),
      v.literal("casual"),
      v.literal("inspiring"),
      v.literal("promotional")
    )),
  },
  handler: async (ctx, args) => {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      // Build context for AI
      const businessContext = args.businessType || "aesthetics clinic";
      const tone = args.tone || "professional";
      const platforms = args.platforms.join(", ");
      
      let prompt = `You are a social media expert for a ${businessContext}. Generate engaging social media content that is ${tone} in tone for posting on ${platforms}.

Context:
${args.content ? `- Current content: "${args.content}"` : ""}
${args.imageDescription ? `- Image/video description: "${args.imageDescription}"` : ""}

Please provide:
1. An improved/suggested caption (if content was provided) or a new caption
2. 10-15 relevant hashtags
3. Best posting time suggestions
4. Engagement tips

Format your response as JSON with the following structure:
{
  "suggestedCaption": "...",
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "bestTimes": ["Monday 9AM", "Wednesday 2PM", ...],
  "engagementTips": ["tip1", "tip2", ...]
}`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a professional social media content creator specializing in healthcare and aesthetics. Always respond with valid JSON."
            },
            {
              role: "user", 
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      // Parse the JSON response
      try {
        const suggestions = JSON.parse(content);
        
        // Validate the response structure
        if (!suggestions.suggestedCaption || !suggestions.hashtags || !Array.isArray(suggestions.hashtags)) {
          throw new Error("Invalid response format from AI");
        }

        return {
          suggestedCaption: suggestions.suggestedCaption,
          hashtags: suggestions.hashtags.slice(0, 15), // Limit to 15 hashtags
          bestTimes: suggestions.bestTimes || [],
          engagementTips: suggestions.engagementTips || [],
          generatedAt: Date.now(),
        };
      } catch (parseError) {
        // If JSON parsing fails, extract what we can
        const lines = content.split('\n');
        const captionMatch = content.match(/suggestedCaption[":]+\s*"([^"]+)"/i);
        const hashtagMatches = content.match(/#\w+/g);
        
        return {
          suggestedCaption: captionMatch ? captionMatch[1] : args.content || "Check out our latest aesthetic treatments! ✨",
          hashtags: hashtagMatches ? hashtagMatches.slice(0, 10) : [
            "#aesthetics", "#beauty", "#skincare", "#botox", "#filler", 
            "#antiaging", "#medicalaesthetics", "#transformation", "#selfcare", "#confidence"
          ],
          bestTimes: ["Monday 9:00 AM", "Wednesday 2:00 PM", "Friday 11:00 AM"],
          engagementTips: ["Ask questions in your captions", "Use relevant hashtags", "Post consistently"],
          generatedAt: Date.now(),
        };
      }
    } catch (error) {
      console.error("AI suggestion error:", error);
      
      // Provide fallback suggestions
      return {
        suggestedCaption: args.content || "Transform your look with our expert aesthetic treatments! ✨ Book your consultation today.",
        hashtags: [
          "#aesthetics", "#beauty", "#skincare", "#botox", "#filler", 
          "#antiaging", "#medicalaesthetics", "#transformation", "#selfcare", "#confidence",
          "#beforeandafter", "#results", "#consultation", "#expert", "#professional"
        ],
        bestTimes: [
          "Monday 9:00 AM - Start the week strong",
          "Wednesday 2:00 PM - Midweek engagement peak", 
          "Friday 11:00 AM - Weekend prep time",
          "Sunday 7:00 PM - Sunday planning"
        ],
        engagementTips: [
          "Ask questions to encourage comments",
          "Share before/after transformations", 
          "Use location tags for local discovery",
          "Post consistently 3-5 times per week",
          "Engage with comments within 2 hours"
        ],
        generatedAt: Date.now(),
        error: "Used fallback suggestions due to AI service unavailability"
      };
    }
  },
});

// Analyze image for content suggestions
export const analyzeImageForContent = action({
  args: {
    imageUrl: v.string(),
    businessType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      // Return basic analysis without OpenAI
      return {
        description: "Beautiful aesthetic treatment result",
        suggestedContent: "Amazing transformation! See the incredible results from our latest treatment.",
        confidence: 0.5,
        detectedElements: ["professional photography", "clean aesthetic"],
      };
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this image for a ${args.businessType || "medical aesthetics clinic"}. Describe what you see and suggest social media content. Return JSON with: description, suggestedContent, confidence (0-1), detectedElements array.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: args.imageUrl
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI Vision API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No content received from OpenAI Vision");
      }

      try {
        return JSON.parse(content);
      } catch {
        // Extract information from text response
        return {
          description: content.substring(0, 200),
          suggestedContent: "Check out this amazing result! ✨",
          confidence: 0.7,
          detectedElements: ["image analysis available"],
        };
      }
    } catch (error) {
      console.error("Image analysis error:", error);
      
      return {
        description: "Professional aesthetic treatment image",
        suggestedContent: "Incredible results from our expert team! Book your consultation today ✨",
        confidence: 0.5,
        detectedElements: ["professional content"],
        error: "Image analysis temporarily unavailable"
      };
    }
  },
});

// Generate platform-specific content variations
export const generatePlatformVariations = action({
  args: {
    baseContent: v.string(),
    platforms: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    const platformLimits = {
      instagram: 2200,
      facebook: 2000,
      youtube: 5000,
      google_business: 1500,
      tiktok: 150,
      linkedin: 3000,
      apple_business: 500,
    };

    if (!openaiApiKey) {
      // Generate basic variations without AI
      return args.platforms.map(platform => ({
        platform,
        content: args.baseContent.substring(0, platformLimits[platform as keyof typeof platformLimits] || 500),
        hashtags: ["#aesthetics", "#beauty", "#transformation"],
        tone: "professional"
      }));
    }

    try {
      const prompt = `Adapt this social media content for different platforms. Base content: "${args.baseContent}"

Create variations for: ${args.platforms.join(", ")}

Platform requirements:
- Instagram: Visual-focused, hashtag-heavy, up to 2200 chars
- Facebook: Community-focused, longer form ok, up to 2000 chars  
- TikTok: Trendy, short, engaging, up to 150 chars
- LinkedIn: Professional, business-focused, up to 3000 chars
- YouTube: Descriptive, SEO-friendly, up to 5000 chars
- Google Business: Local, service-focused, up to 1500 chars
- Apple Business: Concise, premium feel, up to 500 chars

Return JSON array with: [{"platform": "name", "content": "adapted content", "hashtags": ["#tag1"], "tone": "description"}]`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a social media expert. Always respond with valid JSON array."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.6,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      try {
        const variations = JSON.parse(content);
        return Array.isArray(variations) ? variations : [];
      } catch {
        // Fallback to manual variations
        return args.platforms.map(platform => {
          const limit = platformLimits[platform as keyof typeof platformLimits] || 500;
          return {
            platform,
            content: args.baseContent.substring(0, limit),
            hashtags: ["#aesthetics", "#beauty", "#transformation"],
            tone: platform === "linkedin" ? "professional" : "engaging"
          };
        });
      }
    } catch (error) {
      console.error("Platform variation error:", error);
      
      // Return fallback variations
      return args.platforms.map(platform => {
        const limit = platformLimits[platform as keyof typeof platformLimits] || 500;
        return {
          platform,
          content: args.baseContent.substring(0, limit),
          hashtags: ["#aesthetics", "#beauty", "#transformation"],
          tone: "professional",
          error: "AI variations temporarily unavailable"
        };
      });
    }
  },
});

// Get trending hashtags for aesthetics industry
export const getTrendingHashtags = action({
  args: {
    category: v.optional(v.string()),
    platform: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would fetch from social media APIs
    // For now, return curated trending hashtags for aesthetics
    
    const baseHashtags = [
      "#aesthetics", "#beauty", "#skincare", "#antiaging", "#botox",
      "#filler", "#medicalaesthetics", "#transformation", "#selfcare",
      "#confidence", "#beforeandafter", "#results", "#glowup", "#freshen"
    ];

    const categoryHashtags = {
      botox: ["#botox", "#wrinkletreatment", "#antiaging", "#smoothskin", "#youthful"],
      filler: ["#filler", "#lipfiller", "#cheekfiller", "#facialcontouring", "#plump"],
      skincare: ["#skincare", "#facialtreatment", "#glowingskin", "#healthyskin", "#radiant"],
      laser: ["#lasertreatment", "#skinresurfacing", "#hairremoval", "#pigmentation", "#acnescar"],
      consultation: ["#consultation", "#skinanalysis", "#treatmentplan", "#expertadvice", "#personalized"]
    };

    const platformHashtags = {
      instagram: ["#instaskincare", "#beautyinfluencer", "#skincareRoutine", "#makeupfree"],
      tiktok: ["#skincaretiktok", "#glowup", "#transformation", "#beforeafter"],
      linkedin: ["#medicalaesthetics", "#healthcareprofessional", "#aestheticmedicine", "#patientcare"]
    };

    let trending = [...baseHashtags];
    
    if (args.category && categoryHashtags[args.category as keyof typeof categoryHashtags]) {
      trending = trending.concat(categoryHashtags[args.category as keyof typeof categoryHashtags]);
    }
    
    if (args.platform && platformHashtags[args.platform as keyof typeof platformHashtags]) {
      trending = trending.concat(platformHashtags[args.platform as keyof typeof platformHashtags]);
    }

    // Remove duplicates and return with engagement scores
    const unique = [...new Set(trending)];
    
    return unique.map(hashtag => ({
      hashtag,
      popularity: Math.floor(Math.random() * 1000000) + 100000, // Mock popularity score
      trend: Math.random() > 0.5 ? "up" : "stable",
      category: args.category || "general"
    })).sort((a, b) => b.popularity - a.popularity);
  },
});
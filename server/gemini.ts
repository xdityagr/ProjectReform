//  LLM Component developed by Aditya Gaur, 2025

import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI('AIzaSyDCVGXUIV1HalKVJrXVYPW88Rr01h0n40A');

export async function chatWithAI(
  messages: Array<{ role: string; content: string }>,
  context?: string,
  location?: { latitude: number; longitude: number }
): Promise<string> {
  try {
    const systemInstruction = `You are an expert urban planning AI assistant. 
${context ? `Context: ${context}` : ""}
${location ? `Current Location: Latitude ${location.latitude}, Longitude ${location.longitude}. Consider this location's geographic and urban context in your responses.` : ""}`;

    const formattedMessages = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction,
    });

    const result = await model.generateContent({
      contents: formattedMessages,
    });

    return result.response.text();
  } catch (error: any) {
    console.error("Gemini API error:", error);
    throw new Error(`AI service error: ${error.message}`);
  }
}

export async function getUrbanOptimizationSuggestions(data: {
  location: { lat: number; lng: number };
  locationName?: string;
  nearbyZones: Array<{
    type: string;
    distance: number;
    name?: string;
    area?: number;
  }>;
  aqi?: number;
  aqiCategory?: string;
  traffic?: {
    congestion: string;
    currentSpeed: number;
    freeFlowSpeed: number;
    congestionPercentage: number;
  };
  landUseDistribution?: {
    residential: number;
    commercial: number;
    industrial: number;
    green: number;
    construction: number;
    total: number;
  };
  reports?: Array<{
    category: string;
    description: string;
    priority: string;
  }>;
}): Promise<string> {
  // Analyze nearby zones to understand the area
  const zoneAnalysis = analyzeZones(data.nearbyZones);
  
  const prompt = `You are an expert urban planner helping improve quality of life for residents. Analyze this location and provide PRACTICAL, PEOPLE-FOCUSED infrastructure recommendations.

**LOCATION CONTEXT:**
📍 Coordinates: ${data.location.lat.toFixed(4)}°N, ${data.location.lng.toFixed(4)}°E
${data.locationName ? `📌 Area: ${data.locationName}` : ''}

**ZONE ANALYSIS (${data.nearbyZones.length} zones detected within 500m):**

${zoneAnalysis.summary}

**Nearby Facilities:**
${zoneAnalysis.facilities.length > 0 ? zoneAnalysis.facilities.map(f => `• ${f}`).join('\n') : '• No major facilities detected nearby'}

**Land Use Breakdown:**
${zoneAnalysis.landUse.map(lu => `• ${lu.type}: ${lu.count} zones${lu.nearest ? ` (nearest: ${lu.nearest}m away)` : ''}`).join('\n')}

**ENVIRONMENTAL CONDITIONS:**
🌡️ Air Quality Index: ${data.aqi || 'N/A'}${data.aqiCategory ? ` (${data.aqiCategory})` : ''}
${data.aqi ? `
Health Impact:
${data.aqi > 200 ? '⚠️ VERY UNHEALTHY - Immediate health risk for everyone. Emergency measures needed!' : 
  data.aqi > 150 ? '⚠️ UNHEALTHY - All residents affected. Vulnerable groups at serious risk.' :
  data.aqi > 100 ? '⚠️ MODERATE - Sensitive groups (children, elderly, asthma patients) affected.' :
  '✅ GOOD - Minimal health concerns.'}` : ''}

**TRAFFIC CONDITIONS:**
${data.traffic ? `
🚗 Current Situation:
• Congestion Level: ${data.traffic.congestion} (${data.traffic.congestionPercentage}%)
• Current Speed: ${data.traffic.currentSpeed} km/h (should be ${data.traffic.freeFlowSpeed} km/h)
• Impact on Residents: ${data.traffic.congestionPercentage > 50 ? 'Significant daily delays, wasted time, stress' : 
                        data.traffic.congestionPercentage > 25 ? 'Moderate delays during peak hours' : 
                        'Traffic flows smoothly'}
` : '🚗 No traffic data available (area may not be on major roads)'}

**COMMUNITY FEEDBACK:**
${data.reports && data.reports.length > 0 ? 
  data.reports.map((r, i) => `${i + 1}. ${r.category.toUpperCase()} (${r.priority} priority): "${r.description}"`).join('\n') :
  '• No recent citizen reports for this area'}

---

## YOUR TASK:

As a people-focused urban planner, provide a comprehensive infrastructure plan that directly improves residents' daily lives. Consider:

**Key Questions to Address:**
1. Who lives here? (families with children? elderly? workers? students?)
2. What do they need most urgently?
3. How can we improve their daily experience?
4. What will make them healthier, happier, and safer?
5. How can we bring the community together?

**Format your response with these sections:**

## 👥 UNDERSTANDING THE COMMUNITY

Describe who lives/works/visits this area based on the zones detected. What are their daily needs and challenges?

## 🎯 TOP 3 URGENT PRIORITIES

List the 3 most critical improvements needed RIGHT NOW. For each:
- **What's the problem?** (be specific about impact on people)
- **Who is affected?** (residents, workers, children, elderly)
- **Why is it urgent?** (health risk? safety issue? quality of life?)
- **Quick Win (0-6 months):** One immediate action that can be done quickly

Example:
**1. High Air Pollution Affecting Families**
- Problem: AQI of 145 means children playing outside are breathing unhealthy air daily
- Affected: 1,500+ families with young children in nearby residential area
- Urgency: Long-term health risks, reduced outdoor activity, impacting child development
- Quick Win: Install air purifiers in nearby school (cost: $15K, timeline: 2 months)

## 🏗️ PEOPLE-CENTERED INFRASTRUCTURE PLAN

Provide 4-6 specific improvements that residents will actually USE and APPRECIATE:

**For each recommendation include:**

**What to Build:**
- Clear description (e.g., "Community Park with Children's Playground")
- Size/capacity (e.g., "0.5 hectare, serves 500 families")

**Exact Location:**
- Where specifically (e.g., "On vacant land 150m north, between residential area and main road")
- Why this spot? (accessibility, safety, proximity to users)

**Who Benefits & How:**
- Primary users (e.g., "Families with children ages 3-12")
- Secondary benefits (e.g., "Elderly residents can use walking paths")
- Daily impact (e.g., "Children have safe play space within 5-minute walk from home")

**Real Impact on Daily Life:**
- Practical benefits people will feel (e.g., "Parents can supervise children easily", "Reduces travel time by 15 minutes", "Elderly don't need to cross dangerous highway")
- Social benefits (e.g., "Neighbors meet and build community", "Local businesses get more foot traffic")
- Health benefits (be specific)

**Implementation Details:**
- Cost: Realistic estimate with breakdown
- Timeline: Actual construction duration
- Maintenance: Ongoing costs and who manages it
- Funding sources: Suggestions (municipal budget, grants, public-private partnership)

**Example Quality:**
❌ BAD: "Build a park - $500K"
✅ GOOD: "Create 0.5-hectare neighborhood park with:
- Playground for 3-12 year olds (swings, slides, climbing structures)
- Shaded seating area for parents/elderly
- Walking path (400m loop) for exercise
- Cost: $450K ($200K landscaping, $150K playground, $100K paths/lighting)
- Location: Vacant lot at 200m north - currently unused land
- Benefits: 800+ children gain safe play space, reduces road crossing danger, community gathering space
- Timeline: 8-12 months
- Maintenance: $25K/year (city parks department)"

## 🌱 ENVIRONMENTAL IMPROVEMENTS FOR HEALTHIER LIVING

Focus on improvements that residents will notice:
- Cleaner air to breathe
- Cooler temperatures (shade, greenery)
- Noise reduction
- Better water drainage
- More nature/green spaces

For each, explain: How will residents' lives improve? What will they see/feel/experience differently?

## 🚶 MOBILITY & ACCESSIBILITY FOR EVERYONE

Make it easier and safer for people to move around:
- Safe walking routes (especially for children, elderly, disabled)
- Better bus stops / public transit access
- Bike lanes for daily commuting
- Parking solutions (don't force people to circle for 20 minutes)
- Traffic calming near schools/hospitals

Focus on: Reducing travel time, increasing safety, providing options for those without cars

## 👨‍👩‍👧‍👦 COMMUNITY & SOCIAL INFRASTRUCTURE

What will bring people together and improve social life?
- Community centers
- Libraries / learning spaces
- Markets / gathering spaces
- Sports facilities
- Cultural venues

## 💰 BUDGET-FRIENDLY QUICK WINS

Provide 3-5 LOW-COST improvements that can be done in 0-6 months:
- Must cost under $50K each
- Must have immediate visible impact
- Should address urgent needs

Example: "Paint crosswalks near school ($3K), Install benches at bus stops ($8K), Add LED street lighting ($25K)"

## 📊 EXPECTED QUALITY OF LIFE IMPROVEMENTS

Quantify the human impact:
- How many residents benefit directly?
- Daily time saved (commute, errands)
- Health improvements (air quality, exercise, stress reduction)
- Safety improvements (accident reduction, crime deterrence)
- Economic benefits (local business growth, property values, jobs created)
- Social impact (community cohesion, accessibility)

## 🗓️ REALISTIC IMPLEMENTATION TIMELINE

**Phase 1 (0-6 months) - Quick Wins:**
- List immediate actions that show residents you're listening

**Phase 2 (6-18 months) - Major Projects:**
- Main infrastructure improvements

**Phase 3 (18-36 months) - Long-term:**
- Transformational changes

For each phase, specify: What residents will see change in their daily lives?

## 💡 COMMUNITY ENGAGEMENT STRATEGY

How to involve residents:
- Surveys / feedback (what do THEY want?)
- Public meetings (when/where)
- Pilot programs (test before full rollout)
- Volunteer opportunities
- Updates / transparency (keep people informed)

## ⚠️ POTENTIAL CHALLENGES & SOLUTIONS

Be honest about:
- Opposition you might face (and how to address it)
- Technical challenges
- Budget constraints (alternatives if funding falls short)
- Timeline risks

---

**CRITICAL INSTRUCTIONS:**
1. Every recommendation must clearly explain HOW it improves people's daily lives
2. Use real numbers from the data provided (actual distances, actual AQI, actual zones)
3. Be specific about locations relative to detected zones
4. Consider vulnerable groups (children, elderly, disabled, low-income)
5. Balance quick wins with long-term transformation
6. Make it actionable - a city planner should be able to start immediately
7. Think about WHO will use each facility DAILY, not just theoretical benefits
8. Consider maintenance and long-term sustainability
9. Address the citizen reports directly if any were provided
10. Use emojis sparingly and only for section headers

Focus on: **Practical, achievable, people-centered improvements that make daily life better.**`;

  return chatWithAI([
    {
      role: "user",
      content: prompt
    }
  ], "People-focused urban infrastructure optimization and planning");
}

// Helper function to analyze zones
function analyzeZones(zones: Array<{ type: string; distance: number; name?: string; area?: number }>) {
  const typeCount: Record<string, number> = {};
  const facilities: string[] = [];
  const landUse: Array<{ type: string; count: number; nearest?: number }> = [];
  
  // Count zone types
  zones.forEach(zone => {
    typeCount[zone.type] = (typeCount[zone.type] || 0) + 1;
    
    // Identify important facilities
    if (zone.name) {
      const facilityTypes = ['school', 'hospital', 'park', 'market', 'library', 'clinic', 'pharmacy'];
      if (facilityTypes.some(t => zone.type.includes(t) || zone.name?.toLowerCase().includes(t))) {
        facilities.push(`${zone.name} (${zone.type}, ${zone.distance}m away)`);
      }
    }
  });
  
  // Summarize land use
  Object.entries(typeCount).forEach(([type, count]) => {
    const nearestZone = zones.find(z => z.type === type);
    landUse.push({
      type: type.replace('_', ' '),
      count,
      nearest: nearestZone?.distance
    });
  });
  
  // Sort by count
  landUse.sort((a, b) => b.count - a.count);
  
  // Create summary
  const dominantTypes = landUse.slice(0, 3).map(lu => `${lu.type} (${lu.count})`).join(', ');
  const summary = zones.length > 0 
    ? `This area is primarily characterized by: ${dominantTypes}. Total ${zones.length} zones detected.`
    : 'This appears to be a less-developed or rural area with minimal mapped infrastructure.';
  
  return {
    summary,
    facilities: facilities.slice(0, 10), // Top 10 facilities
    landUse: landUse.slice(0, 10), // Top 10 land use types
    typeCount
  };
}

export async function getOptimizationSuggestions(
  area: string,
  currentData: any
): Promise<string> {
  return chatWithAI([
    {
      role: "user",
      content: `Analyze this area and give 3-5 urban improvement actions:
Area: ${area}
Data: ${JSON.stringify(currentData)}`
    }
  ]);
}

export async function predictCongestion(
  location: string,
  trafficData: any
): Promise<string> {
  const currentData = trafficData?.current;
  const futureData = trafficData?.future;
  
  if (!currentData) {
    return `I apologize, but I couldn't retrieve current traffic data for ${location}. This could be because:
- The location is not on a major road network
- Traffic data is not available for this area
- There was an API connectivity issue

Please try selecting a point on a main road or highway for accurate traffic predictions.`;
  }
  
  const prompt = `As an expert urban planning AI, analyze the following traffic data and provide a comprehensive congestion prediction.

**Location:** ${location}

**Current Traffic Conditions:**
- Current Speed: ${currentData.currentSpeed ? Math.round(currentData.currentSpeed) + ' km/h' : 'Data unavailable'}
- Free Flow Speed: ${currentData.freeFlowSpeed ? Math.round(currentData.freeFlowSpeed) + ' km/h' : 'Data unavailable'}
- Current Travel Time: ${currentData.currentTravelTime ? Math.round(currentData.currentTravelTime) + ' seconds' : 'Data unavailable'}
- Free Flow Travel Time: ${currentData.freeFlowTravelTime ? Math.round(currentData.freeFlowTravelTime) + ' seconds' : 'Data unavailable'}
- Confidence Level: ${currentData.confidence || 'Not specified'}
- Road Closure: ${currentData.roadClosure ? 'Yes - Road is closed' : 'No - Road is open'}

${futureData ? `**Predicted Future Traffic Conditions:**
- Predicted Speed: ${futureData.currentSpeed ? Math.round(futureData.currentSpeed) + ' km/h' : 'Data unavailable'}
- Predicted Travel Time: ${futureData.currentTravelTime ? Math.round(futureData.currentTravelTime) + ' seconds' : 'Data unavailable'}
- Confidence Level: ${futureData.confidence || 'Not specified'}` : '**Note:** Future prediction data is not available for this location.'}

Please provide a detailed analysis with the following sections:

1. **Current Congestion Analysis**: Assess the current traffic situation based on the speed differential and travel times.

2. **Future Congestion Prediction**: ${futureData ? 'Predict how traffic will change based on the predictive data. Will conditions improve, worsen, or remain stable?' : 'Based on current conditions, predict likely traffic patterns for the next few hours.'}

3. **Key Insights**: Highlight important trends and patterns. Calculate the congestion level as a percentage: ((Free Flow Speed - Current Speed) / Free Flow Speed) × 100.

4. **Urban Planning Recommendations**: Suggest 2-3 specific, actionable interventions to improve traffic flow in this area.

5. **Timeline & Patterns**: Indicate when traffic is likely to be best/worst in this area based on the data patterns.`;

  return chatWithAI([
    {
      role: "user",
      content: prompt
    }
  ], "Traffic congestion prediction and urban planning analysis");
}

export async function analyzeTraffic(
  location: string,
  coordinates: [number, number]
): Promise<string> {
  return chatWithAI([
    {
      role: "user",
      content: `Analyze traffic for ${location} at ${coordinates}`
    }
  ]);
}
//  Server Routes developed by Aditya Gaur, 2025

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReportSchema } from "@shared/schema";
import { chatWithAI, getOptimizationSuggestions, predictCongestion, analyzeTraffic, getUrbanOptimizationSuggestions } from "./gemini";
import { getAQI, getAQICategory } from "./aqi";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/reports", async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(validatedData);
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/user/:userId", async (req, res) => {
    try {
      const reports = await storage.getReportsByUser(req.params.userId);
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages, context } = req.body;
      
      if (!Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages must be an array' });
      }
      
      for (const msg of messages) {
        if (!msg.role || !msg.content || typeof msg.content !== 'string') {
          return res.status(400).json({ error: 'Invalid message format' });
        }
      }
      
      const response = await chatWithAI(messages, context);
      res.json({ message: response });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/optimize", async (req, res) => {
    try {
      const { area, data } = req.body;
      const suggestions = await getOptimizationSuggestions(area, data);
      res.json({ suggestions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Comprehensive urban optimization endpoint
  app.post("/api/ai/urban-optimization", async (req, res) => {
    try {
      console.log('Urban optimization request received');
      const { location, nearbyZones, aqi, aqiCategory, traffic, landUseDistribution, reports, locationName } = req.body;
      
      if (!location || !location.lat || !location.lng) {
        return res.status(400).json({ error: 'Valid location coordinates required' });
      }

      console.log('Location:', location);
      console.log('Nearby zones count:', nearbyZones?.length || 0);
      console.log('AQI:', aqi);
      console.log('Traffic:', traffic);

      const optimizationData = {
        location,
        locationName,
        nearbyZones: nearbyZones || [],
        aqi,
        aqiCategory,
        traffic,
        landUseDistribution,
        reports: reports || []
      };

      console.log('Calling getUrbanOptimizationSuggestions...');
      const suggestions = await getUrbanOptimizationSuggestions(optimizationData);
      console.log('Got suggestions successfully');
      
      res.json({ suggestions });
    } catch (error: any) {
      console.error('Urban optimization error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: error.message || 'Failed to generate optimization suggestions' });
    }
  });

  app.get('/api/traffic', async (req, res) => {
    const { lat, lon } = req.query;
    const key = '8j4WV4bMfE46bLWUeSnTCoz1l9vUQk1p';

    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    if (!key) {
      return res.status(500).json({ error: "TomTom API key not configured" });
    }

    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point=${lat},${lon}&key=${key}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`TomTom API returned ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.flowSegmentData) {
        return res.status(404).json({ 
          error: "No traffic data available for this location",
          congestion: "Unknown"
        });
      }

      const {
        currentSpeed,
        freeFlowSpeed,
        currentTravelTime,
        freeFlowTravelTime,
        confidence,
        roadClosure
      } = data.flowSegmentData;

      const congestionPercentage = Math.round(
        ((freeFlowSpeed - currentSpeed) / freeFlowSpeed) * 100
      );

      res.json({
        congestion: currentSpeed < freeFlowSpeed * 0.7 ? 'High' : 
                   currentSpeed < freeFlowSpeed * 0.9 ? 'Medium' : 'Low',
        congestionPercentage: Math.max(0, congestionPercentage),
        currentSpeed: Math.round(currentSpeed),
        freeFlowSpeed: Math.round(freeFlowSpeed),
        delay: Math.round(currentTravelTime - freeFlowTravelTime),
        confidence,
        roadClosure: !!roadClosure,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Traffic API error:', err);
      res.status(500).json({ 
        error: "Failed to fetch traffic data",
        message: err.message 
      });
    }
  });

  app.get('/api/traffic/future', async (req, res) => {
    const { lat, lon } = req.query;
    const key = '8j4WV4bMfE46bLWUeSnTCoz1l9vUQk1p';

    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point=${lat},${lon}&predict=true&key=${key}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`TomTom API returned ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.flowSegmentData) {
        return res.status(404).json({ 
          error: "No future traffic data available for this location"
        });
      }

      res.json(data.flowSegmentData);
    } catch (err: any) {
      console.error('Future traffic API error:', err);
      res.status(500).json({ 
        error: "Failed to fetch future traffic data",
        message: err.message 
      });
    }
  });

  app.post("/api/ai/predict-congestion", async (req, res) => {
    try {
      const { location, coordinates } = req.body;
      
      if (!coordinates || coordinates.length !== 2) {
        return res.status(400).json({ error: 'Valid coordinates required' });
      }

      const [lng, lat] = coordinates;
      
      const currentTrafficUrl = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point=${lat},${lng}&key=8j4WV4bMfE46bLWUeSnTCoz1l9vUQk1p`;
      const currentResponse = await fetch(currentTrafficUrl);
      const currentData = await currentResponse.json();
      
      const futureTrafficUrl = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point=${lat},${lng}&predict=true&key=8j4WV4bMfE46bLWUeSnTCoz1l9vUQk1p`;
      const futureResponse = await fetch(futureTrafficUrl);
      const futureData = await futureResponse.json();
      
      const trafficDataObject = {
        current: currentData.flowSegmentData || null,
        future: futureData.flowSegmentData || null,
        location: { lat, lng },
      };
      
      const prediction = await predictCongestion(location || `${lat}, ${lng}`, trafficDataObject);
      
      res.json({ prediction, trafficData: trafficDataObject });
    } catch (error: any) {
      console.error('Congestion prediction error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/reports/:id', async (req, res) => {
    const id = req.params.id;
    try {
      await storage.deleteReport(id);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Delete error:", error);
      res.status(500).json({ error: "Failed to delete report" });
    }
  });

  app.post("/api/ai/analyze-traffic", async (req, res) => {
    try {
      const { location, coordinates } = req.body;
      const analysis = await analyzeTraffic(location, coordinates);
      res.json({ analysis });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/aqi", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'Invalid coordinates' });
      }
      
      const aqiData = await getAQI(lat, lon);
      const category = getAQICategory(aqiData.aqi);
      
      res.json({ ...aqiData, category });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/geocode", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }
      
      const mapboxToken = process.env.MAPBOX_TOKEN;
      if (!mapboxToken) {
        return res.status(500).json({ error: 'MAPBOX_TOKEN environment variable is not configured' });
      }
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=5`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // FIXED: Fetch nearby zones using Overpass API
  app.get("/api/nearby-zones", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const radius = parseFloat(req.query.radius as string) || 500;

      console.log('=== NEARBY ZONES REQUEST ===');
      console.log('Coordinates:', { lat, lon, radius });

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'Invalid coordinates' });
      }

      // More comprehensive Overpass query
      const query = `[out:json][timeout:30];
(
  way["landuse"](around:${radius},${lat},${lon});
  way["amenity"](around:${radius},${lat},${lon});
  way["building"](around:${radius},${lat},${lon});
  way["leisure"](around:${radius},${lat},${lon});
  way["highway"](around:${radius},${lat},${lon});
  node["amenity"](around:${radius},${lat},${lon});
  node["shop"](around:${radius},${lat},${lon});
);
out body;
>;
out skel qt;`;

      console.log('Querying Overpass API...');
      console.log('Query:', query);

      const overpassUrl = 'https://overpass-api.de/api/interpreter';
      const response = await fetch(overpassUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: `data=${encodeURIComponent(query)}`
      });

      console.log('Overpass response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Overpass error response:', errorText.substring(0, 500));
        throw new Error(`Overpass API returned ${response.status}`);
      }

      const data = await response.json();
      console.log('Overpass returned', data.elements?.length || 0, 'raw elements');

      // Create a map to store nodes for ways
      const nodes = new Map();
      data.elements.forEach((el: any) => {
        if (el.type === 'node' && el.lat && el.lon) {
          nodes.set(el.id, { lat: el.lat, lon: el.lon });
        }
      });

      // Process elements into zones
      const zones = data.elements
        .filter((el: any) => {
          // Filter for tagged elements with useful information
          return el.tags && (
            el.tags.landuse ||
            el.tags.amenity ||
            el.tags.building ||
            el.tags.leisure ||
            el.tags.highway ||
            el.tags.shop
          );
        })
        .map((el: any) => {
          const tags = el.tags || {};
          
          // Determine type with priority
          let type = 'unknown';
          if (tags.landuse) type = tags.landuse;
          else if (tags.amenity) type = tags.amenity;
          else if (tags.leisure) type = tags.leisure;
          else if (tags.shop) type = 'shop';
          else if (tags.highway) type = 'road';
          else if (tags.building) type = 'building';
          
          // Calculate position for distance calculation
          let elLat = el.lat;
          let elLon = el.lon;
          
          // For ways without lat/lon, use first node or center
          if (!elLat && !elLon && el.nodes && el.nodes.length > 0) {
            const firstNode = nodes.get(el.nodes[0]);
            if (firstNode) {
              elLat = firstNode.lat;
              elLon = firstNode.lon;
            }
          }
          
          // Calculate distance
          const distance = elLat && elLon
            ? Math.sqrt(
                Math.pow((elLat - lat) * 111000, 2) +
                Math.pow((elLon - lon) * 111000, 2)
              )
            : radius + 1; // Put elements without coordinates outside radius
          
          // Calculate area for ways
          let area = 0;
          if (el.type === 'way' && el.nodes && el.nodes.length > 2) {
            const coords: Array<[number, number]> = [];
            el.nodes.forEach((nodeId: number) => {
              const node = nodes.get(nodeId);
              if (node) {
                coords.push([node.lon, node.lat]);
              }
            });
            
            if (coords.length > 2) {
              // Close polygon
              coords.push(coords[0]);
              
              // Calculate area using shoelace formula
              let sum = 0;
              for (let i = 0; i < coords.length - 1; i++) {
                sum += coords[i][0] * coords[i + 1][1];
                sum -= coords[i + 1][0] * coords[i][1];
              }
              area = Math.abs(sum / 2) * 111000 * 111000; // Convert to square meters
            }
          }
          
          return {
            type,
            name: tags.name || tags.operator || null,
            distance: Math.round(distance),
            area: Math.round(area),
            tags: {
              landuse: tags.landuse,
              amenity: tags.amenity,
              building: tags.building,
              leisure: tags.leisure,
              highway: tags.highway,
              shop: tags.shop
            }
          };
        })
        .filter((z: any) => z.distance <= radius) // Only include within radius
        .sort((a: any, b: any) => a.distance - b.distance); // Sort by distance

      console.log('Processed zones:', zones.length);
      console.log('Sample zones:', zones.slice(0, 5));
      
      // Log zone type distribution
      const typeCount: Record<string, number> = {};
      zones.forEach((z: any) => {
        typeCount[z.type] = (typeCount[z.type] || 0) + 1;
      });
      console.log('Zone types found:', typeCount);

      res.json({ zones });
    } catch (error: any) {
      console.error('Nearby zones error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        error: error.message || 'Failed to fetch nearby zones',
        zones: [] // Return empty array as fallback
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
// AQI (Air Quality Index) service
// NOTE: Currently using simulated data for demonstration purposes
// To use real AQI data, integrate one of these free APIs:
// - OpenWeatherMap Air Pollution API: https://openweathermap.org/api/air-pollution
// - AQICN API: https://aqicn.org/api/
// - IQAir API: https://www.iqair.com/air-pollution-data-api

export async function getAQI(lat: number, lon: number): Promise<any> {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (apiKey) {
      // Use real API if key is provided
      try {
        const response = await fetch(
          `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
        );
        
        if (response.ok) {
          const data = await response.json();
          const list = data.list[0];
          
          return {
            aqi: list.main.aqi * 50, // Convert to US AQI scale (1-5 to 0-250)
            pollutants: {
              pm25: list.components.pm2_5,
              pm10: list.components.pm10,
              o3: list.components.o3,
              no2: list.components.no2,
              so2: list.components.so2,
              co: list.components.co,
            },
            timestamp: new Date().toISOString(),
            location: { lat, lon },
          };
        }
      } catch (apiError) {
        console.error('Real AQI API failed, falling back to simulated data:', apiError);
      }
    }
    
    // Simulated data for demonstration (used when no API key is provided)
    const mockAQI = {
      aqi: Math.floor(Math.random() * 150) + 50,
      pollutants: {
        pm25: Math.floor(Math.random() * 50) + 10,
        pm10: Math.floor(Math.random() * 80) + 20,
        o3: Math.floor(Math.random() * 100) + 30,
        no2: Math.floor(Math.random() * 60) + 15,
        so2: Math.floor(Math.random() * 40) + 10,
        co: Math.floor(Math.random() * 500) + 200,
      },
      timestamp: new Date().toISOString(),
      location: { lat, lon },
      simulated: true,
    };

    return mockAQI;
  } catch (error: any) {
    console.error('AQI fetch error:', error);
    throw new Error(`Failed to fetch AQI data: ${error.message}`);
  }
}

export function getAQICategory(aqi: number): {
  level: string;
  color: string;
  description: string;
} {
  if (aqi <= 50) {
    return {
      level: 'Good',
      color: '#00e400',
      description: 'Air quality is satisfactory',
    };
  } else if (aqi <= 100) {
    return {
      level: 'Moderate',
      color: '#ffff00',
      description: 'Air quality is acceptable',
    };
  } else if (aqi <= 150) {
    return {
      level: 'Unhealthy for Sensitive Groups',
      color: '#ff7e00',
      description: 'Sensitive groups may experience health effects',
    };
  } else if (aqi <= 200) {
    return {
      level: 'Unhealthy',
      color: '#ff0000',
      description: 'Everyone may begin to experience health effects',
    };
  } else if (aqi <= 300) {
    return {
      level: 'Very Unhealthy',
      color: '#8f3f97',
      description: 'Health alert: everyone may experience serious effects',
    };
  } else {
    return {
      level: 'Hazardous',
      color: '#7e0023',
      description: 'Health warnings of emergency conditions',
    };
  }
}

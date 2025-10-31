//  AI Chat Component developed by Aditya Gaur, 2025


import { useState, useRef, useEffect } from 'react';
import { X, Send, Minimize2, Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import TrafficChart from "@/components/TrafficChart";

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  location: [number, number];
  onMinimize: () => void;
}
interface Message {
  role: 'user' | 'assistant' | 'chart';
  content?: string;
  chart?: JSX.Element;
}

// Simple markdown-like formatter
function formatMessage(text: string) {
  const lines = text.split('\n');
  const formatted: JSX.Element[] = [];
  
  lines.forEach((line, idx) => {
    // Headers
    if (line.startsWith('### ')) {
      formatted.push(<h3 key={idx} className="text-lg font-bold mt-4 mb-2">{line.replace('### ', '')}</h3>);
    } else if (line.startsWith('## ')) {
      formatted.push(<h2 key={idx} className="text-xl font-bold mt-5 mb-3">{line.replace('## ', '')}</h2>);
    } else if (line.startsWith('# ')) {
      formatted.push(<h1 key={idx} className="text-2xl font-bold mt-6 mb-4">{line.replace('# ', '')}</h1>);
    }
    // Bullet points
    else if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      const content = line.trim().replace(/^[-•]\s*/, '');
      // Check for bold text with **
      const parts = content.split(/\*\*(.*?)\*\*/g);
      formatted.push(
        <div key={idx} className="flex gap-2 my-1">
          <span className="text-muted-foreground">•</span>
          <span>
            {parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
          </span>
        </div>
      );
    }
    // Numbered lists
    else if (/^\d+\.\s/.test(line.trim())) {
      const content = line.trim().replace(/^\d+\.\s*/, '');
      const parts = content.split(/\*\*(.*?)\*\*/g);
      formatted.push(
        <div key={idx} className="flex gap-2 my-1 ml-4">
          <span>
            {parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
          </span>
        </div>
      );
    }
    // Regular text with bold support
    else if (line.trim()) {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      formatted.push(
        <p key={idx} className="my-2">
          {parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
        </p>
      );
    }
    // Empty line
    else {
      formatted.push(<div key={idx} className="h-2" />);
    }
  });
  
  return <div className="space-y-1">{formatted}</div>;
}

export default function AIChatPanel({ isOpen, onClose, location, onMinimize }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI Urban Planning Assistant. I can help you with:\n\n• **Urban Optimization** - Get comprehensive infrastructure recommendations\n• **Traffic Predictions** - Analyze congestion patterns\n• **Zone Analysis** - Understand land use and zoning\n• **General Planning** - Ask me anything about urban development\n\nClick the buttons below or ask me a question!'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoTriggered = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset auto-trigger when panel closes
  useEffect(() => {
    if (!isOpen) {
      hasAutoTriggered.current = false;
    }
  }, [isOpen]);

  // Fetch AQI data
  const { data: aqiData } = useQuery({
    queryKey: ['/api/aqi', location[1], location[0]],
    queryFn: async () => {
      const response = await fetch(`/api/aqi?lat=${location[1]}&lon=${location[0]}`);
      if (!response.ok) throw new Error('Failed to fetch AQI');
      return response.json();
    },
    enabled: isOpen && !!location,
  });

  // Fetch traffic data
  const { data: trafficData } = useQuery({
    queryKey: ['/api/traffic', location[1], location[0]],
    queryFn: async () => {
      const response = await fetch(`/api/traffic?lat=${location[1]}&lon=${location[0]}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: isOpen && !!location,
  });

  // Fetch nearby zones
  const { data: nearbyZonesData } = useQuery({
    queryKey: ['/api/nearby-zones', location[1], location[0]],
    queryFn: async () => {
      const response = await fetch(`/api/nearby-zones?lat=${location[1]}&lon=${location[0]}&radius=500`);
      if (!response.ok) throw new Error('Failed to fetch nearby zones');
      return response.json();
    },
    enabled: isOpen && !!location,
  });

  // Fetch reports
  const { data: reports = [] } = useQuery({
    queryKey: ['/api/reports'],
    enabled: isOpen,
  });

  // Get reports near this location (within ~1km)
  const nearbyReports = reports.filter((report: any) => {
    const distance = Math.sqrt(
      Math.pow((report.latitude - location[1]) * 111000, 2) +
      Math.pow((report.longitude - location[0]) * 111000, 2)
    );
    return distance < 1000;
  });

const handleUrbanOptimization = async () => {
  setIsLoading(true);

  const userMessage: Message = {
    role: "user",
    content: "🏗️ Provide targeted urban infrastructure optimization recommendations for this selected area."
  };
  setMessages(prev => [...prev, userMessage]);

  try {
    // ✅ MUST be here — BEFORE fetch()
    const zoneSummary: Record<string, number> = {};
    (nearbyZonesData?.zones || []).forEach((zone: any) => {
      const type =
        zone.landuse ||
        zone.building ||
        zone.amenity ||
        zone.highway ||
        "unknown";
      zoneSummary[type] = (zoneSummary[type] || 0) + 1;
    });

    const reportSummary: Record<string, number> = {};
    nearbyReports.forEach((r: any) => {
      reportSummary[r.category] = (reportSummary[r.category] || 0) + 1;
    });

    // ✅ Now fetch (zoneSummary + reports get sent below)
    const response = await fetch("/api/ai/urban-optimization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: { lat: location[1], lng: location[0] },
        locationName: `${location[1].toFixed(4)}°N, ${location[0].toFixed(4)}°E`,
        zones: {
          total: nearbyZonesData?.zones?.length || 0,
          types: zoneSummary
        },
        reportsSummary: reportSummary,
        aqi: aqiData?.aqi,
        traffic: trafficData ? {
          congestion: trafficData.congestion,
          currentSpeed: trafficData.currentSpeed,
          freeFlowSpeed: trafficData.freeFlowSpeed,
          congestionPercentage: trafficData.congestionPercentage,
        } : null,
        contextNote: "IMPORTANT: Use the zone types & counts to generate specific improvements"
      })
    });

    if (!response.ok) throw new Error("Server error");

    const data = await response.json();

    setMessages(prev => [
      ...prev,
      { role: "assistant", content: data.suggestions }
    ]);

    if (trafficData) {
      setMessages(prev => [
        ...prev,
        { role: "chart", chart: <TrafficChart data={trafficData} /> }
      ]);
    }

  } catch (err: any) {
    setMessages(prev => [
      ...prev,
      {
        role: "assistant",
        content: `⚠️ ${err.message || "Failed to optimize"}`
      }
    ]);
  } finally {
    setIsLoading(false);
  }
};


  const handleCongestionPrediction = async () => {
    setIsLoading(true);
    
    const userMessage: Message = {
      role: 'user',
      content: '🚦 Predict traffic congestion patterns for this location'
    };
    setMessages(prev => [...prev, userMessage]);
  if (trafficData) {
    setMessages(prev => [
      ...prev,
      { role: "chart", chart: <TrafficChart data={trafficData} /> }
    ]);
  }
    try {
      const response = await fetch('/api/ai/predict-congestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: `${location[1].toFixed(4)}°N, ${location[0].toFixed(4)}°E`,
          coordinates: location
        })
      });

      if (!response.ok) throw new Error('Failed to predict congestion');
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.prediction
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error.message}. This location may not have sufficient traffic data available.`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          context: `Urban planning assistant for location: ${location[1].toFixed(4)}°N, ${location[0].toFixed(4)}°E. AQI: ${aqiData?.aqi || 'N/A'}. Traffic: ${trafficData?.congestion || 'N/A'} congestion.`
        })
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error.message}. Please try again.`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-trigger optimization when opening from planner action
  useEffect(() => {
    const pendingAction = localStorage.getItem('pendingPlannerAction');
    if (pendingAction && isOpen && !hasAutoTriggered.current && !isLoading) {
      hasAutoTriggered.current = true;
      localStorage.removeItem('pendingPlannerAction');
      
      // Wait for data to load
      setTimeout(() => {
        switch(pendingAction) {
          case 'urban-optimization':
            handleUrbanOptimization();
            break;
          case 'congestion-prediction':
            handleCongestionPrediction();
            break;
        }
      }, 500);
    }
  }, [isOpen, aqiData, trafficData, nearbyZonesData]);

  if (!isOpen) return null;

  return (
    <div className="w-[600px] h-[700px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-purple-500/10 to-blue-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">AI Planning Assistant</h2>
            <p className="text-xs text-muted-foreground">
              {location[1].toFixed(4)}°N, {location[0].toFixed(4)}°E
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={onMinimize}>
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Data Status Indicators */}
      <div className="px-6 py-2 bg-muted/30 border-b border-border flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${aqiData ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
          <span>AQI: {aqiData?.aqi || 'Loading...'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${trafficData ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
          <span>Traffic: {trafficData?.congestion || 'Loading...'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${nearbyZonesData ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
          <span>Zones: {nearbyZonesData?.zones?.length || 0} found</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-3 border-b border-border bg-muted/30 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleUrbanOptimization}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Urban Optimization
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCongestionPrediction}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Traffic Prediction
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.role === "chart" ? (
                <div className="bg-white border rounded-xl p-3 shadow-sm">
                  {message.chart}
                </div>
              ) : message.role === "assistant" ? (
                <div className="text-sm">{formatMessage(message.content)}</div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">
                  {message.content}
                </p>
              )}
            </div>
          </div>
    
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing {nearbyZonesData?.zones?.length || 0} nearby zones, AQI data, and traffic patterns...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask about urban planning, traffic, zones, or anything else..."
            className="resize-none"
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
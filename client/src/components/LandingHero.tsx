import { ArrowRight, Map, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@assets/generated_images/Smart_city_aerial_view_52da3970.png';

interface LandingHeroProps {
  onGetStarted: (role: 'citizen' | 'planner') => void;
}

export default function LandingHero({ onGetStarted }: LandingHeroProps) {
  return (
    <div className="relative min-h-screen flex items-center">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-8">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-white">AI-Powered Urban Intelligence</span>
          </div>

          <h1 className="text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
            Urbanize.<br></br>
          <i>Smart Cities, <br />
            Smarter Decisions</i>
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl leading-relaxed">
            Empowering urban planners and citizens with real-time data analytics, 
            AI-driven insights, and collaborative tools to build sustainable, efficient cities.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button 
              size="lg" 
              className="px-8 backdrop-blur-sm bg-primary/90 hover:bg-primary"
              onClick={() => onGetStarted('citizen')}
              data-testid="button-citizen-signup"
            >
              <Users className="w-5 h-5 mr-2" />
              Citizen Portal
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white border-white/30"
              onClick={() => onGetStarted('planner')}
              data-testid="button-planner-signup"
            >
              <Map className="w-5 h-5 mr-2" />
              Urban Planner Access
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">50K+</div>
              <div className="text-sm text-gray-400">Active Reports</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">12</div>
              <div className="text-sm text-gray-400">Cities Connected</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">98%</div>
              <div className="text-sm text-gray-400">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

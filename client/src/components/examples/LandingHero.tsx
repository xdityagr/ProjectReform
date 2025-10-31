import LandingHero from '../LandingHero';

export default function LandingHeroExample() {
  return (
    <LandingHero 
      onGetStarted={(role) => console.log('Get started as:', role)} 
    />
  );
}

import {
  Navbar,
  Hero,
  Features,
  HowItWorks,
  Stats,
  LiveDemo,
  Trending,
  CTA,
  Footer,
} from "./components/sections";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />
      <LiveDemo />
      <Trending />
      <CTA />
      <Footer />
    </>
  );
}

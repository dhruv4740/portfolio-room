import { motion } from 'framer-motion';
import { Globe, ArrowRight, Shield, Code } from 'lucide-react';
import { useState } from 'react';
import Footer from '../components/Footer';

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    { icon: <Globe />, title: "Real-time Monitoring", desc: "24/7 transaction surveillance" },
    { icon: <Shield />, title: "AI Detection", desc: "Machine learning powered alerts" },
    { icon: <Code />, title: "API Integration", desc: "Seamless accounting software sync" }
  ];

  const testimonials = [
    { name: "Sarah J.", role: "Small Business Owner", text: "Saved my company from a $15k fraud attempt" },
    { name: "Mike R.", role: "CFO", text: "Cut our fraud losses by 80% in 3 months" },
    { name: "Alex P.", role: "Startup Founder", text: "Incredible tool that saved us countless hours of manual review." },
    { name: "Jane D.", role: "Finance Manager", text: "The real-time alerts are a game-changer for our accounting team." },
    { name: "Rob B.", role: "Security Analyst", text: "A must-have solution for preventing financial fraud in any organization." }
  ];

  const faqs = [
    { question: "How does detection work?", answer: "ML models analyze transaction patterns and flag anomalies for review." },
    { question: "How secure is my data?", answer: "We use bank-grade encryption and maintain zero data retention." },
    { question: "Can I integrate this with my existing software?", answer: "Yes, our API integrates seamlessly with most accounting systems." },
    { question: "What is the pricing model?", answer: "We offer a flexible subscription model with a free trial to get you started." },
    { question: "How quickly are fraud attempts detected?", answer: "Our system monitors transactions 24/7, providing near-instant alerts." },
    { question: "Do you offer customer support?", answer: "Absolutely, our support team is available 24/7 to assist you." }
  ];

  return (
    <div className="bg-cyber-dark text-gray-100">
      

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        {/* Prominent Globe placed slightly above text */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 120 }}
          className="mb-6"
        >
          <div className="w-56 h-56 bg-cyber-primary/20 rounded-full flex items-center justify-center shadow-lg">
            <Globe className="w-28 h-28 text-cyber-primary animate-float" />
          </div>
        </motion.div>

        {/* Headline & CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center px-4"
        >
          <h1 className="text-6xl font-bold mb-6 glow">
            Stop Financial Fraud
            <span className="text-cyber-primary block mt-2">Before It Starts</span>
          </h1>
          <motion.div whileHover={{ scale: 1.05 }} className="inline-block">
            <button className="bg-cyber-primary text-cyber-dark px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-2xl transition-shadow">
              Start Free Trial
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
        <div className="max-w-6xl mx-auto space-y-16">
          {[
            {
              step: "01",
              title: "Upload Suspicious CSV",
              desc: "System automatically detects anomalies",
            },
            {
              step: "02",
              title: "Review High-Risk Transactions",
              desc: "Verify flagged payments",
            },
            {
              step: "03",
              title: "Take Action",
              desc: "Block payments or mark as verified",
            },
          ].map((item) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex items-center gap-8"
            >
              <div className="text-cyber-primary text-6xl">{item.step}</div>
              <div className="flex-1 h-1 bg-gradient-to-r from-cyber-primary to-transparent" />
              <div className="w-96 p-8 bg-gray-900/50 rounded-xl border border-cyber-primary/20">
                <h3 className="text-2xl mb-4">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <h2 className="text-4xl font-bold text-center mb-16">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.2 }}
              className="p-8 bg-gray-900/50 rounded-xl border border-cyber-primary/20 hover:border-cyber-primary/40 transition-colors"
            >
              <div className="text-cyber-primary mb-4">{feature.icon}</div>
              <h3 className="text-2xl mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trusted By (Testimonials) */}
      <section className="py-20 px-6">
        <h2 className="text-4xl font-bold text-center mb-16">Trusted By</h2>
        <div className="flex gap-8 overflow-x-auto pb-8">
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              whileHover={{ scale: 1.05 }}
              className="min-w-[400px] p-8 bg-gray-900/50 rounded-xl border border-cyber-primary/20 shadow-md hover:shadow-xl transition-shadow"
            >
              <div className="text-cyber-primary mb-4">🌟</div>
              <p className="text-xl mb-4 italic">"{testimonial.text}"</p>
              <div className="text-cyber-primary font-semibold">{testimonial.name}</div>
              <div className="text-gray-400">{testimonial.role}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">FAQs</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div 
              key={faq.question}
              className="bg-gray-900/50 rounded-lg border border-cyber-primary/20 transition-all hover:shadow-lg"
            >
              <button 
                className="w-full p-6 text-left flex justify-between items-center focus:outline-none"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="text-xl font-medium">{faq.question}</span>
                <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }}>
                  <ArrowRight className="text-cyber-primary" />
                </motion.div>
              </button>
              {openFaq === i && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-6 pb-6 text-gray-400"
                >
                  {faq.answer}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

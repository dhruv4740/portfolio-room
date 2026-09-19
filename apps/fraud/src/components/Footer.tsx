import { motion } from 'framer-motion';
import { FaTwitter, FaLinkedin, FaGithub } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Branding */}
        <div>
          <h3 className="text-cyber-primary text-2xl font-bold mb-4">CyberSafe</h3>
          <p className="text-gray-400">
            Protecting your financial transactions with cutting-edge fraud detection.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-gray-200 font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2">
            <li>
              <a href="#" className="text-gray-400 hover:text-cyber-primary transition-colors">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-cyber-primary transition-colors">
                Features
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-cyber-primary transition-colors">
                Pricing
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-400 hover:text-cyber-primary transition-colors">
                Contact
              </a>
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h4 className="text-gray-200 font-semibold mb-4">Follow Us</h4>
          <div className="flex space-x-4">
            <motion.a 
              whileHover={{ scale: 1.1 }}
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-cyber-primary transition-colors"
            >
              <FaTwitter size={24} />
            </motion.a>
            <motion.a 
              whileHover={{ scale: 1.1 }}
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-cyber-primary transition-colors"
            >
              <FaLinkedin size={24} />
            </motion.a>
            <motion.a 
              whileHover={{ scale: 1.1 }}
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-cyber-primary transition-colors"
            >
              <FaGithub size={24} />
            </motion.a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-12 border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} CyberSafe. All rights reserved.
      </div>
    </footer>
  );
}

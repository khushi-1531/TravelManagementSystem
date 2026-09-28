import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Mail, Phone, MapPin, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-brand-navy border-t border-slate-800 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                TRAVEL<span className="text-teal-400">SPHERE</span>
              </span>
            </Link>

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Discover places. Plan better. Travel smarter. TravelSphere delivers modern travel discovery with curated destinations, verified hotels, and memorable holiday packages.
            </p>

            <div className="pt-2 flex items-center gap-4 text-xs text-slate-500">
              <span>Modern Travel Discovery Platform</span>
              <span>•</span>
              <span>Enterprise Edition</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Discovery</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/destinations" className="hover:text-teal-400 transition-colors">
                  Destinations
                </Link>
              </li>
              <li>
                <Link to="/places" className="hover:text-teal-400 transition-colors">
                  Iconic Places
                </Link>
              </li>
              <li>
                <Link to="/hotels" className="hover:text-teal-400 transition-colors">
                  Hotels & Resorts
                </Link>
              </li>
              <li>
                <Link to="/packages" className="hover:text-teal-400 transition-colors">
                  Holiday Packages
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">TravelSphere</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-teal-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed" title="Available in future phase">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed" title="Available in future phase">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed" title="Available in future phase">
                  Security Architecture
                </span>
              </li>
            </ul>
          </div>

          {/* Contact Information Placeholder */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Connect</h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>TravelSphere HQ, Technology Park, Bengaluru, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <span>support@travelsphere.internal</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>+91 (080) 4567-8900</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} TravelSphere. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built with precision for modern travel discovery</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

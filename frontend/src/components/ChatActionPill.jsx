import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Luggage, 
  Hotel, 
  MapPin, 
  CalendarCheck, 
  CreditCard, 
  ArrowRight 
} from 'lucide-react';

export const ChatActionPill = ({ action }) => {
  if (!action || !action.url) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'PACKAGE':
        return <Luggage className="w-3.5 h-3.5 text-teal-600 shrink-0" />;
      case 'HOTEL':
        return <Hotel className="w-3.5 h-3.5 text-teal-600 shrink-0" />;
      case 'DESTINATION':
        return <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />;
      case 'BOOKING':
        return <CalendarCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />;
      case 'PAYMENT':
        return <CreditCard className="w-3.5 h-3.5 text-teal-600 shrink-0" />;
      default:
        return <ArrowRight className="w-3.5 h-3.5 text-teal-600 shrink-0" />;
    }
  };

  return (
    <Link
      to={action.url}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100/80 border border-teal-200/80 text-teal-950 rounded-xl text-xs font-bold transition-all duration-150 hover:shadow-sm shrink-0"
    >
      {getIcon(action.type)}
      <span>{action.label}</span>
      <ArrowRight className="w-3 h-3 text-teal-700 ml-0.5" />
    </Link>
  );
};

export default ChatActionPill;

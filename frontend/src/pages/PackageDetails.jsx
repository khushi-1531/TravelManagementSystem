import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import packageApi from '../services/packageApi';
import ItineraryTimeline from '../components/ItineraryTimeline';
import PackageBookingModal from '../components/PackageBookingModal';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { handleImageError } from '../utils/imageFallback';
import { formatCurrency, formatDuration } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import WishlistButton from '../components/WishlistButton';
import ReviewSection from '../components/ReviewSection';
import { 
  Luggage, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ShieldCheck, 
  Info,
  Clock,
  Ticket
} from 'lucide-react';

const TIER_BADGES = {
  BUDGET: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  STANDARD: 'bg-blue-50 text-blue-700 border-blue-200',
  PREMIUM: 'bg-purple-50 text-purple-700 border-purple-200',
  LUXURY: 'bg-amber-50 text-amber-700 border-amber-200'
};

export const PackageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [travelPackage, setTravelPackage] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const fetchPackageData = async () => {
    setLoading(true);
    setError(null);
    try {
      const pkgData = await packageApi.getPackageById(id);
      setTravelPackage(pkgData);

      // Fetch day-by-day items
      const itemsData = await packageApi.getPackageItems(id);
      setItems(itemsData || []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve travel package details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackageData();
  }, [id]);

  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
    } else {
      setIsBookingModalOpen(true);
    }
  };

  if (loading) {
    return <LoadingState type="detail" />;
  }

  if (error || !travelPackage) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Package Not Found"
          message={error || "We couldn't retrieve the requested travel package details."}
          onRetry={fetchPackageData}
        />
        <div className="text-center mt-6">
          <Link
            to="/packages"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Packages
          </Link>
        </div>
      </div>
    );
  }

  const tierBadge = TIER_BADGES[travelPackage.tier?.toUpperCase()] || 'bg-slate-50 text-slate-700 border-slate-200';

  const inclusionsList = travelPackage.inclusions
    ? travelPackage.inclusions.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
    : [];

  const exclusionsList = travelPackage.exclusions
    ? travelPackage.exclusions.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Link
          to="/packages"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-teal-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Holiday Packages
        </Link>
      </div>

      {/* Package Header Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Hero image */}
        <div className="lg:col-span-2 rounded-3xl overflow-hidden bg-slate-100 h-[360px] sm:h-[420px] shadow-sm relative">
          <img
            src={travelPackage.heroImageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'}
            alt={travelPackage.title}
            onError={(e) => handleImageError(e, 'package')}
            className="w-full h-full object-cover object-center"
          />
          {travelPackage.tier && (
            <div className={`absolute top-4 left-4 px-3.5 py-1.5 rounded-full text-xs font-extrabold border shadow-md ${tierBadge}`}>
              {travelPackage.tier} TIER EXPERIENCE
            </div>
          )}

          <WishlistButton
            targetType="PACKAGE"
            targetId={travelPackage.id}
            size="md"
            className="absolute top-4 right-4"
          />
        </div>

        {/* Info Card with Book Now CTA */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
          <div>
            {travelPackage.destinationName && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 uppercase tracking-wider mb-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>{travelPackage.destinationName}</span>
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
              {travelPackage.title}
            </h1>

            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl mb-6">
              <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="font-semibold">
                {formatDuration(travelPackage.durationDays, travelPackage.durationNights)}
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600 mb-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Expert-crafted itinerary with daily milestones</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Flexible pace with dedicated leisure periods</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6 space-y-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">Pricing</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-teal-900">
                  {formatCurrency(travelPackage.basePricePerPerson)}
                </span>
                <span className="text-xs text-slate-500 font-normal"> / person</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={handleBookNow}
                className="flex-1 py-3.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 hover:shadow-xl"
              >
                <Ticket className="w-4 h-4" />
                <span>Book This Package</span>
              </button>

              <WishlistButton
                targetType="PACKAGE"
                targetId={travelPackage.id}
                variant="button"
                className="py-3 px-4"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Inclusions & Exclusions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Inclusions */}
        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-3xl p-6 sm:p-8">
          <h3 className="text-base font-bold text-emerald-950 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            What is Included
          </h3>
          {inclusionsList.length > 0 ? (
            <ul className="space-y-2.5 text-xs sm:text-sm text-emerald-900">
              {inclusionsList.map((inc, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-emerald-800">Accommodation, transport, and guided tours included.</p>
          )}
        </div>

        {/* Exclusions */}
        <div className="bg-rose-50/50 border border-rose-200/80 rounded-3xl p-6 sm:p-8">
          <h3 className="text-base font-bold text-rose-950 mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600" />
            What is Excluded
          </h3>
          {exclusionsList.length > 0 ? (
            <ul className="space-y-2.5 text-xs sm:text-sm text-rose-900">
              {exclusionsList.map((exc, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-2 shrink-0" />
                  <span>{exc}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-rose-800">Personal expenses, optional activities, and travel insurance.</p>
          )}
        </div>
      </div>

      {/* Itinerary Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 mb-12 shadow-sm">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Tour Schedule</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Day-by-Day Detailed Itinerary</h2>
        </div>

        <ItineraryTimeline items={items} />
      </div>

      {/* Package Reviews & Ratings Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 mb-12 shadow-sm">
        <ReviewSection
          targetType="PACKAGE"
          targetId={travelPackage.id}
          targetName={travelPackage.title}
        />
      </div>

      {/* Booking Drawer / Modal */}
      <PackageBookingModal
        travelPackage={travelPackage}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </div>
  );
};

export default PackageDetails;

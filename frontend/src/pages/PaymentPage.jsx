import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import bookingApi from '../services/bookingApi';
import paymentApi from '../services/paymentApi';
import { loadRazorpayScript } from '../utils/loadRazorpay';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Users,
  Luggage,
  Hotel,
  ArrowRight,
  ChevronLeft,
  Sparkles,
  Info,
  X,
  RefreshCw
} from 'lucide-react';

export const PaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [demoOrder, setDemoOrder] = useState(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoPaymentMethod, setDemoPaymentMethod] = useState('UPI');

  const fetchBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingApi.getBookingById(id);
      setBooking(data);

      // If already paid, navigate directly to success view
      if (data.paymentStatus === 'PAID' || data.status === 'CONFIRMED') {
        navigate(`/bookings/${id}/payment/success`, { replace: true, state: { booking: data } });
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve booking information for payment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleCompleteVerification = async (attemptReference, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    try {
      setIsProcessing(true);
      setPaymentError(null);

      const verifyPayload = {
        attemptReference,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      };

      const verificationResult = await paymentApi.verifyPayment(verifyPayload);

      // Navigate to payment success on authenticated verification
      navigate(`/bookings/${id}/payment/success`, {
        state: {
          booking,
          verification: verificationResult
        }
      });
    } catch (verifyErr) {
      setPaymentError(verifyErr.message || 'Payment signature verification failed. Please try again or contact support.');
      setIsProcessing(false);
      setShowDemoModal(false);
    }
  };

  const handleInitiatePayment = async () => {
    if (!booking) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // 1. Request backend to create an authoritative payment order (amount calculated on server)
      const orderData = await paymentApi.createPaymentOrder({
        bookingReference: booking.bookingReference,
        bookingId: booking.id
      });

      // 2. Check if running in Controlled Demo Mode (when live Razorpay credentials are not configured)
      if (orderData.demoMode || !orderData.keyId) {
        setDemoOrder(orderData);
        setShowDemoModal(true);
        setIsProcessing(false);
        return;
      }

      // 3. Configure Real Razorpay checkout options when valid credentials are set
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Payment gateway failed to initialize. Please check your connection and try again.');
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amountInSubunits,
        currency: orderData.currency || 'INR',
        name: 'TravelSphere',
        description: `Reservation ${booking.bookingReference}`,
        image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=256&q=80',
        order_id: orderData.orderId,
        prefill: {
          name: user?.fullName || booking.userFullName || '',
          email: user?.email || booking.userEmail || '',
          contact: user?.phoneNumber || ''
        },
        theme: {
          color: '#0d9488' // TravelSphere Teal brand color
        },
        handler: async (response) => {
          await handleCompleteVerification(
            orderData.attemptReference,
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        modal: {
          ondismiss: async () => {
            setIsProcessing(false);
            try {
              await paymentApi.reportPaymentFailure({
                attemptReference: orderData.attemptReference,
                failureReason: 'Payment window was closed by the user.'
              });
              setPaymentError('Payment window was closed. Your reservation is preserved and you can retry.');
            } catch {
              // Non-blocking diagnostic record
            }
          }
        }
      };

      // Open Razorpay Checkout Dialog
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();

    } catch (err) {
      setPaymentError(err.message || 'Unable to start payment. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleConfirmDemoPayment = async () => {
    if (!demoOrder) return;
    const randomHex = Math.random().toString(36).substring(2, 8);
    const timeHex = Date.now().toString(36);
    const simulatedPaymentId = `pay_demo_${timeHex}_${randomHex}`;
    const simulatedSignature = `demo_sig_${timeHex}_${randomHex}`;

    await handleCompleteVerification(
      demoOrder.attemptReference,
      demoOrder.orderId,
      simulatedPaymentId,
      simulatedSignature
    );
  };

  const handleCancelDemoPayment = async () => {
    if (!demoOrder) {
      setShowDemoModal(false);
      return;
    }
    try {
      setIsProcessing(true);
      await paymentApi.reportPaymentFailure({
        attemptReference: demoOrder.attemptReference,
        failureReason: 'User simulated a payment cancellation in demo mode.'
      });
      setPaymentError('Simulated payment cancellation recorded. Your reservation is preserved and you can retry.');
    } catch (err) {
      setPaymentError(err.message || 'Payment cancellation recorded.');
    } finally {
      setIsProcessing(false);
      setShowDemoModal(false);
    }
  };

  if (loading) {
    return <LoadingState type="detail" />;
  }

  if (error || !booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Booking Not Found"
          message={error || "We couldn't retrieve the reservation for payment."}
          onRetry={fetchBooking}
        />
        <div className="text-center mt-6">
          <Link
            to="/bookings"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const isPackage = booking.bookingType === 'PACKAGE';
  const packageItem = isPackage && booking.packageItems?.[0];
  const hotelItem = !isPackage && booking.hotelItems?.[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to={`/bookings/${id}`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-teal-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Booking Details</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Secure TravelSphere Checkout</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Complete Your Payment</h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Authoritative pricing confirmed. Finalize your reservation to receive immediate confirmation.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-right border border-white/15 shrink-0">
            <span className="text-[11px] uppercase tracking-wider text-slate-300 block font-medium">Booking Ref</span>
            <span className="text-lg sm:text-xl font-mono font-bold text-teal-300 block">
              {booking.bookingReference}
            </span>
          </div>
        </div>
      </div>

      {/* Error alert if payment failed */}
      {paymentError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block">Payment Notice:</strong>
            <span>{paymentError}</span>
          </div>
        </div>
      )}

      {/* Main Checkout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Reservation Item Details (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              {isPackage ? <Luggage className="w-5 h-5 text-teal-600" /> : <Hotel className="w-5 h-5 text-teal-600" />}
              <span>Reservation Summary</span>
            </h2>

            <div className="border border-slate-100 bg-slate-50/70 rounded-2xl p-5 mb-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                    {isPackage ? 'Selected Travel Package' : 'Reserved Hotel Stay'}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {isPackage ? packageItem?.packageTitle : hotelItem?.hotelName}
                  </h3>
                  {hotelItem?.destinationName && (
                    <span className="text-xs text-slate-500 font-medium block mt-0.5">
                      {hotelItem.destinationName} • {hotelItem.roomType}
                    </span>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm sm:text-base font-extrabold text-teal-900 block">
                    {formatCurrency(booking.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/80 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    {isPackage
                      ? `Departure: ${formatDate(packageItem?.startDate)} (${packageItem?.durationDays || 1} Days)`
                      : `${formatDate(hotelItem?.checkInDate)} to ${formatDate(hotelItem?.checkOutDate)} (${hotelItem?.totalNights || 1} Nights)`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    {isPackage
                      ? `${packageItem?.guestsCount || 1} Traveler(s)`
                      : `${hotelItem?.roomsCount || 1} Room(s) • ${hotelItem?.guestsCount || 1} Guest(s)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Supported Payment Channels */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Accepted Payment Methods
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs text-slate-600 font-medium">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col items-center gap-1">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  <span>Credit / Debit</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col items-center gap-1">
                  <span className="text-xs font-extrabold text-teal-700">UPI</span>
                  <span>GPay / PhonePe</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Net Banking</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col items-center gap-1">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Wallets</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Guarantees card */}
          <div className="bg-teal-50/60 border border-teal-200/70 rounded-3xl p-5 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs text-teal-950">
              <h4 className="font-bold text-sm text-teal-900 mb-0.5">Bank-Grade 256-Bit SSL Protection</h4>
              <p className="text-teal-800/90 leading-relaxed">
                Your payment is verified with server-side HMAC cryptographic signatures. TravelSphere never stores card numbers or CVV codes.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Summary & Checkout Button (1 Column) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-lg sticky top-24">
          <h3 className="text-base font-bold text-slate-900 pb-4 border-b border-slate-100 mb-4">
            Payment Summary
          </h3>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600 mb-6">
            <div className="flex items-center justify-between">
              <span>Reservation Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCurrency(booking.totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Platform Processing Fee</span>
              <span className="text-emerald-700 font-semibold">FREE (Waived)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Taxes & Tourism Levies</span>
              <span className="text-slate-500 font-medium">Included in Total</span>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-baseline justify-between">
              <span className="text-sm sm:text-base font-bold text-slate-900">Total Payable</span>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-brand-navy block">
                  {formatCurrency(booking.totalAmount)}
                </span>
                <span className="text-[11px] text-slate-400 font-normal">in {booking.currency || 'INR'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleInitiatePayment}
            disabled={isProcessing}
            className="w-full py-4 px-6 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25 hover:shadow-xl hover:shadow-teal-600/30"
          >
            {isProcessing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Contacting Gateway...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Pay {formatCurrency(booking.totalAmount)} Now</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>End-to-End Encrypted & Verified</span>
          </p>
        </div>
      </div>

      {/* Controlled Demo Payment Modal (Local Development / Testing Flow) */}
      {showDemoModal && demoOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-brand-navy to-teal-900 text-white p-6 relative">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Simulated Development Checkout</span>
                </div>
                <button
                  onClick={() => setShowDemoModal(false)}
                  disabled={isProcessing}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-xl font-bold mt-2">Test Payment Simulation</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Razorpay live credentials not configured. Verify full checkout & confirmation safely.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>No Real Financial Transaction</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  This simulates the entire Razorpay order, payment capture, and server-side verification without charging real money or requiring payment details.
                </p>
              </div>

              {/* Order Details */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Booking Reference:</span>
                  <span className="font-mono font-bold text-slate-900">{booking.bookingReference}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Authoritative Amount:</span>
                  <span className="font-black text-teal-900 text-sm">{formatCurrency(booking.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Demo Order ID:</span>
                  <span className="font-mono text-slate-500 truncate max-w-[200px]">{demoOrder.orderId}</span>
                </div>
              </div>

              {/* Simulated Channel Selector */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">Simulated Payment Method:</span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {['UPI', 'CARD', 'NET_BANKING'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setDemoPaymentMethod(method)}
                      className={`p-2.5 rounded-xl border font-semibold transition-all ${
                        demoPaymentMethod === method
                          ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {method === 'UPI' ? 'UPI Demo' : method === 'CARD' ? 'Card Demo' : 'NetBanking'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-2.5">
              <button
                onClick={handleConfirmDemoPayment}
                disabled={isProcessing}
                className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Demo Payment...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Complete Demo Payment ({formatCurrency(booking.totalAmount)})</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCancelDemoPayment}
                disabled={isProcessing}
                className="w-full py-2.5 px-4 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5 text-rose-600" />
                <span>Simulate Payment Failure / Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;

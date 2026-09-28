import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  CloudSnow, 
  Wind, 
  Droplets, 
  Compass, 
  Thermometer, 
  RefreshCw, 
  AlertCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import weatherApi from '../services/weatherApi';

/**
 * Returns an appropriate Lucide icon component based on condition or iconCode.
 */
const getWeatherIcon = (condition, iconCode, className = 'w-6 h-6') => {
  const condLower = (condition || '').toLowerCase();

  if (condLower.includes('rain') || condLower.includes('drizzle')) {
    return <CloudRain className={`${className} text-sky-400`} />;
  }
  if (condLower.includes('thunder') || condLower.includes('storm')) {
    return <CloudLightning className={`${className} text-amber-400`} />;
  }
  if (condLower.includes('snow')) {
    return <CloudSnow className={`${className} text-blue-200`} />;
  }
  if (condLower.includes('partly') || condLower.includes('mainly') || condLower.includes('few')) {
    return <CloudSun className={`${className} text-amber-300`} />;
  }
  if (condLower.includes('cloud') || condLower.includes('overcast')) {
    return <Cloud className={`${className} text-slate-300`} />;
  }
  if (condLower.includes('wind')) {
    return <Wind className={`${className} text-teal-300`} />;
  }
  return <Sun className={`${className} text-amber-400`} />;
};

export const DestinationWeatherCard = ({
  destinationId,
  destinationName,
  latitude,
  longitude,
  climateFallback,
  className = ''
}) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      let data = null;
      if (destinationId) {
        data = await weatherApi.getDestinationWeather(destinationId);
      } else if (latitude != null && longitude != null) {
        data = await weatherApi.getByCoordinates(latitude, longitude, destinationName);
      }

      if (data) {
        setWeather(data);
      } else {
        setError('Weather data unavailable.');
      }
    } catch (err) {
      console.warn('Weather fetch warning:', err.message);
      setError(err.message || 'Live weather currently unavailable.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (destinationId || (latitude != null && longitude != null)) {
      fetchWeather();
    }
  }, [destinationId, latitude, longitude]);

  // Loading State
  if (loading) {
    return (
      <div className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-800 rounded w-12"></div>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-slate-800 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-6 bg-slate-800 rounded w-20"></div>
            <div className="h-3 bg-slate-800 rounded w-28"></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800">
          <div className="h-8 bg-slate-800 rounded"></div>
          <div className="h-8 bg-slate-800 rounded"></div>
          <div className="h-8 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  // Unavailable / Error State
  if (error || !weather || !weather.available) {
    return (
      <div className={`bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 text-slate-300 shadow-md ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CloudSun className="w-4 h-4 text-teal-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Weather & Climate
            </h4>
          </div>
          <button
            onClick={() => fetchWeather(true)}
            disabled={refreshing}
            aria-label="Retry weather fetch"
            className="text-slate-400 hover:text-teal-400 transition-colors p-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-2">
          {climateFallback ? `General Climate: ${climateFallback}` : 'Live weather information is temporarily unavailable.'}
        </p>
        <p className="text-[11px] text-slate-500">
          Destination activities and tours remain available as planned.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl text-white ${className}`}>
      {/* Card Header */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
            {getWeatherIcon(weather.condition, weather.iconCode, 'w-4 h-4')}
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Live Weather
            </h4>
            <span className="text-[11px] text-slate-400">
              {weather.locationName}
            </span>
          </div>
        </div>

        <button
          onClick={() => fetchWeather(true)}
          disabled={refreshing}
          title="Refresh current conditions"
          aria-label="Refresh weather conditions"
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-teal-300 transition-colors bg-slate-800/80 hover:bg-slate-800 px-2 py-1 rounded-lg border border-slate-700/60"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Temperature & Condition */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black tracking-tight text-white">
            {Math.round(weather.temperature)}°<span className="text-xl font-medium text-slate-400">C</span>
          </span>
          <div className="text-xs text-slate-400">
            {weather.feelsLike != null && (
              <span className="block">Feels like {Math.round(weather.feelsLike)}°C</span>
            )}
            {weather.tempMin != null && weather.tempMax != null && (
              <span className="block text-[11px] text-slate-500">
                {Math.round(weather.tempMin)}° / {Math.round(weather.tempMax)}°
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-950/60 border border-teal-700/60 text-teal-300 capitalize">
            {weather.condition}
          </span>
          <span className="block text-[11px] text-slate-400 capitalize mt-0.5">
            {weather.description}
          </span>
        </div>
      </div>

      {/* Environmental Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <Droplets className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Humidity</span>
            <span className="font-bold text-slate-200">{weather.humidity}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Wind className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Wind</span>
            <span className="font-bold text-slate-200">{weather.windSpeed} km/h</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Thermometer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Pressure</span>
            <span className="font-bold text-slate-200">{weather.pressure} hPa</span>
          </div>
        </div>
      </div>

      {/* Travel Context Banner */}
      {weather.travelContext && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2.5 mb-3 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
          <p>{weather.travelContext}</p>
        </div>
      )}

      {/* 5-Day Forecast Strip */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-2">
            <Calendar className="w-3 h-3 text-teal-400" />
            <span>5-Day Outlook</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 text-center">
            {weather.forecast.map((day, idx) => (
              <div 
                key={day.date || idx}
                className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-1.5 flex flex-col items-center justify-between"
              >
                <span className="text-[10px] font-bold text-slate-300 truncate w-full">
                  {day.dayOfWeek ? day.dayOfWeek.slice(0, 3) : ''}
                </span>
                <div className="my-1">
                  {getWeatherIcon(day.condition, day.iconCode, 'w-4 h-4')}
                </div>
                <div className="text-[10px] font-semibold text-slate-200">
                  {Math.round(day.tempMax)}°
                </div>
                <div className="text-[9px] text-slate-500">
                  {Math.round(day.tempMin)}°
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DestinationWeatherCard;

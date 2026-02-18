import { useState, useMemo } from "react";
import { MapPin, Lock, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const locationData: Record<string, string[]> = {
  "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Surat", "Chandigarh", "Kochi", "Bhopal", "Indore"],
  "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "San Francisco", "Miami", "Seattle", "Boston", "Denver"],
  "United Kingdom": ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Edinburgh", "Glasgow", "Bristol"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam"],
  "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  "Germany": ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"],
  "France": ["Paris", "Lyon", "Marseille", "Toulouse", "Nice"],
  "Japan": ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya"],
  "South Korea": ["Seoul", "Busan", "Incheon", "Daegu"],
  "Brazil": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
  "Pakistan": ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad"],
  "Bangladesh": ["Dhaka", "Chittagong", "Sylhet", "Rajshahi"],
  "Indonesia": ["Jakarta", "Surabaya", "Bandung", "Medan"],
  "Turkey": ["Istanbul", "Ankara", "Izmir", "Bursa"],
  "Egypt": ["Cairo", "Alexandria", "Giza", "Luxor"],
  "Nigeria": ["Lagos", "Abuja", "Kano", "Ibadan"],
  "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria"],
  "Mexico": ["Mexico City", "Guadalajara", "Monterrey", "Cancún"],
};

const priorityCountries = ["India"];
const countries = [...priorityCountries, ...Object.keys(locationData).filter(c => !priorityCountries.includes(c)).sort()];

interface LocationSelectorProps {
  country: string | null;
  city: string | null;
  lastLocationChange: string | null;
  onSelect: (country: string, city: string) => void;
  compact?: boolean;
}

function isLocationLocked(lastChange: string | null): boolean {
  if (!lastChange) return false;
  const changeDate = new Date(lastChange);
  const now = new Date();
  const diffMs = now.getTime() - changeDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays < 30;
}

function daysUntilUnlock(lastChange: string | null): number {
  if (!lastChange) return 0;
  const changeDate = new Date(lastChange);
  const unlockDate = new Date(changeDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  return Math.max(0, Math.ceil((unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export function LocationSelector({ country, city, lastLocationChange, onSelect, compact = false }: LocationSelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState(country || "");
  const [selectedCity, setSelectedCity] = useState(city || "");
  const locked = isLocationLocked(lastLocationChange);
  const remainingDays = daysUntilUnlock(lastLocationChange);

  const cities = useMemo(() => {
    return selectedCountry ? (locationData[selectedCountry] || []) : [];
  }, [selectedCountry]);

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setSelectedCity("");
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    if (selectedCountry && value) {
      onSelect(selectedCountry, value);
    }
  };

  if (locked && compact) {
    return (
      <div className="flex items-center justify-center gap-1 text-primary mt-1">
        <MapPin className="w-4 h-4" />
        <span>{city}{city && country ? " | " : ""}{country}</span>
        <Lock className="w-3 h-3 text-muted-foreground ml-1" />
      </div>
    );
  }

  return (
    <div className={compact ? "mt-1" : "space-y-2"}>
      {locked ? (
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-primary">
            <MapPin className="w-4 h-4" />
            <span>{city}{city && country ? " | " : ""}{country}</span>
            <Lock className="w-3 h-3 text-muted-foreground ml-1" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Locked for {remainingDays} more day{remainingDays !== 1 ? "s" : ""}
          </p>
        </div>
      ) : (
        <>
          {compact && (country || city) && (
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <MapPin className="w-4 h-4" />
              <span>{city}{city && country ? " | " : ""}{country}</span>
            </div>
          )}
          <div className={compact ? "flex items-center justify-center gap-2" : "space-y-3"}>
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger className={compact ? "w-[140px] h-8 text-xs bg-muted border-border" : "bg-muted border-border text-foreground"}>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50 max-h-48">
                {countries.map((c) => (
                  <SelectItem key={c} value={c} className="text-sm">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCity} onValueChange={handleCityChange} disabled={!selectedCountry}>
              <SelectTrigger className={compact ? "w-[120px] h-8 text-xs bg-muted border-border" : "bg-muted border-border text-foreground"}>
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50 max-h-48">
                {cities.map((c) => (
                  <SelectItem key={c} value={c} className="text-sm">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-1">
            {country ? "Change location (locks for 1 month)" : "Select your location (locks for 1 month)"}
          </p>
        </>
      )}
    </div>
  );
}

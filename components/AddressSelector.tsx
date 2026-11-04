'use client';

import { useState, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

interface City {
  id: number;
  name: string;
}

interface District {
  id: number;
  name: string;
}

interface Neighborhood {
  id: number;
  name: string;
}

interface AddressSelectorProps {
  onAddressChange: (address: {
    city: string;
    cityId: number;
    district: string;
    districtId: number;
    neighborhood: string;
    neighborhoodId: number;
  }) => void;
  initialValues?: {
    city?: string;
    cityId?: number;
    district?: string;
    districtId?: number;
    neighborhood?: string;
    neighborhoodId?: number;
  };
}

export default function AddressSelector({ onAddressChange, initialValues }: AddressSelectorProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  
  const [selectedCity, setSelectedCity] = useState<number>(initialValues?.cityId || 0);
  const [selectedDistrict, setSelectedDistrict] = useState<number>(initialValues?.districtId || 0);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<number>(initialValues?.neighborhoodId || 0);
  
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    if (selectedCity > 0) {
      fetchDistricts(selectedCity);
    } else {
      setDistricts([]);
      setNeighborhoods([]);
      setSelectedDistrict(0);
      setSelectedNeighborhood(0);
    }
  }, [selectedCity]);

  useEffect(() => {
    if (selectedDistrict > 0) {
      fetchNeighborhoods(selectedDistrict);
    } else {
      setNeighborhoods([]);
      setSelectedNeighborhood(0);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedCity > 0 && selectedDistrict > 0 && selectedNeighborhood > 0) {
      const city = cities.find(c => c.id === selectedCity);
      const district = districts.find(d => d.id === selectedDistrict);
      const neighborhood = neighborhoods.find(n => n.id === selectedNeighborhood);
      
      if (city && district && neighborhood) {
        onAddressChange({
          city: city.name,
          cityId: city.id,
          district: district.name,
          districtId: district.id,
          neighborhood: neighborhood.name,
          neighborhoodId: neighborhood.id,
        });
      }
    }
  }, [selectedCity, selectedDistrict, selectedNeighborhood, cities, districts, neighborhoods]);

  const fetchCities = async () => {
    try {
      setLoadingCities(true);
      const res = await fetch('/api/address/cities');
      const data = await res.json();
      if (data.success) {
        setCities(data.data);
        if (initialValues?.cityId) {
          setSelectedCity(initialValues.cityId);
        }
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchDistricts = async (cityId: number) => {
    try {
      setLoadingDistricts(true);
      setDistricts([]);
      setNeighborhoods([]);
      setSelectedDistrict(0);
      setSelectedNeighborhood(0);
      
      const res = await fetch(`/api/address/districts?cityId=${cityId}`);
      const data = await res.json();
      if (data.success) {
        setDistricts(data.data);
        if (initialValues?.districtId && initialValues.cityId === cityId) {
          setSelectedDistrict(initialValues.districtId);
        }
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchNeighborhoods = async (districtId: number) => {
    try {
      setLoadingNeighborhoods(true);
      setNeighborhoods([]);
      setSelectedNeighborhood(0);
      
      const res = await fetch(`/api/address/neighborhoods?districtId=${districtId}`);
      const data = await res.json();
      if (data.success) {
        setNeighborhoods(data.data);
        if (initialValues?.neighborhoodId && initialValues.districtId === districtId) {
          setSelectedNeighborhood(initialValues.neighborhoodId);
        }
      }
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
    } finally {
      setLoadingNeighborhoods(false);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
      {/* İl Seçimi */}
      <div>
        <label className="block text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 leading-[1]">
          İl <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(parseInt(e.target.value))}
            required
            disabled={loadingCities}
            className="w-full px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent appearance-none bg-white cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed text-[11px] sm:text-xs md:text-sm min-h-[40px] sm:min-h-[44px] md:min-h-[48px] touch-manipulation"
          >
            <option value="0">İl Seçiniz</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          <FiChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
        </div>
      </div>

      {/* İlçe Seçimi */}
      <div>
        <label className="block text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 leading-[1]">
          İlçe <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(parseInt(e.target.value))}
            required
            disabled={loadingDistricts || selectedCity === 0}
            className="w-full px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent appearance-none bg-white cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed text-[11px] sm:text-xs md:text-sm min-h-[40px] sm:min-h-[44px] md:min-h-[48px] touch-manipulation"
          >
            <option value="0">
              {loadingDistricts ? 'Yükleniyor...' : selectedCity === 0 ? 'Önce il seçiniz' : 'İlçe Seçiniz'}
            </option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
          <FiChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
        </div>
      </div>

      {/* Mahalle Seçimi */}
      <div>
        <label className="block text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 leading-[1]">
          Mahalle <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={selectedNeighborhood}
            onChange={(e) => setSelectedNeighborhood(parseInt(e.target.value))}
            required
            disabled={loadingNeighborhoods || selectedDistrict === 0}
            className="w-full px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent appearance-none bg-white cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed text-[11px] sm:text-xs md:text-sm min-h-[40px] sm:min-h-[44px] md:min-h-[48px] touch-manipulation"
          >
            <option value="0">
              {loadingNeighborhoods ? 'Yükleniyor...' : selectedDistrict === 0 ? 'Önce ilçe seçiniz' : 'Mahalle Seçiniz'}
            </option>
            {neighborhoods.map((neighborhood) => (
              <option key={neighborhood.id} value={neighborhood.id}>
                {neighborhood.name}
              </option>
            ))}
          </select>
          <FiChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
        </div>
      </div>
    </div>
  );
}


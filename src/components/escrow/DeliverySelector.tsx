"use client";

import React, { useState } from 'react';
import { DeliveryOption, DeliveryDetails } from '@/types/escrow';

interface DeliverySelectorProps {
  selectedOption: DeliveryOption;
  onOptionChange: (option: DeliveryOption) => void;
  deliveryDetails: DeliveryDetails;
  onDetailsChange: (details: Partial<DeliveryDetails>) => void;
}

export function DeliverySelector({
  selectedOption,
  onOptionChange,
  deliveryDetails,
  onDetailsChange
}: DeliverySelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const deliveryOptions = [
    {
      value: DeliveryOption.FACE_TO_FACE,
      label: 'Face-to-Face Meetup',
      description: 'Meet in person to exchange item and payment',
      icon: '🤝',
      fields: ['meetingPoint', 'notes']
    },
    {
      value: DeliveryOption.PARTNERED_SERVICE,
      label: 'Partnered Logistics Service',
      description: 'We handle delivery with our trusted partners',
      icon: '🚚',
      fields: ['address', 'estimatedDelivery', 'notes']
    },
    {
      value: DeliveryOption.OWN_LOGISTICS,
      label: 'Buyer/Seller Own Logistics',
      description: 'You arrange your own delivery method',
      icon: '📦',
      fields: ['address', 'trackingNumber', 'notes']
    }
  ];

  const handleOptionChange = (option: DeliveryOption) => {
    onOptionChange(option);
    // Reset details when changing option
    onDetailsChange({
      option,
      address: '',
      meetingPoint: '',
      estimatedDelivery: '',
      trackingNumber: '',
      notes: ''
    });
  };

  const renderFields = () => {
    const selectedOptionData = deliveryOptions.find(opt => opt.value === selectedOption);
    if (!selectedOptionData) return null;

    return (
      <div className="mt-4 space-y-4">
        {selectedOptionData.fields.includes('meetingPoint') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Point
            </label>
            <input
              type="text"
              value={deliveryDetails.meetingPoint || ''}
              onChange={(e) => onDetailsChange({ meetingPoint: e.target.value })}
              placeholder="e.g., Central Park, Main Street Mall"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {selectedOptionData.fields.includes('address') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Address
            </label>
            <textarea
              value={deliveryDetails.address || ''}
              onChange={(e) => onDetailsChange({ address: e.target.value })}
              placeholder="Enter full delivery address"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {selectedOptionData.fields.includes('estimatedDelivery') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Delivery Time
            </label>
            <input
              type="text"
              value={deliveryDetails.estimatedDelivery || ''}
              onChange={(e) => onDetailsChange({ estimatedDelivery: e.target.value })}
              placeholder="e.g., 2-3 business days"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {selectedOptionData.fields.includes('trackingNumber') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tracking Number
            </label>
            <input
              type="text"
              value={deliveryDetails.trackingNumber || ''}
              onChange={(e) => onDetailsChange({ trackingNumber: e.target.value })}
              placeholder="Enter tracking number when available"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={deliveryDetails.notes || ''}
            onChange={(e) => onDetailsChange({ notes: e.target.value })}
            placeholder="Any special instructions or notes"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Delivery Method</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className="space-y-3">
        {deliveryOptions.map((option) => (
          <div
            key={option.value}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedOption === option.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleOptionChange(option.value)}
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{option.icon}</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{option.label}</h4>
                <p className="text-sm text-gray-600 mt-1">{option.description}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedOption === option.value
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {selectedOption === option.value && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isExpanded && renderFields()}
    </div>
  );
}

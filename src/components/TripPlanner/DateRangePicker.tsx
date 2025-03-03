import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";

interface DateRangePickerProps {
  startDate: Date | null | undefined;
  endDate: Date | null | undefined;
  onChange: (start: Date | null, end: Date | null) => void;
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'start' | 'end' | null>(null);

  // Handle input click
  const handleInputClick = (input: 'start' | 'end') => {
    setFocusedInput(input);
    setIsOpen(true);
  };

  // Auto-focus end date after selecting start date
  useEffect(() => {
    if (startDate && !endDate) {
      setFocusedInput('end');
    }
  }, [startDate, endDate]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <div className="relative">
            <input
              type="text"
              value={startDate ? format(startDate, 'MMM d, yyyy') : ''}
              onClick={() => handleInputClick('start')}
              readOnly
              placeholder="Select start date"
              className={`w-full px-4 py-2 pl-10 border rounded-lg shadow-sm cursor-pointer transition-all ${
                focusedInput === 'start'
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : startDate
                  ? 'border-gray-300'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            />
            <Calendar 
              size={18}
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                focusedInput === 'start' ? 'text-blue-500' : 'text-gray-400'
              }`}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <div className="relative">
            <input
              type="text"
              value={endDate ? format(endDate, 'MMM d, yyyy') : ''}
              onClick={() => handleInputClick('end')}
              readOnly
              placeholder="Select end date"
              className={`w-full px-4 py-2 pl-10 border rounded-lg shadow-sm cursor-pointer transition-all ${
                focusedInput === 'end'
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : endDate
                  ? 'border-gray-300'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            />
            <Calendar 
              size={18}
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                focusedInput === 'end' ? 'text-blue-500' : 'text-gray-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Hidden DatePicker that controls the actual date selection */}
      {isOpen && (
        <div className="absolute z-50 mt-2">
          <DatePicker
            selected={focusedInput === 'start' ? startDate : endDate}
            onChange={(date) => {
              if (focusedInput === 'start') {
                onChange(date, endDate);
              } else {
                onChange(startDate, date);
                if (startDate && date) {
                  setIsOpen(false);
                  setFocusedInput(null);
                }
              }
            }}
            selectsStart={focusedInput === 'start'}
            selectsEnd={focusedInput === 'end'}
            startDate={startDate}
            endDate={endDate}
            minDate={focusedInput === 'end' ? startDate : new Date()}
            open={true}
            monthsShown={2}
            inline
            calendarClassName="shadow-lg border border-gray-200 rounded-lg bg-white"
          />
        </div>
      )}

      {startDate && endDate && (
        <div className="text-sm text-gray-500">
          {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')} 
          ({Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days)
        </div>
      )}
    </div>
  );
}
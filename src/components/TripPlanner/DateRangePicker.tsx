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

  // Close the calendar when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const datePickerElements = document.querySelectorAll('.react-datepicker, .react-datepicker-wrapper, .date-input');
      
      // Check if click was inside any of the datepicker elements
      let isInsideDatePicker = false;
      datePickerElements.forEach(element => {
        if (element.contains(target)) {
          isInsideDatePicker = true;
        }
      });
      
      if (!isInsideDatePicker) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Custom styles to be injected for calendar layout
  useEffect(() => {
    // Add custom styles to make months appear side by side and center within the panel
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .date-range-picker-container {
        position: relative;
      }
      
      .react-datepicker-wrapper {
        width: 100% !important;
      }
      
      .react-datepicker {
        width: 450px !important;
        max-width: 100% !important;
        display: flex !important;
        justify-content: center !important;
        background-color: white !important;
        margin: 0 auto !important;
        height: 230px !important;
      }
      
      .react-datepicker__month-container {
        float: none !important;
        width: 50% !important;
        height: 230px !important;
        display: flex !important;
        flex-direction: column !important;
      }
      
      /* Month header */
      .react-datepicker__header {
        background-color: #f8f9fa !important;
        border-bottom: 1px solid #e9ecef !important;
      }
      
      /* Navigation arrows */
      .react-datepicker__navigation-icon::before {
        border-color: #2563eb !important;
      }
      
      .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
        border-color: #1e40af !important;
      }
      
      .react-datepicker__current-month {
        font-weight: 500 !important;
        font-size: 0.9rem !important;
      }
      
      .react-datepicker__navigation {
        top: 10px !important;
      }
      
      /* Default day styling */
      .react-datepicker__day {
        margin: 0.1rem !important;
        width: 1.5rem !important;
        line-height: 1.5rem !important;
        border-radius: 0.25rem !important;
        color: #333333 !important;
      }
      
      /* Hover state */
      .react-datepicker__day:hover {
        background-color: #e6f0ff !important;
        color: #2563eb !important;
      }
      
      /* Selected day */
      .react-datepicker__day--selected,
      .react-datepicker__day--in-selecting-range,
      .react-datepicker__day--in-range {
        background-color: #2563eb !important;
        color: #ffffff !important;
      }
      
      /* Today's date */
      .react-datepicker__day--today {
        font-weight: 500 !important;
        color: #2563eb !important;
      }
      
      /* Range start and end */
      .react-datepicker__day--range-start,
      .react-datepicker__day--range-end {
        background-color: #2563eb !important;
        color: white !important;
      }
      
      /* Days in range */
      .react-datepicker__day--in-range:not(.react-datepicker__day--range-start):not(.react-datepicker__day--range-end) {
        background-color: #dbeafe !important;
        color: #2563eb !important;
      }
      
      /* Make focus-visible match textfield style */
      .react-datepicker__day--keyboard-selected {
        background-color: rgba(37, 99, 235, 0.1) !important;
        color: #2563eb !important;
      }
      
      /* Disabled days */
      .react-datepicker__day--disabled {
        color: #cccccc !important;
      }
      
      /* Day names header */
      .react-datepicker__day-name {
        margin: 0.1rem !important;
        width: 1.5rem !important;
        color: #666666 !important;
      }
      
      .react-datepicker__month {
        margin: 0.2rem !important;
        height: 160px !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
      }
      
      .react-datepicker-popper {
        position: absolute !important;
        left: 0 !important;
        right: 0 !important;
        transform: none !important;
        margin-left: auto !important;
        margin-right: auto !important;
        width: 450px !important;
        max-width: 100% !important;
      }
      
      .calendar-popup-container {
        display: flex !important;
        justify-content: center !important;
        width: 100% !important;
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  return (
    <div className="space-y-4 date-range-picker-container">
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
              className={`w-full px-4 py-2 pl-10 border rounded-lg shadow-sm cursor-pointer transition-all date-input ${
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
              className={`w-full px-4 py-2 pl-10 border rounded-lg shadow-sm cursor-pointer transition-all date-input ${
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

      {/* DatePicker for date selection - centered within parent container */}
      {isOpen && (
        <div className="calendar-popup-container">
          <DatePicker
            selected={focusedInput === 'start' ? startDate : endDate}
            onChange={(date) => {
              if (focusedInput === 'start') {
                onChange(date, endDate);
                setFocusedInput('end');
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
            popperClassName="calendar-centered"
            popperPlacement="bottom"
            popperModifiers={[
              {
                name: 'preventOverflow',
                options: {
                  padding: 8,
                  boundariesElement: 'viewport',
                },
              },
            ]}
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
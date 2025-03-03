import React from 'react';
import { Download, Printer, Share2 } from 'lucide-react';
import { Itinerary, DayPlan, Activity } from '../../types/itinerary';
import { format } from 'date-fns';

interface ExportItineraryProps {
  itinerary: Partial<Itinerary>;
}

export function ExportItinerary({ itinerary }: ExportItineraryProps) {
  // Function to create and download a PDF
  const downloadPDF = () => {
    // In a real implementation, you'd use a library like jsPDF or html2pdf
    // This is a simplified version that creates an HTML file instead
    const htmlContent = generateHTML(itinerary);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Itinerary-${itinerary.tripDetails?.destination?.replace(/[^a-zA-Z0-9]/g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to print the itinerary
  const printItinerary = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateHTML(itinerary));
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  // Function to share the itinerary
  const shareItinerary = () => {
    if (navigator.share) {
      const title = `Trip to ${itinerary.tripDetails?.destination}`;
      const text = `Check out my trip to ${itinerary.tripDetails?.destination} from ${
        itinerary.tripDetails?.startDate ? format(new Date(itinerary.tripDetails.startDate), 'MMM d, yyyy') : ''
      } to ${
        itinerary.tripDetails?.endDate ? format(new Date(itinerary.tripDetails.endDate), 'MMM d, yyyy') : ''
      }`;
      
      navigator.share({
        title,
        text
      }).catch(error => {
        console.error('Error sharing:', error);
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      alert('Sharing is not supported in your browser');
    }
  };

  // Function to generate HTML for the itinerary
  const generateHTML = (itinerary: Partial<Itinerary>) => {
    const destination = itinerary.tripDetails?.destination || 'Your Trip';
    const startDate = itinerary.tripDetails?.startDate ? format(new Date(itinerary.tripDetails.startDate), 'MMM d, yyyy') : '';
    const endDate = itinerary.tripDetails?.endDate ? format(new Date(itinerary.tripDetails.endDate), 'MMM d, yyyy') : '';
    const travelGroup = itinerary.tripDetails?.travelGroup || '';
    
    let daysHTML = '';
    
    itinerary.days?.forEach((day, index) => {
      const dayDate = day.date ? format(new Date(day.date), 'EEEE, MMMM d, yyyy') : `Day ${index + 1}`;
      
      let activitiesHTML = '';
      day.activities?.forEach(activity => {
        const startTime = activity.startTime ? format(new Date(activity.startTime), 'HH:mm') : '';
        const duration = activity.duration ? `${activity.duration} minutes` : '';
        
        activitiesHTML += `
          <div style="margin-bottom: 1rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
            <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">${activity.title}</h3>
            <p style="color: #6b7280; margin-bottom: 1rem;">${activity.description || ''}</p>
            <div style="display: flex; flex-wrap: wrap; gap: 1rem; color: #6b7280; font-size: 0.875rem;">
              ${startTime ? `<div>${startTime}</div>` : ''}
              ${duration ? `<div>• ${duration}</div>` : ''}
              ${activity.transportationType ? `<div>• ${activity.transportationType}</div>` : ''}
              ${activity.location?.name ? `<div>• ${activity.location.name}</div>` : ''}
            </div>
          </div>
        `;
      });
      
      daysHTML += `
        <div style="margin-bottom: 2rem;">
          <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb;">
            ${dayDate}
          </h2>
          ${activitiesHTML || '<p>No activities planned for this day.</p>'}
        </div>
      `;
    });
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Itinerary for ${destination}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.5;
            color: #1f2937;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
          }
          h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }
          .trip-info {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 2rem;
            color: #6b7280;
          }
          .trip-info > div {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .days-container {
            margin-top: 2rem;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: right; margin-bottom: 1rem;">
          <button onclick="window.print()" style="padding: 0.5rem 1rem; background-color: #f3f4f6; border: none; border-radius: 0.375rem; cursor: pointer;">
            Print
          </button>
        </div>
        
        <h1>Trip to ${destination}</h1>
        <div class="trip-info">
          ${startDate && endDate ? `<div>${startDate} - ${endDate}</div>` : ''}
          ${travelGroup ? `<div>• ${travelGroup}</div>` : ''}
        </div>
        
        <div class="days-container">
          ${daysHTML}
        </div>
        
        <div style="margin-top: 3rem; text-align: center; color: #9ca3af; font-size: 0.875rem;">
          Created with Tripper© - Your AI Travel Companion
        </div>
      </body>
      </html>
    `;
  };
  //Created with Tripper™, ®, ©, and ℠ - Your AI Travel Companion
  return (
    <div className="flex items-center gap-2">
      <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 divide-x">
        <button 
          onClick={downloadPDF}
          title="Download Itinerary"
          className="p-2 hover:bg-gray-50 flex items-center gap-1"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Export</span>
        </button>
        <button 
          onClick={printItinerary}
          title="Print Itinerary"
          className="p-2 hover:bg-gray-50"
        >
          <Printer size={16} />
        </button>
        <button 
          onClick={shareItinerary}
          title="Share Itinerary"
          className="p-2 hover:bg-gray-50"
        >
          <Share2 size={16} />
        </button>
      </div>
    </div>
  );
}
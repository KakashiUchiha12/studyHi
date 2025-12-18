'use client';

import { Calendar, ChevronLeft, ChevronRight, Plus, Upload, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarView } from '@/types/calendar';

interface CalendarToolbarProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  date: Date;
  onNavigate: (date: Date) => void;
  onAddEvent: () => void;
  onImportClick: () => void;
  onCopyPromptClick: () => void;
}

export default function CalendarToolbar({
  view,
  onViewChange,
  date,
  onNavigate,
  onAddEvent,
  onImportClick,
  onCopyPromptClick,
}: CalendarToolbarProps) {
  const goToToday = () => {
    onNavigate(new Date());
  };

  const goToPrevious = () => {
    const newDate = new Date(date);
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      default:
        newDate.setDate(newDate.getDate() - 1);
    }
    onNavigate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(date);
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      default:
        newDate.setDate(newDate.getDate() + 1);
    }
    onNavigate(newDate);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
    };

    if (view === 'day') {
      options.day = 'numeric';
    }

    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between p-4 border-b border-gray-200 bg-white gap-4">
      {/* Left side - Navigation */}
      <div className="flex items-center space-x-2 w-full lg:w-auto justify-between lg:justify-start">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevious}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="h-8 px-3"
          >
            Today
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 ml-4 truncate">
          {formatDate(date)}
        </h2>
      </div>

      {/* Center - View Selector */}
      <div className="flex items-center space-x-1 overflow-x-auto max-w-full pb-2 sm:pb-0">
        <Button
          variant={view === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewChange('month')}
          className="h-8 px-3 text-xs"
        >
          Month
        </Button>
        <Button
          variant={view === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewChange('week')}
          className="h-8 px-3 text-xs"
        >
          Week
        </Button>
        <Button
          variant={view === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewChange('day')}
          className="h-8 px-3 text-xs"
        >
          Day
        </Button>
        <Button
          variant={view === 'agenda' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewChange('agenda')}
          className="h-8 px-3 text-xs"
        >
          Agenda
        </Button>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-8 sm:px-3 px-2 flex"
          onClick={onCopyPromptClick}
          title="Copy AI Prompt"
        >
          <Sparkles className="h-4 w-4 sm:mr-1 text-purple-600" />
          <span className="hidden lg:inline">AI Prompt</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 sm:px-3 px-2 flex mr-2"
          onClick={onImportClick}
          title="Import CSV"
        >
          <Upload className="h-4 w-4 sm:mr-1" />
          <span className="hidden lg:inline">Import CSV</span>
        </Button>

        <Button
          size="sm"
          className="h-8 sm:px-3 px-2 bg-blue-600 hover:bg-blue-700"
          onClick={onAddEvent}
        >
          <Plus className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Add Event</span>
        </Button>
      </div>
    </div>
  );
}

import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CalendarEvent } from '@/types/events';
import { useLocalStorage } from './useLocalStorage';
import { useNotifications } from './useNotifications';

export function useCalendarEvents() {
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>('calendar-events', []);
  const { scheduleNotification, cancelNotification } = useNotifications();

  const addEvent = useCallback((eventData: Omit<CalendarEvent, 'id'>) => {
    console.log('useCalendarEvents: Adding event:', eventData);
    
    const newEvent: CalendarEvent = {
      ...eventData,
      id: uuidv4(),
    };

    console.log('useCalendarEvents: Created new event with ID:', newEvent.id);

    setEvents(prev => {
      const updatedEvents = [...prev, newEvent];
      console.log('useCalendarEvents: Updated events array:', updatedEvents);
      return updatedEvents;
    });

    // Schedule notification if enabled
    if (newEvent.notificationEnabled) {
      scheduleNotification(newEvent);
    }

    return newEvent;
  }, [setEvents, scheduleNotification]);

  const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    console.log('useCalendarEvents: Updating event:', id, 'with updates:', updates);
    
    setEvents(prev => {
      const updatedEvents = prev.map(event => {
        if (event.id === id) {
          const updatedEvent = { ...event, ...updates };
          console.log('useCalendarEvents: Updated event:', updatedEvent);
          
          // Update notification
          cancelNotification(id);
          if (updatedEvent.notificationEnabled) {
            scheduleNotification(updatedEvent);
          }
          
          return updatedEvent;
        }
        return event;
      });
      console.log('useCalendarEvents: Events after update:', updatedEvents);
      return updatedEvents;
    });
  }, [setEvents, scheduleNotification, cancelNotification]);

  const deleteEvent = useCallback((id: string) => {
    console.log('useCalendarEvents: Deleting event:', id);
    
    setEvents(prev => {
      const updatedEvents = prev.filter(event => event.id !== id);
      console.log('useCalendarEvents: Events after deletion:', updatedEvents);
      return updatedEvents;
    });
    
    cancelNotification(id);
  }, [setEvents, cancelNotification]);

  const getEventsByDate = useCallback((date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  }, [events]);

  const getUpcomingEvents = useCallback((days: number = 7) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= now && eventDate <= futureDate;
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [events]);

  // Debug: Log events whenever they change
  console.log('useCalendarEvents: Current events:', events);

  return {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsByDate,
    getUpcomingEvents,
  };
}

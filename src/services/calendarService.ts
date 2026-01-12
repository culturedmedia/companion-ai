import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string;
  notes?: string;
  calendarId: string;
}

export interface SyncedCalendar {
  id: string;
  title: string;
  color: string;
  source: string;
  isPrimary: boolean;
  isEnabled: boolean;
}

class CalendarService {
  private hasPermission = false;
  private syncedCalendars: Map<string, SyncedCalendar> = new Map();

  // Request calendar permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Failed to request calendar permissions:', error);
      return false;
    }
  }

  // Check if we have permissions
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      return false;
    }
  }

  // Get all available calendars
  async getCalendars(): Promise<SyncedCalendar[]> {
    if (!this.hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) return [];
    }

    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      
      return calendars.map(cal => ({
        id: cal.id,
        title: cal.title,
        color: cal.color || '#6366f1',
        source: cal.source?.name || 'Unknown',
        isPrimary: cal.isPrimary || false,
        isEnabled: this.syncedCalendars.has(cal.id),
      }));
    } catch (error) {
      console.error('Failed to get calendars:', error);
      return [];
    }
  }

  // Enable/disable calendar sync
  async toggleCalendarSync(calendarId: string, enabled: boolean): Promise<void> {
    if (enabled) {
      const calendars = await this.getCalendars();
      const calendar = calendars.find(c => c.id === calendarId);
      if (calendar) {
        this.syncedCalendars.set(calendarId, { ...calendar, isEnabled: true });
      }
    } else {
      this.syncedCalendars.delete(calendarId);
    }
  }

  // Get events from synced calendars
  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    if (!this.hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) return [];
    }

    try {
      const calendarIds = Array.from(this.syncedCalendars.keys());
      if (calendarIds.length === 0) {
        // If no calendars selected, get from all
        const allCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        calendarIds.push(...allCalendars.map(c => c.id));
      }

      const events = await Calendar.getEventsAsync(
        calendarIds,
        startDate,
        endDate
      );

      return events.map(event => ({
        id: event.id,
        title: event.title,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        allDay: event.allDay || false,
        location: event.location,
        notes: event.notes,
        calendarId: event.calendarId,
      }));
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }

  // Get today's events
  async getTodaysEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getEvents(today, tomorrow);
  }

  // Get this week's events
  async getWeekEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    return this.getEvents(today, weekEnd);
  }

  // Create a calendar event from a task
  async createEventFromTask(
    task: {
      title: string;
      description?: string;
      dueDate?: string;
      dueTime?: string;
    },
    calendarId?: string
  ): Promise<string | null> {
    if (!this.hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) return null;
    }

    try {
      // Get default calendar if not specified
      let targetCalendarId = calendarId;
      if (!targetCalendarId) {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const defaultCalendar = calendars.find(c => c.isPrimary) || calendars[0];
        if (!defaultCalendar) return null;
        targetCalendarId = defaultCalendar.id;
      }

      // Parse date and time
      let startDate = new Date();
      if (task.dueDate) {
        startDate = new Date(task.dueDate);
      }
      if (task.dueTime) {
        const [hours, minutes] = task.dueTime.split(':').map(Number);
        startDate.setHours(hours, minutes, 0, 0);
      }

      // End date is 1 hour after start
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);

      const eventId = await Calendar.createEventAsync(targetCalendarId, {
        title: task.title,
        notes: task.description,
        startDate,
        endDate,
        alarms: [{ relativeOffset: -30 }], // 30 min reminder
      });

      return eventId;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      return null;
    }
  }

  // Delete a calendar event
  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      await Calendar.deleteEventAsync(eventId);
      return true;
    } catch (error) {
      console.error('Failed to delete event:', error);
      return false;
    }
  }

  // Update a calendar event
  async updateEvent(
    eventId: string,
    updates: Partial<{
      title: string;
      startDate: Date;
      endDate: Date;
      notes: string;
      location: string;
    }>
  ): Promise<boolean> {
    try {
      await Calendar.updateEventAsync(eventId, updates);
      return true;
    } catch (error) {
      console.error('Failed to update event:', error);
      return false;
    }
  }

  // Create app-specific calendar
  async createAppCalendar(): Promise<string | null> {
    if (!this.hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) return null;
    }

    try {
      // Check if we already have an app calendar
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const existingAppCalendar = calendars.find(c => c.title === 'CompanionAI Tasks');
      if (existingAppCalendar) {
        return existingAppCalendar.id;
      }

      // Create new calendar
      const defaultCalendarSource = Platform.OS === 'ios'
        ? calendars.find(c => c.source?.name === 'iCloud')?.source
        : { isLocalAccount: true, name: 'CompanionAI', type: Calendar.SourceType.LOCAL };

      if (!defaultCalendarSource) {
        console.error('No calendar source available');
        return null;
      }

      const calendarId = await Calendar.createCalendarAsync({
        title: 'CompanionAI Tasks',
        color: '#6366f1',
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: defaultCalendarSource.id,
        source: defaultCalendarSource,
        name: 'companionai',
        ownerAccount: 'personal',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });

      return calendarId;
    } catch (error) {
      console.error('Failed to create app calendar:', error);
      return null;
    }
  }

  // Sync tasks to calendar
  async syncTasksToCalendar(
    userId: string,
    tasks: Array<{
      id: string;
      title: string;
      description?: string;
      due_date?: string;
      due_time?: string;
      calendar_event_id?: string;
    }>
  ): Promise<void> {
    const appCalendarId = await this.createAppCalendar();
    if (!appCalendarId) return;

    for (const task of tasks) {
      if (task.due_date && !task.calendar_event_id) {
        const eventId = await this.createEventFromTask(
          {
            title: task.title,
            description: task.description,
            dueDate: task.due_date,
            dueTime: task.due_time,
          },
          appCalendarId
        );

        if (eventId) {
          // Update task with calendar event ID
          await supabase
            .from('tasks')
            .update({ calendar_event_id: eventId })
            .eq('id', task.id);
        }
      }
    }
  }
}

export const calendarService = new CalendarService();
export default calendarService;

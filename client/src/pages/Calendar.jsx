import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import Layout from '../components/common/Layout';
import EventForm from '../components/calendar/EventForm';
import Modal from '../components/common/Modal';
import calendarService from '../api/calendarService';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';

// Setup the localizer for big calendar
const localizer = momentLocalizer(moment);

// Custom event styling
const eventStyleGetter = (event) => {
  let backgroundColor = '#3174ad'; // Default blue
  
  switch (event.event_type) {
    case 'Task':
      backgroundColor = '#28a745'; // Green for tasks
      break;
    case 'Goal':
      backgroundColor = '#dc3545'; // Red for goals
      break;
    case 'Meeting':
      backgroundColor = '#fd7e14'; // Orange for meetings
      break;
    case 'Deadline':
      backgroundColor = '#6f42c1'; // Purple for deadlines
      break;
    case 'Reminder':
      backgroundColor = '#17a2b8'; // Teal for reminders
      break;
    default:
      backgroundColor = '#3174ad'; // Blue for other events
  }
  
  return {
    style: {
      backgroundColor,
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0',
      display: 'block'
    }
  };
};

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');
  
  // Încărcarea evenimentelor inițiale
  useEffect(() => {
    loadEvents();
  }, []);
  
  const loadEvents = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await calendarService.getAllEvents();
      
      // Convertim evenimentele în formatul așteptat de react-big-calendar
      const formattedEvents = (response.events || []).map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_date),
        end: new Date(event.end_date || event.start_date),
        description: event.description,
        event_type: event.event_type,
        related_id: event.related_id,
        allDay: !event.end_date || 
                new Date(event.start_date).toDateString() === new Date(event.end_date).toDateString()
      }));
      
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load calendar events. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddEvent = () => {
    setCurrentEvent(null);
    setIsModalOpen(true);
  };
  
  const handleSelectEvent = (event) => {
    // Conversia înapoi la formatul original pentru editare
    const originalFormat = {
      id: event.id,
      title: event.title,
      description: event.description,
      start_date: event.start,
      end_date: event.end,
      event_type: event.event_type,
      related_id: event.related_id
    };
    
    setCurrentEvent(originalFormat);
    setIsModalOpen(true);
  };
  
  const handleSelectSlot = ({ start, end }) => {
    // Precompletare cu intervalul selectat
    const newEvent = {
      start_date: start,
      end_date: end
    };
    
    setCurrentEvent(newEvent);
    setIsModalOpen(true);
  };
  
  const handleEventSubmit = async (eventData) => {
    try {
      let response;
      
      if (currentEvent && currentEvent.id) {
        // Actualizare eveniment existent
        response = await calendarService.updateEvent(currentEvent.id, eventData);
        
        // Actualizare listă evenimente
        setEvents(events.map(event => 
          event.id === currentEvent.id
            ? {
                ...event,
                title: eventData.title,
                start: new Date(eventData.start_date),
                end: new Date(eventData.end_date || eventData.start_date),
                description: eventData.description,
                event_type: eventData.event_type
              }
            : event
        ));
      } else {
        // Crearea unui eveniment nou
        response = await calendarService.createEvent(eventData);
        
        // Adăugare la listă
        const newEvent = {
          id: response.event.id,
          title: response.event.title,
          start: new Date(response.event.start_date),
          end: new Date(response.event.end_date || response.event.start_date),
          description: response.event.description,
          event_type: response.event.event_type,
          related_id: response.event.related_id,
          allDay: !response.event.end_date || 
                 new Date(response.event.start_date).toDateString() === 
                 new Date(response.event.end_date).toDateString()
        };
        
        setEvents([...events, newEvent]);
      }
      
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Failed to save event. Please try again.');
    }
  };
  
  const handleDeleteEvent = async () => {
    if (!currentEvent || !currentEvent.id) return;
    
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await calendarService.deleteEvent(currentEvent.id);
      
      // Actualizare listă evenimente
      setEvents(events.filter(event => event.id !== currentEvent.id));
      
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
    }
  };
  
  const handleSyncCalendar = async () => {
    setIsSyncing(true);
    try {
      await calendarService.syncCalendar();
      
      // Reîncarcă evenimentele după sincronizare
      await loadEvents();
      
      alert('Calendar synchronized successfully with tasks and goals.');
    } catch (err) {
      console.error('Error syncing calendar:', err);
      alert('Failed to synchronize calendar. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <Layout>
      <div className="calendar-container">
        <div className="calendar-header">
          <h2>Calendar</h2>
          <div className="calendar-actions">
            <button 
              className="btn btn-secondary"
              onClick={handleSyncCalendar}
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing...' : 'Sync with Tasks & Goals'}
            </button>
            <button className="btn btn-primary" onClick={handleAddEvent}>
              Add Event
            </button>
          </div>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        {isLoading ? (
          <div className="loading">Loading calendar events...</div>
        ) : (
          <div className="calendar-wrapper">
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 650 }}
              views={['month', 'week', 'day', 'agenda']}
              view={view}
              date={date}
              onView={setView}
              onNavigate={setDate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              tooltipAccessor={event => event.description}
              popup
            />
          </div>
        )}
        
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <EventForm 
            event={currentEvent}
            onSubmit={handleEventSubmit}
            onCancel={() => setIsModalOpen(false)}
            onDelete={currentEvent?.id ? handleDeleteEvent : null}
          />
        </Modal>
      </div>
    </Layout>
  );
};

export default Calendar;
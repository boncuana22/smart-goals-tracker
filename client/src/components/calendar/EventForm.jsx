import React, { useState, useEffect } from 'react';
import './EventForm.css';

const EventForm = ({ event, onSubmit, onCancel, onDelete }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    event_type: 'Other',
  });

  useEffect(() => {
    if (event) {
      // Format dates for HTML date input
      let formattedStartDate = '';
      let formattedEndDate = '';
      
      if (event.start_date) {
        const startDate = new Date(event.start_date);
        formattedStartDate = startDate.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
      }
      
      if (event.end_date) {
        const endDate = new Date(event.end_date);
        formattedEndDate = endDate.toISOString().slice(0, 16);
      }
      
      setFormData({
        title: event.title || '',
        description: event.description || '',
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        event_type: event.event_type || 'Other',
      });
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validare
    if (!formData.title.trim()) {
      alert('Please enter a title for the event.');
      return;
    }
    
    if (!formData.start_date) {
      alert('Please select a start date and time.');
      return;
    }
    
    // Dacă end_date lipsește, folosește start_date
    const eventData = {
      ...formData,
      end_date: formData.end_date || formData.start_date
    };
    
    onSubmit(eventData);
  };

  return (
    <div className="event-form-container">
      <h2>{event ? 'Edit Event' : 'Add New Event'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Event Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="form-control"
            placeholder="e.g., Team Meeting"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-control"
            placeholder="Event details"
            rows="3"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="event_type">Event Type</label>
          <select
            id="event_type"
            name="event_type"
            value={formData.event_type}
            onChange={handleChange}
            className="form-control"
          >
            <option value="Meeting">Meeting</option>
            <option value="Deadline">Deadline</option>
            <option value="Reminder">Reminder</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="start_date">Start Date & Time</label>
            <input
              type="datetime-local"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="end_date">End Date & Time (optional)</label>
            <input
              type="datetime-local"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
        
        <div className="form-actions">
            <div className="left-actions">
                {onDelete && (
                <button 
                    type="button" 
                    className="btn btn-danger" 
                    onClick={onDelete}
                >
                    Delete Event
                </button>
                )}
            </div>
            
            <div className="right-actions">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                {event ? 'Update Event' : 'Add Event'}
                </button>
            </div>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
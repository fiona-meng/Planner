import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Dashboard.css';
import { eventAPI, todoAPI } from '../../services/api';

const locales = {
    'en-US': require('date-fns/locale/en-US')
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const CustomToolbar = ({ toolbar, onShowModal }) => (
    <div className="rbc-toolbar d-flex justify-content-between align-items-center p-3">
        <div className="d-flex align-items-center gap-2">
            <button className="btn btn-light go-button" onClick={() => toolbar.onNavigate('PREV')}>&lt;</button>
            <button className="btn btn-light today-button" onClick={() => toolbar.onNavigate('TODAY')}>Today</button>
            <button className="btn btn-light go-button" onClick={() => toolbar.onNavigate('NEXT')}>&gt;</button>
        </div>

        <div className="text-center">
            {toolbar.label}
        </div>

        <div className="d-flex align-items-center gap-2">
            <button 
                className="btn btn-light go-button" 
                onClick={onShowModal}
            >
                +
            </button>
            <div className="dropdown">
                <button 
                    className="btn btn-light dropdown-toggle" 
                    type="button" 
                    data-bs-toggle="dropdown"
                >
                    {toolbar.view.charAt(0).toUpperCase() + toolbar.view.slice(1)}
                </button>
                <ul className="dropdown-menu">
                    <li><button className="dropdown-item" onClick={() => toolbar.onView('month')}>Month</button></li>
                    <li><button className="dropdown-item" onClick={() => toolbar.onView('week')}>Week</button></li>
                    <li><button className="dropdown-item" onClick={() => toolbar.onView('day')}>Day</button></li>
                </ul>
            </div>
        </div>
    </div>
);

function Dashboard() {
    const [events, setEvents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        start: new Date(),
        end: new Date(),
        allDay: false,
        category: 'General'
    });

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const response = await eventAPI.getEvents();
            if (response.data.success) {
                const calendarEvents = response.data.events.map(event => ({
                    ...event,
                    start: new Date(event.start),
                    end: new Date(event.end)
                }));
                setEvents(calendarEvents);
            }
        } catch (error) {
            console.error('Error loading events:', error);
        }
    };

    const handleSelect = ({ start, end }) => {
        setNewEvent(prev => ({ ...prev, start, end }));
        setShowModal(true);
    };

    const handleAddEvent = async () => {
        if (newEvent.title) {
            try {
                const response = await eventAPI.createEvent(newEvent);
                if (response.data.success) {
                    await loadEvents();
                    setShowModal(false);
                    setNewEvent({
                        title: '',
                        description: '',
                        start: new Date(),
                        end: new Date(),
                        allDay: false,
                        category: 'General'
                    });
                }
            } catch (error) {
                console.error('Error creating event:', error);
                alert('Failed to create event');
            }
        }
    };

    return (
        <div className="container">
            <div className="card calendar-border">
                <div className="card-body custom-calendar-wrapper">
                    <Calendar
                        components={{
                            toolbar: (toolbarProps) => (
                                <CustomToolbar 
                                    toolbar={toolbarProps} 
                                    onShowModal={() => setShowModal(true)}
                                />
                            )
                        }}
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 'calc(100vh - 100px)' }}
                        selectable
                        onSelectSlot={handleSelect}
                        onSelectEvent={(event) => alert(event.title)}
                    />
                </div>
            </div>

            {showModal && (
                <div className="modal show d-block">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5>Add Event</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Title</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newEvent.title}
                                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-control"
                                        value={newEvent.description}
                                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Category</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newEvent.category}
                                        onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={newEvent.allDay}
                                            onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })}
                                        />
                                        <label className="form-check-label">All Day</label>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                                <button className="btn btn-primary" onClick={handleAddEvent}>Add Event</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showModal && <div className="modal-backdrop show"></div>}
        </div>
    );
}

export default Dashboard;

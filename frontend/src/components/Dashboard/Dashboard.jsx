import { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Dashboard.css';

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

const CustomToolbar = (toolbar) => (
    <div className="rbc-toolbar">
        <div className="rbc-btn-group">
            <button onClick={() => toolbar.onNavigate('PREV')}>&lt;</button>
            <button onClick={() => toolbar.onNavigate('TODAY')}>Today</button>
            <button onClick={() => toolbar.onNavigate('NEXT')}>&gt;</button>
        </div>
        <span className="rbc-toolbar-label">{toolbar.label}</span>
        <div className="dropdown">
            <button 
                className="btn btn-primary dropdown-toggle" 
                type="button" 
                data-bs-toggle="dropdown"
            >
                {toolbar.view.charAt(0).toUpperCase() + toolbar.view.slice(1)} View
            </button>
            <ul className="dropdown-menu">
                <li><button className="dropdown-item" onClick={() => toolbar.onView('month')}>Month</button></li>
                <li><button className="dropdown-item" onClick={() => toolbar.onView('week')}>Week</button></li>
                <li><button className="dropdown-item" onClick={() => toolbar.onView('day')}>Day</button></li>
            </ul>
        </div>
    </div>
);

function Dashboard() {
    const [events, setEvents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        start: new Date(),
        end: new Date()
    });

    const handleSelect = ({ start, end }) => {
        setNewEvent({ ...newEvent, start, end });
        setShowModal(true);
    };

    const handleAddEvent = () => {
        if (newEvent.title) {
            setEvents([...events, newEvent]);
            setShowModal(false);
            setNewEvent({ title: '', start: new Date(), end: new Date() });
        }
    };

    return (
        <div className="container">
            <div className="card custom-calendar-wrapper">
                <div className="card-body">
                    <Calendar
                        components={{ toolbar: CustomToolbar }}
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
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Event Title"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                />
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                                <button className="btn btn-primary" onClick={handleAddEvent}>Add</button>
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

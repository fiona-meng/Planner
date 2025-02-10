import { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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

function Dashboard() {
    const [events, setEvents] = useState([
        {
            title: 'Sample Event',
            start: new Date(),
            end: new Date(),
            allDay: true,
        }
    ]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        start: new Date(),
        end: new Date(),
    });

    const handleSelect = ({ start, end }) => {
        setNewEvent({
            title: '',
            start,
            end,
        });
        setShowAddModal(true);
    };

    const handleAddEvent = () => {
        if (newEvent.title) {
            setEvents([...events, newEvent]);
            setShowAddModal(false);
            setNewEvent({
                title: '',
                start: new Date(),
                end: new Date(),
            });
        }
    };

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12 p-4">
                    <div className="card shadow">
                        <div className="card-body">
                            <Calendar
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: 'calc(100vh - 200px)' }}
                                selectable
                                onSelectSlot={handleSelect}
                                onSelectEvent={(event) => alert(event.title)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Event Modal */}
            <div className={`modal fade ${showAddModal ? 'show' : ''}`} 
                style={{ display: showAddModal ? 'block' : 'none' }}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Add New Event</h5>
                            <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">Event Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Start Date</label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    value={format(newEvent.start, "yyyy-MM-dd'T'HH:mm")}
                                    onChange={(e) => setNewEvent({ 
                                        ...newEvent, 
                                        start: new Date(e.target.value) 
                                    })}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">End Date</label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    value={format(newEvent.end, "yyyy-MM-dd'T'HH:mm")}
                                    onChange={(e) => setNewEvent({ 
                                        ...newEvent, 
                                        end: new Date(e.target.value) 
                                    })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                Close
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleAddEvent}>
                                Add Event
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {showAddModal && <div className="modal-backdrop fade show"></div>}
        </div>
    );
}

export default Dashboard;

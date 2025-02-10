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
        taskType: 'normal',
        duration: 60,
        scheduledTime: new Date(),
        deadline: new Date(),
        priority: 'Medium',
        status: 'Todo',
        category: 'General',
        tags: [],
        scheduledSlot: {
            start: new Date(),
            end: new Date()
        },
        energyLevel: {
            required: 'medium',
            preferred: 'morning'
        },
        progress: {
            current: 0,
            target: 1,
            unit: 'ratio'
        }
    });

    const handleSelect = ({ start, end }) => {
        setNewEvent({ ...newEvent, start, end });
        setShowModal(true);
    };

    const handleAddEvent = () => {
        if (newEvent.title) {
            setEvents([...events, newEvent]);
            setShowModal(false);
            setNewEvent({ title: '', description: '', taskType: 'normal', duration: 60, scheduledTime: new Date(), deadline: new Date(), priority: 'Medium', status: 'Todo', category: 'General', tags: [], scheduledSlot: { start: new Date(), end: new Date() }, energyLevel: { required: 'medium', preferred: 'morning' }, progress: { current: 0, target: 1, unit: 'ratio' } });
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
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5>Add New Task</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-3">
                                    <div className="col-md-6">
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
                                            <label className="form-label">Task Type</label>
                                            <select
                                                className="form-select"
                                                value={newEvent.taskType}
                                                onChange={(e) => setNewEvent({ ...newEvent, taskType: e.target.value })}
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="exercise">Exercise</option>
                                                <option value="long-term">Long Term</option>
                                                <option value="scheduled">Scheduled</option>
                                                <option value="deadline">Deadline</option>
                                                <option value="flexible">Flexible</option>
                                                <option value="habit">Habit</option>
                                            </select>
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
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Duration (minutes)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min="5"
                                                value={newEvent.duration}
                                                onChange={(e) => setNewEvent({ ...newEvent, duration: parseInt(e.target.value) })}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Scheduled Time</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                value={format(newEvent.scheduledTime, "yyyy-MM-dd'T'HH:mm")}
                                                onChange={(e) => setNewEvent({ ...newEvent, scheduledTime: new Date(e.target.value) })}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Priority</label>
                                            <select
                                                className="form-select"
                                                value={newEvent.priority}
                                                onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value })}
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Energy Level</label>
                                            <div className="row">
                                                <div className="col">
                                                    <select
                                                        className="form-select"
                                                        value={newEvent.energyLevel.required}
                                                        onChange={(e) => setNewEvent({
                                                            ...newEvent,
                                                            energyLevel: { ...newEvent.energyLevel, required: e.target.value }
                                                        })}
                                                    >
                                                        <option value="low">Low</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="high">High</option>
                                                    </select>
                                                </div>
                                                <div className="col">
                                                    <select
                                                        className="form-select"
                                                        value={newEvent.energyLevel.preferred}
                                                        onChange={(e) => setNewEvent({
                                                            ...newEvent,
                                                            energyLevel: { ...newEvent.energyLevel, preferred: e.target.value }
                                                        })}
                                                    >
                                                        <option value="morning">Morning</option>
                                                        <option value="afternoon">Afternoon</option>
                                                        <option value="evening">Evening</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                                <button className="btn btn-primary" onClick={handleAddEvent}>Add Task</button>
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

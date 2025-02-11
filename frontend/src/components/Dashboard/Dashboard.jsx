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

const CustomToolbar = ({ toolbar, setShowCreatePanel, setShowTaskDisplayPanel }) => (
    <div className="rbc-toolbar d-flex justify-content-between align-items-center p-3">
        <div className="d-flex align-items-center gap-2">
            <button className="btn btn-light go-button" onClick={() => toolbar.onNavigate('PREV')}>&lt;</button>
            <button className="btn btn-light today-button" onClick={() => toolbar.onNavigate('TODAY')}>Today</button>
            <button className="btn btn-light go-button" onClick={() => toolbar.onNavigate('NEXT')}>&gt;</button>
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

        <div className="text-center">
            {toolbar.label}
        </div>

        <div className="d-flex align-items-center gap-2">
            <button 
                className="btn btn-primary today-button" 
                type="button" 
                onClick={() => {
                    setShowTaskDisplayPanel(false);  // Close task panel
                    setShowCreatePanel(true);        // Open create panel
                }}
            >
                + Create
            </button>
            <button 
                className="btn btn-primary today-button" 
                type="button" 
                onClick={() => {
                    setShowCreatePanel(false);       // Close create panel
                    setShowTaskDisplayPanel(true);   // Open task panel
                }}
            >
                My Tasks
            </button>
        </div>
    </div>
);

function Dashboard() {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showCreatePanel, setShowCreatePanel] = useState(false);
    const [showTaskDisplayPanel, setShowTaskDisplayPanel] = useState(false);
    const [todos, setTodos] = useState([]);
    const [isLoadingTodos, setIsLoadingTodos] = useState(false);
    const [todoError, setTodoError] = useState(null);
    const [newTodo, setNewTodo] = useState({
        title: '',
        dueDate: new Date(),
        description: ''
    });
    const [showAddTodoForm, setShowAddTodoForm] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        startDate: new Date(),
        endDate: new Date(),
        description: '',
        isAllDay: false,
        repeat: 'none',
        location: '',
        participants: [],
        conferencing: '',
        category: 'General'
    });

    useEffect(() => {
        loadEvents();
        loadTodos();
    }, []);

    const loadEvents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await eventAPI.getEvents();
            if (response.data.success) {
                const calendarEvents = response.data.events.map(event => ({
                    ...event,
                    start: new Date(event.startDate),
                    end: new Date(event.endDate),
                    title: event.title,
                    allDay: event.isAllDay
                }));
                setEvents(calendarEvents);
            }
        } catch (error) {
            console.error('Error loading events:', error);
            setError('Failed to load events. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadTodos = async () => {
        setIsLoadingTodos(true);
        setTodoError(null);
        try {
            const response = await todoAPI.getTodos();
            if (response.data.success) {
                setTodos(response.data.todos);
            }
        } catch (error) {
            console.error('Error loading todos:', error);
            setTodoError('Failed to load todos. Please try again later.');
        } finally {
            setIsLoadingTodos(false);
        }
    };

    const handleToggleTodo = async (todoId) => {
        try {
            const response = await todoAPI.toggleStatus(todoId);
            if (response.data.success) {
                await loadTodos();
            }
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    };

    const handleSelect = ({ start, end }) => {
        // Will implement later
    };

    const handleSelectEvent = (event) => {
        // Will implement later
    };

    const handleAddTodo = async () => {
        if (!newTodo.title.trim()) return;
        
        try {
            const response = await todoAPI.createTodo(newTodo);
            if (response.data.success) {
                await loadTodos();
                setNewTodo({
                    title: '',
                    dueDate: new Date(),
                    description: ''
                });
                setShowAddTodoForm(false);
            }
        } catch (error) {
            console.error('Error creating todo:', error);
        }
    };

    const handleAddEvent = async () => {
        if (!newEvent.title) return;
        
        // Validate dates
        const startDate = new Date(newEvent.startDate);
        const endDate = new Date(newEvent.endDate);
        
        if (endDate < startDate) {
            alert('End date cannot be before start date');
            return;
        }

        try {
            const eventData = {
                ...newEvent,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                participants: newEvent.participants.map(p => p.email).filter(Boolean)
            };

            if (newEvent.isAllDay) {
                // Set time to start of day for all-day events
                eventData.startDate = new Date(startDate.setHours(0, 0, 0, 0)).toISOString();
                eventData.endDate = new Date(endDate.setHours(23, 59, 59, 999)).toISOString();
            }

            const response = await eventAPI.createEvent(eventData);
            if (response.data.success) {
                await loadEvents();
                setNewEvent({
                    title: '',
                    startDate: new Date(),
                    endDate: new Date(),
                    description: '',
                    isAllDay: false,
                    repeat: 'none',
                    location: '',
                    participants: [],
                    conferencing: '',
                    category: 'General'
                });
                setShowCreatePanel(false);
            }
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event. Please try again.');
        }
    };

    const createPanel = () => {
        return (
            <div className="right-panel">
                <div className="right-panel-header">
                    <h2>Event</h2>
                    <button 
                        className="btn-close" 
                        onClick={() => setShowCreatePanel(false)}
                    ></button>
                </div>

                <div className="create-event-form">
                    <div className="mb-3">
                        <input
                            type="text"
                            className="form-control form-control-lg border-0"
                            placeholder="Title"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        />
                    </div>

                    <div className="mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-clock text-muted"></i>
                        {!newEvent.isAllDay ? (
                            <>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    value={format(newEvent.startDate, "yyyy-MM-dd'T'HH:mm")}
                                    onChange={(e) => {
                                        const newDate = new Date(e.target.value);
                                        setNewEvent(prev => ({
                                            ...prev,
                                            startDate: newDate,
                                            endDate: prev.endDate < newDate ? newDate : prev.endDate
                                        }));
                                    }}
                                />
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    value={format(newEvent.endDate, "yyyy-MM-dd'T'HH:mm")}
                                    min={format(newEvent.startDate, "yyyy-MM-dd'T'HH:mm")}
                                    onChange={(e) => setNewEvent(prev => ({
                                        ...prev,
                                        endDate: new Date(e.target.value)
                                    }))}
                                />
                            </>
                        ) : (
                            <>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={format(newEvent.startDate, "yyyy-MM-dd")}
                                    onChange={(e) => {
                                        const newDate = new Date(e.target.value);
                                        setNewEvent(prev => ({
                                            ...prev,
                                            startDate: newDate,
                                            endDate: newDate
                                        }));
                                    }}
                                />
                            </>
                        )}
                    </div>

                    <div className="mb-3 d-flex align-items-center gap-2">
                        <div className="form-check form-switch">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={newEvent.isAllDay}
                                onChange={(e) => setNewEvent({ 
                                    ...newEvent, 
                                    isAllDay: e.target.checked 
                                })}
                            />
                            <label className="form-check-label">All-day</label>
                        </div>
                    </div>

                    <div className="mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-arrow-repeat text-muted"></i>
                        <select 
                            className="form-select"
                            value={newEvent.repeat}
                            onChange={(e) => setNewEvent({ 
                                ...newEvent, 
                                repeat: e.target.value 
                            })}
                        >
                            <option value="none">Does not repeat</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>

                    <div className="mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-people text-muted"></i>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Add participants"
                            value={newEvent.participants.map(p => p.email).join(',')}
                            onChange={(e) => setNewEvent({ 
                                ...newEvent, 
                                participants: e.target.value.split(',').map(p => ({ email: p.trim() }))
                            })}
                        />
                    </div>

                    <div className="mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-camera-video text-muted"></i>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Add conferencing"
                            value={newEvent.conferencing}
                            onChange={(e) => setNewEvent({ 
                                ...newEvent, 
                                conferencing: e.target.value 
                            })}
                        />
                    </div>

                    <div className="mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-geo-alt text-muted"></i>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Add location"
                            value={newEvent.location}
                            onChange={(e) => setNewEvent({ 
                                ...newEvent, 
                                location: e.target.value 
                            })}
                        />
                    </div>

                    <div className="mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-file-text text-muted"></i>
                        <textarea
                            className="form-control"
                            placeholder="Description"
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({ 
                                ...newEvent, 
                                description: e.target.value 
                            })}
                        />
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                        <button 
                            className="btn btn-light" 
                            onClick={() => setShowCreatePanel(false)}
                        >
                            Cancel
                        </button>
                        <button 
                            className="btn btn-primary"
                            onClick={handleAddEvent}
                            disabled={!newEvent.title}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const taskDisplayPanel = () => {
        return (
            <div className="task-display-panel">
                <div className="task-header">
                    <h2>My Tasks</h2>
                    <button 
                        className="btn-close" 
                        onClick={() => setShowTaskDisplayPanel(false)}
                    ></button>
                </div>

                <div className="add-task-button">
                    <button className="btn btn-link text-primary">
                        <i className="bi bi-plus-circle text-primary"></i>
                        <span className="ms-2"> + Add a task</span>
                    </button>
                </div>

                {isLoadingTodos ? (
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : todoError ? (
                    <div className="alert alert-danger">{todoError}</div>
                ) : (
                    <div className="tasks-list">
                        {todos.map(todo => (
                            <div key={todo._id} className="task-item">
                                <div className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={todo.status === 'Completed'}
                                        onChange={() => handleToggleTodo(todo._id)}
                                    />
                                    <label className="form-check-label">
                                        <div>
                                            <div className="task-title">{todo.title}</div>
                                            <div className="task-due">
                                                {format(new Date(todo.dueDate), 'PPp')}
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        ))}
                        {todos.length === 0 && (
                            <div className="text-center text-muted">
                                No tasks yet
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="dashboard-container">
            <div className="calendar-column">
                {isLoading && (
                    <div className="alert alert-info" role="alert">
                        Loading...
                    </div>
                )}
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}
                <div className="card calendar-border">
                    <div className="card-body custom-calendar-wrapper">
                        <Calendar
                            components={{
                                toolbar: (toolbarProps) => (
                                    <CustomToolbar 
                                        toolbar={toolbarProps} 
                                        setShowCreatePanel={setShowCreatePanel}
                                        setShowTaskDisplayPanel={setShowTaskDisplayPanel}
                                    />
                                )
                            }}
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%' }}
                            selectable
                            onSelectSlot={handleSelect}
                            onSelectEvent={handleSelectEvent}
                        />
                    </div>
                </div>
            </div>

            {(showCreatePanel || showTaskDisplayPanel) && (
                <div className="right-column">
                    {showCreatePanel && createPanel()}
                    {showTaskDisplayPanel && taskDisplayPanel()}
                </div>
            )}
        </div>
    );
}

export default Dashboard;

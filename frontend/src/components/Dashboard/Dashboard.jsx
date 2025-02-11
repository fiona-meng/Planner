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

const CustomToolbar = ({ toolbar, onShowModal, showTodoPanel, setShowTodoPanel, setShowRightPanel, setActiveTab, activeTab }) => (
    <div className="rbc-toolbar d-flex justify-content-between align-items-center p-3">
        <div className="d-flex align-items-center gap-2">
            <button className="btn btn-light go-button" onClick={() => toolbar.onNavigate('PREV')}>&lt;</button>
            <button className="btn btn-light today-button" onClick={() => toolbar.onNavigate('TODAY')}>Today</button>
            <button className="btn btn-light go-button" onClick={() => toolbar.onNavigate('NEXT')}>&gt;</button>
        </div>

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

        <div className="text-center">
            {toolbar.label}
        </div>

        <div className="d-flex align-items-center gap-2">
            <div className="dropdown">
                <button 
                    className="btn btn-primary" 
                    type="button" 
                    onClick={() => {
                        setShowRightPanel(true);
                        setActiveTab('todo');
                    }}
                >
                    + Create
                </button>
                <ul className="dropdown-menu">
                    <li>
                        <button 
                            className="dropdown-item" 
                            onClick={(e) => {
                                e.stopPropagation();
                                onShowModal();
                            }}
                        >
                            Event
                        </button>
                    </li>
                    <li>
                        <button 
                            className="dropdown-item" 
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowRightPanel(true);
                                setActiveTab('todo');
                            }}
                        >
                            Todo
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </div>
);

function Dashboard() {
    const [events, setEvents] = useState([]);
    const [todos, setTodos] = useState([]);
    const [showTodoPanel, setShowTodoPanel] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        startDate: new Date(),
        endDate: new Date(),
        isAllDay: false,
        category: 'General',
        repeat: 'none',
        location: '',
        participants: []
    });
    const [showNewTodoModal, setShowNewTodoModal] = useState(false);
    const [newTodo, setNewTodo] = useState({
        title: '',
        description: '',
        dueDate: new Date()
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showRightPanel, setShowRightPanel] = useState(false);
    const [activeTab, setActiveTab] = useState('todo');

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
                    end: new Date(event.endDate)
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
        setIsLoading(true);
        try {
            const response = await todoAPI.getTodos();
            if (response?.data?.success) {
                setTodos(response.data.todos);
            } else {
                console.error('Failed to load todos:', response?.data?.message);
            }
        } catch (error) {
            console.error('Error loading todos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = ({ start, end }) => {
        setNewEvent(prev => ({ 
            ...prev, 
            startDate: start,
            endDate: end
        }));
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
                        startDate: new Date(),
                        endDate: new Date(),
                        isAllDay: false,
                        category: 'General',
                        repeat: 'none',
                        location: '',
                        participants: []
                    });
                }
            } catch (error) {
                console.error('Error creating event:', error);
                alert('Failed to create event');
            }
        }
    };

    const handleToggleTodo = async (todoId) => {
        try {
            await todoAPI.toggleStatus(todoId);
            loadTodos(); // Reload todos after toggle
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    };

    const handleAddTodo = async () => {
        setError(null);
        try {
            const response = await todoAPI.createTodo(newTodo);
            if (response.data.success) {
                await loadTodos();
                setShowNewTodoModal(false);
                setNewTodo({
                    title: '',
                    description: '',
                    dueDate: new Date()
                });
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create todo');
            console.error('Error creating todo:', error);
        }
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent({
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate)
        });
        setIsEditMode(false);
        setShowEventDetailsModal(true);
    };

    const handleUpdateEvent = async () => {
        try {
            const response = await eventAPI.updateEvent(selectedEvent._id, selectedEvent);
            if (response.data.success) {
                await loadEvents();
                setShowEventDetailsModal(false);
                setSelectedEvent(null);
                setIsEditMode(false);
            }
        } catch (error) {
            console.error('Error updating event:', error);
            alert('Failed to update event');
        }
    };

    const handleDeleteEvent = async () => {
        try {
            const response = await eventAPI.deleteEvent(selectedEvent._id);
            if (response.data.success) {
                await loadEvents();
                setShowEventDetailsModal(false);
                setSelectedEvent(null);
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event');
        }
    };

    const TodoPanel = () => (
        <div className={`todo-panel ${showTodoPanel ? 'show' : ''}`}>
            <div className="todo-header">
                <h5>Todo List</h5>
                <button 
                    className="btn btn-sm btn-light" 
                    onClick={() => setShowTodoPanel(false)}
                >×</button>
            </div>
            <div className="todo-list">
                {todos.map(todo => (
                    <div key={todo._id} className="todo-item">
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={todo.status === 'Completed'}
                                onChange={() => handleToggleTodo(todo._id)}
                            />
                            <label className="form-check-label">
                                {todo.title}
                            </label>
                        </div>
                        <small className="text-muted">
                            Due: {format(new Date(todo.dueDate), 'MMM d, yyyy')}
                        </small>
                    </div>
                ))}
            </div>
            <button 
                className="btn btn-primary w-100 mt-3"
                onClick={() => setShowNewTodoModal(true)}
            >
                Add Todo
            </button>
        </div>
    );

    const RightPanel = () => (
        <div className={`right-panel ${showRightPanel ? 'show' : ''}`}>
            <div className="right-panel-header">
                <h5>Create New</h5>
                <button 
                    className="btn-close" 
                    onClick={() => setShowRightPanel(false)}
                ></button>
            </div>
            
            <div className="right-panel-tabs">
                <button 
                    className={`btn ${activeTab === 'todo' ? 'active' : ''}`}
                    onClick={() => setActiveTab('todo')}
                >
                    Todo
                </button>
                <button 
                    className={`btn ${activeTab === 'event' ? 'active' : ''}`}
                    onClick={() => setActiveTab('event')}
                >
                    Event
                </button>
            </div>

            {activeTab === 'todo' ? (
                <div className="todo-form">
                    <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input
                            type="text"
                            className="form-control"
                            value={newTodo.title}
                            onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-control"
                            value={newTodo.description}
                            onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Due Date</label>
                        <input
                            type="date"
                            className="form-control"
                            value={format(newTodo.dueDate, 'yyyy-MM-dd')}
                            onChange={(e) => setNewTodo({ 
                                ...newTodo, 
                                dueDate: new Date(e.target.value) 
                            })}
                        />
                    </div>
                    <button 
                        className="btn btn-primary w-100"
                        onClick={handleAddTodo}
                    >
                        Add Todo
                    </button>
                </div>
            ) : (
                <div className="event-form">
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
                        <label className="form-label">Location</label>
                        <input
                            type="text"
                            className="form-control"
                            value={newEvent.location}
                            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Repeat</label>
                        <select 
                            className="form-select"
                            value={newEvent.repeat}
                            onChange={(e) => setNewEvent({ ...newEvent, repeat: e.target.value })}
                        >
                            <option value="none">No repeat</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Participants</label>
                        <div className="input-group">
                            <input
                                type="email"
                                className="form-control"
                                placeholder="Enter email and press Enter"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value) {
                                        e.preventDefault();
                                        setNewEvent({
                                            ...newEvent,
                                            participants: [...newEvent.participants, {
                                                email: e.target.value,
                                                status: 'pending'
                                            }]
                                        });
                                        e.target.value = '';
                                    }
                                }}
                            />
                        </div>
                        {newEvent.participants.length > 0 && (
                            <div className="mt-2">
                                {newEvent.participants.map((participant, index) => (
                                    <div key={index} className="d-flex align-items-center mb-1">
                                        <span className="me-2">{participant.email}</span>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => setNewEvent({
                                                ...newEvent,
                                                participants: newEvent.participants.filter((_, i) => i !== index)
                                            })}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="mb-3">
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={newEvent.isAllDay}
                                onChange={(e) => setNewEvent({ ...newEvent, isAllDay: e.target.checked })}
                            />
                            <label className="form-check-label">All Day</label>
                        </div>
                    </div>
                    {!newEvent.isAllDay && (
                        <>
                            <div className="mb-3">
                                <label className="form-label">Start Time</label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    value={format(newEvent.startDate, "yyyy-MM-dd'T'HH:mm")}
                                    onChange={(e) => setNewEvent({ 
                                        ...newEvent, 
                                        startDate: new Date(e.target.value) 
                                    })}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">End Time</label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    value={format(newEvent.endDate, "yyyy-MM-dd'T'HH:mm")}
                                    onChange={(e) => setNewEvent({ 
                                        ...newEvent, 
                                        endDate: new Date(e.target.value) 
                                    })}
                                />
                            </div>
                        </>
                    )}
                    <button 
                        className="btn btn-primary w-100"
                        onClick={handleAddEvent}
                    >
                        Add Event
                    </button>
                </div>
            )}
        </div>
    );

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
                                        onShowModal={() => setShowModal(true)}
                                        showTodoPanel={showTodoPanel}
                                        setShowTodoPanel={setShowTodoPanel}
                                        setShowRightPanel={setShowRightPanel}
                                        setActiveTab={setActiveTab}
                                        activeTab={activeTab}
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

            <div className="right-column">
                <RightPanel />
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
                                    <label className="form-label">Location</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newEvent.location}
                                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Repeat</label>
                                    <select 
                                        className="form-select"
                                        value={newEvent.repeat}
                                        onChange={(e) => setNewEvent({ ...newEvent, repeat: e.target.value })}
                                    >
                                        <option value="none">No repeat</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Participants</label>
                                    <div className="input-group">
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="Enter email and press Enter"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.target.value) {
                                                    e.preventDefault();
                                                    setNewEvent({
                                                        ...newEvent,
                                                        participants: [...newEvent.participants, {
                                                            email: e.target.value,
                                                            status: 'pending'
                                                        }]
                                                    });
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                    </div>
                                    {newEvent.participants.length > 0 && (
                                        <div className="mt-2">
                                            {newEvent.participants.map((participant, index) => (
                                                <div key={index} className="d-flex align-items-center mb-1">
                                                    <span className="me-2">{participant.email}</span>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => setNewEvent({
                                                            ...newEvent,
                                                            participants: newEvent.participants.filter((_, i) => i !== index)
                                                        })}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="mb-3">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={newEvent.isAllDay}
                                            onChange={(e) => setNewEvent({ ...newEvent, isAllDay: e.target.checked })}
                                        />
                                        <label className="form-check-label">All Day</label>
                                    </div>
                                </div>
                                {!newEvent.isAllDay && (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label">Start Time</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                value={format(newEvent.startDate, "yyyy-MM-dd'T'HH:mm")}
                                                onChange={(e) => setNewEvent({ 
                                                    ...newEvent, 
                                                    startDate: new Date(e.target.value) 
                                                })}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">End Time</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                value={format(newEvent.endDate, "yyyy-MM-dd'T'HH:mm")}
                                                onChange={(e) => setNewEvent({ 
                                                    ...newEvent, 
                                                    endDate: new Date(e.target.value) 
                                                })}
                                            />
                                        </div>
                                    </>
                                )}
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

            {showNewTodoModal && (
                <div className="modal show d-block">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5>Add Todo</h5>
                                <button type="button" className="btn-close" onClick={() => setShowNewTodoModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Title</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newTodo.title}
                                        onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-control"
                                        value={newTodo.description}
                                        onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Due Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={format(newTodo.dueDate, 'yyyy-MM-dd')}
                                        onChange={(e) => setNewTodo({ 
                                            ...newTodo, 
                                            dueDate: new Date(e.target.value) 
                                        })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowNewTodoModal(false)}>Close</button>
                                <button className="btn btn-primary" onClick={handleAddTodo}>Add Todo</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showNewTodoModal && <div className="modal-backdrop show"></div>}

            {showEventDetailsModal && selectedEvent && (
                <div className="modal show d-block">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5>{isEditMode ? 'Edit Event' : 'Event Details'}</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => {
                                        setShowEventDetailsModal(false);
                                        setSelectedEvent(null);
                                        setIsEditMode(false);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {isEditMode ? (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label">Title</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={selectedEvent.title}
                                                onChange={(e) => setSelectedEvent({
                                                    ...selectedEvent,
                                                    title: e.target.value
                                                })}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Description</label>
                                            <textarea
                                                className="form-control"
                                                value={selectedEvent.description || ''}
                                                onChange={(e) => setSelectedEvent({
                                                    ...selectedEvent,
                                                    description: e.target.value
                                                })}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Location</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={selectedEvent.location || ''}
                                                onChange={(e) => setSelectedEvent({
                                                    ...selectedEvent,
                                                    location: e.target.value
                                                })}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <div className="form-check">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={selectedEvent.isAllDay}
                                                    onChange={(e) => setSelectedEvent({
                                                        ...selectedEvent,
                                                        isAllDay: e.target.checked
                                                    })}
                                                />
                                                <label className="form-check-label">All Day</label>
                                            </div>
                                        </div>
                                        {!selectedEvent.isAllDay && (
                                            <>
                                                <div className="mb-3">
                                                    <label className="form-label">Start Time</label>
                                                    <input
                                                        type="datetime-local"
                                                        className="form-control"
                                                        value={format(selectedEvent.startDate, "yyyy-MM-dd'T'HH:mm")}
                                                        onChange={(e) => setSelectedEvent({
                                                            ...selectedEvent,
                                                            startDate: new Date(e.target.value)
                                                        })}
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label">End Time</label>
                                                    <input
                                                        type="datetime-local"
                                                        className="form-control"
                                                        value={format(selectedEvent.endDate, "yyyy-MM-dd'T'HH:mm")}
                                                        onChange={(e) => setSelectedEvent({
                                                            ...selectedEvent,
                                                            endDate: new Date(e.target.value)
                                                        })}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <h4>{selectedEvent.title}</h4>
                                        {selectedEvent.description && (
                                            <p className="text-muted">{selectedEvent.description}</p>
                                        )}
                                        <p>
                                            <strong>Start:</strong> {format(new Date(selectedEvent.startDate), 'PPpp')}
                                        </p>
                                        <p>
                                            <strong>End:</strong> {format(new Date(selectedEvent.endDate), 'PPpp')}
                                        </p>
                                        {selectedEvent.location && (
                                            <p>
                                                <strong>Location:</strong> {selectedEvent.location}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                {isEditMode ? (
                                    <>
                                        <button 
                                            className="btn btn-danger" 
                                            onClick={handleDeleteEvent}
                                        >
                                            Delete
                                        </button>
                                        <button 
                                            className="btn btn-primary" 
                                            onClick={handleUpdateEvent}
                                        >
                                            Save Changes
                                        </button>
                                        <button 
                                            className="btn btn-secondary" 
                                            onClick={() => setIsEditMode(false)}
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            className="btn btn-danger" 
                                            onClick={handleDeleteEvent}
                                        >
                                            Delete
                                        </button>
                                        <button 
                                            className="btn btn-primary" 
                                            onClick={() => setIsEditMode(true)}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            className="btn btn-secondary" 
                                            onClick={() => {
                                                setShowEventDetailsModal(false);
                                                setSelectedEvent(null);
                                            }}
                                        >
                                            Close
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showEventDetailsModal && <div className="modal-backdrop show"></div>}

            {showRightPanel && <div className="modal-backdrop show" onClick={() => setShowRightPanel(false)} style={{ opacity: '0.5' }}></div>}
        </div>
    );
}

export default Dashboard;

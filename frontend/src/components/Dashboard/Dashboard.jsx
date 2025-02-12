import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Dashboard.css';
import { eventAPI, todoAPI } from '../../services/api';
import Icon from '@mdi/react';
import { mdiClockOutline, mdiCheckboxMarkedCirclePlusOutline, mdiFilterVariant, mdiAccount, mdiMapMarker, mdiRepeatVariant } from '@mdi/js';
import axios from 'axios';

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
                    setShowTaskDisplayPanel(false);  
                    setShowCreatePanel(true);       
                }}
            >
                + Create
            </button>
            <button 
                className="btn btn-primary today-button" 
                type="button" 
                onClick={() => {
                    setShowCreatePanel(false);     
                    setShowTaskDisplayPanel(true);  
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
    const [newTodo, setNewTodo] = useState({
        title: '',
        dueDate: new Date(),
        description: ''
    });
    const [newEvent, setNewEvent] = useState({
        title: '',
        isAllDay: false,
        startDate: new Date(),
        endDate: new Date(),
        repeat: 'none',
        participants: [],
        currentEmail: '',
        location: '',
        description: ''
    });
    const [activeCreateTab, setActiveCreateTab] = useState('event');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [locationSuggestions, setLocationSuggestions] = useState([]);

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
                    id: event._id,
                    title: event.title,
                    start: new Date(event.startDate),
                    end: new Date(event.endDate),
                    allDay: event.isAllDay,
                    repeat: event.repeat,
                    participants: event.participants,
                    location: event.location,
                    description: event.description
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
        try {
            const response = await todoAPI.getTodos();
            if (response.data.success) {
                setTodos(response.data.todos);
            }
        } catch (error) {
            console.error('Error loading todos:', error);
        }
    };

    const handleToggleTodo = async (todoId) => {
        try {
            // Find the todo and update its status optimistically
            const todoToUpdate = todos.find(todo => todo._id === todoId);
            const newStatus = todoToUpdate.status === 'Completed' ? 'Incomplete' : 'Completed';
            
            // Update UI immediately
            const updatedTodos = todos.map(todo => 
                todo._id === todoId 
                    ? { ...todo, status: newStatus } 
                    : todo
            );
            setTodos(updatedTodos);

            // Sync with server
            const response = await todoAPI.toggleStatus(todoId);
            if (response.data.success) {
                if (newStatus === 'Completed') {
                    // Add a small delay before removing completed todo
                    setTimeout(() => {
                        handleDeleteTodo(todoId);
                    }, 1000); // 500ms delay for animation
                }
            } else {
                // If server update fails, revert the change
                await loadTodos();
            }
        } catch (error) {
            console.error('Error toggling todo:', error);
            // Revert on error
            await loadTodos();
        }
    };

    const handleSelect = ({ start, end }) => {
        // Will implement later
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setShowCreatePanel(true);
        setActiveCreateTab('event');
        setNewEvent({
            title: event.title,
            isAllDay: event.allDay,
            startDate: event.start,
            endDate: event.end,
            repeat: event.repeat || 'none',
            participants: event.participants || [],
            location: event.location || '',
            description: event.description || '',
            currentEmail: ''
        });
    };

    const handleDoubleClickEvent = (event) => {
        setSelectedEvent(event);
        setShowCreatePanel(true);
        setNewEvent({
            title: event.title,
            isAllDay: event.allDay,
            startDate: event.start,
            endDate: event.end,
            repeat: event.repeat || 'none',
            participants: event.participants || [],
            location: event.location || '',
            description: event.description || '',
            currentEmail: ''
        });
    };

    const handleAddTodo = async () => {
        if (!newTodo.title.trim()) return;
        
        try {
            const response = await todoAPI.createTodo({
                title: newTodo.title.trim(),
                dueDate: newTodo.dueDate,
                description: newTodo.description.trim()
            });
            
            if (response.data.success) {
                await loadTodos();
                setNewTodo({
                    title: '',
                    dueDate: new Date(),
                    description: ''
                });
            }
        } catch (error) {
            console.error('Error creating todo:', error);
        }
    };

    const handleAddEvent = async () => {
        if (!newEvent.title.trim()) return;

        try {
            let eventData = {
                ...newEvent,
                title: newEvent.title.trim(),
                location: newEvent.location.trim(),
                description: newEvent.description.trim(),
                participants: newEvent.participants.map(p => ({
                    email: p.email.trim(),
                    status: 'pending'
                })).filter(p => p.email)
            };

            // If it's an all-day event, ensure the times are set correctly
            if (newEvent.isAllDay) {
                const date = new Date(newEvent.startDate);
                const year = date.getFullYear();
                const month = date.getMonth();
                const day = date.getDate();
                
                eventData.startDate = new Date(year, month, day, 0, 0, 0);
                eventData.endDate = new Date(year, month, day, 23, 59, 59);
            }

            const response = await eventAPI.createEvent(eventData);
            if (response.data.success) {
                await loadEvents();
                setNewEvent({
                    title: '',
                    isAllDay: false,
                    startDate: new Date(),
                    endDate: new Date(),
                    repeat: 'none',
                    participants: [],
                    location: '',
                    description: '',
                    currentEmail: ''
                });
                setShowCreatePanel(false);
            }
        } catch (error) {
            console.error('Error creating event:', error);
        }
    };

    const handleUpdateEvent = async () => {
        if (!newEvent.title.trim()) return;

        try {
            let eventData = {
                ...newEvent,
                title: newEvent.title.trim(),
                location: newEvent.location.trim(),
                description: newEvent.description.trim(),
                participants: newEvent.participants.map(p => ({
                    email: p.email.trim(),
                    status: 'pending'
                })).filter(p => p.email)
            };

            if (newEvent.isAllDay) {
                const date = new Date(newEvent.startDate);
                const year = date.getFullYear();
                const month = date.getMonth();
                const day = date.getDate();
                
                eventData.startDate = new Date(year, month, day, 0, 0, 0);
                eventData.endDate = new Date(year, month, day, 23, 59, 59);
            }

            const response = await eventAPI.updateEvent(selectedEvent.id, eventData);
            if (response.data.success) {
                await loadEvents();
                setNewEvent({
                    title: '',
                    isAllDay: false,
                    startDate: new Date(),
                    endDate: new Date(),
                    repeat: 'none',
                    participants: [],
                    location: '',
                    description: '',
                    currentEmail: ''
                });
                setShowCreatePanel(false);
                setSelectedEvent(null);
            }
        } catch (error) {
            console.error('Error updating event:', error);
        }
    };

    const handleDeleteEvent = useCallback(async (eventId) => {
        try {
            const updatedEvents = events.filter(event => event.id !== eventId);
            setEvents(updatedEvents);
            setSelectedEvent(null);
            setShowCreatePanel(false);

            const response = await eventAPI.deleteEvent(eventId);
            if (!response.data.success) {
                await loadEvents();
                console.error('Failed to delete event');
            }
        } catch (error) {
            await loadEvents();
            console.error('Error deleting event:', error);
        }
    }, [events, loadEvents]);

    const handleDeleteTodo = async (todoId) => {
        try {
            // Optimistically remove the todo from UI
            const updatedTodos = todos.filter(todo => todo._id !== todoId);
            setTodos(updatedTodos);

            // Then sync with server
            const response = await todoAPI.deleteTodo(todoId);
            if (!response.data.success) {
                // If delete failed, restore the todos
                await loadTodos();
                console.error('Failed to delete todo');
            }
        } catch (error) {
            // If there was an error, reload todos to ensure UI is in sync
            await loadTodos();
            console.error('Error deleting todo:', error);
        }
    };

    const ensureDate = (date) => {
        if (!date) return new Date();
        return date instanceof Date ? date : new Date(date);
    };

    const createPanel = () => {
        return (
            <div className="right-panel">
                <div className="right-panel-header">
                    <div className="row w-100">
                        <div className="col-md-5">
                            <button 
                                className={`eventTodoButton ${activeCreateTab === 'event' ? 'active' : ''}`}
                                onClick={() => setActiveCreateTab('event')}
                            >
                                Event
                            </button>
                        </div>
                        <div className="col-md-5">
                            <button 
                                className={`eventTodoButton ${activeCreateTab === 'todo' ? 'active' : ''}`}
                                onClick={() => setActiveCreateTab('todo')}
                            >
                                Todo
                            </button>
                        </div>
                        <div className="col-md-2">
                            <button 
                                className="btn-close" 
                                onClick={() => {
                                    setShowCreatePanel(false);
                                    setSelectedEvent(null);
                                    setNewEvent({
                                        title: '',
                                        isAllDay: false,
                                        startDate: new Date(),
                                        endDate: new Date(),
                                        repeat: 'none',
                                        participants: [],
                                        location: '',
                                        description: '',
                                        currentEmail: ''
                                    });
                                }}
                            ></button>
                        </div>
                    </div>
                </div>

                {activeCreateTab === 'event' ? (
                    <div className="create-event-form">
                        <div className="mb-3">
                            <input
                                type="text"
                                className="form-control form-control-lg border-0"
                                placeholder="Create a new event"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            />
                        </div>

                        <div className="mb-3 d-flex align-items-center gap-2">
                            <Icon 
                                path={mdiClockOutline}
                                className="text-muted"
                                size={0.8}
                            />
                            {!newEvent.isAllDay ? (
                                <>
                                    <input
                                        type="datetime-local"
                                        className="form-control select-date-start"
                                        value={format(ensureDate(newEvent.startDate), "yyyy-MM-dd'T'HH:mm")}
                                        onChange={(e) => {
                                            const date = new Date(e.target.value);
                                            setNewEvent(prev => ({
                                                ...prev,
                                                startDate: date,
                                                endDate: prev.endDate < date ? date : prev.endDate
                                            }));
                                        }}
                                    />
                                    <input
                                        type="datetime-local"
                                        className="form-control select-date-end"
                                        value={format(ensureDate(newEvent.endDate), "yyyy-MM-dd'T'HH:mm")}
                                        onChange={(e) => {
                                            const date = new Date(e.target.value);
                                            setNewEvent(prev => ({
                                                ...prev,
                                                endDate: date
                                            }));
                                        }}
                                    />
                                </>
                            ) : (
                                <>
                                    <Icon 
                                        path={mdiClockOutline}
                                        className="text-muted"
                                        size={0.8}
                                    />
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={format(ensureDate(newEvent.startDate), "yyyy-MM-dd")}
                                        onChange={(e) => {
                                            const dateStr = e.target.value;
                                            const [year, month, day] = dateStr.split('-');
                                            const startDate = new Date(year, parseInt(month) - 1, day, 0, 0, 0);
                                            const endDate = new Date(year, parseInt(month) - 1, day, 23, 59, 59);
                                            
                                            setNewEvent(prev => ({
                                                ...prev,
                                                startDate: startDate,
                                                endDate: endDate
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
                            <Icon 
                                path={mdiRepeatVariant}
                                size={0.8}
                            />
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
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>

                        <div className="mb-3 d-flex align-items-center gap-2">
                            <Icon 
                                path={mdiAccount}
                                size={0.8}
                            />
                            <div className="w-100 position-relative">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Add participants (press Enter or comma to add)"
                                    value={newEvent.currentEmail || ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value.endsWith(',')) {
                                            // Add email when comma is typed
                                            const email = value.slice(0, -1).trim();
                                            if (isValidEmail(email)) {
                                                setNewEvent(prev => ({
                                                    ...prev,
                                                    participants: [...prev.participants, { email, status: 'pending' }],
                                                    currentEmail: ''
                                                }));
                                            }
                                        } else {
                                            setNewEvent(prev => ({ ...prev, currentEmail: value }));
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newEvent.currentEmail) {
                                            e.preventDefault();
                                            const email = newEvent.currentEmail.trim();
                                            if (isValidEmail(email)) {
                                                setNewEvent(prev => ({
                                                    ...prev,
                                                    participants: [...prev.participants, { email, status: 'pending' }],
                                                    currentEmail: ''
                                                }));
                                            }
                                        }
                                    }}
                                />
                                {newEvent.participants.length > 0 && (
                                    <div className="email-chips mt-2">
                                        {newEvent.participants.map((p, index) => (
                                            <span key={index} className="badge bg-light text-dark me-2">
                                                {p.email}
                                                <button 
                                                    type="button" 
                                                    className="btn-close ms-2" 
                                                    onClick={() => {
                                                        const newParticipants = [...newEvent.participants];
                                                        newParticipants.splice(index, 1);
                                                        setNewEvent(prev => ({ ...prev, participants: newParticipants }));
                                                    }}
                                                ></button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-3 d-flex align-items-center gap-2">
                            <Icon 
                                path={mdiMapMarker}
                                size={0.8}
                            />
                            <div className="w-100 position-relative">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Add location"
                                    value={newEvent.location}
                                    onChange={(e) => {
                                        setNewEvent({ ...newEvent, location: e.target.value });
                                        handleLocationSearch(e.target.value);
                                    }}
                                />
                                {locationSuggestions.length > 0 && (
                                    <div className="location-dropdown">
                                        {locationSuggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                className="suggestion-item"
                                                onClick={() => {
                                                    setNewEvent({ 
                                                        ...newEvent, 
                                                        location: suggestion.description 
                                                    });
                                                    setLocationSuggestions([]);
                                                }}
                                            >
                                                {suggestion.description}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-3 d-flex align-items-center gap-2">
                            <Icon 
                                path={mdiFilterVariant}
                                size={0.8}
                            />
                            <input
                                type="text"
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
                            {selectedEvent ? (
                                <>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={handleUpdateEvent}
                                        disabled={!newEvent.title}
                                    >
                                        Update
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={handleAddEvent}
                                        disabled={!newEvent.title}
                                    >
                                        Create
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="create-todo-form">
                        <div className="mb-3 d-flex align-items-center gap-2">
                            <Icon 
                                path={mdiCheckboxMarkedCirclePlusOutline}
                                size={0.8}
                            />
                            <input
                                type="text"
                                className="form-control form-control-lg border-0"
                                placeholder="Add a todo"
                                value={newTodo.title}
                                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                            />
                        </div>

                        <div className="mb-3 d-flex align-items-center gap-2">
                            <Icon 
                                path={mdiClockOutline}
                                size={0.8}
                            />
                            <input
                                type="datetime-local"
                                className="form-control"
                                value={format(ensureDate(newTodo.dueDate), "yyyy-MM-dd'T'HH:mm")}
                                onChange={(e) => setNewTodo({ 
                                    ...newTodo, 
                                    dueDate: new Date(e.target.value) 
                                })}
                            />
                        </div>

                        <div className="mb-3 d-flex align-items-center gap-2">
                            <Icon 
                                path={mdiFilterVariant}
                                size={0.8}
                            />
                            <input
                                className="form-control"
                                placeholder="Description"
                                value={newTodo.description}
                                onChange={(e) => setNewTodo({ 
                                    ...newTodo, 
                                    description: e.target.value 
                                })}
                            />
                        </div>

                        <div className="d-flex justify-content-end gap-2">
                            <button 
                                className="btn btn-light create-button"
                                onClick={handleAddTodo}
                                disabled={!newTodo.title}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                )}
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
                    <button 
                        className="btn btn-link text-primary"
                        onClick={() => {
                            setShowTaskDisplayPanel(false);  // Close task panel
                            setShowCreatePanel(true);        // Open create panel
                            setActiveCreateTab('todo');      // Switch to todo tab
                        }}
                    >
                        <i className="bi bi-plus-circle text-primary"></i>
                        <span className="ms-2"> + Add a task</span>
                    </button>
                </div>

                <div className="tasks-list">
                    {todos.map(todo => (
                        <div 
                            key={todo._id} 
                            className={`task-item ${todo.status === 'Completed' ? 'completed' : ''}`}
                        >
                            <div className="d-flex justify-content-between align-items-start">
                                <div className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={todo.status === 'Completed'}
                                        onChange={() => handleToggleTodo(todo._id)}
                                    />
                                    <label className="form-check-label">
                                        <div>
                                            <div className={`task-title ${todo.status === 'Completed' ? 'text-decoration-line-through' : ''}`}>
                                                {todo.title}
                                            </div>
                                            <div className="task-due">
                                                {format(new Date(todo.dueDate), 'PPp')}
                                            </div>
                                        </div>
                                    </label>
                                </div>
                                <button 
                                    className="btn btn-link text-danger btn-sm"
                                    onClick={() => handleDeleteTodo(todo._id)}
                                >
                                    <i className="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                    {todos.length === 0 && (
                        <div className="text-center text-muted">
                            No tasks yet
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const handleLocationSearch = async (text) => {
        if (!text) {
            setLocationSuggestions([]);
            return;
        }
        
        const apiKey = process.env.REACT_APP_GEOAPIFY_KEY;
        
        try {
            const response = await axios.get(
                'https://api.geoapify.com/v1/geocode/autocomplete', {
                    params: {
                        text: text,
                        apiKey: apiKey,
                        format: 'json',
                        limit: 5
                    }
                }
            );
            
            if (response.data && response.data.results) {
                const suggestions = response.data.results.map(result => ({
                    description: result.formatted,
                    properties: result
                }));
                setLocationSuggestions(suggestions);
            }
        } catch (error) {
            console.error('Error fetching locations:', error);
            setLocationSuggestions([]);
        }
    };

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return email && emailRegex.test(email);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (selectedEvent && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault();
                    handleDeleteEvent(selectedEvent.id);
                    setSelectedEvent(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedEvent, handleDeleteEvent]);

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
                            onDoubleClickEvent={handleDoubleClickEvent}
                            selected={selectedEvent}
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

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
import { mdiClockOutline, mdiCheckboxMarkedCirclePlusOutline, mdiFilterVariant, mdiAccount, mdiMapMarker, mdiRepeatVariant, mdiPencil} from '@mdi/js';
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
        endDate: new Date(new Date().setHours(new Date().getHours() + 1)),
        repeat: 'none',
        participants: [],
        currentEmail: '',
        location: '',
        description: ''
    });
    const [activeCreateTab, setActiveCreateTab] = useState('event');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [editingTodo, setEditingTodo] = useState(null);

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
        setShowTaskDisplayPanel(false);
        setShowCreatePanel(true);
        setActiveCreateTab('event');
        setSelectedEvent(null);
        setSelectedSlot({ start, end });
        
        setNewEvent({
            title: '',
            isAllDay: false,
            startDate: start,
            endDate: end,
            repeat: 'none',
            participants: [],
            currentEmail: '',
            location: '',
            description: ''
        });
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

    const handleEditMode = (todo) => {
        setShowTaskDisplayPanel(false);
        setShowCreatePanel(true);
        setActiveCreateTab('todo');
        setNewTodo({
            id: todo._id,
            title: todo.title,
            dueDate: ensureDate(todo.dueDate),
            description: todo.description || ''
        });
    };

    const handleAddTodo = async () => {
        if (!newTodo.title.trim()) return;
        
        try {
            if (newTodo.id) {
                // Update existing todo
                const response = await todoAPI.updateTodo(newTodo.id, {
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
                    setShowCreatePanel(false);
                    setShowTaskDisplayPanel(true);
                }
            } else {
                // Create new todo
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
                    setShowCreatePanel(false);
                    setShowTaskDisplayPanel(true);
                }
            }
        } catch (error) {
            console.error('Error saving todo:', error);
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
                    endDate: new Date(new Date().setHours(new Date().getHours() + 2)),
                    repeat: 'none',
                    participants: [],
                    location: '',
                    description: '',
                    currentEmail: ''
                });
                setSelectedSlot(null);
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
                    endDate: new Date(new Date().setHours(new Date().getHours() + 2)),
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
            // Clean up any editing state first
            setEditingTodo(null);
            setNewTodo({
                title: '',
                dueDate: new Date(),
                description: ''
            });

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

    const handleEditTodo = async (todoId, updatedData) => {
        try {
            const response = await todoAPI.updateTodo(todoId, updatedData);
            if (response.data.success) {
                await loadTodos();
                setEditingTodo(null);
            }
        } catch (error) {
            console.error('Error updating todo:', error);
        }
    };

    const ensureDate = (date) => {
        if (!date) return new Date();
        try {
            const parsedDate = new Date(date);
            return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
        } catch (error) {
            return new Date();
        }
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
                                    setSelectedSlot(null);
                                    setNewEvent({
                                        title: '',
                                        isAllDay: false,
                                        startDate: new Date(),
                                        endDate: new Date(new Date().setHours(new Date().getHours() + 2)),
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
                        <div className="mb-3 d-flex align-items-center gap-2">
                            <Icon 
                                path={mdiPencil}
                                size={0.8}
                            />
                            <input
                                type="text"
                                className="form-control form-control-lg border-0"
                                placeholder="Create a new event"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            />
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
                            {!newEvent.isAllDay ? (
                                <div className="date-time-picker-container">
                                    <div className="date-time-row">
                                        <span className="date-time-label">Start:</span>
                                        <input
                                            type="date"
                                            className="form-control date-picker"
                                            value={format(ensureDate(newEvent.startDate), "yyyy-MM-dd")}
                                            onChange={(e) => {
                                                const [year, month, day] = e.target.value.split('-');
                                                const newDate = new Date(year, parseInt(month) - 1, day);
                                                const currentStart = new Date(newEvent.startDate);
                                                
                                                newDate.setHours(
                                                    currentStart.getHours(),
                                                    currentStart.getMinutes(),
                                                    currentStart.getSeconds()
                                                );
                                                
                                                setNewEvent(prev => ({
                                                    ...prev,
                                                    startDate: newDate,
                                                    endDate: prev.endDate < newDate ? newDate : prev.endDate
                                                }));
                                            }}
                                        />
                                        <input
                                            type="time"
                                            className="form-control time-picker"
                                            value={format(ensureDate(newEvent.startDate), "HH:mm")}
                                            onChange={(e) => {
                                                const [hours, minutes] = e.target.value.split(':');
                                                const newDate = new Date(newEvent.startDate);
                                                newDate.setHours(hours, minutes);
                                                
                                                setNewEvent(prev => ({
                                                    ...prev,
                                                    startDate: newDate,
                                                    endDate: prev.endDate < newDate ? newDate : prev.endDate
                                                }));
                                            }}
                                        />
                                    </div>
                                    <div className="date-time-row">
                                        <span className="date-time-label">End:</span>
                                        <input
                                            type="date"
                                            className="form-control date-picker"
                                            value={format(ensureDate(newEvent.endDate), "yyyy-MM-dd")}
                                            onChange={(e) => {
                                                const [year, month, day] = e.target.value.split('-');
                                                const newDate = new Date(year, parseInt(month) - 1, day);
                                                const currentEnd = new Date(newEvent.endDate);
                                                
                                                newDate.setHours(
                                                    currentEnd.getHours(),
                                                    currentEnd.getMinutes(),
                                                    currentEnd.getSeconds()
                                                );
                                                
                                                setNewEvent(prev => ({
                                                    ...prev,
                                                    endDate: newDate
                                                }));
                                            }}
                                        />
                                        <input
                                            type="time"
                                            className="form-control time-picker"
                                            value={format(ensureDate(newEvent.endDate), "HH:mm")}
                                            onChange={(e) => {
                                                const [hours, minutes] = e.target.value.split(':');
                                                const newDate = new Date(newEvent.endDate);
                                                newDate.setHours(hours, minutes);
                                                
                                                setNewEvent(prev => ({
                                                    ...prev,
                                                    endDate: newDate
                                                }));
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="date-picker-container">
                                    <input
                                        type="date"
                                        className="form-control date-picker-all-day"
                                        value={format(ensureDate(newEvent.startDate), "yyyy-MM-dd")}
                                        onChange={(e) => {
                                            const [year, month, day] = e.target.value.split('-');
                                            const newDate = new Date(year, parseInt(month) - 1, day);
                                            const currentStart = new Date(newEvent.startDate);
                                            
                                            newDate.setHours(
                                                currentStart.getHours(),
                                                currentStart.getMinutes(),
                                                currentStart.getSeconds()
                                            );
                                            
                                            setNewEvent(prev => ({
                                                ...prev,
                                                startDate: newDate,
                                                endDate: prev.endDate < newDate ? newDate : prev.endDate
                                            }));
                                        }}
                                    />
                                </div>
                            )}
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
                        <div className="mb-3 d-flex align-items-start gap-2">
                            <div className="w-100 participants-container">
                                {newEvent.participants.length > 0 && (
                                    <div className="email-chips">
                                        {newEvent.participants.map((p, index) => (
                                            <span key={index} className="badge">
                                                {p.email}
                                                <button 
                                                    type="button" 
                                                    className="btn-close" 
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
                                <div className="participants-input-container">
                                    <Icon 
                                        path={mdiAccount}
                                        size={0.8}
                                    />
                                    <input
                                        type="text"
                                        className="form-control participants-input"
                                        placeholder="Add participants"
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
                                </div>
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
                                        className="btn btn-primary create-button"
                                        onClick={handleUpdateEvent}
                                        disabled={!newEvent.title}
                                    >
                                        Update
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        className="btn btn-primary create-button"
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
                                type="form-control"
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
                                onChange={(e) => {
                                    const date = e.target.value ? new Date(e.target.value) : new Date();
                                    setNewTodo({ 
                                        ...newTodo, 
                                        dueDate: date
                                    });
                                }}
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
                                {newTodo.id ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const isSameDay = (date1, date2) => {
        return format(new Date(date1), 'yyyy-MM-dd') === format(new Date(date2), 'yyyy-MM-dd');
    };

    const isOverdue = (dueDate) => {
        return new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
    };

    const taskDisplayPanel = () => {
        // Sort todos: overdue first, then by due date
        const sortedTodos = [...todos].sort((a, b) => {
            const aOverdue = isOverdue(a.dueDate);
            const bOverdue = isOverdue(b.dueDate);
            
            // If one is overdue and the other isn't, overdue comes first
            if (aOverdue && !bOverdue) return -1;
            if (!aOverdue && bOverdue) return 1;
            
            // If both are overdue or not overdue, sort by due date
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        const formatDueDate = (dueDate) => {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dueDateTime = new Date(dueDate);
            
            if (isOverdue(dueDate)) {
                return <span className="task-due overdue">Past due</span>;
            }
            
            if (isSameDay(today, dueDateTime)) {
                return <span className="task-due today">Today</span>;
            }

            if (isSameDay(tomorrow, dueDateTime)) {
                return <span className="task-due tomorrow">Tomorrow</span>;
            }
            
            return <span className="task-due">{format(dueDateTime, 'PPp')}</span>;
        };

        return (
            <div className="right-panel">
                <div className="task-header">
                    <div className="task-header-left">
                        <div className="title-add-group">
                            <h2 className="task-header-title">My Tasks</h2>
                            <button 
                                className="btn add-task-button"
                                onClick={() => {
                                    setShowTaskDisplayPanel(false);
                                    setShowCreatePanel(true);
                                    setActiveCreateTab('todo');
                                }}
                            >
                                <span>+</span>
                            </button>
                        </div>
                        <button 
                            className="btn-close add-task-close"
                            onClick={() => setShowTaskDisplayPanel(false)}
                        ></button>
                    </div>
                </div>

                <div className="tasks-list">
                    {sortedTodos.map(todo => (
                        <div 
                            key={todo._id} 
                            data-todo-id={todo._id}
                            className={`task-item ${todo.status === 'Completed' ? 'completed' : ''} ${isOverdue(todo.dueDate) ? 'overdue-item' : ''}`}
                        >
                            <div className="d-flex justify-content-between align-items-center w-100">
                                <div className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={todo.status === 'Completed'}
                                        onChange={() => handleToggleTodo(todo._id)}
                                    />
                                    <label className="form-check-label">
                                        {editingTodo?.id === todo._id ? (
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editingTodo.title}
                                                onChange={(e) => setEditingTodo({
                                                    ...editingTodo,
                                                    title: e.target.value
                                                })}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleEditTodo(todo._id, {
                                                            title: editingTodo.title,
                                                            dueDate: editingTodo.dueDate
                                                        });
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div>
                                                <div className={`task-title ${todo.status === 'Completed' ? 'text-decoration-line-through' : ''}`}>
                                                    {todo.title}
                                                </div>
                                                <div className="task-due">
                                                    {formatDueDate(todo.dueDate)}
                                                </div>
                                            </div>
                                        )}
                                    </label>
                                </div>
                                <div className="task-actions">
                                    <button 
                                        className="btn btn-edit"
                                        onClick={() => handleEditMode(todo)}
                                    >
                                        <i className="bi bi-pencil"></i>
                                    </button>
                                    <button 
                                        className="btn btn-delete"
                                        onClick={() => handleDeleteTodo(todo._id)}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {todos.length === 0 && (
                        <div className="text-center text-muted no-tasks">
                            All Done!
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
        <div className="dashboard-container row">
            <div className="col-lg-8 col-md-7 col-sm-12 calendar-column">
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
                <div className="col-lg-4 col-md-5 col-sm-12 right-column">
                    {showCreatePanel && createPanel()}
                    {showTaskDisplayPanel && taskDisplayPanel()}
                </div>
            )}
        </div>
    );
}

export default Dashboard;

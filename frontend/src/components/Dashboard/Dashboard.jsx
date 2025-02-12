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
        isAllDay: false,
        startDate: new Date(),
        endDate: new Date(),
        repeat: 'none',
        participants: [],  // Array of {email: String, status: String}
        location: '',
        description: ''
    });
    const [activeCreateTab, setActiveCreateTab] = useState('event');
    const [selectedEvent, setSelectedEvent] = useState(null);

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
            description: event.description || ''
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
            description: event.description || ''
        });
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
                    description: ''
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
                    description: ''
                });
                setShowCreatePanel(false);
                setSelectedEvent(null);
            }
        } catch (error) {
            console.error('Error updating event:', error);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        try {
            // Optimistically remove the event from UI first
            const updatedEvents = events.filter(event => event.id !== eventId);
            setEvents(updatedEvents);
            setSelectedEvent(null);
            setShowCreatePanel(false);

            // Then sync with server
            const response = await eventAPI.deleteEvent(eventId);
            if (!response.data.success) {
                // If delete failed, restore the events
                await loadEvents();
                console.error('Failed to delete event');
            }
        } catch (error) {
            // If there was an error, reload events to ensure UI is in sync
            await loadEvents();
            console.error('Error deleting event:', error);
        }
    };

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
                    <div className="create-panel-tabs">
                        <button 
                            className={`tab-button ${activeCreateTab === 'event' ? 'active' : ''} btn btn-light`}
                            onClick={() => setActiveCreateTab('event')}
                        >
                            Event
                        </button>
                        <button 
                            className={`tab-button ${activeCreateTab === 'todo' ? 'active' : ''} btn btn-light`}
                            onClick={() => setActiveCreateTab('todo')}
                        >
                            Todo
                        </button>
                    </div>
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
                                description: ''
                            });
                        }}
                    ></button>
                </div>

                {activeCreateTab === 'event' ? (
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
                                        className="form-control"
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
                                <option value="yearly">Yearly</option>
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
                            {selectedEvent ? (
                                <>
                                    <button 
                                        className="btn btn-light" 
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
                                                description: ''
                                            });
                                        }}
                                    >
                                        Cancel
                                    </button>
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
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="create-todo-form">
                        <div className="mb-3">
                            <input
                                type="text"
                                className="form-control form-control-lg border-0"
                                placeholder="Task name"
                                value={newTodo.title}
                                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                            />
                        </div>

                        <div className="mb-3 d-flex align-items-center gap-2">
                            <i className="bi bi-clock text-muted"></i>
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
                            <i className="bi bi-file-text text-muted"></i>
                            <textarea
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
                                className="btn btn-light" 
                                onClick={() => setShowCreatePanel(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={handleAddTodo}
                                disabled={!newTodo.title}
                            >
                                Save
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
                )}
            </div>
        );
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check if we have a selected event and if we're not in an input field
            if (selectedEvent && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                // Handle both Delete and Backspace keys
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault(); // Prevent any default behavior
                    handleDeleteEvent(selectedEvent.id);
                    setSelectedEvent(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedEvent, handleDeleteEvent]); // Add handleDeleteEvent to dependencies

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

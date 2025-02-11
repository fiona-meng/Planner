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

const CustomToolbar = ({ toolbar, onShowModal, showTodoPanel, setShowTodoPanel }) => (
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
            <button 
                className="btn btn-light go-button" 
                onClick={() => setShowTodoPanel(!showTodoPanel)}
            >
                ☑️
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
    const [todos, setTodos] = useState([]);
    const [showTodoPanel, setShowTodoPanel] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        start: new Date(),
        end: new Date(),
        allDay: false,
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

    useEffect(() => {
        loadEvents();
        loadTodos();
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
            console.error('Error creating todo:', error);
            alert('Failed to create todo');
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

    return (
        <div className="container position-relative">
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

            {showTodoPanel && <TodoPanel />}

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
                                            checked={newEvent.allDay}
                                            onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })}
                                        />
                                        <label className="form-check-label">All Day</label>
                                    </div>
                                </div>
                                {!newEvent.allDay && (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label">Start Time</label>
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
                                            <label className="form-label">End Time</label>
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
        </div>
    );
}

export default Dashboard;

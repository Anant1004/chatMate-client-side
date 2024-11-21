import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client'; // Import Socket.IO client
import Nav from '../components/Nav.jsx';

const Dashboard = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const socketRef = useRef(null); // Socket reference

    useEffect(() => {
        axios.get('http://localhost:4000/api/auth/users')  
            .then(response => {
                setUsers(response.data);
            })
            .catch(error => {
                console.error('Error fetching users', error);
            });

        // Set up socket connection when component mounts
        socketRef.current = io('http://localhost:4000', {
            withCredentials: true
        });

        // Listen for incoming messages
        socketRef.current.on('receive-message', (messageData) => {
            setMessages((prevMessages) => [...prevMessages, messageData]);
        });

        // Clean up socket connection on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        axios.get(`http://localhost:4000/api/messages/${user._id}`)
            .then(response => {
                setMessages(response.data);
            })
            .catch(error => {
                console.error('Error fetching messages', error);
            });
    };

    const handleMessageSend = () => {
        if (message.trim()) {
            // Emit message to the server for broadcasting
            const messageData = {
                roomId: selectedUser._id, // Send message to the selected user
                sender: 'me', // Replace with actual sender
                text: message
            };

            socketRef.current.emit('send-message', messageData);

            // Update the messages state immediately for a better user experience
            setMessages((prevMessages) => [...prevMessages, messageData]);

            setMessage('');
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-gray-300">
            <Nav />

            <section className="flex-grow py-5 bg-gray-800">
                <div className="flex">
                    <div className="w-1/4 p-4 border-r border-gray-600">
                        <h2 className="text-2xl font-semibold mb-4 text-blue-400">Online Buddies</h2>
                        <ul>
                            {users.map(user => (
                                <li
                                    key={user._id}
                                    onClick={() => handleUserSelect(user)}
                                    className="cursor-pointer py-2 px-4 rounded-lg hover:bg-blue-600 mb-2 transition duration-300 flex items-center space-x-3"
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden">
                                        <img
                                            src={user.avatar || 'https://via.placeholder.com/150'}
                                            alt={user.fullName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <span>{user.fullName}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex-1 bg-gray-800 p-4 flex flex-col">
                        {selectedUser ? (
                            <div className="flex flex-col h-full">
                                <h2 className="text-2xl font-semibold text-white mb-4">Buddie : {selectedUser.fullName}</h2>
                                <div className="flex-1 overflow-y-auto bg-gray-900 p-4 rounded-lg border border-gray-600 mb-4">
                                    {messages.map((msg, index) => (
                                        <div key={index} className={`mb-2 ${msg.sender === 'me' ? 'text-right' : 'text-left'}`}>
                                            <div className={`inline-block p-3 rounded-lg ${msg.sender === 'me' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                                                <p>{msg.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center space-x-3 mt-auto">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type a message"
                                        className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={handleMessageSend}
                                        className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                Select a user to start chatting
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../services/socketService';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [incomingAlert, setIncomingAlert] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    const socket = getSocket();

    if (user?.id) {
      socket.emit('join_user_room', user.id);
      socket.emit('join_role_room', user.role);
    }

    // Emergency alert for matched donors
    socket.on('emergency_blood_alert', (requestData) => {
      console.log('🚨 Incoming Real-Time Emergency Alert:', requestData);
      setIncomingAlert(requestData);
      setRecentEvents(prev => [{ type: 'ALERT', data: requestData, time: new Date() }, ...prev]);
    });

    // Donor response update for Admins
    socket.on('donor_response_updated', (responseData) => {
      setRecentEvents(prev => [{ type: 'DONOR_RESPONSE', data: responseData, time: new Date() }, ...prev]);
    });

    // Donation verified update
    socket.on('my_donation_verified', (donationData) => {
      setRecentEvents(prev => [{ type: 'DONATION_VERIFIED', data: donationData, time: new Date() }, ...prev]);
    });

    return () => {
      socket.off('emergency_blood_alert');
      socket.off('donor_response_updated');
      socket.off('my_donation_verified');
    };
  }, [user]);

  const clearIncomingAlert = () => setIncomingAlert(null);

  return (
    <SocketContext.Provider value={{ incomingAlert, clearIncomingAlert, recentEvents }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

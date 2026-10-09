import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../services/socketService';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [incomingAlert, setIncomingAlert] = useState(null);
  const [incomingSms, setIncomingSms] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    try {
      const socket = getSocket();

      if (socket && user?.id) {
        socket.emit?.('join_user_room', user.id);
        socket.emit?.('join_role_room', user.role);
      }

      const handleAlert = (requestData) => {
        console.log('🚨 Incoming Real-Time Emergency Alert:', requestData);
        setIncomingAlert(requestData);
        setRecentEvents(prev => [{ type: 'ALERT', data: requestData, time: new Date() }, ...prev]);
      };

      const handleSms = (smsData) => {
        console.log('📱 Real-time SMS Received:', smsData);
        setIncomingSms(smsData);
        setRecentEvents(prev => [{ type: 'SMS_RECEIVED', data: smsData, time: new Date() }, ...prev]);
      };

      const handleDonorResponse = (responseData) => {
        setRecentEvents(prev => [{ type: 'DONOR_RESPONSE', data: responseData, time: new Date() }, ...prev]);
      };

      const handleDonationVerified = (donationData) => {
        setRecentEvents(prev => [{ type: 'DONATION_VERIFIED', data: donationData, time: new Date() }, ...prev]);
      };

      socket?.on?.('emergency_blood_alert', handleAlert);
      socket?.on?.('realtime_sms_received', handleSms);
      socket?.on?.('donor_response_updated', handleDonorResponse);
      socket?.on?.('my_donation_verified', handleDonationVerified);

      return () => {
        socket?.off?.('emergency_blood_alert', handleAlert);
        socket?.off?.('realtime_sms_received', handleSms);
        socket?.off?.('donor_response_updated', handleDonorResponse);
        socket?.off?.('my_donation_verified', handleDonationVerified);
      };
    } catch (e) {
      console.warn('Socket listener initialization skipped:', e.message);
    }
  }, [user]);


  const clearIncomingAlert = () => setIncomingAlert(null);
  const clearIncomingSms = () => setIncomingSms(null);

  return (
    <SocketContext.Provider value={{ incomingAlert, clearIncomingAlert, incomingSms, clearIncomingSms, recentEvents }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);


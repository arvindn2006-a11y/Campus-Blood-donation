let io = null;

const initSocket = (socketIoInstance) => {
  io = socketIoInstance;

  io.on('connection', (socket) => {
    // Join personal user room upon client registration
    socket.on('join_user_room', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`🔌 Socket joined user room: user_${userId}`);
      }
    });

    // Join role room (e.g., 'ADMIN', 'STUDENT')
    socket.on('join_role_room', (role) => {
      if (role) {
        socket.join(`role_${role}`);
        console.log(`🔌 Socket joined role room: role_${role}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    console.warn('Socket.IO not initialized yet');
  }
  return io;
};

// Real-time Event Broadcasters
const emitBloodRequestCreated = (requestData, matchedUserIds = []) => {
  if (!io) return;
  
  // Broadcast to Admin room
  io.to('role_ADMIN').emit('blood_request_created', requestData);

  // Broadcast emergency alert to each matched donor individually
  matchedUserIds.forEach(userId => {
    io.to(`user_${userId}`).emit('emergency_blood_alert', requestData);
  });
};

const emitDonorResponse = (responseData) => {
  if (!io) return;
  // Notify admin dashboard immediately without requiring refresh
  io.to('role_ADMIN').emit('donor_response_updated', responseData);
};

const emitDonationConfirmed = (donationData, studentUserId) => {
  if (!io) return;
  io.to('role_ADMIN').emit('donation_confirmed', donationData);
  if (studentUserId) {
    io.to(`user_${studentUserId}`).emit('my_donation_verified', donationData);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitBloodRequestCreated,
  emitDonorResponse,
  emitDonationConfirmed
};

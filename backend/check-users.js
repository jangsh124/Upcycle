const mongoose = require('mongoose');
const User = require('./model/User');

mongoose.connect('mongodb://localhost:27017/auth-app')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      const users = await User.find({});
      console.log('\n=== All Users ===');
      users.forEach(user => {
        console.log(`Email: ${user.email}, Name: ${user.name}, Subscription: ${JSON.stringify(user.subscription)}`);
      });
      
    } catch (error) {
      console.error('Error:', error);
    }
    
    mongoose.connection.close();
  })
  .catch(err => console.error('Connection error:', err));

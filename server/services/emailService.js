const nodemailer = require('nodemailer');

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

// Email template for calendar reminders
const getReminderEmailTemplate = (reminder) => {
  return {
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
    to: reminder.userEmail,
    subject: `📅 Reminder: ${reminder.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Calendar Reminder</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 30px 20px;
          }
          .reminder-details {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .reminder-title {
            font-size: 20px;
            font-weight: 600;
            color: #2c3e50;
            margin: 0 0 10px 0;
          }
          .reminder-description {
            color: #7f8c8d;
            margin: 10px 0;
            line-height: 1.5;
          }
          .reminder-meta {
            display: flex;
            gap: 20px;
            margin-top: 15px;
            flex-wrap: wrap;
          }
          .meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #34495e;
            font-size: 14px;
          }
          .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .priority-high {
            background: #fee;
            color: #e74c3c;
          }
          .priority-medium {
            background: #fef9e7;
            color: #f39c12;
          }
          .priority-low {
            background: #e8f8f5;
            color: #27ae60;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #7f8c8d;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Calendar Reminder</h1>
            <p>You have a reminder due!</p>
          </div>
          
          <div class="content">
            <div class="reminder-details">
              <h2 class="reminder-title">${reminder.title}</h2>
              
              ${reminder.description ? `<p class="reminder-description">${reminder.description}</p>` : ''}
              
              <div class="reminder-meta">
                <div class="meta-item">
                  📅 ${new Date(reminder.reminder_time).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div class="meta-item">
                  ⏰ ${new Date(reminder.reminder_time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              
              <div style="margin-top: 15px;">
                <span class="priority-badge priority-${reminder.priority}">
                  ${reminder.priority} priority
                </span>
                <span style="margin-left: 10px; color: #7f8c8d; font-size: 14px;">
                  Category: ${reminder.category}
                </span>
              </div>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #e8f4fd; border-radius: 8px; border-left: 4px solid #3498db;">
              <p style="margin: 0; color: #2c3e50; font-size: 14px;">
                <strong>💡 Tip:</strong> Make sure to complete this task on time. You can also snooze this reminder if needed.
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p>This reminder was sent from Radhey Management System</p>
            <p style="margin-top: 5px;">© 2026 Radhey Management. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// Send reminder email
const sendReminderEmail = async (reminder) => {
  try {
    const transporter = createTransporter();
    const mailOptions = getReminderEmailTemplate(reminder);
    
    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendReminderEmail,
  testEmailConfig,
  createTransporter
};

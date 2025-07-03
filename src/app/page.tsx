import React from 'react';

export default function TwilightMessengerPage() {
  return (
    <div className="phone-container">
      <div className="screen">
        <header className="header">
          <button className="back-btn" aria-label="Back">{'←'}</button>
          <div className="profile-info">
            <div className="avatar">J</div>
            <div className="contact-info">
              <h3>John</h3>
              <span className="online-status">
                <span className="online-dot"></span>
                Online
              </span>
            </div>
          </div>
          <button className="menu-btn" aria-label="Menu">{'…'}</button>
        </header>

        <main className="chat-container">
          <div className="message received">
            <div className="message-bubble">
              <p>Hey! I saw the prototype, it's looking great. Just a few thoughts.</p>
              <div className="message-time">10:42 AM</div>
            </div>
          </div>
          <div className="message sent">
            <div className="message-bubble">
              <p>Oh, awesome! Glad you like it. What's on your mind?</p>
              <div className="message-time">10:43 AM</div>
            </div>
          </div>
          <div className="message received">
            <div className="message-bubble">
              <p>The login flow feels a bit clunky. Maybe we can simplify the animations?</p>
              <div className="message-time">10:44 AM</div>
            </div>
          </div>
          <div className="typing-indicator show">
            <div className="typing-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        </main>

        <footer className="input-area">
          <div className="input-container">
            <input type="text" className="message-input" placeholder="Type a message..." />
          </div>
          <button className="send-btn" aria-label="Send">{'→'}</button>
        </footer>
      </div>
    </div>
  );
}

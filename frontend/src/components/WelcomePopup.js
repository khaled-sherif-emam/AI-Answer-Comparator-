import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaArrowLeft, FaCheck, FaRobot, FaComments, FaBookmark } from 'react-icons/fa';
import './WelcomePopup.css';

const slides = [
  {
    title: 'Welcome to Promptly!',
    description: 'Your personal space to chat with multiple AI assistants in one place. Ask questions, get help with coding, or just have a friendly conversation!',
    icon: <FaRobot className="feature-icon" />,
    features: [
      { text: 'Chat with different AI models', icon: <FaComments /> },
      { text: 'Get instant responses to your questions', icon: <FaCheck /> },
      { text: 'Save and organize your conversations', icon: <FaBookmark /> }
    ]
  },
  {
    title: 'Get Started',
    description: 'Join our community of AI enthusiasts and unlock the full potential of AI conversations.',
    isAuth: true
  }
];

const WelcomePopup = ({ onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState('next');
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  const goToSlide = (index) => {
    if (isAnimating || index === currentIndex) return;
    
    setDirection(index > currentIndex ? 'next' : 'prev');
    setIsAnimating(true);
    
    setTimeout(() => {
      setCurrentIndex(index);
      setIsAnimating(false);
    }, 400); // Match with CSS transition duration
  };

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      goToSlide(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  };

  const handleAction = (action) => {
    if (action === 'signup') {
      navigate('/authentication/SignupPage');
    } else if (action === 'login') {
      navigate('/authentication/LoginPage');
    }
    if (onClose) onClose();
  };

  const currentSlide = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;
  const isFirstSlide = currentIndex === 0;

  return (
    <div className="welcome-popup-overlay">
      <div className="welcome-popup">
        <div className="slides-container">
          {slides.map((slide, index) => {
            let className = 'welcome-slide';
            if (index === currentIndex) className += ' active';
            else if (index < currentIndex) className += ' previous';
            
            return (
              <div key={index} className={className}>
                {slide.icon && <div className="slide-icon">{slide.icon}</div>}
                <h2>{slide.title}</h2>
                <p className="slide-description">{slide.description}</p>
                
                {slide.features && (
                  <div className="welcome-features">
                    {slide.features.map((feature, i) => (
                      <div key={i} className="feature-item">
                        <span className="feature-icon">{feature.icon}</span>
                        <span className="feature-text">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {slide.isAuth ? (
                  <div className="auth-options">
                    <div className="auth-option">
                      <h3>New User?</h3>
                      <button 
                        className="auth-button primary"
                        onClick={() => handleAction('signup')}
                      >
                        Create Account
                      </button>
                      <p className="credits-note">
                        Get <strong>5,000 free credits</strong> when you sign up!
                      </p>
                    </div>
                    
                    <div className="auth-option">
                      <h3>Returning User?</h3>
                      <button 
                        className="auth-button secondary"
                        onClick={() => handleAction('login')}
                      >
                        Log In
                      </button>
                    </div>
                    
                    <div className="divider">
                      <span>or</span>
                    </div>
                    
                    <button 
                      className="guest-button"
                      onClick={onClose}
                    >
                      Continue as Guest
                    </button>
                  </div>
                ) : (
                  <button 
                    className="welcome-button" 
                    onClick={nextSlide}
                  >
                    Get Started <FaArrowRight className="button-icon" />
                  </button>
                )}
              </div>
            );
          })}
          
          {/* Navigation Dots */}
          <div className="slide-dots">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Navigation Arrows */}
          {!isFirstSlide && (
            <button 
              className="nav-arrow prev-arrow" 
              onClick={prevSlide}
              aria-label="Previous slide"
            >
              <FaArrowLeft />
            </button>
          )}
          
          {!isLastSlide && (
            <button 
              className="nav-arrow next-arrow" 
              onClick={nextSlide}
              aria-label="Next slide"
            >
              <FaArrowRight />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;

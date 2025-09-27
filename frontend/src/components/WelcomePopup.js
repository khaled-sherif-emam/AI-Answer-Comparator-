import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaComments, FaBookmark } from 'react-icons/fa';
import './WelcomePopup.css';

const slides = [
  {
    title: 'Welcome to Promptly!',
    description: 'Chat with multiple AI assistants in one place. Get homework help, coding assistance, or have a friendly conversation!',
    icon: null,
    features: [
      { text: 'Compare multiple AI models side by side', icon: <FaComments /> },
      { text: 'Detect biases and errors through cross-referencing', icon: <FaCheck /> },
      { text: 'Get more reliable insights from diverse AI perspectives', icon: <FaBookmark /> }
    ]
  },
  {
    title: 'Get Started',
    description: 'Sign up today and get 5,000 free credits — or continue as a guest to try it out instantly.',
    isAuth: true,
    buttons: [
      { text: 'Sign Up', variant: 'primary' },
      { text: 'Log In', variant: 'outline' },
      { text: 'Continue as Guest', variant: 'text' }
    ]
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
                    <button
                      className="auth-button black"
                      onClick={() => handleAction('signup')}
                    >
                      Sign Up
                    </button>
                    
                    <button
                      className="auth-button white"
                      onClick={() => handleAction('login')}
                    >
                      Log In
                    </button>
                    
                    <div className="divider">
                      <span className="divider-line"></span>
                      <span className="divider-text">OR</span>
                      <span className="divider-line"></span>
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
                    Get Started
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
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;

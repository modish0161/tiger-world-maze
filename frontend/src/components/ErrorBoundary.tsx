import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Tiger World Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a0a0f 0%, #2d1810 100%)',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '6rem',
            marginBottom: '1rem',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            🐯
          </div>
          <h1 style={{
            fontFamily: '"Fredoka One", cursive',
            color: '#FFD700',
            fontSize: '2rem',
            marginBottom: '1rem',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
          }}>
            Oops! Something went wrong
          </h1>
          <p style={{
            color: 'rgba(255, 237, 78, 0.8)',
            fontSize: '1.1rem',
            marginBottom: '2rem',
            maxWidth: '400px'
          }}>
            Don't worry, even the best tiger explorers hit a wall sometimes!
          </p>
          <button
            onClick={this.handleReload}
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
              border: 'none',
              borderRadius: '16px',
              padding: '1rem 2.5rem',
              fontSize: '1.2rem',
              fontFamily: '"Fredoka One", cursive',
              color: '#3d2414',
              cursor: 'pointer',
              boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            🎮 Back to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

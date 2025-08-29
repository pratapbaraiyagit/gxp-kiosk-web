# GXP Kiosk Web Application

## 🏨 Project Overview

**GXP Kiosk Web Application** is a sophisticated, enterprise-grade hotel self-service kiosk system built with React.js. This application revolutionizes traditional hotel operations by providing guests with automated check-in/check-out capabilities, eliminating long queues and enhancing the overall guest experience.

## 🎯 Business Purpose

- **Eliminates Traditional Check-in Queues** - Provides 24/7 self-service capabilities
- **Reduces Operational Costs** - Automated guest processing reduces staff workload
- **Enhances Guest Experience** - Faster, more convenient service with minimal wait times
- **Supports Multiple Hotel Operations** - Comprehensive solution for modern hospitality needs
- **Multi-language Support** - Serves international guests in their preferred language

## ✨ Core Features

### 🔐 Primary Services

#### **Automated Check-in System**

- **Self-service Guest Registration** - Complete check-in without staff assistance
- **ID Document Scanning** - Passport, driving license, and ID card verification
- **Payment Processing** - Credit cards, mobile payments (Apple Pay, Google Pay)
- **Room Key Dispensing** - Automated key card issuance and management
- **Add-on Services** - Hotel amenities, upgrades, and special requests
- **Selfie Authentication** - Photo-based security verification

#### **Check-out Services**

- **Room Key Return** - Automated key card collection
- **Receipt Generation** - Digital and printed check-out receipts
- **Parking Services** - Vehicle information and parking receipts
- **Feedback Collection** - Guest satisfaction surveys

#### **Additional Guest Services**

- **Hotel Information** - Interactive maps, floor plans, and amenities
- **Nearby Places** - Local attractions, restaurants, and services
- **Flight Schedules** - Real-time flight information and updates
- **Multi-currency Support** - International payment processing

### 🎮 User Experience Features

- **Touch-Optimized Interface** - Designed specifically for kiosk displays
- **Multi-language Support** - English, Arabic, Spanish, French, Hindi, Japanese, Chinese
- **Responsive Design** - Adapts to different screen sizes and orientations
- **Accessibility Features** - Screen reader support and keyboard navigation
- **Audio Feedback** - Sound effects and voice guidance

## 🏗️ Technical Architecture

### **Frontend Technologies**

- **React 19** - Latest React with modern hooks and functional components
- **Redux Toolkit** - Advanced state management and store configuration
- **React Router v7** - Client-side routing and navigation
- **Bootstrap 5** - Responsive UI framework and components
- **SCSS/Sass** - Advanced CSS preprocessing and styling

### **Real-time Communication**

- **MQTT Protocol** - Real-time messaging for device communication
- **WebSocket-like Functionality** - Live updates and device control
- **Device Integration** - Hardware communication and control

### **Hardware Integration**

- **ID Scanners** - Document verification and processing
- **Key Dispensers** - Automated room key management
- **Cash Recyclers** - Payment processing hardware
- **Touch Screens** - Kiosk display and input systems
- **Receipt Printers** - Physical receipt generation

### **Data Management**

- **IndexedDB** - Client-side database storage
- **Session Management** - Custom hooks for user session handling
- **API Integration** - RESTful services with Axios
- **Offline Support** - Local data persistence

### **Security & Authentication**

- **Document Verification** - ID scanning and validation
- **Selfie Authentication** - Photo-based security verification
- **Payment Security** - Secure payment processing
- **Session Management** - Secure user session handling

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Modern web browser
- Touch-enabled device (for kiosk testing)

### Installation

1. **Clone the repository**

   ```bash
   git clone [repository-url]
   cd gxp-kiosk-web
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:

   ```env
   REACT_APP_API_URL=your_api_endpoint_here
   REACT_APP_MQTT_BROKER=your_mqtt_broker_url
   ```

4. **Start development server**
   ```bash
   npm start
   ```
   The application will open at [http://localhost:3000](http://localhost:3000)

### Available Scripts

- **`npm start`** - Runs the app in development mode
- **`npm test`** - Launches the test runner in interactive watch mode
- **`npm run build`** - Builds the app for production
- **`npm run eject`** - Ejects from Create React App (one-way operation)

## 🔧 Configuration

### **Kiosk Device Configuration**

- Device mode settings (self-service vs. agent-assisted)
- MQTT topic configuration
- Hardware device mapping
- Audio and visual preferences

### **Hotel Configuration**

- Hotel information and branding
- Room types and availability
- Payment methods and currencies
- Terms and conditions
- Localization settings

### **Security Settings**

- Document verification requirements
- Selfie authentication settings
- Payment security protocols
- Session timeout configurations

## 📱 Supported Devices

### **Kiosk Hardware**

- Touch screen displays (various sizes)
- ID document scanners
- Key card dispensers
- Receipt printers
- Cash recyclers
- Audio systems

### **Software Requirements**

- Modern web browsers (Chrome, Firefox, Safari, Edge)
- Touch interface support
- JavaScript enabled
- Stable internet connection

## 🌐 Internationalization

The application supports multiple languages and locales:

- **English** (en) - Default language
- **Arabic** (ar) - Right-to-left support
- **Spanish** (es) - Latin American support
- **French** (fr) - European French
- **Hindi** (hi) - Indian language support
- **Japanese** (ja) - Asian language support
- **Chinese** (zh) - Simplified Chinese

## 🔒 Security Features

- **Document Verification** - Secure ID scanning and validation
- **Selfie Authentication** - Photo-based guest verification
- **Payment Security** - PCI-compliant payment processing
- **Session Management** - Secure user session handling
- **Data Encryption** - Secure data transmission and storage

## 📊 Performance & Scalability

- **Lazy Loading** - Code splitting for optimal performance
- **Image Optimization** - Compressed images and lazy loading
- **Offline Support** - Local data persistence
- **Responsive Design** - Optimized for various screen sizes
- **Touch Optimization** - Optimized for kiosk touch interfaces

## 🧪 Testing

- **Unit Testing** - Jest testing framework
- **Component Testing** - React Testing Library
- **Integration Testing** - API and component integration tests
- **User Acceptance Testing** - Real-world kiosk testing scenarios

## 📦 Dependencies

### **Core Dependencies**

- React 19.0.0
- Redux Toolkit 2.5.1
- React Router DOM 7.1.5
- Bootstrap 5.3.3
- Axios 1.7.9

### **UI & Animation**

- FontAwesome 6.7.2
- Animate.css 4.1.1
- AOS (Animate On Scroll) 2.3.4
- Swiper 11.2.2
- Lottie React 2.4.1

### **Payment & Security**

- React Phone Input 2.15.1
- React Signature Canvas 1.0.7
- jsPDF 3.0.1
- HTML2Canvas 1.4.1

## 🚀 Deployment

### **Production Build**

```bash
npm run build
```

### **Deployment Options**

- **Static Hosting** - Netlify, Vercel, AWS S3
- **Container Deployment** - Docker containers
- **Cloud Platforms** - AWS, Azure, Google Cloud
- **On-premise** - Local server deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For technical support and questions:

- **Email**: [support@company.com]
- **Documentation**: [docs-link]
- **Issue Tracker**: [GitHub Issues]

## 🔄 Version History

- **v1.1.9** - Current stable release
- **v1.1.8** - Previous release with bug fixes
- **v1.1.7** - Feature updates and improvements

---

**Built with ❤️ for modern hospitality solutions**

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: 'AIzaSyCOE_L6g9c3J6jhcajVzNkC4flEao4Av2I',
  authDomain: 'yrdly-coyig.firebaseapp.com',
  projectId: 'yrdly-coyig',
  storageBucket: 'yrdly-coyig.firebasestorage.app',
  messagingSenderId: '166095077947',
  appId: '1:166095077947:web:2f5285213610bbd893521e',
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/yrdly-logo.png' // Make sure you have this icon in your public folder
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});

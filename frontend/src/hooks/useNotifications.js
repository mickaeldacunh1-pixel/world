import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function useNotifications() {
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    setSupported(isSupported);
    
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!supported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [supported]);

  const subscribeToPush = useCallback(async () => {
    if (!supported || permission !== 'granted') return null;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      let sub = await registration.pushManager.getSubscription();
      
      if (!sub) {
        // Create new subscription (you'd need VAPID keys for real push)
        // For now, we'll use local notifications
        console.log('Push subscription would be created here with VAPID keys');
      }
      
      setSubscription(sub);
      return sub;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return null;
    }
  }, [supported, permission]);

  const showNotification = useCallback(async (title, options = {}) => {
    if (!supported) return false;
    
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      // Use Service Worker for notification if available
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body: options.body || '',
        icon: options.icon || '/logo192.png',
        badge: '/logo192.png',
        tag: options.tag || 'world-auto',
        data: options.data || {},
        requireInteraction: options.requireInteraction || false,
        actions: options.actions || []
      });
      return true;
    } catch (error) {
      // Fallback to regular notification
      try {
        new Notification(title, {
          body: options.body,
          icon: '/logo192.png'
        });
        return true;
      } catch (e) {
        console.error('Error showing notification:', e);
        return false;
      }
    }
  }, [supported, permission, requestPermission]);

  return {
    supported,
    permission,
    subscription,
    requestPermission,
    subscribeToPush,
    showNotification
  };
}

// Notification types
export const NotificationTypes = {
  NEW_MESSAGE: 'new_message',
  NEW_ORDER: 'new_order',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  PRICE_ALERT: 'price_alert',
  NEW_REVIEW: 'new_review'
};

// Helper to show specific notification types
export const showAppNotification = async (type, data, showNotification) => {
  const notifications = {
    [NotificationTypes.NEW_MESSAGE]: {
      title: 'Nouveau message',
      body: `${data.senderName || 'Quelqu\'un'} vous a envoyé un message`,
      tag: `message-${data.messageId}`
    },
    [NotificationTypes.NEW_ORDER]: {
      title: 'Nouvelle commande !',
      body: `${data.buyerName || 'Un acheteur'} a commandé "${data.listingTitle}"`,
      tag: `order-${data.orderId}`
    },
    [NotificationTypes.ORDER_SHIPPED]: {
      title: 'Commande expédiée',
      body: `Votre commande "${data.listingTitle}" a été expédiée`,
      tag: `shipped-${data.orderId}`
    },
    [NotificationTypes.ORDER_DELIVERED]: {
      title: 'Commande livrée',
      body: `Votre commande "${data.listingTitle}" a été livrée`,
      tag: `delivered-${data.orderId}`
    },
    [NotificationTypes.PRICE_ALERT]: {
      title: 'Alerte prix !',
      body: `Une annonce correspond à votre alerte "${data.alertName}"`,
      tag: `alert-${data.alertId}`
    },
    [NotificationTypes.NEW_REVIEW]: {
      title: 'Nouvel avis',
      body: `${data.reviewerName || 'Un acheteur'} vous a laissé un avis`,
      tag: `review-${data.reviewId}`
    }
  };

  const notification = notifications[type];
  if (notification && showNotification) {
    return await showNotification(notification.title, {
      body: notification.body,
      tag: notification.tag,
      data: { type, ...data }
    });
  }
  return false;
};

export default useNotifications;
